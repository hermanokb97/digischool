import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { MODULES, STORAGE_KEYS } from '@/lib/constants';
import { playClick, playFanfare, playSuccess } from '@/lib/sound';
import { useUser } from '@/context/UserContext';

const COLOR_STYLES = {
  primary: 'bg-primary-container text-on-primary-container',
  secondary: 'bg-secondary-container text-on-secondary-container',
  tertiary: 'bg-tertiary-container text-on-tertiary-container',
  error: 'bg-error-container text-on-error-container',
} as const;

const GAME_DURATION = 15;

function readBestScore(): number {
  const stored = localStorage.getItem(STORAGE_KEYS.playgroundBest);
  return stored ? parseInt(stored, 10) || 0 : 0;
}

export function Playground() {
  const { user } = useUser();
  const isGuest = user?.isGuest === true;
  const [score, setScore] = useState(0);
  const [running, setRunning] = useState(false);
  const [timeLeft, setTimeLeft] = useState(GAME_DURATION);
  const [bestScore, setBestScore] = useState(() => (isGuest ? 0 : readBestScore()));

  useEffect(() => {
    setBestScore(isGuest ? 0 : readBestScore());
  }, [isGuest, user?.id]);

  useEffect(() => {
    if (!running) return;
    if (timeLeft <= 0) {
      setRunning(false);
      if (score > bestScore) {
        setBestScore(score);
        if (!isGuest) {
          localStorage.setItem(STORAGE_KEYS.playgroundBest, String(score));
        }
      }
      playFanfare();
      return;
    }
    const t = window.setTimeout(() => setTimeLeft((s) => s - 1), 1000);
    return () => window.clearTimeout(t);
  }, [running, timeLeft, score, bestScore, isGuest]);

  const handleStart = () => {
    playClick();
    setScore(0);
    setTimeLeft(GAME_DURATION);
    setRunning(true);
  };

  const handleClick = () => {
    if (!running) return;
    setScore((s) => s + 1);
    playSuccess();
  };

  return (
    <div className="w-full max-w-5xl mx-auto flex flex-col gap-8 md:pt-10">
      <section className="text-center space-y-3">
        <h1 className="font-display-lg text-display-lg text-primary">연습장</h1>
        <p className="font-body-xl text-body-xl text-on-surface-variant max-w-2xl mx-auto">
          여기서는 자유롭게 연습할 수 있어요. 미니 게임도 도전해 봐요!
        </p>
      </section>

      <section className="bg-surface-container-lowest rounded-xl p-8 border-2 border-primary-fixed shadow-lg flex flex-col items-center gap-6">
        <div className="flex items-center gap-4 text-center">
          <span className="material-symbols-outlined text-5xl text-primary" style={{ fontVariationSettings: "'FILL' 1" }}>sports_esports</span>
          <h2 className="font-headline-md text-headline-md text-on-background">빠르게 클릭 챌린지</h2>
        </div>

        <p className="font-body-lg text-body-lg text-on-surface-variant text-center max-w-md">
          {GAME_DURATION}초 동안 동그라미를 최대한 많이 클릭해 봐요!
        </p>

        <div className="flex flex-wrap justify-center gap-4">
          <div className="bg-primary-container text-on-primary-container px-6 py-3 rounded-full font-label-bold text-label-bold flex items-center gap-2">
            <span className="material-symbols-outlined">timer</span> 남은 시간 {timeLeft}초
          </div>
          <div className="bg-secondary-container text-on-secondary-container px-6 py-3 rounded-full font-label-bold text-label-bold flex items-center gap-2">
            <span className="material-symbols-outlined">scoreboard</span> 점수 {score}
          </div>
          <div className="bg-tertiary-container text-on-tertiary-container px-6 py-3 rounded-full font-label-bold text-label-bold flex items-center gap-2">
            <span className="material-symbols-outlined">trophy</span> {isGuest ? '이번 방문 기록' : '최고 기록'} {bestScore}
          </div>
        </div>

        <div className="w-full h-64 bg-surface-container-low rounded-2xl border-4 border-dashed border-outline-variant flex items-center justify-center relative overflow-hidden">
          {running ? (
            <button
              type="button"
              onClick={handleClick}
              className="w-32 h-32 rounded-full bg-primary text-on-primary text-3xl font-bold shadow-[0_8px_0_rgb(0,78,118)] active:translate-y-2 active:shadow-none transition-all hover:scale-110"
              aria-label="클릭"
            >
              클릭!
            </button>
          ) : (
            <button
              type="button"
              onClick={handleStart}
              className="px-8 py-4 bg-secondary text-on-secondary rounded-full font-label-bold text-label-bold shadow-[0_4px_0_rgba(0,33,14,0.4)] active:translate-y-1 active:shadow-none transition-all flex items-center gap-2"
            >
              <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>play_arrow</span>
              {timeLeft === 0 ? '다시 도전' : '게임 시작'}
            </button>
          )}
        </div>
      </section>

      <section>
        <h2 className="font-headline-md text-headline-md text-on-background mb-4">자유 연습</h2>
        <p className="font-body-lg text-body-lg text-on-surface-variant mb-6">
          학습한 모듈을 부담 없이 다시 연습해 봐요. 진행도와 상관없이 자유롭게 연습할 수 있어요.
        </p>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {MODULES.map((m) => (
            <Link
              key={m.key}
              to={m.route}
              className={`rounded-xl p-5 border-2 border-surface-container-highest shadow-3d flex flex-col items-center gap-2 text-center hover:scale-105 transition-transform ${COLOR_STYLES[m.color]}`}
            >
              <span className="material-symbols-outlined text-4xl" style={{ fontVariationSettings: "'FILL' 1" }}>{m.icon}</span>
              <span className="font-label-bold text-label-bold">{m.shortLabel}</span>
            </Link>
          ))}
        </div>
      </section>
    </div>
  );
}
