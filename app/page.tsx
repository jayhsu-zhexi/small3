'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { BookOpen, Brain, Calculator, Check, Lightbulb, Lock, Rocket, RotateCcw, Star, Trophy, Volume2, VolumeX } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Switch } from '@/components/ui/switch';

type Subject = 'math' | 'chinese' | 'focus';
type Level = 1 | 2 | 3;
type Challenge = { prompt: string; display: string; choices: string[]; answer: string; hint: string };
const TOTAL = 8;
const subjectInfo = {
  math: { label: '數學', Icon: Calculator, color: 'blue' },
  chinese: { label: '國語', Icon: BookOpen, color: 'orange' },
  focus: { label: '專注力', Icon: Brain, color: 'green' },
} as const;
const levelInfo = {
  1: { name: '暖身關', icon: '🌱' },
  2: { name: '成長關', icon: '🚀' },
  3: { name: '挑戰關', icon: '🏆' },
} as const;

const chineseBank: Challenge[] = [
  { prompt: '選出正確的詞語', display: '今天的天氣很＿＿，適合去公園。', choices: ['晴朗', '清朗', '晴郎', '清郎'], answer: '晴朗', hint: '「晴」和太陽、天氣有關。' },
  { prompt: '哪個詞語最適合？', display: '妹妹＿＿地把積木收進盒子。', choices: ['仔細', '清楚', '熱鬧', '飛快'], answer: '仔細', hint: '想想收拾東西時，需要小心還是熱鬧？' },
  { prompt: '找出意思相近的詞', display: '「開心」和哪個詞最接近？', choices: ['快樂', '難過', '安靜', '生氣'], answer: '快樂', hint: '想想笑咪咪時的心情。' },
  { prompt: '選出正確的量詞', display: '一＿＿鉛筆', choices: ['枝', '座', '片', '朵'], answer: '枝', hint: '細長的筆，通常用哪個量詞？' },
  { prompt: '哪個句子最通順？', display: '選出語序正確的句子。', choices: ['小鳥在樹上唱歌。', '在唱歌小鳥樹上。', '樹上小鳥歌唱在。', '唱歌在小鳥樹上。'], answer: '小鳥在樹上唱歌。', hint: '先找「誰」，再找「在哪裡做什麼」。' },
  { prompt: '選出相反的詞', display: '「勇敢」的相反詞是？', choices: ['膽小', '堅強', '認真', '活潑'], answer: '膽小', hint: '遇到困難時，很害怕可以怎麼形容？' },
  { prompt: '選出正確的字', display: '我＿＿經寫完功課了。', choices: ['已', '以', '己', '乙'], answer: '已', hint: '「已經」表示事情完成了。' },
  { prompt: '讀一讀，找答案', display: '小安帶著雨傘出門，因為天空烏雲密布。接下來最可能發生什麼？', choices: ['下雨', '下雪', '刮颱風', '出太陽'], answer: '下雨', hint: '烏雲和雨傘提供了線索。' },
];

const chineseAdvancedBank: Challenge[] = [
  { prompt: '選出正確的成語', display: '大家你一句、我一句，教室裡＿＿。', choices: ['七嘴八舌', '一心一意', '自言自語', '鴉雀無聲'], answer: '七嘴八舌', hint: '很多人同時說話，會是什麼樣子？' },
  { prompt: '找出連接詞', display: '＿＿外面下雨，＿＿我們改在室內活動。', choices: ['因為／所以', '雖然／但是', '不但／而且', '先／再'], answer: '因為／所以', hint: '前面是原因，後面是結果。' },
  { prompt: '找出錯別字', display: '哪一個詞語寫錯了？', choices: ['功課', '休息', '己經', '圖書館'], answer: '己經', hint: '表示事情完成，要用「已」。' },
  { prompt: '閱讀推論', display: '地上有濕腳印，窗邊的花盆倒了。最可能發生什麼事？', choices: ['小狗從雨中跑進來', '有人正在睡覺', '太陽非常大', '大家在看書'], answer: '小狗從雨中跑進來', hint: '把「濕腳印」和「花盆倒了」放在一起想。' },
  { prompt: '找出成語的意思', display: '「半途而廢」的意思是？', choices: ['事情做到一半就停止', '很快把事情完成', '一邊走一邊休息', '先失敗後成功'], answer: '事情做到一半就停止', hint: '「半途」是半路，「廢」是停止。' },
  { prompt: '選出病句', display: '哪一句需要修改？', choices: ['我看見美麗的花香。', '妹妹穿上紅色外套。', '大家開心地唱歌。', '爸爸仔細閱讀報紙。'], answer: '我看見美麗的花香。', hint: '花香能用眼睛「看見」嗎？' },
  { prompt: '找出正確關係', display: '「蜜蜂：蜂蜜」就像「乳牛：＿＿」。', choices: ['牛奶', '草地', '牧場', '尾巴'], answer: '牛奶', hint: '想想前一個動物能提供什麼。' },
  { prompt: '閱讀主旨', display: '小樹經過風吹雨打，仍努力向上生長。這句話告訴我們？', choices: ['遇到困難也不要放棄', '下雨時不要出門', '小樹長得非常快', '風雨會傷害植物'], answer: '遇到困難也不要放棄', hint: '注意「仍努力」帶出的精神。' },
  { prompt: '改寫句子', display: '「弟弟打破了花瓶。」改成把字句是？', choices: ['弟弟把花瓶打破了。', '花瓶把弟弟打破了。', '打破弟弟的是花瓶。', '花瓶弟弟把打破了。'], answer: '弟弟把花瓶打破了。', hint: '誰＋把＋東西＋怎麼了。' },
  { prompt: '選出適合的成語', display: '他每天練習跑步，從不偷懶，真是＿＿。', choices: ['持之以恆', '手忙腳亂', '大吃一驚', '東張西望'], answer: '持之以恆', hint: '長時間一直努力、不放棄。' },
];

