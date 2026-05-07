import { FormEvent, useEffect, useMemo, useRef, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useUser } from '@/context/UserContext';
import { saveStudyResult } from '@/lib/evaluation';
import { getLoginPracticeAccount, LoginPracticeAccount } from '@/lib/loginPracticeAccount';
import { playClick, playFail, playFanfare, playSuccess } from '@/lib/sound';

type GoogleAuthStep = 'home' | 'email' | 'password';

function getStartedAt(state: unknown): number {
  if (state && typeof state === 'object' && 'startedAt' in state) {
    const startedAt = (state as { startedAt?: unknown }).startedAt;
    if (typeof startedAt === 'number' && Number.isFinite(startedAt) && startedAt > 0) {
      return startedAt;
    }
  }
  return Date.now();
}

function getInitial(nickname: string | undefined): string {
  const trimmed = nickname?.trim();
  return trimmed ? trimmed.slice(0, 1) : '나';
}

export function LoginSimulation() {
  const navigate = useNavigate();
  const location = useLocation();
  const { markComplete, user } = useUser();

  const practiceAccount = useMemo(() => getLoginPracticeAccount(user?.id), [user?.id]);
  const startedAtRef = useRef(getStartedAt(location.state));
  const completedRef = useRef(false);

  const [googleAuthStep, setGoogleAuthStep] = useState<GoogleAuthStep>('home');
  const [googleEmail, setGoogleEmail] = useState('');
  const [googlePassword, setGooglePassword] = useState('');
  const [googleAuthError, setGoogleAuthError] = useState<string | null>(null);
  const [googleLoggedIn, setGoogleLoggedIn] = useState(false);
  const [accountMenuOpen, setAccountMenuOpen] = useState(false);
  const [accountMenuVisited, setAccountMenuVisited] = useState(false);
  const [completed, setCompleted] = useState(false);

  const initial = getInitial(user?.nickname);

  useEffect(() => {
    if (!completed || completedRef.current) return;
    completedRef.current = true;
    saveStudyResult('login', startedAtRef.current);
    playFanfare();
    markComplete('login');
    const t = window.setTimeout(() => navigate('/result/login', { replace: true }), 1200);
    return () => window.clearTimeout(t);
  }, [completed, markComplete, navigate]);

  const handleStartGoogleLogin = () => {
    if (!practiceAccount) {
      playFail();
      setGoogleAuthError('먼저 로그인/로그아웃 연습에서 계정을 만들어 주세요.');
      return;
    }
    playClick();
    setGoogleAuthStep('email');
    setGoogleAuthError(null);
    setAccountMenuOpen(false);
  };

  const handleGoogleEmailNext = (e?: FormEvent) => {
    e?.preventDefault();
    if (!practiceAccount) {
      playFail();
      setGoogleAuthError('먼저 로그인/로그아웃 연습에서 계정을 만들어 주세요.');
      return;
    }

    const normalized = googleEmail.trim().toLowerCase();
    const accountEmail = practiceAccount.email.toLowerCase();
    const accountId = practiceAccount.id.toLowerCase();

    if (normalized !== accountEmail && normalized !== accountId) {
      playFail();
      setGoogleAuthError(`아이디는 로그인 연습에서 만든 ${practiceAccount.email} 를 입력해 보세요.`);
      return;
    }

    playSuccess();
    setGoogleEmail(practiceAccount.email);
    setGoogleAuthError(null);
    setGoogleAuthStep('password');
  };

  const handleGooglePasswordSubmit = (e?: FormEvent) => {
    e?.preventDefault();
    if (!practiceAccount) {
      playFail();
      setGoogleAuthError('먼저 로그인/로그아웃 연습에서 계정을 만들어 주세요.');
      return;
    }

    if (googlePassword !== practiceAccount.password) {
      playFail();
      setGoogleAuthError('비밀번호가 로그인 연습에서 만든 것과 달라요. 대문자도 확인해 주세요.');
      return;
    }

    playSuccess();
    setGoogleLoggedIn(true);
    setGooglePassword('');
    setGoogleAuthError(null);
    setGoogleAuthStep('home');
  };

  const handleGoogleAccountMenu = () => {
    if (!googleLoggedIn) {
      playFail();
      return;
    }
    playClick();
    setAccountMenuOpen((open) => {
      const next = !open;
      if (next) setAccountMenuVisited(true);
      return next;
    });
  };

  const handleGoogleLogout = () => {
    if (!googleLoggedIn) {
      playFail();
      return;
    }
    playSuccess();
    setGoogleLoggedIn(false);
    setAccountMenuOpen(false);
    setCompleted(true);
  };

  if (!practiceAccount) {
    return (
      <div className="mx-auto flex w-full max-w-3xl flex-col items-center gap-6 pt-10 text-center">
        <span className="material-symbols-outlined text-8xl text-primary" style={{ fontVariationSettings: "'FILL' 1" }}>
          manage_accounts
        </span>
        <h1 className="font-display-lg text-display-lg text-primary">연습 계정이 필요해요</h1>
        <p className="max-w-xl font-body-xl text-body-xl text-on-surface-variant">
          먼저 로그인/로그아웃 연습에서 내 아이디와 비밀번호를 만든 다음, Google 시뮬레이션을 시작할 수 있어요.
        </p>
        <button
          type="button"
          onClick={() => {
            playClick();
            navigate('/login-practice');
          }}
          className="flex h-14 items-center gap-2 rounded-full bg-primary px-8 font-label-bold text-label-bold text-on-primary shadow-[0_4px_0_rgb(0,78,118)] transition-all active:translate-y-[4px] active:shadow-none"
        >
          <span className="material-symbols-outlined">arrow_back</span>
          기본 연습으로 돌아가기
        </button>
      </div>
    );
  }

  if (completed) {
    return (
      <div className="mx-auto flex w-full max-w-2xl flex-col items-center gap-6 pt-12 text-center">
        <span className="material-symbols-outlined text-8xl text-secondary" style={{ fontVariationSettings: "'FILL' 1" }}>
          task_alt
        </span>
        <h1 className="font-display-lg text-display-lg text-primary">로그아웃까지 완료했어요!</h1>
        <p className="font-body-xl text-body-xl text-on-surface-variant">결과 화면으로 이동하고 있어요.</p>
      </div>
    );
  }

  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-5">
      <header className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
        <div>
          <p className="font-label-bold text-label-bold text-primary">실제 시뮬레이션</p>
          <h1 className="font-display-lg text-display-lg text-on-background">Google 로그인/로그아웃 연습</h1>
          <p className="mt-2 font-body-lg text-body-lg text-on-surface-variant">
            방금 만든 계정으로 로그인한 뒤, 계정 메뉴에서 로그아웃해 보세요.
          </p>
        </div>
        <button
          type="button"
          onClick={() => {
            playClick();
            navigate('/login-practice');
          }}
          className="inline-flex h-11 items-center justify-center gap-2 rounded-full border-2 border-outline-variant px-5 font-label-bold text-label-bold text-on-surface transition-colors hover:bg-surface-container-low"
        >
          <span className="material-symbols-outlined text-xl">refresh</span>
          기본 연습 다시 하기
        </button>
      </header>

      <div className="grid gap-5 lg:grid-cols-[280px_1fr]">
        <aside className="flex flex-col gap-4 rounded-lg border border-outline-variant bg-surface-container-lowest p-5 shadow-sm">
          <div>
            <p className="font-label-bold text-label-bold text-on-surface">이번에 사용할 계정</p>
            <p className="mt-2 break-all rounded-lg bg-primary-container px-3 py-2 font-mono text-sm text-on-primary-container">
              {practiceAccount.email}
            </p>
          </div>

          <div className="space-y-2">
            <MissionChip done={googleLoggedIn} icon="login" label="Google 로그인" />
            <MissionChip done={accountMenuVisited} icon="account_circle" label="계정 메뉴 열기" />
            <MissionChip done={false} icon="logout" label="로그아웃하기" active={googleLoggedIn && accountMenuVisited} />
          </div>

          <div className="rounded-lg bg-secondary-container p-4 text-on-secondary-container">
            <p className="font-label-bold text-label-bold">기억할 점</p>
            <p className="mt-1 text-sm">
              공용 컴퓨터에서는 로그인 후 반드시 계정 메뉴를 열고 로그아웃해야 해요.
            </p>
          </div>
        </aside>

        <section className="overflow-hidden rounded-lg border border-[#3c4043] bg-[#202124] shadow-xl">
          <div className="flex h-12 items-center gap-3 border-b border-white/10 bg-[#2d2e30] px-4">
            <div className="flex gap-2" aria-hidden="true">
              <span className="h-3 w-3 rounded-full bg-[#ff5f57]" />
              <span className="h-3 w-3 rounded-full bg-[#febc2e]" />
              <span className="h-3 w-3 rounded-full bg-[#28c840]" />
            </div>
            <div className="flex min-w-0 flex-1 items-center gap-2 rounded-full bg-[#1f1f1f] px-4 py-2 text-sm text-white/80">
              <span className="material-symbols-outlined text-base">lock</span>
              <span className="truncate">https://www.google.com</span>
            </div>
          </div>

          {googleAuthStep === 'home' ? (
            <GoogleHome
              account={practiceAccount}
              initial={initial}
              loggedIn={googleLoggedIn}
              accountMenuOpen={accountMenuOpen}
              onStartLogin={handleStartGoogleLogin}
              onAccountMenu={handleGoogleAccountMenu}
              onLogout={handleGoogleLogout}
            />
          ) : (
            <GoogleSignInScreen
              step={googleAuthStep}
              email={googleEmail}
              password={googlePassword}
              error={googleAuthError}
              account={practiceAccount}
              onEmailChange={(value) => {
                setGoogleEmail(value);
                setGoogleAuthError(null);
              }}
              onPasswordChange={(value) => {
                setGooglePassword(value);
                setGoogleAuthError(null);
              }}
              onEmailNext={handleGoogleEmailNext}
              onPasswordSubmit={handleGooglePasswordSubmit}
            />
          )}
        </section>
      </div>
    </div>
  );
}

