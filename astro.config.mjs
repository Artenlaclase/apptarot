// @ts-check
import { defineConfig } from 'astro/config';
import node from '@astrojs/node';
import sitemap from '@astrojs/sitemap';

const site = process.env.SITE_URL || 'http://localhost:4321';

export default defineConfig({
  site,
  integrations: [sitemap()],
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