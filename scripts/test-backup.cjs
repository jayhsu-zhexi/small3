const assert = require('node:assert/strict');
const { boot } = require('./game-harness.cjs');
const backupModule = { exports: {} };
require('node:vm').runInNewContext(require('node:fs').readFileSync('assets/backup.js', 'utf8'), { module: backupModule });
const backup = backupModule.exports;
function storage(values = {}) {
  return { values, getItem: key => values[key] ?? null, setItem: (key, value) => { values[key] = value; }, removeItem: key => { delete values[key]; } };
}
const original = boot();
for (const kind of ['math', 'chinese', 'english', 'focus']) {
  original.run(`subject='${kind}';level=1;begin()`);
  original.answer(false); original.flush(); original.answer();
  original.run('advance();saveExitButton.onclick()');
}
for (const theme of ['space', 'shop', 'pets']) original.run(`openStory('${theme}');storyExit.onclick()`);
original.run('unlocks.math=2;saveProgress()');
const exported = backup.parse(JSON.stringify(backup.capture(storage(original.saved))));
assert.match(backup.summary(exported), /4 科中途存檔、3 個故事/);
const destination = storage({ 'unrelated-setting': 'keep', 'learning-planet-session-v1': 'null' });
backup.restore(destination, exported);
assert.equal(destination.values['unrelated-setting'], 'keep');
const restored = boot(destination.values);
for (const kind of ['math', 'chinese', 'english', 'focus']) {
  restored.run(`restoreSession('${kind}')`);
  assert.equal(restored.run('round'), 1);
  assert.equal(restored.run('subject'), kind);
  assert.equal(restored.run('learning[subject].mistakes.length'), 1);
  restored.run('saveExitButton.onclick()');
}
for (const theme of ['space', 'shop', 'pets']) assert.ok(restored.run(`readStory('${theme}')`));
assert.equal(restored.run('unlocks.math'), 2);
console.log('PASS: a real four-subject and three-story backup restores across fresh browser storage, including mistakes and unlocks.');

const before = JSON.stringify(destination.values);
for (const mutate of [
  data => { data.version = 999; },
  data => { data.entries.secret = '"unexpected"'; },
  data => { delete data.entries[backup.keys[0]]; },
  data => { data.entries[backup.keys[0]] = '{broken'; },
  data => { data.entries[backup.keys[0]] = '{"math":99}'; },
  data => { data.entries['learning-planet-session-v1-math'] = JSON.stringify({ ...JSON.parse(data.entries['learning-planet-session-v1-math']), round: -1 }); }
]) {
  const invalid = structuredClone(exported); mutate(invalid);
  assert.throws(() => backup.restore(destination, invalid));
  assert.equal(JSON.stringify(destination.values), before);
}
assert.throws(() => backup.parse('x'.repeat(backup.MAX_BYTES + 1)));
const failing = storage(structuredClone(destination.values));
const set = failing.setItem; let writes = 0;
failing.setItem = (key, value) => { if (++writes === 3) throw Error('quota'); set(key, value); };
const changed = structuredClone(exported); changed.entries['learning-planet-levels'] = '{"math":3}';
assert.throws(() => backup.restore(failing, changed), /已恢復/);
assert.deepEqual(failing.values, destination.values);
const empty = backup.capture(storage()); backup.restore(destination, empty);
assert.deepEqual(destination.values, { 'unrelated-setting': 'keep' });
console.log('PASS: malformed, oversized, unknown-version backups never mutate data; a partial write rolls back; a confirmed empty backup clears only game keys.');

const story = boot();
story.run(`
  function walk(node){return [node,...node.children.flatMap(walk)]}
  openStory('shop');
  const plus=walk(storyScene).find(n=>n.textContent==='＋');
  plus.onclick();plus.onclick();
`);
assert.equal(story.run('story.values.apple'), 2);
assert.equal(story.run('walk(storyScene).includes(plus)'), true);
story.run("story.step=2;resetStoryInputs();renderStory();const label=walk(storyScene).find(n=>n.textContent.startsWith('apple →'));label.onclick();changeStory('pair','apple')");
assert.equal(story.run('walk(storyScene).includes(label)'), true);
assert.match(story.run('label.textContent'), /蘋果/);
story.run("openStory('space');story.step=3;resetStoryInputs();renderStory();const heading=storyScene.children[0];changeStory('conceal');changeStory('sequence','up');changeStory('peek')");
assert.equal(story.run('storyScene.children[0]===heading'), true);
assert.equal(story.run('story.sequence.length'), 0);
story.run("story.step=4;renderStory();const sticker=walk(storyScene).find(n=>n.textContent==='🌈');sticker.onclick();sticker.onclick()");
assert.equal(story.run('walk(storyScene).includes(sticker)'), true);
assert.equal(story.run("walk(storyScene).filter(n=>n.textContent==='再玩一回（保留貼紙）').length"), 1);
console.log('PASS: quantity, matching, memory and reward controls retain DOM identity during updates; replay controls do not duplicate.');

(async () => {
  const nodes = new Map(); let downloads = 0, reloads = 0;
  function element() { return { textContent: '', value: '', open: false, classList: { remove() {} }, appendChild() {}, remove() {}, click() { if (this.onclick) return this.onclick(); downloads++; }, showModal() { this.open = true; }, close() { this.open = false; this.onclose?.(); } }; }
  const get = id => { if (!nodes.has(id)) nodes.set(id, element()); return nodes.get(id); };
  const uiStorage = storage({ 'unrelated': 'keep', 'learning-planet-levels': '{"math":1}' });
  require('node:vm').runInNewContext(require('node:fs').readFileSync('assets/backup.js', 'utf8'), {
    window: {}, document: { getElementById: get, createElement: element, body: element() }, localStorage: uiStorage,
    location: { hostname: 'localhost', reload() { reloads++; } },
    Blob: class {}, URL: { createObjectURL: () => 'blob:test', revokeObjectURL() {} }, setTimeout() {}
  });
  get('exportBackup').click(); assert.equal(downloads, 1);
  const select = text => get('backupFile').onchange({ target: { files: [{ size: text.length, text: async () => text }], value: 'selected' } });
  const oldValues = structuredClone(uiStorage.values);
  await select(JSON.stringify(exported));
  assert.equal(get('restoreBackupDialog').open, true);
  assert.deepEqual(uiStorage.values, oldValues, 'Selecting a file does not replace progress');
  get('cancelBackup').click(); assert.deepEqual(uiStorage.values, oldValues);
  await select('{bad'); assert.equal(get('restoreBackupDialog').open, false);
  assert.deepEqual(uiStorage.values, oldValues);
  await select(JSON.stringify(exported)); get('confirmBackup').click();
  assert.equal(reloads, 1); assert.equal(uiStorage.values.unrelated, 'keep');
  assert.equal(uiStorage.values['learning-planet-levels'], exported.entries['learning-planet-levels']);
  console.log('PASS: backup UI downloads on click, previews before changes, cancels safely, rejects invalid files, and reloads only after confirmed import.');
})().catch(error => { console.error(error); process.exitCode = 1; });
