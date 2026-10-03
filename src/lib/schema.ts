import { z } from 'astro/zod';

export const CATEGORY_IDS = ['bot', 'miniapp', 'site', 'parser'] as const;

export function buildTemplateSchema<I extends z.ZodType>(image: I) {
  return z
    .object({
      title: z.string().min(1),
      category: z.enum(CATEGORY_IDS),
      status: z.enum(['ready', 'soon']),
      audience: z.string().min(1),
      short: z.string().min(1),
      features: z.array(z.string().min(1)).min(1),
      demo_url: z.string().url().optional(),
      screenshots: z.array(image).default([]),
      video: z.string().url().optional(),
      price_source: z.number().int().positive().optional(),
      price_turnkey: z.number().int().positive().optional(),
      turnkey_days: z.number().int().positive().optional(),
      stack: z.string().min(1).optional(),
      requirements: z.array(z.string().min(1)).min(1).optional(),
      faq: z.array(z.object({ q: z.string().min(1), a: z.string().min(1) })).optional(),
      featured: z.boolean().default(false),
      order: z.number(),
    })
    .superRefine((d, ctx) => {
      if (d.status === 'ready') {
        for (const f of ['demo_url', 'price_source', 'price_turnkey', 'turnkey_days', 'stack', 'requirements'] as const) {
          if (d[f] === undefined) ctx.addIssue({ code: 'custom', path: [f], message: 'обязательно для status: ready' });
        }
        if (!d.faq || d.faq.length < 4 || d.faq.length > 6) {
          ctx.addIssue({ code: 'custom', path: ['faq'], message: 'для status: ready нужно 4–6 вопросов' });
        }
      } else if (d.demo_url !== undefined) {
        ctx.addIssue({ code: 'custom', path: ['demo_url'], message: 'у status: soon демо быть не должно' });
      }
    });
}

export type TemplateData = z.infer<ReturnType<typeof buildTemplateSchema<z.ZodString>>>;
