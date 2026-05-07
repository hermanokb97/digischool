import { FormEvent, useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useUser } from '@/context/UserContext';
import { playClick, playFail, playSuccess } from '@/lib/sound';
import { SpeakButton } from '@/components/SpeakButton';
import { getLoginPracticeAccount, saveLoginPracticeAccount } from '@/lib/loginPracticeAccount';

type Step = 'intro' | 'signup' | 'login' | 'loggedIn' | 'done';

interface CreatedAccount {
  id: string;
  password: string;
}

const STEP_INFO: Record<Exclude<Step, 'intro' | 'done'>, { title: string; description: string; icon: string }> = {
  signup: {
    title: '회원가입 연습',
    description: '아이디와 비밀번호를 직접 만들어 봐요. 좋은 비밀번호는 글자, 숫자, 기호를 섞어요.',
    icon: 'app_registration',
  },
  login: {
    title: '로그인 연습',
    description: '방금 만든 아이디와 비밀번호로 로그인해 봐요.',
    icon: 'login',
  },
  loggedIn: {
    title: '로그아웃 연습',
    description: '컴퓨터를 다 썼으면 꼭 로그아웃 버튼을 눌러야 해요!',
    icon: 'logout',
  },
};

const EMAIL_DOMAIN = '@it2edu.co.kr';
const BANNED_ID_WORDS = ['asdf', 'qwer', 'test', 'user', 'admin'];
const BANNED_PASSWORD_WORDS = ['asdf', 'qwer', '1234', 'password'];

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

