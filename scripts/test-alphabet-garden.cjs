'use strict';
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const {createHash} = require('node:crypto');
const {files} = require('./build.cjs');
const root = path.resolve(__dirname, '..');
const load = file => fs.readFileSync(path.join(root, file));
function browserModule(file) {
  const globals = {window: {}};
  vm.runInNewContext(load('assets/' + file).toString(), globals);
  return globals.window;
}
const quiz = browserModule('alphabet-garden-quiz.js').GardenQuiz;
const letters = browserModule('alphabet-garden-letters.js').GardenLetters;
assert.equal(quiz.groups.join(''), quiz.alphabet);
assert.equal(Object.keys(letters.shapes).join(''), quiz.alphabet);
assert.throws(() => quiz.create(''), /範圍/);
for (const scope of quiz.scopes) {
  for (let run = 0; run < 35; run++) {
    const round = quiz.create(scope);
    assert.equal(round.questions.length, 10);
    assert.equal(new Set(round.questions.map(q => q.letter)).size, Math.min(10, scope.length));
    assert.ok(quiz.restore(round));
    assert.equal(quiz.advance(round), false);
    const wrongTargets = new Set();
    for (const [i, q] of round.questions.entries()) {
      assert.equal(q.choices.length, 3);
      assert.equal(new Set(q.choices).size, 3);
      assert.ok(q.choices.every(char => scope.includes(char)));
      if (i) assert.notEqual(q.letter, round.questions[i - 1].letter);
      if (run % 2 && i % 3 === 0) {
        for (const miss of q.choices.filter(char => char !== q.letter)) {
          assert.equal(quiz.answer(round, miss), 'wrong');
          assert.equal(quiz.answer(round, miss), 'locked');
        }
        wrongTargets.add(q.letter);
        assert.equal(quiz.advance(round), false);
      }
      assert.equal(quiz.answer(round, q.letter), 'correct');
      assert.equal(quiz.answer(round, q.letter), 'locked');
      assert.ok(quiz.restore(JSON.parse(JSON.stringify(round))));
      assert.equal(quiz.perfect(round), false);
      assert.equal(quiz.advance(round), true);
    }
    assert.ok(quiz.restore(round));
    assert.equal(quiz.answer(round, 'a'), 'locked');
    assert.equal(quiz.perfect(round), run % 2 === 0);
    assert.equal(quiz.firstCorrect(round), run % 2 ? 6 : 10);
    assert.deepEqual(Array.from(quiz.review(round)), [...wrongTargets]);
  }
}
for (const mutate of [
  r => { r.scope = 'ab'; }, r => { r.index = 10; }, r => { r.phase = 'result'; },
  r => { r.questions.pop(); }, r => { r.questions[1].solved = true; },
  r => { r.questions[0].misses = [r.questions[0].letter]; },
  r => { r.questions[0].choices[0] = r.questions[0].choices[1]; }
]) {
  const draft = quiz.create(quiz.groups[0]);
  mutate(draft);
  assert.equal(quiz.restore(draft), null);
}
const hashes = new Set();
for (const char of quiz.alphabet) {
  const asset = 'assets/alphabet-garden-audio/' + char + '.wav';
  assert.ok(files.includes(asset));
  const wav = load(asset);
  assert.equal(wav.toString('ascii', 0, 4), 'RIFF');
  assert.equal(wav.toString('ascii', 8, 12), 'WAVE');
  const fmt = wav.indexOf('fmt ') + 8;
  assert.equal(wav.readUInt16LE(fmt), 1);
  assert.equal(wav.readUInt16LE(fmt + 2), 1);
  assert.equal(wav.readUInt32LE(fmt + 4), 22050);
  assert.equal(wav.readUInt16LE(fmt + 14), 16);
  const data = wav.indexOf('data') + 8;
  const size = wav.readUInt32LE(data - 4);
  assert.ok(size >= 11025 && size <= 22050 * 2 * 4 && data + size <= wav.length);
  let voiced = 0;
  for (let i = data; i < data + size; i += 2) if (Math.abs(wav.readInt16LE(i)) > 450) voiced++;
  assert.ok(voiced > 1300, char + ' must contain audible speech');
  hashes.add(createHash('sha256').update(wav.subarray(data, data + size)).digest('hex'));
  assert.ok(letters.shapes[char].every(s => s.hint && (s.d || Number.isFinite(s.x))));
}
assert.equal(hashes.size, 26);
assert.ok(letters.shapes.i.at(-1).x && letters.shapes.j.at(-1).x);

// A browser can start the first animation callback just before the sampled start time.
function testEarlyDemoFrame() {
  let frame;
  const element = () => ({
    style: {}, attrs: {}, classList: {toggle() {}}, setAttribute(k, v) { this.attrs[k] = v; },
    append() {}, replaceChildren() {}, addEventListener() {},
    getTotalLength: () => 52, getPointAtLength: n => ({x: 60, y: 60 + n})
  });
  const board = element();
  const marker = element();
  board.querySelector = selector => selector === '.trace-marker' ? marker : element();
  const env = {
    window: {matchMedia: () => ({matches: false})}, performance: {now: () => 100},
    GardenLetters: {shapes: letters.shapes, mark: element},
    requestAnimationFrame(callback) { frame = callback; return 1; }, cancelAnimationFrame() {}
  };
  vm.runInNewContext(load('assets/alphabet-garden-trace.js').toString(), env);
  const trace = env.window.GardenTrace.create({board, hint: element(), steps: element(), demoButton: element()});
  trace.select('i');
  trace.demonstrate();
  frame(99.8);
  assert.equal(marker.attrs.transform, 'translate(60 60)');
  frame(550);
  assert.notEqual(marker.attrs.transform, 'translate(60 60)');
}
testEarlyDemoFrame();
const page = load('alphabet-garden.html').toString();
assert.ok(files.includes('alphabet-garden.html'));
for (const [, asset] of page.matchAll(/(?:src|href)="\/(assets\/[^"?]+)/g)) assert.ok(files.includes(asset), asset);
const rewrites = JSON.parse(load('vercel.json')).rewrites;
for (const url of ['/alphabet-garden', '/alphabet-garden/']) assert.equal(rewrites.find(r => r.source === url).destination, '/alphabet-garden.html');
assert.match(load('index.html').toString(), /href="\/alphabet-garden"/);
console.log('Alphabet Garden passed: 26 writing models and voiced recordings, all quiz ranges, saved rounds, scoring, review and build assets.');
