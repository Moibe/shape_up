# Estrategia de deploy y sincronización — shape_up ↔ shape_up_moibe

> Estado: **§3 (shape_up → interno) en ejecución** — repo y `webhook-central` ya
> preparados; faltan los pasos manuales en el servidor (ver §3). **§2 (moibe → DO)
> pendiente**, se retoma después.
> Regla de oro: el **código de la app es idéntico** en los dos repos. Lo único que
> difiere vive **fuera del código de la app**: el `.env` de cada servidor y el
> "plumbing" de deploy (que por fuerza difiere: DO = push/Action, interno = pull).

## Los dos repos

| Repo | Para | Destino | Mecanismo de deploy |
|------|------|---------|---------------------|
| `Moibe/shape_up` (este) | Buzzword (clientes de la agencia) | **Servidor interno** `172.10.30.15` | pull vía **webhook-central** (:8090) |
| `Moibe/shape_up_moibe` | Mis proyectos | **Droplet DO** `gradioFish` (165.22.53.200) | push vía **GitHub Action** (SSH) |

`shape_up` = **fuente de verdad**: aquí se desarrolla. `shape_up_moibe` = **espejo**.

Stack (idéntico en ambos): SvelteKit 5 + `@sveltejs/adapter-node`, SQLite + Drizzle
(`better-sqlite3`), migraciones a mano (ver `MEMORY`/memoria del proyecto).

---

## 1. Sincronización de código (el "rollo")

Objetivo: que un cambio hecho en `shape_up` llegue **igualito** a `shape_up_moibe`,
sin conflictos.

Setup único en el clon local de `shape_up_moibe`:

```bash
cd /c/Moibe/code/shape_up_moibe
git remote add upstream git@github.com:Moibe/shape_up.git
git fetch upstream
git checkout -b main upstream/main      # sembrar con el código de shape_up
# (agregar aquí el único delta propio: .github/workflows/deploy.yml para DO — ver §2)
git push -u origin main                 # ← TÚ haces el push
```

Cada vez que cambie `shape_up`:

```bash
cd /c/Moibe/code/shape_up_moibe
git fetch upstream
git rebase upstream/main    # replica el código idéntico; re-aplica el deploy.yml encima
git push                    # ← TÚ; dispara el deploy a DO
```

- El **único** archivo que difiere entre los repos es `.github/workflows/deploy.yml`
  (solo en moibe). Como es un archivo que `shape_up` no toca, el `rebase` nunca da
  conflicto: solo re-aplica ese commit encima del código nuevo.
- Todo lo demás (features, `drizzle/` migraciones, etc.) queda byte-idéntico.

### Diferencias que NO van en el código

