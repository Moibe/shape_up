import tailwindcss from '@tailwindcss/vite';
import adapter from '@sveltejs/adapter-node';
import { sveltekit } from '@sveltejs/kit/vite';
import { defineConfig } from 'vite';

export default defineConfig({
	// Puerto fijo propio de esta app (mismo que el de deploy). strictPort = true evita
	// que Vite se brinque a 5174/5175… en silencio cuando el puerto está ocupado:
	// si 3200 está tomado, falla y te avisa en vez de derivar solo.
	server: {
		port: 3200,
		strictPort: true
	},
	preview: {
		port: 3200,
		strictPort: true
	},
	plugins: [
		tailwindcss(),
		sveltekit({
			compilerOptions: {
				// Force runes mode for the project, except for libraries. Can be removed in svelte 6.
				runes: ({ filename }) => filename.split(/[/\\]/).includes('node_modules') ? undefined : true
			},

			// adapter-auto only supports some environments, see https://svelte.dev/docs/kit/adapter-auto for a list.
			// If your environment is not supported, or you settled on a specific environment, switch out the adapter.
			// See https://svelte.dev/docs/kit/adapters for more information about adapters.
			adapter: adapter()
		})
	]
});
