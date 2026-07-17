import { env } from '$env/dynamic/public';

// Nombre visible de la app. Viene de PUBLIC_APP_TITLE (.env de cada servidor) para
// que shape_up y su espejo (shape_up_moibe) corran el mismo código y solo difieran
// en config — nunca hay que tocar el código para cambiar el título por deploy.
export const APP_TITLE = env.PUBLIC_APP_TITLE || 'Shape Up Buzzword';
