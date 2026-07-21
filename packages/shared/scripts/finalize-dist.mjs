import { writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

// Mark each build output with its module type so Node resolves the CJS and ESM
// bundles correctly regardless of the root package's `type` field.
const distDir = join(dirname(fileURLToPath(import.meta.url)), '..', 'dist');

writeFileSync(join(distDir, 'cjs', 'package.json'), `${JSON.stringify({ type: 'commonjs' })}\n`);
writeFileSync(join(distDir, 'esm', 'package.json'), `${JSON.stringify({ type: 'module' })}\n`);
