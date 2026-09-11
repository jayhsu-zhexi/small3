const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { once } = require('node:events');
const { build, files } = require('./build.cjs');
const { createServer } = require('./serve.cjs');
(async () => {
  const temp = fs.mkdtempSync(path.join(os.tmpdir(), 'small3-test-'));
  const server = createServer(temp);
  try {
    build(temp);
    for (const file of files) assert.deepEqual(fs.readFileSync(path.join(temp, file)), fs.readFileSync(file));
    server.listen(0, '127.0.0.1'); await once(server, 'listening');
    const origin = 'http://127.0.0.1:' + server.address().port;
    const page = await fetch(origin); assert.equal(page.status, 200);
    const html = await page.text(); assert.match(html, /id="backupTools"/);
    const script = await fetch(origin + '/assets/backup.js'); assert.match(script.headers.get('content-type'), /javascript/);
    assert.match(await script.text(), /learning-planet-backup/);
    for(const route of ['/board','/board/','/board.html']){
      const board=await fetch(origin+route);assert.equal(board.status,200);assert.match(await board.text(),/id="board"/);
    }
    for(const route of ['/detective','/detective/','/detective.html']){const response=await fetch(origin+route);assert.equal(response.status,200);assert.match(await response.text(),/id="detectiveScene"/);}
    for(const game of ['parcels','crossing'])for(const route of ['/'+game,'/'+game+'/', '/'+game+'.html']){const response=await fetch(origin+route);assert.equal(response.status,200);assert.match(await response.text(),/id="attentionScene"/);}
    for(const route of ['/memory','/memory/','/memory.html']){const response=await fetch(origin+route);assert.equal(response.status,200);assert.match(await response.text(),/id="memoryGrid"/);}
    for(const asset of ['memory-engine.js','memory-ui.js','memory-audio.js','memory.css','memory-home.css','memory-cards.css', 'memory-cinematics.css', 'memory-control-discs.png', 'memory-result-win.png', 'memory-result-loss.png','memory-card-shells.png','memory-equipment-1.png','memory-equipment-2.png','memory-home-v2.png', 'memory-controls.png', 'memory-title.png', 'memory-home-icons.png','memory-icons.svg','memory-background.png','attention-ui.js','attention.css','detective-ui.js','detective.css','board-engine.js','board-ui.js','board-audio.js','board-bank.js','board-records.js','board.css','board-island.png']){
      const response=await fetch(origin+'/assets/'+asset);assert.equal(response.status,200);
      assert.deepEqual(Buffer.from(await response.arrayBuffer()),fs.readFileSync('assets/'+asset));
    }
    assert.equal((await fetch(origin + '/assets/missing.js')).status, 404);
    assert.equal(await (await fetch(origin + '/any-game-route')).text(), html);
    assert.equal(await (await fetch(origin + '/.git/config')).text(), html, 'Source files are never served');
    const vercel = JSON.parse(fs.readFileSync('vercel.json'));
    assert.equal(vercel.buildCommand, 'npm run build'); assert.equal(vercel.outputDirectory, 'dist');
    console.log('PASS: dev/production use the exact same public files; scripts load as JS, missing assets fail clearly, and Vercel builds through tests.');
  } finally {
    server.closeAllConnections();
    await new Promise(resolve => server.close(resolve));
    // mkdtemp gives this test exclusive ownership of a single fresh directory.
    if (path.dirname(path.resolve(temp)) !== path.resolve(os.tmpdir()) || !path.basename(temp).startsWith('small3-test-')) throw Error('Unexpected cleanup path');
    fs.rmSync(temp, { recursive: true, force: true });
  }
})().catch(error => { console.error(error); process.exitCode = 1; });
