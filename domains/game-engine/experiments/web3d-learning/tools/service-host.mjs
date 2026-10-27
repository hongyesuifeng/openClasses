// One hidden, detached preview process. Management validates this exact path and token.
import { preview } from 'vite';
import { resolve } from 'node:path';

const [project, token] = process.argv.slice(2);
if (!project || !/^[a-f0-9]{32}$/.test(token ?? '') || resolve(project) !== process.cwd()) {
  throw new Error('Invalid learning service identity');
}
const server = await preview({ root: project, preview: { host: '127.0.0.1', port: 5173, strictPort: true, open: false } });
server.printUrls();