const focusBank: Challenge[] = [
  { prompt: '找出完全一樣的符號', display: '目標：★●▲', choices: ['★●▲', '★▲●', '☆●▲', '★●△'], answer: '★●▲', hint: '從左到右，一個一個比對。' },
  { prompt: '找出完全一樣的符號', display: '目標：◆○■', choices: ['◇○■', '◆○■', '◆●■', '◆○□'], answer: '◆○■', hint: '注意實心和空心。' },
  { prompt: '找出不同的一個', display: '其他三個都相同。', choices: ['貝貝貝', '貝貝見', '貝貝貝', '貝貝貝'], answer: '貝貝見', hint: '仔細看最後一個字。' },
  { prompt: '找出完全一樣的數字', display: '目標：6389', choices: ['6389', '6398', '6839', '6386'], answer: '6389', hint: '用手指遮住後面，一位一位看。' },
  { prompt: '找出不同的一個', display: '其他三個方向相同。', choices: ['↑→↓', '↑→↓', '↑←↓', '↑→↓'], answer: '↑←↓', hint: '注意中間箭頭的方向。' },
  { prompt: '找出完全一樣的圖案', display: '目標：☀☁☂', choices: ['☀☁☂', '☀☂☁', '☁☀☂', '☀☁☃'], answer: '☀☁☂', hint: '先看太陽，再看雲，最後看雨傘。' },
  { prompt: '找出不同的一個', display: '其他三個字母相同。', choices: ['bdpq', 'bdpq', 'bqpq', 'bdpq'], answer: 'bqpq', hint: '注意第二個字母。' },
  { prompt: '找出完全一樣的色彩順序', display: '目標：紅－藍－黃', choices: ['紅－黃－藍', '藍－紅－黃', '紅－藍－黃', '黃－藍－紅'], answer: '紅－藍－黃', hint: '在心裡念一次：紅、藍、黃。' },
];

