import { cpSync, existsSync, mkdirSync, rmSync, writeFileSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildDossier } from './vendor/makefun-frontend.ts';

const root = fileURLToPath(new URL('.', import.meta.url));
const output = resolve(process.env.MAKEFUN_OUTPUT_DIR || '/output');
if (output === resolve(root)) throw new Error('MAKEFUN_OUTPUT_DIR must be separate from the source repository');

mkdirSync(output, { recursive: true });
rmSync(join(output, 'app'), { recursive: true, force: true });
rmSync(join(output, 'screenshots'), { recursive: true, force: true });
cpSync(join(root, 'app'), join(output, 'app'), { recursive: true, force: true });
mkdirSync(join(output, 'screenshots'), { recursive: true });
if (existsSync(join(root, 'screenshots'))) cpSync(join(root, 'screenshots'), join(output, 'screenshots'), { recursive: true, force: true });

const dossier = buildDossier(output, {
  text_max_bytes: 163840,
  screenshots: { max: 3, max_bytes: 262144 },
  app_max_files: 993,
  app_max_bytes: 16777216,
});
writeFileSync(join(output, 'dossier.json'), dossier);
