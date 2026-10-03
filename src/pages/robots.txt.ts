import type { APIRoute } from 'astro';
import { siteConfig } from '../../site.config';
import { buildRobotsTxt } from '../lib/seo';

export const GET: APIRoute = () =>
  new Response(buildRobotsTxt(siteConfig.siteUrl, siteConfig.base, siteConfig.indexing), {
    headers: { 'Content-Type': 'text/plain; charset=utf-8' },
  });