function shuffle<T>(items: T[]) { return [...items].sort(() => Math.random() - 0.5); }
function makeMath(level: Level = 1): Challenge {
  const kind = Math.floor(Math.random() * 3);
  let left = 0, right = 0, answer = 0, sign = '+';
  if (level === 3 && kind === 0) {
    const packs = 3 + Math.floor(Math.random() * 6), each = 4 + Math.floor(Math.random() * 6), extra = 2 + Math.floor(Math.random() * 11);
    answer = packs * each + extra;
    const wrong = new Set<number>(); while (wrong.size < 3) { const value = answer + Math.floor(Math.random() * 17) - 8; if (value >= 0 && value !== answer) wrong.add(value); }
    return { prompt: '兩步驟挑戰', display: packs + ' 包糖果，每包 ' + each + ' 顆，再加 ' + extra + ' 顆，共有幾顆？', answer: String(answer), choices: shuffle([answer, ...wrong]).map(String), hint: '先算每包糖果的總數，再加上多出來的糖果。' };
  }
  if (level === 3 && kind === 1) {
    const divisor = 3 + Math.floor(Math.random() * 6), quotient = 5 + Math.floor(Math.random() * 8), remainder = 1 + Math.floor(Math.random() * (divisor - 1));
    const total = divisor * quotient + remainder; answer = remainder;
    return { prompt: '找出餘數', display: total + ' 顆球，每 ' + divisor + ' 顆裝一盒，最後剩幾顆？', answer: String(answer), choices: shuffle([answer, 0, divisor, Math.max(1, remainder + 1)]).map(String), hint: '先找最接近、但不超過總數的倍數。' };
  }
  const upper = level === 1 ? 99 : 900;
  if (kind === 0) { left = level === 1 ? 12 + Math.floor(Math.random() * 69) : 120 + Math.floor(Math.random() * 480); right = 4 + Math.floor(Math.random() * Math.max(5, upper - left)); answer = left + right; }
  else if (kind === 1) { left = level === 1 ? 25 + Math.floor(Math.random() * 70) : 220 + Math.floor(Math.random() * 680); right = 3 + Math.floor(Math.random() * (left - 3)); answer = left - right; sign = '−'; }
  else { left = level === 1 ? 2 + Math.floor(Math.random() * 4) : 3 + Math.floor(Math.random() * 7); right = 2 + Math.floor(Math.random() * 8); answer = left * right; sign = '×'; }
  const wrong = new Set<number>();
  while (wrong.size < 3) { const offset = Math.floor(Math.random() * 15) - 7; const candidate = Math.max(0, answer + (offset === 0 ? 8 : offset)); if (candidate !== answer) wrong.add(candidate); }
  const hint = sign === '×' ? `可以把 ${left} 加自己 ${right} 次。` : sign === '+' ? '先算到下一個整十，再把剩下的加上去。' : `試著從 ${left} 往回數 ${right}。`;
  return { prompt: '算算看', display: `${left} ${sign} ${right} = ?`, answer: String(answer), choices: shuffle([answer, ...wrong]).map(String), hint };
}
function makeFocus(level: Level): Challenge {
  const pools = level === 1 ? ['★●▲◆○■△◇□', '6389251740', '↑↓←→'] : level === 2 ? ['6389251740', '晴睛清情請靜', '↑↓←→★●'] : ['6389251740', '晴睛清情請靜精', 'bdpq6890'];
  const pool = pools[Math.floor(Math.random() * pools.length)], length = level + 2;
  let target = ''; for (let i = 0; i < length; i++) target += pool[Math.floor(Math.random() * pool.length)];
  const mutate = (text: string) => { const chars = [...text], index = Math.floor(Math.random() * chars.length); let value = chars[index]; while (value === chars[index]) value = pool[Math.floor(Math.random() * pool.length)]; chars[index] = value; return chars.join(''); };
  if (level === 3 && Math.random() > .5) {
    const answer = [...target].reverse().join(''), wrong = new Set<string>(); while (wrong.size < 3) { const value = mutate(answer); if (value !== answer) wrong.add(value); }
    return { prompt: '工作記憶挑戰', display: '把「' + target + '」倒過來，哪一個正確？', answer, choices: shuffle([answer, ...wrong]), hint: '從最後一個開始，一個一個往前讀。' };
  }
  const wrong = new Set<string>(); while (wrong.size < 3) { const value = mutate(target); if (value !== target) wrong.add(value); }
  return { prompt: '找出完全一樣的內容', display: '目標：' + target, answer: target, choices: shuffle([target, ...wrong]), hint: level === 1 ? '從左到右，一個一個比對。' : '先看開頭和結尾，再檢查中間。' };
}
function makeChallenge(subject: Subject, round: number, level: Level): Challenge {
  if (subject === 'math') return makeMath(level);
  if (subject === 'focus') return level === 1 && Math.random() < .35 ? { ...focusBank[round % focusBank.length], choices: shuffle(focusBank[round % focusBank.length].choices) } : makeFocus(level);
  const bank = level === 1 ? chineseBank : level === 2 ? [...chineseBank, ...chineseAdvancedBank] : chineseAdvancedBank;
  const item = bank[Math.floor(Math.random() * bank.length)];
  return { ...item, choices: shuffle(item.choices) };
}

