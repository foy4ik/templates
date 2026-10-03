import { defineCollection } from 'astro:content';
import { glob } from 'astro/loaders';
import { buildTemplateSchema } from './lib/schema';

const templates = defineCollection({
  loader: glob({ pattern: '*.md', base: './src/content/templates' }),
  schema: ({ image }) => buildTemplateSchema(image()),
});

export const collections = { templates };
