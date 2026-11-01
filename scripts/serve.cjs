const http = require('node:http');
const fs = require('node:fs');
const path = require('node:path');
function createServer(root = path.resolve(__dirname, '..'), options = {}) {
  const admin = require('../server/admin.cjs');
  let adminHandler;
  function getAdminHandler(){return adminHandler ||= admin.createHandler({store:options.adminStore || admin.fileStore(path.resolve(__dirname,'../.local-admin')),now:options.now});}
  const types={'.mp3':'audio/mpeg','.wav':'audio/wav','.txt':'text/plain; charset=utf-8','.js':'text/javascript; charset=utf-8','.css':'text/css; charset=utf-8','.png':'image/png','.webp':'image/webp','.svg':'image/svg+xml','.html':'text/html; charset=utf-8'};
  const publicFiles = new Map(require('./build.cjs').files.map(file=>['/'+file,[file,types[path.extname(file)]]]));
  publicFiles.set('/board',['board.html',types['.html']]);
  publicFiles.set('/board/',['board.html',types['.html']]);
  publicFiles.set('/detective',['detective.html',types['.html']]);
  publicFiles.set('/detective/',['detective.html',types['.html']]);
  for(const route of ['admin','length','multiply','blocks','geography','vocabulary','abacus','parcels','crossing','memory','pinball','vault','survival','kart']){publicFiles.set('/'+route,[route+'.html',types['.html']]);publicFiles.set('/'+route+'/',[route+'.html',types['.html']]);}
  return http.createServer((req, res) => {
    const pathname = new URL(req.url, 'http://localhost').pathname;
    if(pathname==='/api/site')return getAdminHandler()(req,res);
    if(pathname.startsWith('/api/')){res.writeHead(404).end();return;}
    if (!['GET', 'HEAD'].includes(req.method)) { res.writeHead(405).end(); return; }
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
