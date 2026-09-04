'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { Check, Lightbulb, Rocket, RotateCcw, Star, Volume2, VolumeX } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Switch } from '@/components/ui/switch';

type Question = { left: number; right: number; sign: '+' | '−' | '×'; answer: number; choices: number[] };
const TOTAL = 8;

function shuffle<T>(items: T[]) { return [...items].sort(() => Math.random() - 0.5); }

function makeQuestion(index: number): Question {
  const kind = index % 3;
  let left = 0, right = 0, answer = 0;
  let sign: Question['sign'] = '+';
  if (kind === 0) {
    left = 12 + Math.floor(Math.random() * 69);
    right = 4 + Math.floor(Math.random() * Math.max(5, 96 - left));
    answer = left + right;
  } else if (kind === 1) {
    left = 25 + Math.floor(Math.random() * 70);
    right = 3 + Math.floor(Math.random() * (left - 3));
    answer = left - right;
    sign = '−';
  } else {
    left = 2 + Math.floor(Math.random() * 8);
    right = 2 + Math.floor(Math.random() * 8);
    answer = left * right;
    sign = '×';
  }
  const wrong = new Set<number>();
  while (wrong.size < 3) {
    const offset = Math.floor(Math.random() * 15) - 7;
    const candidate = Math.max(0, answer + (offset === 0 ? 8 : offset));
    if (candidate !== answer) wrong.add(candidate);
  }
  return { left, right, sign, answer, choices: shuffle([answer, ...wrong]) };
}

