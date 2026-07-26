#!/usr/bin/env node
import fs from 'node:fs/promises';
import path from 'node:path';
import process from 'node:process';
import { fileURLToPath } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(here, '..');
const templateDir = path.join(here, 'template');

const slug = (process.argv[2] || '').trim().toLowerCase();
const title = (process.argv.slice(3).join(' ') || slug)
  .replace(/[-_]+/g, ' ')
  .replace(/\b\w/g, (m) => m.toUpperCase());

if (!/^[a-z0-9][a-z0-9-]{1,48}[a-z0-9]$/.test(slug)) {
  console.error('Usage: node site-builder/new-site.mjs <site-slug> [Site Title]');
  console.error('Slug must be 3-50 chars: lowercase letters, numbers, hyphens.');
  process.exit(1);
}

const dest = path.join(repoRoot, 'sites', slug);
try {
  await fs.access(dest);
  console.error(`Refusing to overwrite existing site: sites/${slug}`);
  process.exit(2);
} catch {}

await fs.cp(templateDir, dest, { recursive: true });

const replacements = new Map([
  ['__SITE_SLUG__', slug],
  ['__SITE_TITLE__', title],
]);

async function replaceTokens(dir) {
  for (const entry of await fs.readdir(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      await replaceTokens(full);
      continue;
    }
    let text = await fs.readFile(full, 'utf8');
    for (const [token, value] of replacements) text = text.split(token).join(value);
    await fs.writeFile(full, text);
  }
}

await replaceTokens(dest);
console.log(`Created sites/${slug}`);
console.log(`Next: cd sites/${slug} && npm install && npm run dev -- --host 0.0.0.0`);
