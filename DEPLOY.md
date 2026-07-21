# Estrategia de deploy y sincronización — shape_up ↔ shape_up_moibe

> Estado: **§3 (shape_up → interno) completo y verificado (2026-07-21)** — repo
> clonado, `.env` creado, build + `pm2 start` hechos, `webhook-listener` recargado
> y probado con 3 deploys de prueba exitosos (`no_changes`) vía la UI. **§2 (moibe
> → DO) pendiente**, se retoma después.
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
  - `scripts/deploy.sh` **parcheado** (afecta a todos los proyectos, no solo shape_up):
    `POST_BUILD` fallido ahora es fatal en vez de solo advertencia (ver gotcha #1).

### ✅ Hecho y verificado (2026-07-21)

En el server interno `172.10.30.15` (`mbriseno`):

1. ✅ `webhook-central/` en el server tiene `hooks.json`/`apps.json`/
   `projects/shape_up.conf` y el `scripts/deploy.sh` parcheado (POST_BUILD fatal).
2. ✅ `git clone` hecho en `/home/mbriseno/code/shape_up` — `main`, working tree limpio,
   al día con `origin/main`.
3. ✅ `.env` creado: `PORT=3300`, `HOST=127.0.0.1`, `ORIGIN=http://172.10.30.15:3300`
   (dominio interno **todavía sin decidir** — ver pendiente abajo), `DATABASE_URL=./local.db`,
   `PUBLIC_APP_TITLE=Shape Up Buzzword`. Sin `ADMIN_PASSWORD`: el código no lo usa, no
   hace falta.
4. ✅ `npm ci` + `db:migrate` + build hechos (`build/`, `local.db` con migraciones aplicadas).
5. ✅ `pm2 start build/index.js --name shape-up` corriendo (`pm2 status` → online).
6. ✅ `webhook-listener` reiniciado después de que se agregó el hook (confirmado por
   timestamps: restart posterior a la edición de `hooks.json`).
7. ✅ Probado end-to-end: 3 deploys de prueba vía la UI, los 3 `no_changes` exitosos
   (`logs/deploys.jsonl` y `logs/shape_up/*.log` en `webhook-central`).

Cada deploy = botón "Deploy" en `webhook-central-ui` (o
`curl -X POST http://172.10.30.15:8090/hooks/despliegue-shape-up`). Es **pull**: el
server jala de GitHub; nadie entra por SSH.

**Pendiente de decidir:** dominio interno (para `ORIGIN` y `public_url` — hoy corre
solo por IP:puerto, sin HTTPS), y coordinar el corte de `alphasummitindex.com` (hoy
sirve a shape_up en el droplet:3200 vía `nx-routes` — ese archivo/dominio se libera
cuando se decida cortar).

---

## Gotchas (ya identificados)

1. **Migraciones en interno**: `webhook-central/scripts/deploy.sh` solo hace
   `git pull` + build + `pm2 restart` — **no corre migraciones**. Se cubre con
   `POST_BUILD="npm run db:migrate"` en el `.conf`. (En DO la Action ya llama `db:migrate`.)
   ✅ **Fix aplicado** (revisión adversarial 2026-07-13): `deploy.sh` trataba un
   `POST_BUILD` fallido como advertencia no-fatal — si la migración fallaba, igual
   reiniciaba pm2 con el build nuevo contra un esquema desactualizado, y el dashboard
   marcaba el deploy como "success". Ahora `POST_BUILD` es fatal (`exit 1`), igual que
   el resto de los pasos del script. Verificado que era seguro: el único otro
   consumidor de `POST_BUILD` hoy es `webhook-central-ui.conf` (symlinks deterministas,
   sin riesgo de romperse).
2. **Título de la app** ✅ **hecho**: era hardcodeado en 3 sitios (TopNav, home, login).
   Ahora viene de `PUBLIC_APP_TITLE` (`src/lib/app-config.ts`, `$env/dynamic/public` —
   se lee en runtime, no se hornea en el build), default `"Shape Up Buzzword"` si el
   `.env` no lo define. Cada server pone el suyo.
3. **Única divergencia de archivo**: `deploy.yml` (solo en moibe) — manejada con `rebase`,
   sin conflictos.
4. **webhook-central first-run manual**: `deploy.sh` no clona ni hace `pm2 start` — el
   primer clone + primer `pm2 start` son a mano (pasos 2–5 de §3).
5. **adapter-node NO autocarga `.env`** ✅ **fix aplicado (2026-07-21)**: `build/env.js`
   (generado por `@sveltejs/adapter-node`) solo lee `process.env` tal cual — no hay
   autoload de dotenv. El primer `pm2 start` en el servidor se hizo sin pasarle el
   `.env`, así que Node arrancó con sus defaults (`PORT=3000`, `HOST=0.0.0.0`) **sin
   error visible**: pm2 marcaba "online" pero la app escuchaba en el puerto
   equivocado y `http://172.10.30.15:3300` no respondía. Fix: usar el flag nativo de
   Node `--env-file=.env` al arrancar (`pm2 start ... --node-args="--env-file=.env"`),
   igual que ya hace `db:migrate` en `package.json`. Documentado en
   `webhook-central/projects/shape_up.conf`. De paso, `HOST` se cambió de
   `127.0.0.1` a `0.0.0.0` en el `.env` del servidor: esta app no tiene nginx
   delante todavía, así que necesita bindear a todas las interfaces para que el
   acceso directo por IP:puerto (como el resto de las apps del servidor) funcione.

## Orden de ejecución sugerido

1. ~~(Código) Parametrizar el título con `PUBLIC_APP_TITLE`~~ ✅ hecho.
2. ~~shape_up → interno: preparar repo + webhook-central~~ ✅ hecho y verificado en
   servidor (ver §3).
3. shape_up_moibe → DO (§1 + §2): pendiente, se retoma después ("luego vemos moibe").
