import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';
import { siteConfig } from './site.config.ts';

export default defineConfig({
  site: siteConfig.siteUrl,
  base: siteConfig.base,
  trailingSlash: 'always',
  integrations: [sitemap({ filter: (page) => !page.includes('/thanks/') })],
});
