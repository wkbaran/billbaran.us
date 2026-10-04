// @ts-check
import { defineConfig } from 'astro/config';

export default defineConfig({
  site: 'https://billbaran.us',
  // S3 + CloudFront serves /foo/ as /foo/index.html (see infra/site.yaml).
  trailingSlash: 'always',
  build: { format: 'directory' },
  // 404.astro must come out as /404.html for CloudFront's error response.
});
