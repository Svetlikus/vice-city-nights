import { cp, mkdir, readdir, rm, writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { resolve } from 'node:path';

const root = fileURLToPath(new URL('..', import.meta.url));
const pages = resolve(root, 'docs');
await mkdir(pages, { recursive: true });
// docs contains generated game files only; written documentation lives elsewhere.
for (const entry of await readdir(pages)) {
  await rm(resolve(pages, entry), { recursive: true, force: true });
}
await cp(resolve(root, 'dist'), pages, { recursive: true });
await writeFile(resolve(pages, '.nojekyll'), '');
console.log('GitHub Pages build ready in docs/');
