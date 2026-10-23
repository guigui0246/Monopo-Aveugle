import { spawn } from 'node:child_process';
const port = 5187;
const child = spawn(
  process.execPath,
  [
    'node_modules/vite/bin/vite.js',
    '--host',
    '127.0.0.1',
    '--port',
    String(port),
  ],
  { stdio: 'pipe', windowsHide: true },
);
try {
  await new Promise((resolve, reject) => {
    child.once('error', reject);
    child.once('exit', (code) => reject(Error(`Server exited ${code}`)));
    child.stdout.on('data', (data) => {
      if (data.toString().includes('Local:')) resolve();
    });
    setTimeout(() => reject(Error('Server startup timed out')), 20000).unref();
  });
  process.env.BASE_URL = `http://127.0.0.1:${port}`;
  await import('./smoke.mjs');
} finally {
  child.kill();
}