function MissionChip({ done, icon, label, active = false }: { done: boolean; icon: string; label: string; active?: boolean }) {
  return (
    <div
      className={`flex items-center gap-3 rounded-lg px-3 py-3 font-label-bold text-sm transition-colors ${
        done
          ? 'bg-secondary text-on-secondary'
          : active
          ? 'bg-tertiary-container text-on-tertiary-container ring-2 ring-tertiary'
          : 'bg-surface-container-low text-on-surface-variant'
      }`}
    >
      <span className="material-symbols-outlined text-xl" style={{ fontVariationSettings: done ? "'FILL' 1" : "'FILL' 0" }}>
        {done ? 'check_circle' : icon}
      </span>
      {label}
    </div>
  );
}

function GoogleHome({
  account,
  initial,
  loggedIn,
  accountMenuOpen,
  onStartLogin,
  onAccountMenu,
  onLogout,
}: {
  account: LoginPracticeAccount;
  initial: string;
  loggedIn: boolean;
  accountMenuOpen: boolean;
  onStartLogin: () => void;
  onAccountMenu: () => void;
  onLogout: () => void;
}) {
  return (
    <div className="min-h-[610px] bg-[#202124] px-5 py-5 text-white">
      <div className="flex items-center justify-between text-sm md:text-base">
        <div className="flex items-center gap-6">
          <a className="underline-offset-2 hover:underline" href="#" onClick={(e) => e.preventDefault()}>
            Google 정보
          </a>
          <a className="underline-offset-2 hover:underline" href="#" onClick={(e) => e.preventDefault()}>
            스토어
          </a>
        </div>
        <div className="flex items-center gap-5">
          <a href="#" onClick={(e) => e.preventDefault()}>
            Gmail
          </a>
          <a href="#" onClick={(e) => e.preventDefault()}>
            이미지
          </a>
          <span className="material-symbols-outlined text-3xl text-white/80">apps</span>
          {loggedIn ? (
            <div className="relative">
              <button
                type="button"
                onClick={onAccountMenu}
                className="flex h-12 w-12 items-center justify-center rounded-full bg-[#c2e7ff] font-black text-[#001d35] transition-all hover:ring-4 hover:ring-white/20"
                aria-label="Google 계정 메뉴"
              >
                {initial}
              </button>
              {accountMenuOpen && (
                <div className="absolute right-0 top-14 z-40 w-72 rounded-lg border border-white/15 bg-[#2f3033] p-5 text-center text-white shadow-2xl">
                  <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-[#c2e7ff] text-2xl font-black text-[#001d35]">
                    {initial}
                  </div>
                  <p className="mt-3 font-label-bold">{account.id}</p>
                  <p className="break-all text-sm text-white/70">{account.email}</p>
                  <button
                    type="button"
                    onClick={onLogout}
                    className="mt-5 w-full rounded-full border border-white/25 px-5 py-3 font-label-bold transition-colors hover:bg-white/10"
                  >
                    로그아웃
                  </button>
                </div>
              )}
            </div>
          ) : (
            <button
              type="button"
              onClick={onStartLogin}
              className="rounded-full bg-[#c2e7ff] px-8 py-3 font-label-bold text-[#001d35] transition-all hover:bg-[#d3edff]"
            >
              로그인
            </button>
          )}
        </div>
      </div>

      <div className="mt-24 flex flex-col items-center gap-8 text-center">
        <div className="text-[72px] font-medium text-white md:text-[96px]">Google</div>
        <div className="flex w-full max-w-[780px] items-center rounded-full bg-[#4d5156] px-5 shadow-[inset_0_1px_0_rgba(255,255,255,0.08)]">
          <span className="material-symbols-outlined mr-3 text-white/70">search</span>
          <input
            value=""
            readOnly
            className="h-16 min-w-0 flex-1 bg-transparent text-xl text-white outline-none placeholder:text-white/55"
            placeholder="Google 검색 또는 URL 입력"
            aria-label="Google 검색어"
          />
          <span className="material-symbols-outlined mx-2 text-white/90">keyboard</span>
          <span className="material-symbols-outlined mx-2 text-white/90">mic</span>
          <span className="material-symbols-outlined ml-2 text-white/90">photo_camera</span>
        </div>
        {loggedIn ? (
          <p className="rounded-full bg-white/10 px-5 py-2 font-label-bold text-white/85">
            로그인됨: 계정 아이콘을 눌러 로그아웃하세요.
          </p>
        ) : (
          <p className="rounded-full bg-white/10 px-5 py-2 font-label-bold text-white/85">
            오른쪽 위 로그인 버튼을 눌러 시작하세요.
          </p>
        )}
      </div>
    </div>
  );
}

function GoogleSignInScreen({
  step,
  email,
  password,
  error,
  account,
  onEmailChange,
  onPasswordChange,
  onEmailNext,
  onPasswordSubmit,
}: {
  step: Exclude<GoogleAuthStep, 'home'>;
  email: string;
  password: string;
  error: string | null;
  account: LoginPracticeAccount;
  onEmailChange: (value: string) => void;
  onPasswordChange: (value: string) => void;
  onEmailNext: (e?: FormEvent) => void;
  onPasswordSubmit: (e?: FormEvent) => void;
}) {
  const isEmailStep = step === 'email';

  return (
    <div className="flex min-h-[610px] items-center justify-center bg-[#202124] p-5 text-white">
      <form
        onSubmit={isEmailStep ? onEmailNext : onPasswordSubmit}
        className="grid w-full max-w-4xl gap-10 rounded-lg border border-white/20 p-8 md:grid-cols-[1fr_1.1fr] md:p-10"
      >
        <div>
          <div className="text-4xl font-medium">Google</div>
          <h2 className="mt-10 text-4xl font-medium">{isEmailStep ? '로그인' : '비밀번호 입력'}</h2>
          <p className="mt-4 break-all text-lg text-white/80">
            {isEmailStep ? 'Google 계정으로 계속합니다.' : account.email}
          </p>
        </div>

        <div className="flex flex-col gap-5">
          {isEmailStep ? (
            <>
              <div>
                <label htmlFor="google_sim_email" className="sr-only">
                  이메일 또는 아이디
                </label>
                <input
                  id="google_sim_email"
                  value={email}
                  onChange={(e) => onEmailChange(e.target.value)}
                  className="h-16 w-full rounded-lg border border-[#8ab4f8] bg-transparent px-4 text-xl text-white outline-none placeholder:text-white/55"
                  placeholder="이메일 또는 아이디"
                  autoComplete="off"
                  spellCheck={false}
                  autoFocus
                />
                <p className="mt-3 break-all text-sm text-[#8ab4f8]">힌트: {account.email}</p>
              </div>
              {error && <p className="rounded-lg bg-error-container px-4 py-3 font-label-bold text-on-error-container">{error}</p>}
              <div className="mt-auto flex justify-end">
                <button type="submit" className="rounded-full bg-[#c2e7ff] px-8 py-3 font-label-bold text-[#001d35]">
                  다음
                </button>
              </div>
            </>
          ) : (
            <>
              <div>
                <label htmlFor="google_sim_password" className="sr-only">
                  비밀번호 입력
                </label>
                <input
                  id="google_sim_password"
                  type="password"
                  value={password}
                  onChange={(e) => onPasswordChange(e.target.value)}
                  className="h-16 w-full rounded-lg border border-[#8ab4f8] bg-transparent px-4 text-xl text-white outline-none placeholder:text-white/55"
                  placeholder="비밀번호 입력"
                  autoComplete="off"
                  autoFocus
                />
                <p className="mt-3 text-sm text-[#8ab4f8]">힌트: 로그인 연습에서 만든 비밀번호를 입력하세요.</p>
              </div>
              {error && <p className="rounded-lg bg-error-container px-4 py-3 font-label-bold text-on-error-container">{error}</p>}
              <div className="mt-auto flex justify-end">
                <button type="submit" className="rounded-full bg-[#c2e7ff] px-8 py-3 font-label-bold text-[#001d35]">
                  로그인
                </button>
              </div>
            </>
          )}
        </div>
      </form>
    </div>
  );
}