export function LoginPractice() {
  const navigate = useNavigate();
  const { user } = useUser();
  const savedAccount = useMemo(() => getLoginPracticeAccount(user?.id), [user?.id]);

  const [step, setStep] = useState<Step>('intro');
  const [account, setAccount] = useState<CreatedAccount | null>(null);
  const [existingAccountPromptVisible, setExistingAccountPromptVisible] = useState(false);
  const [existingAccountDecisionMade, setExistingAccountDecisionMade] = useState(false);

  // signup 폼
  const [signupId, setSignupId] = useState('');
  const [signupPw, setSignupPw] = useState('');
  const [signupPw2, setSignupPw2] = useState('');
  const [agree, setAgree] = useState(false);
  const [signupError, setSignupError] = useState<string | null>(null);

  // login 폼
  const [loginId, setLoginId] = useState('');
  const [loginPw, setLoginPw] = useState('');
  const [loginError, setLoginError] = useState<string | null>(null);
  const [shake, setShake] = useState(false);
  const [showLoginHint, setShowLoginHint] = useState(false);

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

  // ---------- 회원가입 ----------
  const validateSignup = (): string | null => {
    const id = normalizeId(signupId);
    const bannedIdWord = findBannedWord(id, BANNED_ID_WORDS);
    const bannedPasswordWord = findBannedWord(signupPw, BANNED_PASSWORD_WORDS);

    if (id.length < 6) return '아이디는 6자 이상이어야 해요. 예: star2026 처럼 조금 더 길게 만들어 보세요.';
    if (!/^[a-z0-9_]+$/i.test(id)) return '아이디는 영어, 숫자, 밑줄(_)만 사용할 수 있어요. 한글이나 특수기호는 빼고 다시 만들어 볼까요?';
    if (/^\d+$/.test(id)) return '아이디가 숫자만 있으면 다른 사람이 맞히기 쉬워요. 영어를 함께 넣어 보세요. 예: star2026';
    if (bannedIdWord) return `"${bannedIdWord}"는 너무 흔한 아이디라 사용할 수 없어요. 나만의 단어를 넣어 보세요. 예: happy_tiger`;
    if (signupPw.length < 8) return '비밀번호는 8자 이상이어야 해요. 좋아하는 단어에 숫자를 붙여 보세요. 예: Star2026';
    if (!/[a-zA-Z]/.test(signupPw) || !/[0-9]/.test(signupPw)) {
      return '비밀번호에는 영어와 숫자가 모두 들어가야 해요. 예: star2026 처럼 글자와 숫자를 함께 써 보세요.';
    }
    if (signupPw.toLowerCase() === id) return '비밀번호가 아이디와 같으면 다른 사람이 쉽게 맞힐 수 있어요. 아이디와 다른 비밀번호를 만들어 보세요.';
    if (bannedPasswordWord) return `"${bannedPasswordWord}"는 너무 쉬운 비밀번호라 사용할 수 없어요. 좋아하는 단어와 숫자를 섞어 보세요.`;
    if (signupPw !== signupPw2) return '비밀번호가 서로 달라요. 같게 적어 주세요.';
    if (!agree) return '약관에 동의해야 가입할 수 있어요.';
    return null;
  };

  const handleSignup = (e: FormEvent) => {
    e.preventDefault();
    const err = validateSignup();
    if (err) {
      setSignupError(err);
      playFail();
      setShake(true);
      window.setTimeout(() => setShake(false), 400);
      return;
    }
    setSignupError(null);
    playSuccess();
    const newAccount = { id: normalizeId(signupId), password: signupPw };
    setAccount(newAccount);
    saveLoginPracticeAccount(user?.id, {
      id: newAccount.id,
      email: getSchoolEmail(newAccount.id),
      password: newAccount.password,
      createdAt: new Date().toISOString(),
    });
    setLoginId('');
    setLoginPw('');
    setShowLoginHint(false);
    window.setTimeout(() => setStep('login'), 600);
  };

  // ---------- 로그인 ----------
  const handleLogin = (e: FormEvent) => {
    e.preventDefault();
    if (!account) return;
    const enteredId = normalizeId(loginId);
    if (enteredId === account.id && loginPw === account.password) {
      playSuccess();
      setLoginError(null);
      setStep('loggedIn');
    } else {
      playFail();
      setShake(true);
      window.setTimeout(() => setShake(false), 400);
      if (enteredId !== account.id) {
        setLoginError(`아이디가 달라요. 방금 만든 계정은 ${getSchoolEmail(account.id)}예요. 앞부분 아이디를 다시 확인해 보세요.`);
      } else {
        setLoginError('비밀번호가 달라요. 회원가입 때 직접 만든 비밀번호를 다시 천천히 입력해 보세요.');
      }
    }
  };

  // ---------- 로그아웃 ----------
  const handleLogout = () => {
    playSuccess();
    setStep('done');
  };

  const handleStart = () => {
    playClick();
    if (savedAccount && !existingAccountDecisionMade) {
      setExistingAccountPromptVisible(true);
      return;
    }
    setStep('signup');
  };

  const handleCreateNewAccount = () => {
    playClick();
    setExistingAccountDecisionMade(true);
    setExistingAccountPromptVisible(false);
    setAccount(null);
    setSignupId('');
    setSignupPw('');
    setSignupPw2('');
    setAgree(false);
    setSignupError(null);
    setLoginId('');
    setLoginPw('');
    setLoginError(null);
    setShowLoginHint(false);
    setStep('signup');
  };

  const handlePracticeWithExistingAccount = () => {
    if (!savedAccount) return;
    playClick();
    setExistingAccountDecisionMade(true);
    setExistingAccountPromptVisible(false);
    setAccount({ id: savedAccount.id, password: savedAccount.password });
    setLoginId(savedAccount.id);
    setLoginPw('');
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
    return score; // 0~4
  })();

  // Intro
  if (step === 'intro') {
    return (
      <div className="max-w-3xl w-full mx-auto flex flex-col gap-8 md:pt-12 items-center text-center">
        {existingAccountPromptVisible && savedAccount && (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-scrim/60 px-4"
            role="dialog"
            aria-modal="true"
            aria-labelledby="existing-login-account-title"
          >
            <div className="w-full max-w-lg rounded-2xl border-2 border-primary-fixed bg-surface-container-lowest p-6 text-left shadow-2xl">
              <div className="flex items-start gap-4">
                <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-primary-container text-on-primary-container">
                  <span className="material-symbols-outlined text-3xl" style={{ fontVariationSettings: "'FILL' 1" }}>
                    manage_accounts
                  </span>
                </div>
                <div>
                  <h2 id="existing-login-account-title" className="font-headline-md text-headline-md text-on-background">
                    이미 만든 계정이 있어요
                  </h2>
                  <p className="mt-2 font-body-lg text-body-lg text-on-surface-variant">
                    저장된 계정 <strong className="text-primary">{savedAccount.email}</strong>이 있어요. 새 계정을 다시 만들까요?
                  </p>
                </div>
              </div>

              <div className="mt-6 grid gap-3 sm:grid-cols-2">
                <button
                  type="button"
                  onClick={handleCreateNewAccount}
                  className="flex h-14 items-center justify-center gap-2 rounded-lg bg-primary font-label-bold text-label-bold text-on-primary shadow-[0_3px_0_rgb(0,78,118)] transition-all active:translate-y-[3px] active:shadow-none"
                >
                  <span className="material-symbols-outlined">person_add</span>
                  새 계정 만들기
                </button>
                <button
                  type="button"
                  onClick={handlePracticeWithExistingAccount}
                  className="flex h-14 items-center justify-center gap-2 rounded-lg border-2 border-primary bg-surface font-label-bold text-label-bold text-primary transition-colors hover:bg-primary-container"
                >
                  <span className="material-symbols-outlined">password</span>
                  비밀번호 연습하기
                </button>
              </div>
            </div>
          </div>
        )}

        <h1 className="font-display-lg text-display-lg text-primary">안전한 가입과 로그인 연습</h1>
        <p className="font-body-xl text-body-xl text-on-surface-variant max-w-2xl">
          이번에는 ① 학교 계정({EMAIL_DOMAIN})으로 회원가입을 직접 해 보고 ② 방금 만든 계정으로 로그인하고 ③ 다 쓴 뒤 로그아웃까지 차례대로 연습해 봐요!
        </p>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 w-full">
          <StepCard num={1} title="회원가입" body="아이디와 비밀번호를 만들어요." icon="app_registration" />
          <StepCard num={2} title="로그인" body="방금 만든 정보로 로그인해요." icon="login" />
          <StepCard num={3} title="로그아웃" body="다 쓰면 꼭 로그아웃!" icon="logout" />
        </div>
        <button
          type="button"
          onClick={handleStart}
          className="mt-4 px-10 py-4 bg-primary text-on-primary rounded-full font-headline-md text-headline-md shadow-[0_6px_0_rgb(0,78,118)] active:translate-y-1 active:shadow-none transition-all flex items-center gap-3"
        >
          <span className="material-symbols-outlined text-3xl">play_arrow</span>
          시작하기
        </button>
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
        <p className="font-body-xl text-body-xl text-on-surface-variant">
          이제 실제 Google 로그인 화면처럼 한 번 더 연습해 볼게요.
        </p>
      </div>
    );
  }

  const stepInfo = STEP_INFO[step];

  return (
    <div className="max-w-3xl mx-auto flex flex-col gap-8 w-full md:pt-12">
      {/* 진행 표시 */}
      <section className="text-center space-y-3">
        <h2 className="font-display-lg text-display-lg text-primary">{stepInfo.title}</h2>
        <div className="flex items-center justify-center gap-3">
          <p className="font-body-xl text-body-xl text-on-surface-variant max-w-2xl">{stepInfo.description}</p>
          <SpeakButton text={`${stepInfo.title}. ${stepInfo.description}`} />
        </div>

        <div className="flex justify-center gap-2 flex-wrap mt-4">
          {(['signup', 'login', 'loggedIn'] as const).map((s, i) => {
            const isCurrent = s === step;
            const isPast =
              (s === 'signup' && (step === 'login' || step === 'loggedIn')) ||
              (s === 'login' && step === 'loggedIn');
            return (
              <div
                key={s}
                className={`flex items-center gap-2 px-4 py-2 rounded-full font-label-bold text-sm transition-colors ${
                  isPast
                    ? 'bg-secondary text-on-secondary'
                    : isCurrent
                    ? 'bg-primary text-on-primary'
                    : 'bg-surface-container-high text-on-surface-variant'
                }`}
              >
                <span className="material-symbols-outlined text-base" style={{ fontVariationSettings: isPast ? "'FILL' 1" : "'FILL' 0" }}>
                  {isPast ? 'check_circle' : i === 0 ? 'app_registration' : i === 1 ? 'login' : 'logout'}
                </span>
                {i === 0 ? '회원가입' : i === 1 ? '로그인' : '로그아웃'}
              </div>
            );
          })}
        </div>
      </section>

      {/* 회원가입 폼 */}
      {step === 'signup' && (
        <form
          onSubmit={handleSignup}
          className={`bg-surface-container-lowest rounded-xl shadow-lg border-2 border-primary-fixed p-8 flex flex-col gap-6 relative overflow-hidden ${
            shake ? 'animate-[shake_0.4s_ease-in-out]' : ''
          }`}
          noValidate
        >
          <div className="absolute top-0 left-0 w-full h-4 bg-primary-container"></div>

          <div className="text-center space-y-2">
            <span className="material-symbols-outlined text-5xl text-primary" style={{ fontVariationSettings: "'FILL' 1" }}>
              app_registration
            </span>
            <h3 className="font-headline-md text-headline-md text-on-background">새 계정 만들기</h3>
            <p className="font-body-lg text-body-lg text-on-surface-variant text-sm">
              아이디 앞부분만 만들면 뒤에 <strong className="text-primary">{EMAIL_DOMAIN}</strong> 이 붙어서 학교 계정이 돼요.
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

            <div className="space-y-2">
              <label htmlFor="signup_pw" className="font-label-bold text-label-bold text-on-surface">비밀번호 (8자 이상, 영어+숫자)</label>
              <input
                type="password"
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
                  <li>좋아하는 단어를 하나 고르세요. 예: <code className="bg-surface-container-lowest px-1 rounded">star</code></li>
                  <li>숫자를 붙여 보세요. 예: <code className="bg-surface-container-lowest px-1 rounded">star2026</code></li>
                  <li>대문자를 하나 섞어 보세요. 예: <code className="bg-surface-container-lowest px-1 rounded">Star2026</code></li>
                </ol>
                <p className="mt-2">아이디와 똑같이 만들거나 `asdf`, `qwer`, `1234`, `password`는 쓰지 않아요.</p>
              </div>
              {/* 비밀번호 강도 게이지 */}
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
              <label htmlFor="signup_pw2" className="font-label-bold text-label-bold text-on-surface">비밀번호 확인</label>
              <input
                type="password"
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

            <label className="flex items-center gap-3 cursor-pointer p-3 rounded-lg hover:bg-surface-container-low">
              <input
                type="checkbox"
                checked={agree}
                onChange={(e) => {
                  setAgree(e.target.checked);
                  setSignupError(null);
                }}
                className="w-5 h-5 accent-primary"
                aria-label="약관 동의"
              />
              <span className="font-body-lg text-body-lg text-on-surface text-sm">
                이용약관과 개인정보 보호에 동의해요. (실제로 보내지 않아요)
              </span>
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
              <span className="material-symbols-outlined">person_add</span>
              가입하기
            </button>
          </div>
        </form>
      )}

      {/* 로그인 폼 */}
      {step === 'login' && account && (
        <form
          onSubmit={handleLogin}
          className={`bg-surface-container-lowest rounded-xl shadow-lg border-2 border-primary-fixed p-8 flex flex-col gap-6 relative overflow-hidden ${
            shake ? 'animate-[shake_0.4s_ease-in-out]' : ''
          }`}
          noValidate
        >
          <div className="absolute top-0 left-0 w-full h-4 bg-primary-container"></div>

          <div className="text-center space-y-2">
            <span className="material-symbols-outlined text-5xl text-primary" style={{ fontVariationSettings: "'FILL' 1" }}>shield_lock</span>
            <h3 className="font-headline-md text-headline-md text-on-background">방금 만든 계정으로 로그인</h3>
          </div>

          <div className="bg-secondary-container/50 text-on-secondary-container rounded-lg p-4 text-center">
            <p className="font-label-bold text-label-bold text-sm mb-2">방금 만든 계정 정보예요</p>
            <p className="font-body-lg text-body-lg">
              계정:{' '}
              <code className="bg-surface-container-lowest px-2 py-1 rounded font-mono">
                {showLoginHint ? getSchoolEmail(account.id) : `${'•'.repeat(account.id.length)}${EMAIL_DOMAIN}`}
              </code>
            </p>
            <p className="font-body-lg text-body-lg mt-1">
              비밀번호: <code className="bg-surface-container-lowest px-2 py-1 rounded font-mono">{'•'.repeat(account.password.length)}</code>
            </p>
            <p className="text-xs text-on-surface-variant mt-2">
              아이디와 비밀번호는 먼저 가려져 있어요. 막히면 힌트를 눌러 확인해요.
            </p>
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

          <LoginAccountEvaluation account={account} />

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
              <p className="text-xs text-on-surface-variant">
                앞부분만 입력해도 되고, 전체 계정을 붙여 넣어도 괜찮아요. 막히면 위의 힌트를 눌러요.
              </p>
            </div>

            <div className="space-y-2">
              <label htmlFor="login_pw" className="font-label-bold text-label-bold text-on-surface">비밀번호</label>
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
                if (confirm('비밀번호를 잊어버리셨나요? 회원가입을 다시 해 봐요.')) {
                  playClick();
                  setStep('signup');
                  setSignupId('');
                  setSignupPw('');
                  setSignupPw2('');
                  setAgree(false);
                  setAccount(null);
                  setShowLoginHint(false);
                }
              }}
              className="w-full text-sm text-primary hover:underline font-label-bold"
            >
              비밀번호 잊어버렸어요 → 회원가입 다시 하기
            </button>
          </div>
        </form>
      )}

      {/* 로그인 됨 → 로그아웃 */}
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
            <p className="font-body-lg text-body-lg text-sm">
              학교나 도서관 컴퓨터를 그대로 두면 다른 사람이 내 정보를 볼 수 있어요!
            </p>
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

