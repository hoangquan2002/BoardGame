import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createAppServer } from './server.js';

export const SERVER_VERSION = '0.1.0';
export * from './registry.js';
export * from './room.js';
export * from './server.js';

// Auto-start if executed directly via node or CLI
const isDirectRun = Boolean(
  process.argv[1] &&
    (fileURLToPath(import.meta.url) === path.resolve(process.argv[1]) ||
      process.argv[1].endsWith('dist/index.js') ||
      process.argv[1].endsWith('src/index.ts')),
);

if (isDirectRun) {
  const server = createAppServer();
  const port = parseInt(process.env.PORT || '3000', 10);
  const host = process.env.HOST || '0.0.0.0';
  server.listen(port, host).then((actualPort) => {
    console.log(`[BoardGame Server] Running on http://${host}:${actualPort}`);
  });
}
