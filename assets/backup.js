(function (root) {
  'use strict';
  const PREFIX = 'learning-planet-';
  const subjects = { math: 3, chinese: 3, focus: 12, english: 6 };
  const keys = [
    'levels', 'chinese-history', 'question-history-v1', 'history-v1', 'session-v1',
    ...Object.keys(subjects).map(s => 'session-v1-' + s),
    ...['space', 'shop', 'pets'].map(s => 'stories-v1-' + s)
  ].map(s => PREFIX + s);
  const MAX_BYTES = 2 * 1024 * 1024;
  const object = x => !!x && typeof x === 'object' && !Array.isArray(x);
  const integer = (x, min, max) => Number.isInteger(x) && x >= min && x <= max;
  const strings = (x, max) => Array.isArray(x) && x.length <= max && x.every(v => typeof v === 'string');
  const question = q => object(q) && ['prompt', 'display', 'answer', 'hint'].every(k => typeof q[k] === 'string') && strings(q.choices, 4) && q.choices.length === 4 && q.choices.filter(c => c === q.answer).length === 1;
  function session(s, subject) {
    return object(s) && s.version === 1 && Object.hasOwn(subjects, s.subject) && (!subject || s.subject === subject) && integer(s.level, 1, subjects[s.subject]) && integer(s.round, 0, 7) && integer(s.stars, 0, 8) && question(s.current) && strings(s.attempted, 4) && s.attempted.every(c => s.current.choices.includes(c) && c !== s.current.answer) && ['wrongQuestions', 'reviewDeck'].every(k => Array.isArray(s[k]) && s[k].length <= 8 && s[k].every(question)) && ['englishDeck', 'chineseDeck'].every(k => Array.isArray(s[k]) && s[k].length <= 200) && (!s.reviewMode || s.round < s.reviewDeck.length) && (s.reviewMode || !['english', 'chinese'].includes(s.subject) || s[s.subject === 'english' ? 'englishDeck' : 'chineseDeck'].length >= 8);
  }
  function validValue(key, value) {
    if (value === null) return true;
    if (key === PREFIX + 'levels') return object(value) && Object.entries(value).every(([s, n]) => Object.hasOwn(subjects, s) && integer(n, 1, subjects[s]));
    if (key === PREFIX + 'chinese-history') return strings(value, 100);
    if (key === PREFIX + 'question-history-v1') return object(value) && Object.entries(value).every(([s, list]) => Object.hasOwn(subjects, s) && strings(list, 160));
    if (key === PREFIX + 'session-v1') return session(value);
    if (key.startsWith(PREFIX + 'session-v1-')) return session(value, key.slice((PREFIX + 'session-v1-').length));
    if (key === PREFIX + 'history-v1') return object(value) && Object.entries(value).every(([s, data]) => Object.hasOwn(subjects, s) && object(data) &&
      Array.isArray(data.events) && data.events.length <= 600 && data.events.every(e => object(e) && typeof e.id === 'string' && typeof e.type === 'string' && ['first', 'retry', 'review'].includes(e.kind) && typeof e.correct === 'boolean' && Number.isFinite(e.at)) &&
      Array.isArray(data.stages) && data.stages.length <= 100 && data.stages.every(e => object(e) && typeof e.id === 'string' && integer(e.stars, 0, 8) && Number.isFinite(e.at)) &&
      Array.isArray(data.mistakes) && data.mistakes.length <= 40 && data.mistakes.every(m => object(m) && typeof m.id === 'string' && question(m.q) && integer(m.level, 1, subjects[s]) && Number.isFinite(m.due)));
    if (key.startsWith(PREFIX + 'stories-v1-')) return object(value) && value.version === 1 && value.theme === key.slice((PREFIX + 'stories-v1-').length) && integer(value.variant, 0, 3) && integer(value.step, 0, 4) && object(value.values) && Object.values(value.values).every(n => integer(n, 0, 32)) && strings(value.selected, 4) && strings(value.sequence, 3) && object(value.pairs) && Object.values(value.pairs).every(v => typeof v === 'string');
    return false;
  }
  function capture(storage) {
    return { format: 'learning-planet-backup', version: 1, createdAt: new Date().toISOString(), entries: Object.fromEntries(keys.map(k => [k, storage.getItem(k)])) };
  }
  function parse(text) {
    if (typeof text !== 'string' || text.length > MAX_BYTES) throw Error('備份檔案太大，請選擇 2 MB 以內的遊戲備份。');
    let data;
    try { data = JSON.parse(text); } catch { throw Error('無法讀取這個檔案，請選擇遊戲匯出的 JSON 備份。'); }
    if (!object(data) || data.format !== 'learning-planet-backup' || data.version !== 1 || !object(data.entries) || Object.keys(data.entries).length !== keys.length || !keys.every(k => Object.hasOwn(data.entries, k))) throw Error('備份格式或版本不支援，原本的進度沒有變更。');
    for (const [key, raw] of Object.entries(data.entries)) {
      if (raw === null) continue;
      if (typeof raw !== 'string') throw Error('備份內容不完整，原本的進度沒有變更。');
      let value;
      try { value = JSON.parse(raw); } catch { throw Error('備份內有損壞的紀錄，原本的進度沒有變更。'); }
      if (!validValue(key, value)) throw Error('備份內有無效的進度，原本的進度沒有變更。');
    }
    return data;
  }
  function restore(storage, data) {
    data = parse(JSON.stringify(data));
    const previous = capture(storage);
    const write = entries => { for (const key of keys) entries[key] === null ? storage.removeItem(key) : storage.setItem(key, entries[key]); };
    try { write(data.entries); }
    catch {
      try { write(previous.entries); }
      catch { throw Error('儲存空間無法使用，還原未完成。請保留備份檔，恢復瀏覽器儲存空間後重新匯入。'); }
      throw Error('目前無法寫入備份，已恢復匯入前的進度。請確認瀏覽器儲存空間。');
    }
  }
  function summary(data) {
    const history = JSON.parse(data.entries[PREFIX + 'history-v1'] || 'null') || {};
    const stages = Object.values(history).reduce((sum, d) => sum + d.stages.length, 0);
    const saves = Object.keys(subjects).filter(s => JSON.parse(data.entries[PREFIX + 'session-v1-' + s] || 'null')).length;
    const stories = ['space', 'shop', 'pets'].filter(s => JSON.parse(data.entries[PREFIX + 'stories-v1-' + s] || 'null')).length;
    return stages + ' 次闖關紀錄、' + saves + ' 科中途存檔、' + stories + ' 個故事進度';
  }
  function mount() {
    const $ = id => document.getElementById(id);
    const status = $('backupStatus');
    let pending = null;
    const dialog = $('restoreBackupDialog');
    const announce = message => { status.textContent = message; };
    const download = (data, name) => {
      const url = URL.createObjectURL(new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' }));
      const link = document.createElement('a'); link.href = url; link.download = name;
      document.body.appendChild(link); link.click(); link.remove();
      setTimeout(() => URL.revokeObjectURL(url), 60000);
    };
    $('exportBackup').onclick = () => {
      try { download(capture(localStorage), 'learning-planet-' + new Date().toISOString().slice(0, 10) + '.json'); announce('已準備下載備份，請保留檔案。換裝置或網址時，可在這裡匯入。'); }
      catch { announce('目前無法匯出，請確認瀏覽器允許下載與儲存。'); }
    };
    $('importBackup').onclick = () => $('backupFile').click();
    $('backupFile').onchange = async event => {
      const file = event.target.files[0]; event.target.value = '';
      if (!file) return;
      try {
        if (file.size > MAX_BYTES) throw Error('檔案超過 2 MB，請選擇遊戲匯出的 JSON 備份。');
        pending = parse(await file.text());
        $('restoreBackupSummary').textContent = '這份備份包含 ' + summary(pending) + '。';
        dialog.showModal();
      } catch (error) { pending = null; announce(error.message); }
    };
    $('cancelBackup').onclick = () => { pending = null; dialog.close(); };
    dialog.onclose = () => { pending = null; };
    $('confirmBackup').onclick = () => {
      if (!pending) return;
      try {
        restore(localStorage, pending);
        pending = null; dialog.close();
        announce('匯入完成，正在重新載入進度。');
        location.reload();
      } catch (error) { pending = null; dialog.close(); announce(error.message); }
    };
    $('downloadBeforeRestore').onclick = () => $('exportBackup').click();
    if (location.hostname.endsWith('.vercel.app') && location.hostname !== 'small3.vercel.app') {
      $('officialNotice').classList.remove('hidden');
    }
  }
  const api = { keys, MAX_BYTES, capture, parse, restore, summary, mount };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  else { root.LearningBackup = api; mount(); }
})(typeof window === 'undefined' ? {} : window);
