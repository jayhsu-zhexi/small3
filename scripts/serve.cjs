const http = require('node:http');
const fs = require('node:fs');
const path = require('node:path');
function createServer(root = path.resolve(__dirname, '..')) {
  const publicFiles = new Map([['/assets/backup.js', ['assets/backup.js', 'text/javascript; charset=utf-8']]]);
  return http.createServer((req, res) => {
    if (!['GET', 'HEAD'].includes(req.method)) { res.writeHead(405).end(); return; }
    const pathname = new URL(req.url, 'http://localhost').pathname;
    if (pathname.startsWith('/assets/') && !publicFiles.has(pathname)) { res.writeHead(404).end(); return; }
    const [file, type] = publicFiles.get(pathname) || ['index.html', 'text/html; charset=utf-8'];
    try {
      const body = fs.readFileSync(path.join(root, file));
      res.writeHead(200, { 'Content-Type': type, 'Cache-Control': 'no-store' });
      res.end(req.method === 'HEAD' ? undefined : body);
    } catch { res.writeHead(503).end('Run npm run build before starting the production preview.'); }
  });
}
if (require.main === module) {
  const args = process.argv.slice(2);
  const option = (name, fallback) => args.includes(name) ? args[args.indexOf(name) + 1] : fallback;
  const root = path.resolve(__dirname, '..', option('--dir', '.'));
  const port = Number(option('--port', process.env.PORT || '4173'));
  createServer(root).listen(port, '127.0.0.1', () => console.log('Local: http://127.0.0.1:' + port));
}
module.exports = { createServer };
