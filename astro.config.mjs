// @ts-check
import { defineConfig } from 'astro/config';

export default defineConfig({
  integrations: [],
  vite: {
    css: {
      postcss: './postcss.config.cjs',
    },
  },
}); 