function playTone(success: boolean, enabled: boolean) {
  if (!enabled || typeof window === 'undefined') return;
  const AudioContextClass = window.AudioContext || (window as typeof window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
  if (!AudioContextClass) return;
  const context = new AudioContextClass();
  const oscillator = context.createOscillator();
  const gain = context.createGain();
  oscillator.frequency.value = success ? 660 : 220;
  gain.gain.setValueAtTime(0.08, context.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.001, context.currentTime + 0.16);
  oscillator.connect(gain); gain.connect(context.destination);
  oscillator.start(); oscillator.stop(context.currentTime + 0.16);
}

export default function Home() {
  const [started, setStarted] = useState(false);
  const [round, setRound] = useState(0);
  const [stars, setStars] = useState(0);
  const [streak, setStreak] = useState(0);
  const [question, setQuestion] = useState<Question>(() => makeQuestion(0));
  const [selected, setSelected] = useState<number | null>(null);
  const [message, setMessage] = useState('選一個答案');
  const [showHint, setShowHint] = useState(false);
  const [sound, setSound] = useState(false);
  const [calmMotion, setCalmMotion] = useState(true);
  const [finished, setFinished] = useState(false);
  const progress = useMemo(() => (round / TOTAL) * 100, [round]);

  const startGame = useCallback(() => {
    setStarted(true); setRound(0); setStars(0); setStreak(0);
    setQuestion(makeQuestion(0)); setSelected(null); setMessage('選一個答案');
    setShowHint(false); setFinished(false);
  }, []);

  useEffect(() => {
    const context = (document as Document & {
      modelContext?: {
        registerTool: (tool: {
          name: string;
          title: string;
          description: string;
          inputSchema: object;
          annotations: { readOnlyHint: boolean; untrustedContentHint: boolean };
          execute: () => Promise<object>;
        }, options?: { signal?: AbortSignal }) => void | Promise<void>;
      };
    }).modelContext;
    if (!context?.registerTool) return;
    const lifecycle = new AbortController();
    void Promise.resolve(context.registerTool({
      name: 'start_math_mission',
      title: '開始數學任務',
      description: '開始一輪新的八題數學星球任務，並重設目前的星星和進度。',
      inputSchema: { type: 'object', properties: {}, additionalProperties: false },
      annotations: { readOnlyHint: false, untrustedContentHint: false },
      async execute() {
        startGame();
        return { status: 'started', totalQuestions: TOTAL };
      },
    }, { signal: lifecycle.signal })).catch(() => undefined);
    return () => lifecycle.abort();
  }, [startGame]);

  const chooseAnswer = (choice: number) => {
    if (selected === question.answer) return;
    setSelected(choice);
    if (choice !== question.answer) {
      setMessage('差一點！慢慢算，再試一次'); setStreak(0); playTone(false, sound); return;
    }
    const nextRound = round + 1;
    setStars((value) => value + 1); setStreak((value) => value + 1);
    setMessage('答對了！獲得一顆星星'); playTone(true, sound);
    window.setTimeout(() => {
      if (nextRound >= TOTAL) { setRound(nextRound); setFinished(true); return; }
      setRound(nextRound); setQuestion(makeQuestion(nextRound)); setSelected(null);
      setMessage('選一個答案'); setShowHint(false);
    }, calmMotion ? 750 : 250);
  };

  if (!started) return (
    <main className="game-shell">
      <section className="start-card" aria-labelledby="game-title">
        <div className="planet-mark" aria-hidden="true"><Rocket size={42} /></div>
        <p className="eyebrow">今天的小任務</p>
        <h1 id="game-title">數學星球大冒險</h1>
        <p className="intro">完成 8 道題，幫太空船收集星星。沒有倒數，慢慢想就好！</p>
        <div className="mission-list" aria-label="任務內容"><span>加法</span><span>減法</span><span>乘法</span></div>
        <Button className="start-button" size="lg" onClick={startGame}><Rocket /> 出發！</Button>
        <div className="settings-row">
          <label><Volume2 size={20} />音效</label><Switch checked={sound} onCheckedChange={setSound} aria-label="開啟音效" />
          <label>輕柔動畫</label><Switch checked={calmMotion} onCheckedChange={setCalmMotion} aria-label="開啟輕柔動畫" />
        </div>
      </section>
    </main>
  );

  if (finished) return (
    <main className="game-shell">
      <section className="finish-card" aria-labelledby="finish-title">
        <div className="star-burst" aria-hidden="true"><Star fill="currentColor" size={56} /></div>
        <p className="eyebrow">任務完成</p><h1 id="finish-title">太棒了，你抵達星球了！</h1>
        <div className="final-score"><strong>{stars}</strong><span>顆星星</span></div>
        <p>今天完成了加法、減法和乘法。休息一下，再挑戰一次也可以。</p>
        <Button className="start-button" size="lg" onClick={startGame}><RotateCcw /> 再玩一次</Button>
      </section>
    </main>
  );

  return (
    <main className={`game-shell ${calmMotion ? '' : 'reduce-motion'}`}>
      <section className="game-card" aria-labelledby="question-title">
        <header className="game-topbar">
          <div className="progress-wrap">
            <div className="progress-label"><span>第 {round + 1} 題</span><span>{TOTAL} 題</span></div>
            <Progress value={progress} aria-label={`已完成 ${round} 題，共 ${TOTAL} 題`} />
          </div>
          <button className="sound-button" onClick={() => setSound((value) => !value)} aria-label={sound ? '關閉音效' : '開啟音效'}>{sound ? <Volume2 /> : <VolumeX />}</button>
        </header>
        <div className="reward-row" aria-label={`目前有 ${stars} 顆星星，連續答對 ${streak} 題`}>
          <span><Star size={20} fill="currentColor" /> {stars}</span>{streak >= 2 && <span className="streak">連續答對 {streak} 題</span>}
        </div>
        <div className="question-area"><p className="eyebrow">算算看</p>
          <h1 id="question-title" className="equation"><span>{question.left}</span><span>{question.sign}</span><span>{question.right}</span><span>=</span><span>?</span></h1>
        </div>
        <div className="answer-grid" aria-label="答案選項">
          {question.choices.map((choice) => {
            const isCorrect = selected === question.answer && choice === question.answer;
            const isWrong = selected === choice && choice !== question.answer;
            return <button key={choice} className={`answer-button ${isCorrect ? 'correct' : ''} ${isWrong ? 'wrong' : ''}`} onClick={() => chooseAnswer(choice)} disabled={selected === question.answer}>{choice}{isCorrect && <Check aria-hidden="true" />}</button>;
          })}
        </div>
        <div className="feedback" role="status" aria-live="polite">
          <span>{message}</span>
          {selected !== question.answer && <button onClick={() => setShowHint((value) => !value)}><Lightbulb size={19} />給我提示</button>}
        </div>
        {showHint && <aside className="hint-box">{question.sign === '×' ? `可以把 ${question.left} 加自己 ${question.right} 次。` : question.sign === '+' ? '先算到下一個整十，再把剩下的加上去。' : `試著從 ${question.left} 往回數 ${question.right}。`}</aside>}
      </section>
    </main>
  );
}