interface StepCardProps {
  num: number;
  title: string;
  body: string;
  icon: string;
}

function StepCard({ num, title, body, icon }: StepCardProps) {
  return (
    <div className="bg-surface-container-lowest rounded-2xl p-6 border-b-4 border-primary-fixed-dim shadow-sm flex flex-col items-center gap-3 text-center">
      <div className="w-14 h-14 rounded-full bg-primary-container text-on-primary-container flex items-center justify-center">
        <span className="material-symbols-outlined text-3xl" style={{ fontVariationSettings: "'FILL' 1" }}>{icon}</span>
      </div>
      <span className="text-sm font-label-bold text-primary">STEP {num}</span>
      <h3 className="font-headline-md text-headline-md text-on-background">{title}</h3>
      <p className="font-body-lg text-body-lg text-on-surface-variant text-sm">{body}</p>
    </div>
  );
}

function LoginAccountEvaluation({ account }: { account: CreatedAccount }) {
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
          <p className="font-label-bold text-label-bold">회원가입 평가</p>
          <p className="text-sm">방금 만든 계정으로 로그인 평가를 시작해요. ({score}/{passedItems.length})</p>
        </div>
      </div>
      <div className="grid grid-cols-1 gap-2">
        {passedItems.map((item) => (
          <div key={item.label} className="flex items-center gap-2 text-sm font-label-bold">
            <span className={`material-symbols-outlined text-base ${item.pass ? 'text-secondary' : 'text-error'}`}>
              {item.pass ? 'check_circle' : 'cancel'}
            </span>
            {item.label}
          </div>
        ))}
      </div>
    </div>
  );
}