- **`.env`** (no versionado, uno por servidor): `PORT`, `HOST`, `ORIGIN`,
  `DATABASE_URL`, `ADMIN_PASSWORD`, y `PUBLIC_APP_TITLE` (ver gotcha #2).
- **Deploy plumbing**: `deploy.yml` (solo moibe) / config server-side en
  webhook-central (solo Buzzword).

---

## 2. shape_up_moibe → DigitalOcean (droplet)

Reusa el patrón que `shape_up` tiene hoy (`.github/workflows/deploy.yml`), adaptado.

1. **deploy.yml** (commit propio de moibe): copiar el de shape_up y cambiar
   `shape_up` → `shape_up_moibe` (nombre del workflow, `git clone` URL
   `git@github.com:Moibe/shape_up_moibe.git`, ruta `~/code/shape_up_moibe`,
   `pm2 --name shape_up_moibe`, y el `PORT`/healthcheck).
2. **Puerto**: usar uno propio en el droplet (sugerido **3201**; debe ser único por app).
   Nota: cuando Buzzword salga del droplet (§3), el 3200 queda libre, pero conviene
   dar a moibe su propio puerto igual.
3. **Secrets del repo** (GitHub → Settings → Secrets): `SSH_HOST` (165.22.53.200),
   `SSH_USER` (root), `SSH_PRIVATE_KEY`. Mismos que los demás proyectos del droplet.
4. **`.env` en el droplet** (`~/code/shape_up_moibe/.env`, se crea a mano la 1ª vez):
   `PORT=3201`, `HOST=127.0.0.1`, `ORIGIN=https://<dominio-moibe>`,
   `DATABASE_URL=./local.db`, `ADMIN_PASSWORD=...`, `PUBLIC_APP_TITLE=...`.
5. **nginx** vía repo `nx-routes`: agregar un archivo `<dominio-moibe>` (server block
   `proxy_pass http://127.0.0.1:3201`), push → recarga nginx. Luego
   `certbot --nginx -d <dominio-moibe>` para el SSL.
6. La Action ya hace clone-if-missing + `db:migrate` + build + pm2 start, así que el
   primer push la deja arriba.

**Pendiente de decidir:** dominio de moibe, puerto (3201?), título (`PUBLIC_APP_TITLE`).

---

## 3. shape_up (Buzzword) → servidor interno (webhook-central)

Migrar del droplet al interno. Todo el "plumbing" es **server-side**; el repo no lleva
nada de deploy.

### ✅ Ya hecho (2026-07-13)

- **Repo**: `.github/workflows/deploy.yml` eliminado (ya no va a DO). Título
  parametrizado vía `PUBLIC_APP_TITLE` (`src/lib/app-config.ts`), default
  `"Shape Up Buzzword"` si no se define. `.env.example` actualizado (agrega
  `PUBLIC_APP_TITLE`, puerto sugerido `3300`, comentario generalizado — ya no dice
  "en el droplet").
- **`webhook-central`** (repo local, falta `scp` al servidor — ver abajo):
  - `projects/shape_up.conf` — `APP_STACK=svelte`, `PROJECT_ROOT=/home/mbriseno/code/shape_up`,
    `PROJECT_BRANCH=main`, `PM2_NAME=shape-up`, `POST_BUILD="npm run db:migrate"`
    (gotcha #1), y un comentario con el comando exacto del primer `pm2 start` manual.
  - `hooks.json` — entrada `id: despliegue-shape-up` (arg pasado a `deploy.sh`: `shape_up`,
    coincide con el `.conf` y con `PROJECT_ROOT`).
  - `apps.json` — entrada `id: shape_up`, `app_url: http://172.10.30.15:3300` (puerto
    libre, verificado contra los demás `.conf`; sin `public_url` todavía — falta dominio).
  - Verificado: JSON válido en ambos archivos, sin IDs ni puertos duplicados.

### ⏳ Pendiente (requiere acceso al servidor — manual, fuera de lo que puedo ejecutar aquí)

En el server interno `172.10.30.15` (`mbriseno`):

1. `scp -r webhook-central/ mbriseno@172.10.30.15:/home/mbriseno/` (o `git pull` si ya
   está clonado ahí) para que `hooks.json`/`apps.json`/`projects/shape_up.conf` lleguen.
2. `git clone git@github.com:Moibe/shape_up.git /home/mbriseno/code/shape_up`
3. Crear `/home/mbriseno/code/shape_up/.env` (una vez): `PORT=3300`, `HOST=127.0.0.1`,
   `ORIGIN=https://<dominio-interno>` (pendiente elegir — ¿algo bajo `*.buzzword.com.mx`?),
   `DATABASE_URL=./local.db`, `ADMIN_PASSWORD=...`, `PUBLIC_APP_TITLE=Shape Up Buzzword`.
4. `cd /home/mbriseno/code/shape_up && npm ci && npm run db:migrate && npm run build`
5. `pm2 start build/index.js --name shape-up --cwd /home/mbriseno/code/shape_up` → `pm2 save`
   (adapter-node autocarga el `.env` del paso 3 — no hace falta exportar nada a mano).
6. `pm2 restart webhook-listener` para que recargue el nuevo `hooks.json`.
7. Probar: `curl -X POST http://172.10.30.15:8090/hooks/despliegue-shape-up` → debe
   hacer `git pull` + build + `pm2 restart shape-up` (revisa `pm2 logs shape-up` y
   `logs/deploys.jsonl` en `webhook-central`).

Después de esto, cada deploy = botón "Deploy" en `webhook-central-ui` (o el curl de
arriba). Es **pull**: el server jala de GitHub; nadie entra por SSH.

**Pendiente de decidir:** dominio interno (para `ORIGIN` y `public_url`), y coordinar
el corte de `alphasummitindex.com` (hoy sirve a shape_up en el droplet:3200 vía
`nx-routes` — ese archivo/dominio se libera cuando esto quede arriba).

---

## Gotchas (ya identificados)

1. **Migraciones en interno**: `webhook-central/scripts/deploy.sh` solo hace
   `git pull` + build + `pm2 restart` — **no corre migraciones**. Se cubre con
   `POST_BUILD="npm run db:migrate"` en el `.conf`. (En DO la Action ya llama `db:migrate`.)
2. **Título de la app** ✅ **hecho**: era hardcodeado en 3 sitios (TopNav, home, login).
   Ahora viene de `PUBLIC_APP_TITLE` (`src/lib/app-config.ts`, `$env/dynamic/public` —
   se lee en runtime, no se hornea en el build), default `"Shape Up Buzzword"` si el
   `.env` no lo define. Cada server pone el suyo.
3. **Única divergencia de archivo**: `deploy.yml` (solo en moibe) — manejada con `rebase`,
   sin conflictos.
4. **webhook-central first-run manual**: `deploy.sh` no clona ni hace `pm2 start` — el
   primer clone + primer `pm2 start` son a mano (pasos 2–5 de §3).

## Orden de ejecución sugerido

1. ~~(Código) Parametrizar el título con `PUBLIC_APP_TITLE`~~ ✅ hecho.
2. ~~shape_up → interno: preparar repo + webhook-central~~ ✅ hecho (código/config
   listos); **falta la parte manual en el servidor** (§3 "⏳ Pendiente").
3. shape_up_moibe → DO (§1 + §2): pendiente, se retoma después ("luego vemos moibe").
