import { FormEvent, useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useUser } from '@/context/UserContext';
import { playClick, playFail, playSuccess } from '@/lib/sound';
import { SpeakButton } from '@/components/SpeakButton';
import { getLoginPracticeAccount, saveLoginPracticeAccount } from '@/lib/loginPracticeAccount';

type Step =
  | 'intro'
  | 'createId'
  | 'practiceId'
  | 'createPassword'
  | 'practicePassword'
  | 'login'
  | 'loggedIn'
  | 'done';

interface CreatedAccount {
  id: string;
  password: string;
}

const STEP_INFO: Record<Exclude<Step, 'intro' | 'done'>, { title: string; description: string; icon: string }> = {
  createId: {
    title: '① 아이디 만들기',
    description: '학교 계정 앞부분(아이디)만 직접 만들어 봐요. 다음 단계에서 방금 만든 아이디를 또 입력해 볼 거예요.',
    icon: 'badge',
  },
  practiceId: {
    title: '아이디 입력 연습',
    description: '방금 만든 아이디를 떠올리고, 칸에 직접 입력해 봐요. 기억해 두면 로그인할 때 도움이 돼요.',
    icon: 'edit_note',
  },
  createPassword: {
    title: '② 비밀번호 만들기',
    description: '이제 비밀번호를 새로 만들어 봐요. 다음 단계에서 방금 적은 비밀번호를 다시 입력해 볼 거예요.',
    icon: 'key',
  },
  practicePassword: {
    title: '비밀번호 입력 연습',
    description: '방금 만든 비밀번호를 기억해서, 그대로 다시 입력해 봐요.',
    icon: 'password',
  },
  login: {
    title: '③ 로그인 연습',
    description: '이제 아이디와 비밀번호를 한 번에 넣어서 로그인해 봐요.',
    icon: 'login',
  },
  loggedIn: {
    title: '④ 로그아웃 연습',
    description: '컴퓨터를 다 썼으면 꼭 로그아웃 버튼을 눌러야 해요!',
    icon: 'logout',
  },
};

const EMAIL_DOMAIN = '@it2edu.co.kr';
const BANNED_ID_WORDS = ['asdf', 'qwer', 'test', 'user', 'admin'];
const BANNED_PASSWORD_WORDS = ['asdf', 'qwer', '1234', 'password'];
const SEQUENTIAL_DIGIT_PATTERNS = [
  '123',
  '234',
  '345',
  '456',
  '567',
  '678',
  '789',
  '987',
  '876',
  '765',
  '654',
  '543',
  '432',
  '321',
];

const PHASE_STEPS: Step[][] = [
  ['createId', 'practiceId'],
  ['createPassword', 'practicePassword'],
  ['login'],
  ['loggedIn'],
];

function normalizeId(value: string): string {
  return value.trim().toLowerCase().replace(EMAIL_DOMAIN, '');
}

function getSchoolEmail(id: string): string {
  return `${normalizeId(id)}${EMAIL_DOMAIN}`;
}

function findBannedWord(value: string, bannedWords: string[]): string | undefined {
  const normalized = value.toLowerCase();
  return bannedWords.find((word) => normalized.includes(word));
}

function hasSequentialDigits(value: string): boolean {
  return SEQUENTIAL_DIGIT_PATTERNS.some((pattern) => value.includes(pattern));
}

function validateIdOnly(signupId: string): string | null {
  const id = normalizeId(signupId);
  const bannedIdWord = findBannedWord(id, BANNED_ID_WORDS);
  if (id.length < 6) return '아이디는 6자 이상이어야 해요. 예: star2026 처럼 조금 더 길게 만들어 보세요.';
  if (!/^[a-z0-9_]+$/i.test(id)) return '아이디는 영어, 숫자, 밑줄(_)만 사용할 수 있어요. 한글이나 특수기호는 빼고 다시 만들어 볼까요?';
  if (/^\d+$/.test(id)) return '아이디가 숫자만 있으면 다른 사람이 맞히기 쉬워요. 영어를 함께 넣어 보세요. 예: star2026';
  if (bannedIdWord) return `"${bannedIdWord}"는 너무 흔한 아이디라 사용할 수 없어요. 나만의 단어를 넣어 보세요. 예: happy_tiger`;
  return null;
}

function validatePasswordFields(
  signupPw: string,
  signupPw2: string,
  id: string,
): string | null {
  const normalizedPassword = signupPw.toLowerCase();
  const normalizedId = normalizeId(id);
  const bannedPasswordWord = findBannedWord(signupPw, BANNED_PASSWORD_WORDS);
  if (signupPw.length < 8) return '너무 짧아요. 더 길게 만들어주세요.';
  if (!/[0-9]/.test(signupPw)) return '숫자가 필요해요.';
  if (
    !/[a-zA-Z]/.test(signupPw) ||
    normalizedPassword === normalizedId ||
    !!bannedPasswordWord ||
    hasSequentialDigits(signupPw)
  ) {
    return '복잡하게 만들어서 안전하게 해주세요.';
  }
  if (signupPw !== signupPw2) return '비밀번호가 서로 달라요. 같게 적어 주세요.';
  return null;
}

function phaseIndexForStep(step: Step): number {
  const i = PHASE_STEPS.findIndex((group) => group.includes(step as (typeof PHASE_STEPS)[number][number]));
  return i >= 0 ? i : 0;
}

