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
    for (const file of files) assert.equal(fs.readFileSync(path.join(temp, file), 'utf8'), fs.readFileSync(file, 'utf8'));
    server.listen(0, '127.0.0.1'); await once(server, 'listening');
    const origin = 'http://127.0.0.1:' + server.address().port;
    const page = await fetch(origin); assert.equal(page.status, 200);
    const html = await page.text(); assert.match(html, /id="backupTools"/);
    const script = await fetch(origin + '/assets/backup.js'); assert.match(script.headers.get('content-type'), /javascript/);
    assert.match(await script.text(), /learning-planet-backup/);
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
