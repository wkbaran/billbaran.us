import { defineCollection } from 'astro:content';
import { file, glob } from 'astro/loaders';
import { z } from 'astro/zod';

const projects = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/projects' }),
  schema: z.object({
    title: z.string(),
    subtitle: z.string().optional(),
    tagline: z.string(),
    order: z.number(),
    live: z.url().optional(),
    repo: z.url(),
    license: z.string().optional(),
    stack: z.array(z.string()),
    highlights: z.array(z.string()),
    // Folder under public/demos/ holding the static snapshot, if there is one.
    demo: z.string().optional(),
    // Page inside the demo folder to open first.
    demoPage: z.string().default('index.html'),
    demoNote: z.string().optional(),
    // One extra line on the home-page card, for the thing worth noticing first.
    cardNote: z.string().optional(),
    // Show the WebMCP agent console under the demo (Equity Watch).
    webmcp: z.boolean().default(false),
    screenshot: z.string().optional(),
  }),
});

const experience = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/experience' }),
  schema: z.object({
    org: z.string(),
    role: z.string(),
    location: z.string().optional(),
    start: z.string(),
    end: z.string().optional(),
    order: z.number(),
    // Placeholder text waiting on the career interview; shown with a marker in dev only.
    draft: z.boolean().default(false),
  }),
});

const skills = defineCollection({
  loader: file('src/content/skills.json'),
  schema: z.object({
    group: z.string(),
    order: z.number(),
    items: z.array(z.string()),
  }),
});

const alsoBuilt = defineCollection({
  loader: file('src/content/also-built.json'),
  schema: z.object({
    name: z.string(),
    repo: z.url(),
    blurb: z.string(),
    tags: z.array(z.string()),
  }),
});

export const collections = { projects, experience, skills, alsoBuilt };
