(function () {
  'use strict';
  const alphabet = 'abcdefghijklmnopqrstuvwxyz';
  const groups = ['abcde', 'fghij', 'klmno', 'pqrst', 'uvwxyz'];
  const scopes = [...groups, 'bdpq', alphabet];
  const size = 10;

  function shuffled(values, random) {
    const items = Array.from(values);
    for (let i = items.length - 1; i > 0; i--) {
      const j = Math.floor(random() * (i + 1));
      [items[i], items[j]] = [items[j], items[i]];
    }
    return items;
  }

  function create(scope, random = Math.random) {
    if (!scopes.includes(scope)) throw new Error('請選擇字母範圍。');
    const questions = [];
    while (questions.length < size) {
      const batch = shuffled(scope, random);
      if (batch[0] === questions.at(-1)?.letter) [batch[0], batch[1]] = [batch[1], batch[0]];
      for (const letter of batch) {
        const others = shuffled(scope.replace(letter, ''), random).slice(0, 2);
        questions.push({letter, choices: shuffled([letter, ...others], random), misses: [], solved: false});
        if (questions.length === size) break;
      }
    }
    return {version: 1, scope, index: 0, phase: 'playing', questions};
  }

  function answer(round, letter) {
    if (!round || round.phase !== 'playing') return 'locked';
    const question = round.questions[round.index];
    if (question.solved || !question.choices.includes(letter) || question.misses.includes(letter)) return 'locked';
    if (letter !== question.letter) {
      question.misses.push(letter);
      return 'wrong';
    }
    question.solved = true;
    return 'correct';
  }

  function advance(round) {
    if (round.phase !== 'playing' || !round.questions[round.index].solved) return false;
    if (round.index === size - 1) round.phase = 'result';
    else round.index++;
    return true;
  }

  function firstCorrect(round) {
    return round.questions.filter(q => q.solved && !q.misses.length).length;
  }

  function perfect(round) {
    return round.phase === 'result' && firstCorrect(round) === size;
  }

  function review(round) {
    return [...new Set(round.questions.filter(q => q.misses.length).map(q => q.letter))];
  }

  function restore(value) {
    if (!value || value.version !== 1 || !scopes.includes(value.scope) ||
        !Number.isInteger(value.index) || value.index < 0 || value.index >= size ||
        !['playing', 'result'].includes(value.phase) ||
        !Array.isArray(value.questions) || value.questions.length !== size) return null;
    if (value.phase === 'result' && value.index !== size - 1) return null;
    const validLetter = char => typeof char === 'string' && char.length === 1 && value.scope.includes(char);
    for (const [i, q] of value.questions.entries()) {
      if (!q || !validLetter(q.letter) || typeof q.solved !== 'boolean' ||
          !Array.isArray(q.choices) || q.choices.length !== 3 || new Set(q.choices).size !== 3 ||
          !q.choices.includes(q.letter) || !q.choices.every(validLetter) ||
          !Array.isArray(q.misses) || q.misses.length > 2 || new Set(q.misses).size !== q.misses.length ||
          !q.misses.every(char => q.choices.includes(char) && char !== q.letter)) return null;
      if ((i < value.index || value.phase === 'result') && !q.solved) return null;
      if (i > value.index && (q.solved || q.misses.length)) return null;
    }
    return value;
  }

  const api = {alphabet, groups, scopes, size, create, answer, advance, firstCorrect, perfect, review, restore};
  if (typeof module === 'object' && module.exports) module.exports = api;
  else window.GardenQuiz = api;
})();
