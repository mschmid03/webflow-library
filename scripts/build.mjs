import { readFile, stat } from 'node:fs/promises';
import { gzipSync } from 'node:zlib';
import { readFileSync } from 'node:fs';
import { build } from 'esbuild';

const pkg = JSON.parse(await readFile(new URL('../package.json', import.meta.url), 'utf8'));
const outfile = 'dist/wl.min.js';

await build({
  entryPoints: ['src/index.ts'],
  outfile,
  bundle: true,
  minify: true,
  format: 'iife',
  target: 'es2020',
  legalComments: 'none',
  define: { __WL_VERSION__: JSON.stringify(pkg.version) },
  banner: { js: `/* webflow-library v${pkg.version} | wl- Attribute-Utilities */` },
});

const raw = readFileSync(outfile);
const { size } = await stat(outfile);
console.log(
  `${outfile}  ${(size / 1024).toFixed(2)} KB min  |  ${(gzipSync(raw).length / 1024).toFixed(2)} KB min+gzip`,
);
