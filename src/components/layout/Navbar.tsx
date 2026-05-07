import { Link, useLocation } from "react-router-dom";
import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";
import { useUser } from "@/context/UserContext";
import { isMuted, setMuted, stopSpeak } from "@/lib/sound";

export function Navbar() {
  const location = useLocation();
  const path = location.pathname;
  const { user, logout } = useUser();
  const [muted, setMutedState] = useState(false);

  useEffect(() => {
    setMutedState(isMuted());
  }, []);

  const toggleMute = () => {
    const next = !muted;
    setMuted(next);
    setMutedState(next);
    if (next) stopSpeak();
  };

  const isHome = path === '/';
  const isLearning =
    path === '/dashboard' ||
    path.startsWith('/keyboard') ||
    path.startsWith('/mouse') ||
    path.startsWith('/browser') ||
    path.startsWith('/login-practice') ||
    path.startsWith('/playground');
  const isGrowth = path.startsWith('/growth');
  const isEvaluation = path.startsWith('/evaluation');

  return (
    <header className="hidden md:flex justify-between items-center w-full px-8 py-4 h-20 bg-surface-container-lowest text-primary docked full-width top-0 shadow-lg border-b-4 border-surface-container-highest sticky z-50">
      <Link to="/" className="flex items-center gap-3 text-2xl font-black text-primary tracking-tight">
        <img src="/digischool-icon.png" alt="디지 스쿨 아이콘" className="w-11 h-11 rounded-2xl object-cover shadow-sm" />
        디지 스쿨
      </Link>
      <nav aria-label="메인 메뉴" className="flex gap-4">
        <Link
          to="/"
          className={cn(
            'rounded-lg px-4 py-2 font-headline-md text-headline-md transition-colors',
            isHome
              ? 'text-primary border-b-4 border-primary pb-1'
              : 'text-outline hover:text-primary hover:bg-surface-container-low',
          )}
        >
          홈
        </Link>
        <Link
          to="/dashboard"
          className={cn(
            'rounded-lg px-4 py-2 font-headline-md text-headline-md transition-colors',
            isLearning
              ? 'text-primary border-b-4 border-primary pb-1'
              : 'text-outline hover:text-primary hover:bg-surface-container-low',
          )}
        >
          학습과정
        </Link>
        <Link
          to="/evaluation"
          className={cn(
            'rounded-lg px-4 py-2 font-headline-md text-headline-md transition-colors',
            isEvaluation
              ? 'text-primary border-b-4 border-primary pb-1'
              : 'text-outline hover:text-primary hover:bg-surface-container-low',
          )}
        >
          평가
        </Link>
        <Link
          to="/growth"
          className={cn(
            'rounded-lg px-4 py-2 font-headline-md text-headline-md transition-colors',
            isGrowth
              ? 'text-primary border-b-4 border-primary pb-1'
              : 'text-outline hover:text-primary hover:bg-surface-container-low',
          )}
        >
          기록
        </Link>
      </nav>
      <div className="flex items-center gap-4">
        <span className="font-label-bold text-label-bold text-on-surface-variant">{user?.nickname}</span>
        <button
          onClick={toggleMute}
          title={muted ? '소리 켜기' : '소리 끄기'}
          aria-label={muted ? '소리 켜기' : '소리 끄기'}
          aria-pressed={muted}
          className="w-12 h-12 rounded-full hover:bg-surface-container-low flex items-center justify-center transition-colors text-outline hover:text-primary"
        >
          <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 0" }}>
            {muted ? 'volume_off' : 'volume_up'}
          </span>
        </button>
        <button
          onClick={logout}
          title="로그아웃"
          aria-label="로그아웃"
          className="w-12 h-12 rounded-full hover:bg-surface-container-low flex items-center justify-center transition-colors text-outline hover:text-error"
        >
          <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 0" }}>logout</span>
        </button>
      </div>
    </header>
  );
}
