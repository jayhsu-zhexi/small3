(function () {
  'use strict';
  const byId = id => document.getElementById(id);
  const quiz = window.GardenQuiz;
  const letters = window.GardenLetters;
  const trace = window.GardenTrace.create({
    board: byId('trace-board'), hint: byId('trace-hint'), steps: byId('stroke-step'), demoButton: byId('trace-demo')
  });
  const sounds = window.MultiplyAudio.create();
  const speech = new Audio();
  const slowRate = 0.75;
  const prefsKey = 'small3-alphabet-garden-prefs-v1';
  const roundKey = 'small3-alphabet-garden-round-v1';
  const saved = read(prefsKey) || {};
  const group = quiz.groups.includes(saved.group) ? saved.group : quiz.groups[0];
  const prefs = {letter: Array.from(quiz.alphabet).includes(saved.letter) ? saved.letter : group[0], effects: saved.effects !== false};
  let round = quiz.restore(read(roundKey));
  let view = 'menu';
  let practiceLetters = quiz.alphabet;
  let letter = prefs.letter;
  let tracing = false;
  let reviewing = false;
  let heard = false;
  let playback = 0;
  let activeSpeaker = null;
  let party = null;
  const scenes = ['menu', 'practice', 'setup', 'quiz', 'result'];

  function read(key) {
    try { return JSON.parse(localStorage.getItem(key)); } catch { return null; }
  }

  function save(key, value) {
    try { localStorage.setItem(key, JSON.stringify(value)); }
    catch {
      const note = byId('save-notice');
      note.textContent = '這個瀏覽器暫時無法儲存進度，請在這個分頁完成測驗。';
      note.hidden = false;
    }
  }

  function speakerIdle() {
    activeSpeaker?.classList.remove('speaking');
    activeSpeaker = null;
  }

  function stopSpeech() {
    playback++;
    speech.onended = null;
    speech.onerror = null;
    speech.pause();
    speakerIdle();
    byId('audio-notice').hidden = true;
  }

  function playLetter(target, slow, button) {
    stopSpeech();
    sounds.stop();
    const ticket = playback;
    const question = view === 'quiz' ? round.questions[round.index] : null;
    const failed = () => {
      if (ticket !== playback) return;
      speakerIdle();
      const note = byId('audio-notice');
      note.textContent = '字母的聲音還沒播出，請再點一次播放。';
      note.hidden = false;
    };
    try {
      speech.src = '/assets/alphabet-garden-audio/' + target + '.wav';
      speech.defaultPlaybackRate = slow ? slowRate : 1;
      speech.playbackRate = speech.defaultPlaybackRate;
      speech.preservesPitch = true;
      if ('webkitPreservesPitch' in speech) speech.webkitPreservesPitch = true;
      activeSpeaker = button;
      button.classList.add('speaking');
      speech.onerror = failed;
      speech.onended = speakerIdle;
      speech.play().then(() => {
        if (ticket !== playback || !question || heard) return;
        heard = true;
        updateChoices(question);
      }).catch(failed);
    } catch { failed(); }
  }

  function show(scene) {
    stopSpeech();
    sounds.stop();
    trace.stop();
    party?.close();
    view = scene;
    for (const name of scenes) byId(name).hidden = name !== scene;
    byId('planet-link').hidden = scene !== 'menu';
    byId('garden-return').hidden = scene === 'menu';
    byId(scene).querySelector('h1').focus({preventScroll: true});
    window.scrollTo(0, 0);
  }

  function renderEffects() {
    byId('effects').setAttribute('aria-pressed', String(prefs.effects));
    byId('effects').textContent = prefs.effects ? '♫ 提示音開' : '♫ 提示音關';
  }

  function menu() {
    show('menu');
    const resume = byId('resume-round');
    resume.hidden = !round;
    if (round) resume.textContent = round.phase === 'result' ? '看看上次的測驗成果' : '繼續上次的測驗 · 第 ' + (round.index + 1) + ' 題';
  }

  function rangeLabel(scope) {
    if (scope === quiz.alphabet) return '全部字母 a – z';
    if (scope === 'bdpq') return '容易認錯的 b、d、p、q';
    return scope[0] + ' – ' + scope.at(-1);
  }

  function fillSelect(select, items, selected, label) {
    select.replaceChildren(...items.map(item => new Option(label(item), item)));
    select.value = selected;
  }

  function drawRack() {
    const rack = byId('letter-rack');
    rack.replaceChildren(...Array.from(practiceLetters, char => {
      const button = document.createElement('button');
      button.type = 'button';
      button.className = 'letter-chip';
      button.dataset.letter = char;
      button.setAttribute('aria-label', '小寫 ' + char);
      button.append(letters.glyph(char));
      return button;
    }));
  }

  function selectLetter(next) {
    letter = next;
    if (!reviewing) {
      prefs.letter = letter;
      save(prefsKey, prefs);
    }
    for (const button of byId('letter-rack').children) {
      button.setAttribute('aria-pressed', String(button.dataset.letter === letter));
    }
    byId('large-letter').replaceChildren(letters.glyph(letter));
    byId('letter-card').setAttribute('aria-label', '聽小寫 ' + letter + ' 的名稱');
    byId('previous-letter').disabled = letter === practiceLetters[0];
    byId('next-letter').disabled = letter === practiceLetters.at(-1);
    if (tracing) {
      stopSpeech();
      trace.select(letter);
      trace.demonstrate();
    } else playLetter(letter, false, byId('letter-card'));
  }

  function practice(review = false) {
    reviewing = review;
    practiceLetters = review ? quiz.review(round).join('') : quiz.alphabet;
    tracing = false;
    byId('practice-title').textContent = review ? '再練剛才認錯的字母' : '和小熊練習';
    drawRack();
    byId('listen-panel').hidden = false;
    byId('trace-panel').hidden = true;
    byId('return-result').hidden = !review;
    show('practice');
    selectLetter(review ? practiceLetters[0] : prefs.letter);
  }

  function stepLetter(offset) {
    const next = practiceLetters[practiceLetters.indexOf(letter) + offset];
    if (next) selectLetter(next);
  }

  function setup(scope = quiz.groups.find(item => item.includes(prefs.letter))) {
    fillSelect(byId('quiz-scope'), quiz.scopes, scope, rangeLabel);
    show('setup');
  }

  function prepareParty() {
    if (!party) party = window.CompletionParty.create(undefined, {perfectSound: true});
  }

  function startNewRound() {
    round = quiz.create(byId('quiz-scope').value);
    save(roundKey, round);
    openQuiz();
  }

  function openQuiz() {
    prepareParty();
    show('quiz');
    renderQuestion();
  }

  function drawLights() {
    byId('quiz-lights').replaceChildren(...round.questions.map((q, i) => {
      const item = document.createElement('li');
      const number = i + 1;
      const status = q.misses.length ? '再試過' : q.solved ? '一次答對' : '還沒作答';
      item.className = q.misses.length ? 'pink' : q.solved ? 'green' : '';
      if (i === round.index) { item.classList.add('now'); item.setAttribute('aria-current', 'step'); }
      item.textContent = q.misses.length ? '↻' : q.solved ? '✓' : String(number);
      item.setAttribute('aria-label', '第 ' + number + ' 題，' + status);
      return item;
    }));
  }

  function updateChoices(q) {
    for (const button of byId('answers').children) {
      const char = button.dataset.letter;
      const wrong = q.misses.includes(char);
      const correct = q.solved && char === q.letter;
      button.disabled = !heard || q.solved || wrong;
      button.classList.toggle('wrong', wrong);
      button.classList.toggle('correct', correct);
      button.lastElementChild.textContent = correct ? '✓' : wrong ? '×' : '';
    }
  }

  function showAnswer(q) {
    const feedback = byId('quiz-feedback');
    feedback.className = 'feedback';
    feedback.replaceChildren();
    if (q.solved) {
      feedback.classList.add('correct');
      const flower = document.createElement('span');
      flower.className = 'bloom';
      flower.setAttribute('aria-hidden', 'true');
      flower.textContent = '🌼';
      feedback.append(flower, '答對了！' + q.letter + ' 的花開了。');
    } else if (q.misses.length) {
      feedback.classList.add('wrong');
      feedback.textContent = '再聽聽看，換一個字母試試。';
    }
    byId('next-question').hidden = !q.solved;
    byId('next-question').textContent = round.index === quiz.size - 1 ? '看通關成果' : '下一題 ›';
    updateChoices(q);
    drawLights();
  }

  function renderQuestion() {
    const q = round.questions[round.index];
    heard = false;
    byId('question-count').textContent = '第 ' + (round.index + 1) + ' / ' + quiz.size + ' 題';
    byId('answers').replaceChildren(...q.choices.map(char => {
      const button = document.createElement('button');
      button.type = 'button';
      button.className = 'choice';
      button.dataset.letter = char;
      button.setAttribute('aria-label', '小寫 ' + char);
      const verdict = document.createElement('span');
      verdict.className = 'verdict';
      verdict.setAttribute('aria-hidden', 'true');
      button.append(letters.glyph(char), verdict);
      return button;
    }));
    showAnswer(q);
    if (!q.solved) playLetter(q.letter, false, byId('quiz-replay'));
  }

  function choose(char) {
    if (view !== 'quiz' || !heard) return;
    const verdict = quiz.answer(round, char);
    if (verdict === 'locked') return;
    save(roundKey, round);
    stopSpeech();
    if (prefs.effects) sounds.play(verdict);
    showAnswer(round.questions[round.index]);
    if (verdict === 'correct') byId('next-question').focus({preventScroll: true});
  }

  function celebrate() {
    prepareParty();
    party.show({perfect: quiz.perfect(round), sound: prefs.effects});
  }

  function result(withParty = false) {
    const count = quiz.firstCorrect(round);
    byId('result-title').textContent = quiz.perfect(round) ? '全綠通關！' : '字母花園通關了！';
    byId('result-summary').textContent = '十朵花都開了！有 ' + count + ' 題第一次就答對。';
    byId('result-letters').replaceChildren(...round.questions.map((q, index) => {
      const item = document.createElement('div');
      item.className = 'result-seed ' + (q.misses.length ? 'pink' : 'green');
      const caption = document.createElement('small');
      caption.textContent = q.misses.length ? '再試答對' : '一次答對';
      item.setAttribute('aria-label', '第 ' + (index + 1) + ' 題，小寫 ' + q.letter + '，' + caption.textContent);
      item.setAttribute('role', 'img');
      item.append(letters.glyph(q.letter), caption);
      return item;
    }));
    byId('review-letters').hidden = !quiz.review(round).length;
    show('result');
    if (withParty) celebrate();
  }

  byId('effects').onclick = () => {
    prefs.effects = !prefs.effects;
    if (!prefs.effects) { sounds.stop(); party?.stopSound(); }
    renderEffects();
    save(prefsKey, prefs);
  };
  byId('garden-return').onclick = menu;
  byId('practice-entry').onclick = () => practice();
  byId('letter-rack').onclick = event => {
    const button = event.target.closest('button');
    if (button) selectLetter(button.dataset.letter);
  };
  byId('letter-card').onclick = () => playLetter(letter, false, byId('letter-card'));
  byId('practice-slow').onclick = () => playLetter(letter, true, byId('practice-slow'));
  byId('trace-entry').onclick = () => {
    stopSpeech();
    tracing = true;
    byId('listen-panel').hidden = true;
    byId('trace-panel').hidden = false;
    trace.select(letter);
    trace.demonstrate();
    byId('trace-demo').focus({preventScroll: true});
  };
  byId('trace-demo').onclick = trace.demonstrate;
  byId('trace-reset').onclick = trace.reset;
  byId('listen-again').onclick = () => {
    tracing = false;
    trace.stop();
    byId('trace-panel').hidden = true;
    byId('listen-panel').hidden = false;
    byId('letter-card').focus({preventScroll: true});
    playLetter(letter, false, byId('letter-card'));
  };
  byId('previous-letter').onclick = () => stepLetter(-1);
  byId('next-letter').onclick = () => stepLetter(1);
  byId('quiz-entry').onclick = () => setup();
  byId('resume-round').onclick = () => round.phase === 'result' ? result() : openQuiz();
  byId('start-quiz').onclick = () => {
    if (round?.phase === 'playing') byId('restart-dialog').showModal();
    else startNewRound();
  };
  byId('keep-round').onclick = () => { byId('restart-dialog').close(); openQuiz(); };
  byId('replace-round').onclick = () => { byId('restart-dialog').close(); startNewRound(); };
  byId('quiz-replay').onclick = () => playLetter(round.questions[round.index].letter, false, byId('quiz-replay'));
  byId('quiz-slow').onclick = () => playLetter(round.questions[round.index].letter, true, byId('quiz-slow'));
  byId('answers').onclick = event => {
    const button = event.target.closest('button');
    if (button && !button.disabled) choose(button.dataset.letter);
  };
  byId('next-question').onclick = () => {
    if (!quiz.advance(round)) return;
    save(roundKey, round);
    if (round.phase === 'result') result(true);
    else {
      byId('quiz-title').focus({preventScroll: true});
      renderQuestion();
    }
  };
  byId('review-letters').onclick = () => practice(true);
  byId('return-result').onclick = () => result();
  byId('anotherRound').onclick = () => setup(round.scope);
  byId('replay-party').onclick = celebrate;
  function quiet() { stopSpeech(); sounds.stop(); trace.stop(); party?.stopSound(); }
  document.addEventListener('visibilitychange', () => { if (document.hidden) quiet(); });
  window.addEventListener('pagehide', quiet);
  renderEffects();
  menu();
})();
