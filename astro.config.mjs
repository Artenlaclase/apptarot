// @ts-check
import { defineConfig } from 'astro/config';
import node from '@astrojs/node';

export default defineConfig({
  integrations: [],
  vite: {
    css: {
      postcss: './postcss.config.cjs',
    },
  },
  output: 'server',
  adapter: node({
    mode: 'standalone'
  })

}); 