function playTone(success: boolean, enabled: boolean) {
  if (!enabled || typeof window === 'undefined') return;
  const AudioContextClass = window.AudioContext || (window as typeof window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
  if (!AudioContextClass) return;
  const context = new AudioContextClass(); const oscillator = context.createOscillator(); const gain = context.createGain();
  oscillator.frequency.value = success ? 660 : 220; gain.gain.setValueAtTime(.08, context.currentTime); gain.gain.exponentialRampToValueAtTime(.001, context.currentTime + .16);
  oscillator.connect(gain); gain.connect(context.destination); oscillator.start(); oscillator.stop(context.currentTime + .16);
}

export default function Home() {
  const [subject, setSubject] = useState<Subject>('math');
  const [level, setLevel] = useState<Level>(1);
  const [unlocks, setUnlocks] = useState<Record<Subject, Level>>({ math: 1, chinese: 1, focus: 1 });
  const [started, setStarted] = useState(false);
  const [round, setRound] = useState(0);
  const [stars, setStars] = useState(0);
  const [streak, setStreak] = useState(0);
  const [challenge, setChallenge] = useState<Challenge>(() => makeMath(1));
  const [selected, setSelected] = useState<string | null>(null);
  const [message, setMessage] = useState('選一個答案');
  const [showHint, setShowHint] = useState(false);
  const [sound, setSound] = useState(false);
  const [calmMotion, setCalmMotion] = useState(true);
  const [finished, setFinished] = useState(false);
  const progress = useMemo(() => (round / TOTAL) * 100, [round]);
  const ActiveIcon = subjectInfo[subject].Icon;

  useEffect(() => {
    try {
      const saved = JSON.parse(localStorage.getItem('learning-planet-levels') || 'null');
      if (saved) setUnlocks({ math: saved.math || 1, chinese: saved.chinese || 1, focus: saved.focus || 1 });
    } catch { /* keep fresh progress */ }
  }, []);

  const startGame = useCallback((nextSubject?: Subject, nextLevel?: Level) => {
    const chosen = nextSubject ?? subject;
    const chosenLevel = nextLevel ?? level;
    setSubject(chosen); setLevel(chosenLevel); setStarted(true); setRound(0); setStars(0); setStreak(0);
    setChallenge(makeChallenge(chosen, 0, chosenLevel)); setSelected(null); setMessage('選一個答案'); setShowHint(false); setFinished(false);
  }, [subject, level]);

  useEffect(() => {
    const context = (document as Document & { modelContext?: { registerTool: (tool: { name: string; title: string; description: string; inputSchema: object; annotations: { readOnlyHint: boolean; untrustedContentHint: boolean }; execute: (input: { subject?: Subject }) => Promise<object> }, options?: { signal?: AbortSignal }) => void | Promise<void> } }).modelContext;
    if (!context?.registerTool) return;
    const lifecycle = new AbortController();
    void Promise.resolve(context.registerTool({
      name: 'start_learning_mission', title: '開始學習任務', description: '開始一輪新的八題學習任務，可選數學、國語或專注力。',
      inputSchema: { type: 'object', properties: { subject: { type: 'string', enum: ['math', 'chinese', 'focus'] } }, required: ['subject'], additionalProperties: false },
      annotations: { readOnlyHint: false, untrustedContentHint: false },
      async execute(input) { if (!['math','chinese','focus'].includes(input.subject ?? '')) throw new Error('請選擇有效的任務類型'); startGame(input.subject); return { status: 'started', subject: input.subject, totalQuestions: TOTAL }; },
    }, { signal: lifecycle.signal })).catch(() => undefined);
    return () => lifecycle.abort();
  }, [startGame]);

  const chooseAnswer = (choice: string) => {
    if (selected === challenge.answer) return;
    setSelected(choice);
    if (choice !== challenge.answer) { setMessage('差一點！慢慢看，再試一次'); setStreak(0); playTone(false, sound); return; }
    const nextRound = round + 1; setStars((value) => value + 1); setStreak((value) => value + 1); setMessage('答對了！獲得一顆星星'); playTone(true, sound);
    window.setTimeout(() => {
      if (nextRound >= TOTAL) {
        setRound(nextRound);
        if (level < 3) setUnlocks((current) => {
          const updated = { ...current, [subject]: Math.max(current[subject], level + 1) as Level };
          localStorage.setItem('learning-planet-levels', JSON.stringify(updated));
          return updated;
        });
        setFinished(true); return;
      }
      setRound(nextRound); setChallenge(makeChallenge(subject, nextRound, level)); setSelected(null); setMessage('選一個答案'); setShowHint(false);
    }, calmMotion ? 750 : 250);
  };

  if (!started) return <main className="game-shell"><section className="start-card" aria-labelledby="game-title">
    <div className="planet-mark" aria-hidden="true"><Rocket size={42} /></div><p className="eyebrow">今天的小任務</p><h1 id="game-title">學習星球大冒險</h1>
    <p className="intro">選一科、挑一關。每關 8 題，過關就會解鎖更難的題目！</p>
    <div className="subject-grid" aria-label="選擇任務">
      {(Object.keys(subjectInfo) as Subject[]).map((key) => { const { label, Icon, color } = subjectInfo[key]; return <button key={key} className={`subject-button ${subject === key ? 'active' : ''} ${color}`} onClick={() => { setSubject(key); setLevel(unlocks[key]); }}><Icon /><span>{label}</span><small>已到第 {unlocks[key]} 關</small></button>; })}
    </div>
    <p className="picker-label">選擇關卡</p>
    <div className="level-grid" aria-label="選擇關卡">{([1,2,3] as Level[]).map((value) => {
      const locked = value > unlocks[subject];
      return <button key={value} disabled={locked} className={`level-button ${level === value ? 'active' : ''}`} onClick={() => setLevel(value)}><span>{locked ? <Lock size={19} /> : levelInfo[value].icon}</span><strong>第 {value} 關</strong><small>{locked ? '尚未解鎖' : levelInfo[value].name}</small></button>;
    })}</div>
    <Button className="start-button" size="lg" onClick={() => startGame()}><Rocket /> 開始{subjectInfo[subject].label}第 {level} 關</Button>
    <div className="settings-row"><label><Volume2 size={20} />音效</label><Switch checked={sound} onCheckedChange={setSound} aria-label="開啟音效" /><label>輕柔動畫</label><Switch checked={calmMotion} onCheckedChange={setCalmMotion} aria-label="開啟輕柔動畫" /></div>
  </section></main>;

  if (finished) return <main className="game-shell"><section className="finish-card" aria-labelledby="finish-title">
    <div className="star-burst" aria-hidden="true"><Trophy size={56} /></div><p className="eyebrow">{subjectInfo[subject].label}第 {level} 關完成</p><h1 id="finish-title">{level < 3 ? '太棒了，升級成功！' : '你成為學習小高手了！'}</h1>
    <div className="final-score"><strong>{stars}</strong><span>顆星星</span></div><p>{level < 3 ? `第 ${level + 1} 關已解鎖，準備迎接更有挑戰的題目！` : '最高難度完成！重玩還會遇到不同題目。'}</p>
    <div className="finish-actions">{level < 3 && <Button className="start-button" size="lg" onClick={() => startGame(subject, (level + 1) as Level)}><Rocket /> 挑戰第 {level + 1} 關</Button>}<Button className="secondary-button" size="lg" onClick={() => startGame()}><RotateCcw /> 再玩一次</Button><Button className="secondary-button" size="lg" onClick={() => setStarted(false)}>選其他任務</Button></div>
  </section></main>;

  return <main className={`game-shell ${calmMotion ? '' : 'reduce-motion'}`}><section className={`game-card theme-${subjectInfo[subject].color}`} aria-labelledby="question-title">
    <header className="game-topbar"><div className="mode-chip"><ActiveIcon />{subjectInfo[subject].label} · 第 {level} 關</div><div className="progress-wrap"><div className="progress-label"><span>第 {round + 1} 題</span><span>{TOTAL} 題</span></div><Progress value={progress} aria-label={`已完成 ${round} 題，共 ${TOTAL} 題`} /></div><button className="sound-button" onClick={() => setSound((v) => !v)} aria-label={sound ? '關閉音效' : '開啟音效'}>{sound ? <Volume2 /> : <VolumeX />}</button></header>
    <div className="reward-row" aria-label={`目前有 ${stars} 顆星星，連續答對 ${streak} 題`}><span><Star size={20} fill="currentColor" /> {stars}</span><span className="level-chip">{levelInfo[level].icon} {levelInfo[level].name}</span>{streak >= 2 && <span className="streak">連續答對 {streak} 題</span>}</div>
    <div className="question-area"><p className="eyebrow">{challenge.prompt}</p><h1 id="question-title" className={`challenge-display ${subject === 'math' && challenge.display.length < 18 ? 'equation' : ''}`}>{challenge.display}</h1></div>
    <div className="answer-grid" aria-label="答案選項">{challenge.choices.map((choice, index) => { const isCorrect = selected === challenge.answer && choice === challenge.answer; const isWrong = selected === choice && choice !== challenge.answer; return <button key={`${choice}-${index}`} className={`answer-button ${isCorrect ? 'correct' : ''} ${isWrong ? 'wrong' : ''}`} onClick={() => chooseAnswer(choice)} disabled={selected === challenge.answer}>{choice}{isCorrect && <Check aria-hidden="true" />}</button>; })}</div>
    <div className="feedback" role="status" aria-live="polite"><span>{message}</span>{selected !== challenge.answer && <button onClick={() => setShowHint((v) => !v)}><Lightbulb size={19} />給我提示</button>}</div>
    {showHint && <aside className="hint-box">{challenge.hint}</aside>}
  </section></main>;
}