export function LoginPractice() {
  const navigate = useNavigate();
  const { user } = useUser();
  const savedAccount = useMemo(() => getLoginPracticeAccount(user?.id), [user?.id]);

  const [step, setStep] = useState<Step>('intro');
  const [account, setAccount] = useState<CreatedAccount | null>(null);
  const [idActivityComplete, setIdActivityComplete] = useState(false);
  const [passwordActivityComplete, setPasswordActivityComplete] = useState(false);
  const [existingAccountPromptVisible, setExistingAccountPromptVisible] = useState(false);
  const [existingAccountDecisionMade, setExistingAccountDecisionMade] = useState(false);
  const [hubError, setHubError] = useState<string | null>(null);

  const [signupId, setSignupId] = useState('');
  const [signupPw, setSignupPw] = useState('');
  const [signupPw2, setSignupPw2] = useState('');
  const [signupError, setSignupError] = useState<string | null>(null);
  const [showCreatePassword, setShowCreatePassword] = useState(false);

  const [loginId, setLoginId] = useState('');
  const [loginPw, setLoginPw] = useState('');
  const [practicePw, setPracticePw] = useState('');
  const [loginError, setLoginError] = useState<string | null>(null);
  const [shake, setShake] = useState(false);
  const [showLoginHint, setShowLoginHint] = useState(false);
  const [showPracticeIdHint, setShowPracticeIdHint] = useState(false);

  const completedRef = useRef(false);
  const startedAtRef = useRef(Date.now());

  useEffect(() => {
    if (step === 'done' && !completedRef.current) {
      completedRef.current = true;
      const t = window.setTimeout(
        () => navigate('/login-practice/simulation', { state: { startedAt: startedAtRef.current } }),
        1200,
      );
      return () => window.clearTimeout(t);
    }
  }, [step, navigate]);

  useEffect(() => {
    if (step === 'intro' && savedAccount && !existingAccountDecisionMade) {
      setExistingAccountPromptVisible(true);
    }
  }, [existingAccountDecisionMade, savedAccount, step]);

  const triggerShake = () => {
    setShake(true);
    window.setTimeout(() => setShake(false), 400);
  };

  const persistAccountIfReady = (
    nextAccount: CreatedAccount,
    nextIdActivityComplete = idActivityComplete,
    nextPasswordActivityComplete = passwordActivityComplete,
  ) => {
    if (!nextIdActivityComplete || !nextPasswordActivityComplete || !nextAccount.id || !nextAccount.password) return;
    saveLoginPracticeAccount(user?.id, {
      id: nextAccount.id,
      email: getSchoolEmail(nextAccount.id),
      password: nextAccount.password,
      createdAt: new Date().toISOString(),
    });
  };

  const handleStartIdActivity = () => {
    playClick();
    setExistingAccountDecisionMade(true);
    setExistingAccountPromptVisible(false);
    setIdActivityComplete(false);
    setHubError(null);
    setSignupError(null);
    setLoginError(null);
    setSignupId(account?.id ?? '');
    setLoginId('');
    setShowPracticeIdHint(false);
    setStep('createId');
  };

  const handleStartPasswordActivity = () => {
    playClick();
    setExistingAccountDecisionMade(true);
    setExistingAccountPromptVisible(false);
    setPasswordActivityComplete(false);
    setHubError(null);
    setSignupError(null);
    setLoginError(null);
    setSignupPw('');
    setSignupPw2('');
    setPracticePw('');
    setShowCreatePassword(false);
    setAccount((prev) => prev ?? { id: '', password: '' });
    setStep('createPassword');
  };

  const handleStartLoginActivity = () => {
    if (!idActivityComplete || !passwordActivityComplete || !account?.id || !account.password) {
      playFail();
      setHubError('아이디 만들기 활동과 비밀번호 만들기 활동을 모두 완료하면 로그인 연습을 할 수 있어요.');
      return;
    }
    playClick();
    setHubError(null);
    persistAccountIfReady(account, true, true);
    setLoginId(account.id);
    setLoginPw('');
    setLoginError(null);
    setShowLoginHint(true);
    setStep('login');
  };

  // ---------- ① 아이디 만들기 ----------
  const handleCreateId = (e: FormEvent) => {
    e.preventDefault();
    const err = validateIdOnly(signupId);
    if (err) {
      setSignupError(err);
      playFail();
      triggerShake();
      return;
    }
    const id = normalizeId(signupId);
    const existingPassword = account?.password ?? '';
    if (existingPassword && id === existingPassword.toLowerCase()) {
      setSignupError('아이디와 비밀번호가 같으면 안 돼요. 다른 아이디를 만들어 주세요.');
      playFail();
      triggerShake();
      return;
    }
    setSignupError(null);
    playSuccess();
    setAccount({ id, password: existingPassword });
    setLoginId('');
    setLoginError(null);
    setShowPracticeIdHint(false);
    window.setTimeout(() => setStep('practiceId'), 600);
  };

  // ---------- 아이디 입력 연습 ----------
  const handlePracticeId = (e: FormEvent) => {
    e.preventDefault();
    if (!account?.id) return;
    const enteredId = normalizeId(loginId);
    if (enteredId === account.id) {
      playSuccess();
      setLoginError(null);
      setHubError(null);
      setIdActivityComplete(true);
      setLoginId('');
      persistAccountIfReady(account, true, passwordActivityComplete);
      window.setTimeout(() => setStep('intro'), 600);
    } else {
      playFail();
      triggerShake();
      setLoginError(
        `아이디가 달라요. 방금 만든 계정은 ${getSchoolEmail(account.id)}예요. 앞부분 아이디를 다시 확인해 보세요.`,
      );
    }
  };

  // ---------- ② 비밀번호 만들기 ----------
  const handleCreatePassword = (e: FormEvent) => {
    e.preventDefault();
    const currentId = account?.id ?? '';
    const err = validatePasswordFields(signupPw, signupPw2, currentId);
    if (err) {
      setSignupError(err);
      playFail();
      triggerShake();
      return;
    }
    setSignupError(null);
    playSuccess();
    const newAccount = { id: currentId, password: signupPw };
    setAccount(newAccount);
    setPracticePw('');
    setLoginError(null);
    window.setTimeout(() => setStep('practicePassword'), 600);
  };

  // ---------- 비밀번호 입력 연습 ----------
  const handlePracticePassword = (e: FormEvent) => {
    e.preventDefault();
    if (!account) return;
    if (practicePw === account.password) {
      playSuccess();
      setLoginError(null);
      setHubError(null);
      setLoginId('');
      setLoginPw('');
      setShowLoginHint(false);
      setPasswordActivityComplete(true);
      persistAccountIfReady(account, idActivityComplete, true);
      window.setTimeout(() => setStep('intro'), 600);
    } else {
      playFail();
      triggerShake();
      setLoginError('비밀번호가 달라요. 방금 비밀번호 만들기에서 직접 만든 비밀번호를 다시 천천히 입력해 보세요.');
    }
  };

  // ---------- ③ 로그인 ----------
  const handleLogin = (e: FormEvent) => {
    e.preventDefault();
    if (!account || !account.id || !account.password) return;
    const enteredId = normalizeId(loginId);
    if (enteredId === account.id && loginPw === account.password) {
      playSuccess();
      setLoginError(null);
      setStep('loggedIn');
    } else {
      playFail();
      triggerShake();
      if (enteredId !== account.id) {
        setLoginError(`아이디가 달라요. 방금 만든 계정은 ${getSchoolEmail(account.id)}예요. 앞부분 아이디를 다시 확인해 보세요.`);
      } else {
        setLoginError('비밀번호가 달라요. 방금 만든 비밀번호를 다시 천천히 입력해 보세요.');
      }
    }
  };

  const handleLogout = () => {
    playSuccess();
    setStep('done');
  };

  const resetAllForms = () => {
    setAccount(null);
    setIdActivityComplete(false);
    setPasswordActivityComplete(false);
    setHubError(null);
    setSignupId('');
    setSignupPw('');
    setSignupPw2('');
    setSignupError(null);
    setShowCreatePassword(false);
    setLoginId('');
    setLoginPw('');
    setPracticePw('');
    setLoginError(null);
    setShowLoginHint(false);
    setShowPracticeIdHint(false);
  };

  const handleCreateNewAccount = () => {
    playClick();
    setExistingAccountDecisionMade(true);
    setExistingAccountPromptVisible(false);
    resetAllForms();
    setStep('intro');
  };

  const handlePracticeWithExistingAccount = () => {
    if (!savedAccount) return;
    playClick();
    setExistingAccountDecisionMade(true);
    setExistingAccountPromptVisible(false);
    setAccount({ id: savedAccount.id, password: savedAccount.password });
    setIdActivityComplete(true);
    setPasswordActivityComplete(true);
    setHubError(null);
    setLoginId(savedAccount.id);
    setLoginPw('');
    setPracticePw('');
    setLoginError(null);
    setShowLoginHint(true);
    setStep('login');
  };

  const passwordStrength = (() => {
    let score = 0;
    if (signupPw.length >= 8) score++;
    if (signupPw.length >= 10) score++;
    if (/[a-zA-Z]/.test(signupPw) && /[0-9]/.test(signupPw)) score++;
    if (/[!@#$%^&*?]/.test(signupPw)) score++;
    const isTooEasy =
      !!signupPw &&
      (!/[a-zA-Z]/.test(signupPw) ||
        !!findBannedWord(signupPw, BANNED_PASSWORD_WORDS) ||
        hasSequentialDigits(signupPw) ||
        (!!account?.id && signupPw.toLowerCase() === account.id));
    if (isTooEasy) return Math.min(score, 1);
    return score;
  })();

  const canStartLogin = idActivityComplete && passwordActivityComplete && !!account?.id && !!account.password;

  // Intro
  if (step === 'intro') {
    return (
      <div className="max-w-4xl w-full mx-auto flex flex-col gap-8 md:pt-12 items-center text-center">
        {existingAccountPromptVisible && savedAccount && (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-scrim/60 px-4"
            role="dialog"
            aria-modal="true"
            aria-labelledby="existing-login-account-title"
          >
            <div className="w-full max-w-2xl rounded-2xl border-2 border-primary-fixed bg-surface-container-lowest p-6 text-left shadow-2xl">
              <div className="flex items-start gap-4">
                <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-primary-container text-on-primary-container">
                  <span className="material-symbols-outlined text-3xl" style={{ fontVariationSettings: "'FILL' 1" }}>
                    manage_accounts
                  </span>
                </div>
                <div>
                  <h2 id="existing-login-account-title" className="font-headline-md text-headline-md text-on-background">
                    이미 만든 연습 계정이 있어요
                  </h2>
                  <p className="mt-2 font-body-lg text-body-lg text-on-surface-variant">
                    저장된 연습 계정 <strong className="text-primary">{savedAccount.email}</strong>이 있어요. 아이디와 비밀번호를 새로 연습할까요?
                  </p>
                </div>
              </div>

              <div className="mt-6 grid gap-3 sm:grid-cols-2">
                <button
                  type="button"
                  onClick={handleCreateNewAccount}
                  className="flex h-14 items-center justify-center gap-2 rounded-lg bg-primary font-label-bold text-label-bold text-on-primary shadow-[0_3px_0_rgb(0,78,118)] transition-all active:translate-y-[3px] active:shadow-none"
                >
                  <span className="material-symbols-outlined">restart_alt</span>
                  처음부터 연습하기
                </button>
                <button
                  type="button"
                  onClick={handlePracticeWithExistingAccount}
                  className="flex h-14 items-center justify-center gap-2 rounded-lg border-2 border-primary bg-surface font-label-bold text-label-bold text-primary transition-colors hover:bg-primary-container"
                >
                  <span className="material-symbols-outlined">password</span>
                  저장된 계정으로 로그인 연습하기
                </button>
              </div>
            </div>
          </div>
        )}

        <h1 className="font-display-lg text-display-lg text-primary">아이디와 비밀번호 활동</h1>
        <p className="font-body-xl text-body-xl text-on-surface-variant max-w-2xl">
          아이디 만들기 활동과 비밀번호 만들기 활동을 원하는 순서로 해요. 두 활동을 모두 완료하면 로그인 연습이 열리고, 로그인 뒤에는 로그아웃까지 이어서 연습해요.
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 w-full">
          <ActivityCard
            title="아이디 만들기 활동"
            body={idActivityComplete && account?.id ? `${getSchoolEmail(account.id)} 아이디 활동을 완료했어요.` : '아이디 만들기와 아이디 입력 연습을 해요.'}
            icon="badge"
            status={idActivityComplete ? '완료' : '미완료'}
            done={idActivityComplete}
            buttonLabel={idActivityComplete ? '아이디 다시 연습하기' : '아이디 활동 시작'}
            onClick={handleStartIdActivity}
          />
          <ActivityCard
            title="비밀번호 만들기 활동"
            body={passwordActivityComplete ? '비밀번호 만들기와 비밀번호 입력 연습을 완료했어요.' : '비밀번호 만들기와 비밀번호 입력 연습을 해요.'}
            icon="key"
            status={passwordActivityComplete ? '완료' : '미완료'}
            done={passwordActivityComplete}
            buttonLabel={passwordActivityComplete ? '비밀번호 다시 연습하기' : '비밀번호 활동 시작'}
            onClick={handleStartPasswordActivity}
          />
          <ActivityCard
            title="로그인 연습"
            body={canStartLogin ? '아이디와 비밀번호를 함께 입력해서 로그인해요.' : '아이디 활동과 비밀번호 활동을 모두 완료하면 열려요.'}
            icon="login"
            status={canStartLogin ? '열림' : '잠김'}
            disabled={!canStartLogin}
            buttonLabel="로그인 연습하기"
            onClick={handleStartLoginActivity}
          />
          <ActivityCard
            title="로그아웃 연습"
            body="로그인 성공 뒤 바로 이어서 로그아웃 버튼을 눌러요."
            icon="logout"
            status="대기"
            disabled
            buttonLabel="로그인 후 진행"
          />
        </div>

        {hubError && (
          <p role="alert" className="font-label-bold text-label-bold text-error bg-error-container rounded-lg px-4 py-3">
            {hubError}
          </p>
        )}
      </div>
    );
  }

  if (step === 'done') {
    return (
      <div className="max-w-2xl w-full mx-auto flex flex-col gap-6 md:pt-12 items-center text-center">
        <span className="material-symbols-outlined text-8xl text-secondary" style={{ fontVariationSettings: "'FILL' 1" }}>
          verified_user
        </span>
        <h1 className="font-display-lg text-display-lg text-primary">기본 연습 완료!</h1>
        <p className="font-body-xl text-body-xl text-on-surface-variant">이제 실제 Google 로그인 화면처럼 한 번 더 연습해 볼게요.</p>
      </div>
    );
  }

  const stepInfo = STEP_INFO[step];
  const phaseLabels = ['아이디 활동', '비밀번호 활동', '로그인', '로그아웃'];
  const phaseIcons = ['badge', 'key', 'login', 'logout'] as const;
  const phaseDone = [idActivityComplete, passwordActivityComplete, false, false];
  const currentPhase = phaseIndexForStep(step);

  return (
    <div className="max-w-3xl mx-auto flex flex-col gap-8 w-full md:pt-12">
      <section className="text-center space-y-3">
        <h2 className="font-display-lg text-display-lg text-primary">{stepInfo.title}</h2>
        <div className="flex items-center justify-center gap-3">
          <p className="font-body-xl text-body-xl text-on-surface-variant max-w-2xl">{stepInfo.description}</p>
          <SpeakButton text={`${stepInfo.title}. ${stepInfo.description}`} />
        </div>

        <div className="flex justify-center gap-2 flex-wrap mt-4">
          {phaseLabels.map((label, i) => {
            const isCurrent = currentPhase === i;
            const isComplete = phaseDone[i];
            return (
              <div
                key={label}
                className={`flex items-center gap-2 px-4 py-2 rounded-full font-label-bold text-sm transition-colors ${
                  isComplete ? 'bg-secondary text-on-secondary' : isCurrent ? 'bg-primary text-on-primary' : 'bg-surface-container-high text-on-surface-variant'
                }`}
              >
                <span className="material-symbols-outlined text-base" style={{ fontVariationSettings: isComplete ? "'FILL' 1" : "'FILL' 0" }}>
                  {isComplete ? 'check_circle' : phaseIcons[i]}
                </span>
                {label}
              </div>
            );
          })}
        </div>
      </section>

      {/* ① 아이디 만들기 */}
      {step === 'createId' && (
        <form
          onSubmit={handleCreateId}
          className={`bg-surface-container-lowest rounded-xl shadow-lg border-2 border-primary-fixed p-8 flex flex-col gap-6 relative overflow-hidden ${
            shake ? 'animate-[shake_0.4s_ease-in-out]' : ''
          }`}
          noValidate
        >
          <div className="absolute top-0 left-0 w-full h-4 bg-primary-container"></div>

          <div className="text-center space-y-2">
            <span className="material-symbols-outlined text-5xl text-primary" style={{ fontVariationSettings: "'FILL' 1" }}>
              badge
            </span>
            <h3 className="font-headline-md text-headline-md text-on-background">아이디 만들기 연습</h3>
            <p className="font-body-lg text-body-lg text-on-surface-variant text-sm">
              아이디 앞부분만 먼저 만들어요. 뒤에 <strong className="text-primary">{EMAIL_DOMAIN}</strong> 이 붙어서 학교 계정처럼 보여요. 비밀번호는 다음 단계에서 따로 만들어요.
            </p>
          </div>

          <div className="space-y-4">
            <div className="space-y-2">
              <label htmlFor="signup_id" className="font-label-bold text-label-bold text-on-surface">
                아이디 (6자 이상, 영어/숫자/밑줄)
              </label>
              <div className="flex rounded-lg border-2 border-outline-variant focus-within:border-primary focus-within:ring-4 focus-within:ring-primary-fixed bg-surface overflow-hidden">
                <input
                  type="text"
                  id="signup_id"
                  value={signupId}
                  onChange={(e) => {
                    setSignupId(e.target.value);
                    setSignupError(null);
                  }}
                  className="min-w-0 flex-1 h-touch-min border-none px-4 font-body-lg text-body-lg bg-transparent placeholder:text-outline-variant outline-none"
                  placeholder="예: star2026"
                  autoComplete="off"
                  spellCheck={false}
                  aria-label="새 아이디"
                />
                <span className="flex items-center px-4 bg-primary-container text-on-primary-container font-label-bold text-sm border-l border-primary/20">
                  {EMAIL_DOMAIN}
                </span>
              </div>
              <div className="bg-surface-container-low rounded-lg p-3 text-sm text-on-surface-variant">
                <p className="font-label-bold text-on-surface mb-1">좋은 아이디 예시</p>
                <p>
                  <code className="bg-surface-container-lowest px-1 rounded">star2026</code>,{' '}
                  <code className="bg-surface-container-lowest px-1 rounded">happy_tiger</code>,{' '}
                  <code className="bg-surface-container-lowest px-1 rounded">school77</code>
                </p>
                <p className="mt-1">숫자만 쓰거나 `asdf`, `qwer`, `test`, `user`, `admin` 같은 흔한 단어는 피해야 해요.</p>
              </div>
              {normalizeId(signupId) && (
                <p className="font-label-bold text-label-bold text-primary text-sm">
                  만들어질 계정: <code className="bg-primary-container px-2 py-1 rounded">{getSchoolEmail(signupId)}</code>
                </p>
              )}
            </div>

            {signupError && (
              <p role="alert" className="font-label-bold text-label-bold text-error text-center bg-error-container rounded-lg p-3">
                {signupError}
              </p>
            )}

            <button
              type="submit"
              className="w-full h-14 bg-primary text-on-primary font-label-bold text-label-bold rounded-lg shadow-[0_4px_0_rgb(0,78,118)] active:shadow-none active:translate-y-[4px] transition-all flex items-center justify-center gap-2"
            >
              <span className="material-symbols-outlined">arrow_forward</span>
              다음: 아이디 입력 연습으로
            </button>
          </div>
        </form>
      )}

      {/* 아이디 입력 연습 */}
      {step === 'practiceId' && account && (
        <form
          onSubmit={handlePracticeId}
          className={`bg-surface-container-lowest rounded-xl shadow-lg border-2 border-primary-fixed p-8 flex flex-col gap-6 relative overflow-hidden ${
            shake ? 'animate-[shake_0.4s_ease-in-out]' : ''
          }`}
          noValidate
        >
          <div className="absolute top-0 left-0 w-full h-4 bg-primary-container"></div>

          <div className="text-center space-y-2">
            <span className="material-symbols-outlined text-5xl text-primary" style={{ fontVariationSettings: "'FILL' 1" }}>
              edit_note
            </span>
            <h3 className="font-headline-md text-headline-md text-on-background">아이디 입력해 보기</h3>
            <p className="font-body-lg text-body-lg text-on-surface-variant text-sm">방금 만든 아이디를 스스로 떠올려서, 아래 칸에 직접 입력해 봐요.</p>
          </div>

          <div className="bg-secondary-container/50 text-on-secondary-container rounded-lg p-4 text-center">
            <p className="font-label-bold text-label-bold text-sm mb-2">힌트 (막히면 눌러요)</p>
            <p className="font-body-lg text-body-lg">
              계정:{' '}
              <code className="bg-surface-container-lowest px-2 py-1 rounded font-mono">
                {showPracticeIdHint ? getSchoolEmail(account.id) : `${'•'.repeat(account.id.length)}${EMAIL_DOMAIN}`}
              </code>
            </p>
            <button
              type="button"
              onClick={() => {
                playClick();
                setShowPracticeIdHint((v) => !v);
              }}
              className="mt-3 px-4 py-2 rounded-full bg-primary text-on-primary font-label-bold text-sm shadow-[0_2px_0_rgb(0,78,118)] active:translate-y-[2px] active:shadow-none transition-all"
            >
              {showPracticeIdHint ? '아이디 다시 가리기' : '아이디 힌트 보기'}
            </button>
          </div>

          <div className="space-y-4">
            <div className="space-y-2">
              <label htmlFor="practice_login_id" className="font-label-bold text-label-bold text-on-surface">
                아이디
              </label>
              <div className="flex rounded-lg border-2 border-outline-variant focus-within:border-primary focus-within:ring-4 focus-within:ring-primary-fixed bg-surface overflow-hidden">
                <input
                  type="text"
                  id="practice_login_id"
                  value={loginId}
                  onChange={(e) => {
                    setLoginId(e.target.value);
                    setLoginError(null);
                  }}
                  className="min-w-0 flex-1 h-touch-min border-none px-4 font-body-lg text-body-lg bg-transparent placeholder:text-outline-variant outline-none"
                  placeholder={showPracticeIdHint ? account.id : '아이디 앞부분을 입력해요'}
                  autoComplete="off"
                  spellCheck={false}
                  aria-label="아이디 입력 연습"
                />
                <span className="flex items-center px-4 bg-primary-container text-on-primary-container font-label-bold text-sm border-l border-primary/20">
                  {EMAIL_DOMAIN}
                </span>
              </div>
            </div>

            {loginError && (
              <p role="alert" className="font-label-bold text-label-bold text-error text-center bg-error-container rounded-lg p-3">
                {loginError}
              </p>
            )}

            <button
              type="submit"
              className="w-full h-14 bg-primary text-on-primary font-label-bold text-label-bold rounded-lg shadow-[0_4px_0_rgb(0,78,118)] active:shadow-none active:translate-y-[4px] transition-all flex items-center justify-center gap-2"
            >
              <span className="material-symbols-outlined">check</span>
              맞아요 — 활동 완료하고 돌아가기
            </button>
          </div>
        </form>
      )}

      {/* ② 비밀번호 만들기 */}
      {step === 'createPassword' && account && (
        <form
          onSubmit={handleCreatePassword}
          className={`bg-surface-container-lowest rounded-xl shadow-lg border-2 border-primary-fixed p-8 flex flex-col gap-6 relative overflow-hidden ${
            shake ? 'animate-[shake_0.4s_ease-in-out]' : ''
          }`}
          noValidate
        >
          <div className="absolute top-0 left-0 w-full h-4 bg-primary-container"></div>

          <div className="text-center space-y-2">
            <span className="material-symbols-outlined text-5xl text-primary" style={{ fontVariationSettings: "'FILL' 1" }}>
              key
            </span>
            <h3 className="font-headline-md text-headline-md text-on-background">
              {account.id ? '이제 비밀번호 만들기' : '비밀번호 만들기 연습'}
            </h3>
            <p className="font-body-lg text-body-lg text-on-surface-variant text-sm">
              {account.id ? (
                <>
                  아이디 <code className="bg-primary-container px-2 py-0.5 rounded font-mono text-on-primary-container">{getSchoolEmail(account.id)}</code> 와 다른 비밀번호를 새로 지어요.
                </>
              ) : (
                '아이디는 나중에 만들어도 괜찮아요. 먼저 좋아하는 단어와 숫자를 섞어 안전한 비밀번호를 새로 지어요.'
              )}
            </p>
          </div>

          <div className="space-y-4">
            <div className="space-y-2">
              <label htmlFor="signup_pw" className="font-label-bold text-label-bold text-on-surface">
                비밀번호 (8자 이상, 영어+숫자)
              </label>
              <input
                type={showCreatePassword ? 'text' : 'password'}
                id="signup_pw"
                value={signupPw}
                onChange={(e) => {
                  setSignupPw(e.target.value);
                  setSignupError(null);
                }}
                className="w-full h-touch-min rounded-lg border-2 border-outline-variant focus:border-primary focus:ring-4 focus:ring-primary-fixed px-4 font-body-lg text-body-lg bg-surface placeholder:text-outline-variant outline-none"
                placeholder="비밀번호"
                aria-label="비밀번호"
              />
              <div className="bg-secondary-container/50 rounded-lg p-4 text-sm text-on-secondary-container">
                <p className="font-label-bold text-label-bold mb-2">좋은 비밀번호 만드는 법</p>
                <ol className="list-decimal list-inside space-y-1 text-left">
                  <li>
                    좋아하는 단어를 하나 고르세요. 예: <code className="bg-surface-container-lowest px-1 rounded">star</code>
                  </li>
                  <li>
                    숫자를 붙여 보세요. 예: <code className="bg-surface-container-lowest px-1 rounded">star2026</code>
                  </li>
                  <li>
                    대문자를 하나 섞어 보세요. 예: <code className="bg-surface-container-lowest px-1 rounded">Star2026</code>
                  </li>
                </ol>
                <p className="mt-2">
                  {account.id
                    ? '아이디와 똑같이 만들거나 `asdf`, `qwer`, `1234`, `password`는 쓰지 않아요.'
                    : '`asdf`, `qwer`, `1234`, `password`처럼 쉽게 떠올릴 수 있는 비밀번호는 쓰지 않아요.'}
                </p>
              </div>
              <div className="flex gap-1 mt-1">
                {[0, 1, 2, 3].map((i) => (
                  <div
                    key={i}
                    className={`h-2 flex-1 rounded-full transition-colors ${
                      i < passwordStrength
                        ? passwordStrength === 1
                          ? 'bg-error'
                          : passwordStrength === 2
                          ? 'bg-tertiary'
                          : 'bg-secondary'
                        : 'bg-surface-container-high'
                    }`}
                  />
                ))}
              </div>
              <p className="text-xs text-on-surface-variant">
                강도:{' '}
                {passwordStrength === 0 && '없음'}
                {passwordStrength === 1 && '약해요'}
                {passwordStrength === 2 && '보통이에요'}
                {passwordStrength === 3 && '안전해요'}
                {passwordStrength === 4 && '아주 안전해요!'}
              </p>
            </div>

            <div className="space-y-2">
              <label htmlFor="signup_pw2" className="font-label-bold text-label-bold text-on-surface">
                비밀번호 확인
              </label>
              <input
                type={showCreatePassword ? 'text' : 'password'}
                id="signup_pw2"
                value={signupPw2}
                onChange={(e) => {
                  setSignupPw2(e.target.value);
                  setSignupError(null);
                }}
                className="w-full h-touch-min rounded-lg border-2 border-outline-variant focus:border-primary focus:ring-4 focus:ring-primary-fixed px-4 font-body-lg text-body-lg bg-surface placeholder:text-outline-variant outline-none"
                placeholder="다시 한 번 입력해요"
                aria-label="비밀번호 확인"
              />
            </div>

            <label className="flex items-center gap-3 cursor-pointer rounded-lg bg-surface-container-low px-4 py-3 font-label-bold text-label-bold text-on-surface">
              <input
                type="checkbox"
                checked={showCreatePassword}
                onChange={(e) => setShowCreatePassword(e.target.checked)}
                className="w-5 h-5 accent-primary"
                aria-label="비밀번호 보기"
              />
              <span>비밀번호 보기</span>
            </label>

            {signupError && (
              <p role="alert" className="font-label-bold text-label-bold text-error text-center bg-error-container rounded-lg p-3">
                {signupError}
              </p>
            )}

            <button
              type="submit"
              className="w-full h-14 bg-primary text-on-primary font-label-bold text-label-bold rounded-lg shadow-[0_4px_0_rgb(0,78,118)] active:shadow-none active:translate-y-[4px] transition-all flex items-center justify-center gap-2"
            >
              <span className="material-symbols-outlined">arrow_forward</span>
              다음: 비밀번호 입력 연습으로
            </button>
          </div>
        </form>
      )}

      {/* 비밀번호 입력 연습 */}
      {step === 'practicePassword' && account && (
        <form
          onSubmit={handlePracticePassword}
          className={`bg-surface-container-lowest rounded-xl shadow-lg border-2 border-primary-fixed p-8 flex flex-col gap-6 relative overflow-hidden ${
            shake ? 'animate-[shake_0.4s_ease-in-out]' : ''
          }`}
          noValidate
        >
          <div className="absolute top-0 left-0 w-full h-4 bg-primary-container"></div>

          <div className="text-center space-y-2">
            <span className="material-symbols-outlined text-5xl text-primary" style={{ fontVariationSettings: "'FILL' 1" }}>
              password
            </span>
            <h3 className="font-headline-md text-headline-md text-on-background">비밀번호 입력해 보기</h3>
            <p className="font-body-lg text-body-lg text-on-surface-variant text-sm">
              {account.id ? (
                <>
                  아이디는 <code className="bg-primary-container px-2 py-0.5 rounded">{getSchoolEmail(account.id)}</code> 이에요. 방금 만든 비밀번호만 칸에 다시 적어 봐요.
                </>
              ) : (
                '방금 만든 비밀번호만 칸에 다시 적어 봐요. 아이디는 나중에 만들어도 돼요.'
              )}
            </p>
          </div>

          <div className="space-y-4">
            <div className="space-y-2">
              <label htmlFor="practice_pw" className="font-label-bold text-label-bold text-on-surface">
                비밀번호
              </label>
              <input
                type="password"
                id="practice_pw"
                value={practicePw}
                onChange={(e) => {
                  setPracticePw(e.target.value);
                  setLoginError(null);
                }}
                className="w-full h-touch-min rounded-lg border-2 border-outline-variant focus:border-primary focus:ring-4 focus:ring-primary-fixed px-4 font-body-lg text-body-lg bg-surface placeholder:text-outline-variant outline-none"
                placeholder="방금 만든 비밀번호"
                aria-label="비밀번호 입력 연습"
              />
            </div>

            {loginError && (
              <p role="alert" className="font-label-bold text-label-bold text-error text-center bg-error-container rounded-lg p-3">
                {loginError}
              </p>
            )}

            <button
              type="submit"
              className="w-full h-14 bg-primary text-on-primary font-label-bold text-label-bold rounded-lg shadow-[0_4px_0_rgb(0,78,118)] active:shadow-none active:translate-y-[4px] transition-all flex items-center justify-center gap-2"
            >
              <span className="material-symbols-outlined">check</span>
              맞아요 — 활동 완료하고 돌아가기
            </button>
          </div>
        </form>
      )}

      {/* ③ 로그인 (아이디 + 비밀번호) */}
      {step === 'login' && account && account.password && (
        <form
          onSubmit={handleLogin}
          className={`bg-surface-container-lowest rounded-xl shadow-lg border-2 border-primary-fixed p-8 flex flex-col gap-6 relative overflow-hidden ${
            shake ? 'animate-[shake_0.4s_ease-in-out]' : ''
          }`}
          noValidate
        >
          <div className="absolute top-0 left-0 w-full h-4 bg-primary-container"></div>

          <div className="text-center space-y-2">
            <span className="material-symbols-outlined text-5xl text-primary" style={{ fontVariationSettings: "'FILL' 1" }}>
              shield_lock
            </span>
            <h3 className="font-headline-md text-headline-md text-on-background">아이디와 비밀번호로 로그인</h3>
          </div>

          <div className="bg-secondary-container/50 text-on-secondary-container rounded-lg p-4 text-center">
            <p className="font-label-bold text-label-bold text-sm mb-2">내 계정 정보 (기본은 가려져 있어요)</p>
            <p className="font-body-lg text-body-lg">
              계정:{' '}
              <code className="bg-surface-container-lowest px-2 py-1 rounded font-mono">
                {showLoginHint ? getSchoolEmail(account.id) : `${'•'.repeat(account.id.length)}${EMAIL_DOMAIN}`}
              </code>
            </p>
            <p className="font-body-lg text-body-lg mt-1">
              비밀번호: <code className="bg-surface-container-lowest px-2 py-1 rounded font-mono">{'•'.repeat(account.password.length)}</code>
            </p>
            <p className="text-xs text-on-surface-variant mt-2">막히면 힌트를 눌러 확인해요.</p>
            <button
              type="button"
              onClick={() => {
                playClick();
                setShowLoginHint((v) => !v);
              }}
              className="mt-3 px-4 py-2 rounded-full bg-primary text-on-primary font-label-bold text-sm shadow-[0_2px_0_rgb(0,78,118)] active:translate-y-[2px] active:shadow-none transition-all"
            >
              {showLoginHint ? '아이디 다시 가리기' : '아이디 힌트 보기'}
            </button>
          </div>

          <AccountSafetyChecklist account={account} />

          <div className="space-y-4">
            <div className="space-y-2">
              <label htmlFor="login_id" className="font-label-bold text-label-bold text-on-surface">
                아이디
              </label>
              <div className="flex rounded-lg border-2 border-outline-variant focus-within:border-primary focus-within:ring-4 focus-within:ring-primary-fixed bg-surface overflow-hidden">
                <input
                  type="text"
                  id="login_id"
                  value={loginId}
                  onChange={(e) => {
                    setLoginId(e.target.value);
                    setLoginError(null);
                  }}
                  className="min-w-0 flex-1 h-touch-min border-none px-4 font-body-lg text-body-lg bg-transparent placeholder:text-outline-variant outline-none"
                  placeholder={showLoginHint ? account.id : '아이디 앞부분을 입력해요'}
                  autoComplete="off"
                  spellCheck={false}
                  aria-label="아이디"
                />
                <span className="flex items-center px-4 bg-primary-container text-on-primary-container font-label-bold text-sm border-l border-primary/20">
                  {EMAIL_DOMAIN}
                </span>
              </div>
              <p className="text-xs text-on-surface-variant">앞부분만 입력해도 되고, 전체 계정을 붙여 넣어도 괜찮아요.</p>
            </div>

            <div className="space-y-2">
              <label htmlFor="login_pw" className="font-label-bold text-label-bold text-on-surface">
                비밀번호
              </label>
              <input
                type="password"
                id="login_pw"
                value={loginPw}
                onChange={(e) => {
                  setLoginPw(e.target.value);
                  setLoginError(null);
                }}
                className="w-full h-touch-min rounded-lg border-2 border-outline-variant focus:border-primary focus:ring-4 focus:ring-primary-fixed px-4 font-body-lg text-body-lg bg-surface placeholder:text-outline-variant outline-none"
                placeholder="비밀번호"
                aria-label="비밀번호"
              />
            </div>

            {loginError && (
              <p role="alert" className="font-label-bold text-label-bold text-error text-center bg-error-container rounded-lg p-3">
                {loginError}
              </p>
            )}

            <button
              type="submit"
              className="w-full h-14 bg-primary text-on-primary font-label-bold text-label-bold rounded-lg shadow-[0_4px_0_rgb(0,78,118)] active:shadow-none active:translate-y-[4px] transition-all flex items-center justify-center gap-2"
            >
              <span className="material-symbols-outlined">login</span>
              로그인
            </button>

            <button
              type="button"
              onClick={() => {
                if (confirm('처음부터 다시 연습할까요? 활동 허브로 돌아가요.')) {
                  playClick();
                  resetAllForms();
                  setStep('intro');
                }
              }}
              className="w-full text-sm text-primary hover:underline font-label-bold"
            >
              처음부터 다시 하기 → 활동 허브
            </button>
          </div>
        </form>
      )}

      {step === 'loggedIn' && account && (
        <div className="bg-surface-container-lowest rounded-xl shadow-lg border-2 border-secondary p-8 flex flex-col items-center gap-6 relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-4 bg-secondary"></div>
          <span className="material-symbols-outlined text-6xl text-secondary" style={{ fontVariationSettings: "'FILL' 1" }}>
            verified_user
          </span>
          <h3 className="font-headline-md text-headline-md text-on-background">로그인 성공!</h3>
          <p className="font-body-xl text-body-xl text-on-surface-variant text-center max-w-md">
            반가워요, <strong className="text-primary">{getSchoolEmail(account.id)}</strong>님! 이제 컴퓨터를 다 썼다면 꼭 <b>로그아웃</b> 버튼을 누르는 습관을 들여요.
          </p>

          <div className="bg-error-container text-on-error-container rounded-lg p-4 max-w-md text-center">
            <p className="font-label-bold text-label-bold mb-1">왜 로그아웃해야 하나요?</p>
            <p className="font-body-lg text-body-lg text-sm">학교나 도서관 컴퓨터를 그대로 두면 다른 사람이 내 정보를 볼 수 있어요!</p>
          </div>

          <button
            type="button"
            onClick={handleLogout}
            className="w-full max-w-sm h-14 bg-error text-on-error font-label-bold text-label-bold rounded-lg shadow-[0_4px_0_rgb(147,0,10)] active:shadow-none active:translate-y-[4px] transition-all flex items-center justify-center gap-2 ring-4 ring-error-container animate-[pulse_1.5s_ease-in-out_infinite]"
            aria-label="로그아웃"
          >
            <span className="material-symbols-outlined">logout</span>
            로그아웃
          </button>
        </div>
      )}

      <style>{`
        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          25% { transform: translateX(-8px); }
          75% { transform: translateX(8px); }
        }
      `}</style>
    </div>
  );
}

interface ActivityCardProps {
  title: string;
  body: string;
  icon: string;
  status: string;
  done?: boolean;
  disabled?: boolean;
  buttonLabel: string;
  onClick?: () => void;
}

function ActivityCard({ title, body, icon, status, done = false, disabled = false, buttonLabel, onClick }: ActivityCardProps) {
  return (
    <div
      className={`bg-surface-container-lowest rounded-lg p-6 border-2 shadow-sm flex flex-col items-center gap-4 text-center ${
        done
          ? 'border-secondary bg-secondary-container/30'
          : disabled
          ? 'border-outline-variant bg-surface-container-low opacity-75'
          : 'border-primary-fixed'
      }`}
    >
      <div
        className={`w-14 h-14 rounded-full flex items-center justify-center ${
          done ? 'bg-secondary text-on-secondary' : disabled ? 'bg-surface-container-high text-on-surface-variant' : 'bg-primary-container text-on-primary-container'
        }`}
      >
        <span className="material-symbols-outlined text-3xl" style={{ fontVariationSettings: "'FILL' 1" }}>
          {done ? 'check_circle' : disabled ? 'lock' : icon}
        </span>
      </div>
      <span className={`text-sm font-label-bold ${done ? 'text-secondary' : disabled ? 'text-on-surface-variant' : 'text-primary'}`}>{status}</span>
      <h3 className="font-headline-md text-headline-md text-on-background">{title}</h3>
      <p className="font-body-lg text-body-lg text-on-surface-variant text-sm min-h-12">{body}</p>
      <button
        type="button"
        onClick={onClick}
        disabled={disabled}
        className={`mt-auto w-full h-12 rounded-lg font-label-bold text-label-bold transition-all flex items-center justify-center gap-2 ${
          disabled
            ? 'bg-surface-container-high text-on-surface-variant cursor-not-allowed'
            : 'bg-primary text-on-primary shadow-[0_3px_0_rgb(0,78,118)] active:translate-y-[3px] active:shadow-none'
        }`}
      >
        <span className="material-symbols-outlined">{disabled ? 'lock' : done ? 'replay' : 'play_arrow'}</span>
        {buttonLabel}
      </button>
    </div>
  );
}

function AccountSafetyChecklist({ account }: { account: CreatedAccount }) {
  const passedItems = [
    { label: '아이디가 6자 이상이에요', pass: account.id.length >= 6 },
    { label: '아이디가 숫자만으로 되어 있지 않아요', pass: !/^\d+$/.test(account.id) },
    { label: '비밀번호가 8자 이상이에요', pass: account.password.length >= 8 },
    { label: '비밀번호에 영어와 숫자가 함께 있어요', pass: /[a-zA-Z]/.test(account.password) && /[0-9]/.test(account.password) },
    { label: '아이디와 비밀번호가 서로 달라요', pass: account.id !== account.password.toLowerCase() },
  ];
  const score = passedItems.filter((item) => item.pass).length;

  return (
    <div className="bg-primary-container/40 text-on-primary-container rounded-xl p-5 border-2 border-primary-fixed">
      <div className="flex items-center gap-3 mb-3">
        <span className="material-symbols-outlined text-3xl" style={{ fontVariationSettings: "'FILL' 1" }}>
          fact_check
        </span>
        <div>
          <p className="font-label-bold text-label-bold">계정 안전 확인</p>
          <p className="text-sm">만든 계정이 안전한지 같이 확인해요. ({score}/{passedItems.length})</p>
        </div>
      </div>
      <div className="grid grid-cols-1 gap-2">
        {passedItems.map((item) => (
          <div key={item.label} className="flex items-center gap-2 text-sm font-label-bold">
            <span className={`material-symbols-outlined text-base ${item.pass ? 'text-secondary' : 'text-error'}`}>{item.pass ? 'check_circle' : 'cancel'}</span>
            {item.label}
          </div>
        ))}
      </div>
    </div>
  );
}
