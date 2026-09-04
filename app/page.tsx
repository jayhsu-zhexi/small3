'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { BookOpen, Brain, Calculator, Check, Lightbulb, Rocket, RotateCcw, Star, Volume2, VolumeX } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Switch } from '@/components/ui/switch';

type Subject = 'math' | 'chinese' | 'focus';
type Challenge = { prompt: string; display: string; choices: string[]; answer: string; hint: string };
const TOTAL = 8;
const subjectInfo = {
  math: { label: '數學', Icon: Calculator, color: 'blue' },
  chinese: { label: '國語', Icon: BookOpen, color: 'orange' },
  focus: { label: '專注力', Icon: Brain, color: 'green' },
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
function makeMath(): Challenge {
  const kind = Math.floor(Math.random() * 3);
  let left = 0, right = 0, answer = 0, sign = '+';
  if (kind === 0) { left = 12 + Math.floor(Math.random() * 69); right = 4 + Math.floor(Math.random() * Math.max(5, 96 - left)); answer = left + right; }
  else if (kind === 1) { left = 25 + Math.floor(Math.random() * 70); right = 3 + Math.floor(Math.random() * (left - 3)); answer = left - right; sign = '−'; }
  else { left = 2 + Math.floor(Math.random() * 8); right = 2 + Math.floor(Math.random() * 8); answer = left * right; sign = '×'; }
  const wrong = new Set<number>();
  while (wrong.size < 3) { const offset = Math.floor(Math.random() * 15) - 7; const candidate = Math.max(0, answer + (offset === 0 ? 8 : offset)); if (candidate !== answer) wrong.add(candidate); }
  const hint = sign === '×' ? `可以把 ${left} 加自己 ${right} 次。` : sign === '+' ? '先算到下一個整十，再把剩下的加上去。' : `試著從 ${left} 往回數 ${right}。`;
  return { prompt: '算算看', display: `${left} ${sign} ${right} = ?`, answer: String(answer), choices: shuffle([answer, ...wrong]).map(String), hint };
}
function makeChallenge(subject: Subject, round: number): Challenge {
  if (subject === 'math') return makeMath();
  const bank = subject === 'chinese' ? chineseBank : focusBank;
  const item = bank[round % bank.length];
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
  const [started, setStarted] = useState(false);
  const [round, setRound] = useState(0);
  const [stars, setStars] = useState(0);
  const [streak, setStreak] = useState(0);
  const [challenge, setChallenge] = useState<Challenge>(() => makeMath());
  const [selected, setSelected] = useState<string | null>(null);
  const [message, setMessage] = useState('選一個答案');
  const [showHint, setShowHint] = useState(false);
  const [sound, setSound] = useState(false);
  const [calmMotion, setCalmMotion] = useState(true);
  const [finished, setFinished] = useState(false);
  const progress = useMemo(() => (round / TOTAL) * 100, [round]);
  const ActiveIcon = subjectInfo[subject].Icon;

  const startGame = useCallback((nextSubject?: Subject) => {
    const chosen = nextSubject ?? subject;
    setSubject(chosen); setStarted(true); setRound(0); setStars(0); setStreak(0);
    setChallenge(makeChallenge(chosen, 0)); setSelected(null); setMessage('選一個答案'); setShowHint(false); setFinished(false);
  }, [subject]);

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
      if (nextRound >= TOTAL) { setRound(nextRound); setFinished(true); return; }
      setRound(nextRound); setChallenge(makeChallenge(subject, nextRound)); setSelected(null); setMessage('選一個答案'); setShowHint(false);
    }, calmMotion ? 750 : 250);
  };

  if (!started) return <main className="game-shell"><section className="start-card" aria-labelledby="game-title">
    <div className="planet-mark" aria-hidden="true"><Rocket size={42} /></div><p className="eyebrow">今天的小任務</p><h1 id="game-title">學習星球大冒險</h1>
    <p className="intro">選一個任務，完成 8 道題。沒有倒數，慢慢想就好！</p>
    <div className="subject-grid" aria-label="選擇任務">
      {(Object.keys(subjectInfo) as Subject[]).map((key) => { const { label, Icon, color } = subjectInfo[key]; return <button key={key} className={`subject-button ${subject === key ? 'active' : ''} ${color}`} onClick={() => setSubject(key)}><Icon /><span>{label}</span></button>; })}
    </div>
    <Button className="start-button" size="lg" onClick={() => startGame()}><Rocket /> 開始{subjectInfo[subject].label}任務</Button>
    <div className="settings-row"><label><Volume2 size={20} />音效</label><Switch checked={sound} onCheckedChange={setSound} aria-label="開啟音效" /><label>輕柔動畫</label><Switch checked={calmMotion} onCheckedChange={setCalmMotion} aria-label="開啟輕柔動畫" /></div>
  </section></main>;

  if (finished) return <main className="game-shell"><section className="finish-card" aria-labelledby="finish-title">
    <div className="star-burst" aria-hidden="true"><Star fill="currentColor" size={56} /></div><p className="eyebrow">{subjectInfo[subject].label}任務完成</p><h1 id="finish-title">太棒了，你抵達星球了！</h1>
    <div className="final-score"><strong>{stars}</strong><span>顆星星</span></div><p>先休息一下，或回到首頁選另一個任務。</p>
    <div className="finish-actions"><Button className="start-button" size="lg" onClick={() => startGame()}><RotateCcw /> 再玩一次</Button><Button variant="outline" size="lg" onClick={() => setStarted(false)}>選其他任務</Button></div>
  </section></main>;

  return <main className={`game-shell ${calmMotion ? '' : 'reduce-motion'}`}><section className={`game-card theme-${subjectInfo[subject].color}`} aria-labelledby="question-title">
    <header className="game-topbar"><div className="mode-chip"><ActiveIcon />{subjectInfo[subject].label}</div><div className="progress-wrap"><div className="progress-label"><span>第 {round + 1} 題</span><span>{TOTAL} 題</span></div><Progress value={progress} aria-label={`已完成 ${round} 題，共 ${TOTAL} 題`} /></div><button className="sound-button" onClick={() => setSound((v) => !v)} aria-label={sound ? '關閉音效' : '開啟音效'}>{sound ? <Volume2 /> : <VolumeX />}</button></header>
    <div className="reward-row" aria-label={`目前有 ${stars} 顆星星，連續答對 ${streak} 題`}><span><Star size={20} fill="currentColor" /> {stars}</span>{streak >= 2 && <span className="streak">連續答對 {streak} 題</span>}</div>
    <div className="question-area"><p className="eyebrow">{challenge.prompt}</p><h1 id="question-title" className={`challenge-display ${subject === 'math' ? 'equation' : ''}`}>{challenge.display}</h1></div>
    <div className="answer-grid" aria-label="答案選項">{challenge.choices.map((choice, index) => { const isCorrect = selected === challenge.answer && choice === challenge.answer; const isWrong = selected === choice && choice !== challenge.answer; return <button key={`${choice}-${index}`} className={`answer-button ${isCorrect ? 'correct' : ''} ${isWrong ? 'wrong' : ''}`} onClick={() => chooseAnswer(choice)} disabled={selected === challenge.answer}>{choice}{isCorrect && <Check aria-hidden="true" />}</button>; })}</div>
    <div className="feedback" role="status" aria-live="polite"><span>{message}</span>{selected !== challenge.answer && <button onClick={() => setShowHint((v) => !v)}><Lightbulb size={19} />給我提示</button>}</div>
    {showHint && <aside className="hint-box">{challenge.hint}</aside>}
  </section></main>;
}
