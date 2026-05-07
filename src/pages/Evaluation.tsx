import {
  DragEvent as ReactDragEvent,
  KeyboardEvent as ReactKeyboardEvent,
  MouseEvent as ReactMouseEvent,
  useEffect,
  useRef,
  useState,
} from 'react';
import { playClick, playFail, playFanfare, playSuccess } from '@/lib/sound';
import { formatDuration } from '@/lib/evaluation';
import {
  DesktopIconTile,
  DesktopTaskChip,
  DesktopTaskbarAppButton,
  DesktopWindow,
  VirtualDesktopFrame,
} from '@/components/VirtualDesktop';
import { cn } from '@/lib/utils';
import { useUser } from '@/context/UserContext';
import { getLoginPracticeAccount } from '@/lib/loginPracticeAccount';

type EvalMode = 'keyboard' | 'desktop';

const KEY_QUESTIONS: Array<{
  label: string;
  key: string;
  display: string;
  prompt?: string;
  ctrl?: boolean;
  shift?: boolean;
}> = [
  { label: 'Enter(엔터) 키', key: 'Enter', display: 'Enter' },
  { label: 'Space(스페이스) 키', key: ' ', display: 'Space' },
  { label: 'Backspace(백스페이스) 키', key: 'Backspace', display: 'Backspace' },
  { label: 'CapsLock(캡스락) 키', key: 'CapsLock', display: 'CapsLock' },
  { label: 'Tab(탭) 키', key: 'Tab', display: 'Tab' },
  { label: 'Shift(쉬프트) 키', key: 'Shift', display: 'Shift' },
  { label: 'Ctrl(컨트롤) 키', key: 'Control', display: 'Ctrl' },
  { label: 'Alt(알트) 키', key: 'Alt', display: 'Alt' },
  { label: 'A(에이) 키', key: 'a', display: 'A' },
  { label: '숫자 1(일) 키', key: '1', display: '1' },
  { label: '오른쪽 방향키', key: 'ArrowRight', display: '→' },
  { label: '왼쪽 방향키', key: 'ArrowLeft', display: '←' },
  { label: 'Ctrl + C(컨트롤 씨)', key: 'c', ctrl: true, display: 'Ctrl+C' },
  { label: 'Ctrl + V(컨트롤 브이)', key: 'v', ctrl: true, display: 'Ctrl+V' },
  { label: '물음표(?)', key: '?', shift: true, display: '?', prompt: '물음표(?)를 써보세요' },
];

function isExpectedModifierPrelude(
  question: { key: string; ctrl?: boolean; shift?: boolean },
  e: KeyboardEvent,
): boolean {
  if (question.ctrl && question.key !== 'Control' && (e.key === 'Control' || e.code.startsWith('Control'))) return true;
  if (question.shift && question.key !== 'Shift' && (e.key === 'Shift' || e.code.startsWith('Shift'))) return true;
  return false;
}

export function Evaluation() {
  const [mode, setMode] = useState<EvalMode>('keyboard');
  const [completed, setCompleted] = useState<Record<EvalMode, boolean>>({
    keyboard: false,
    desktop: false,
  });
  const startedAtRef = useRef(Date.now());

  const allDone = Object.values(completed).every(Boolean);
  const elapsed = Date.now() - startedAtRef.current;

  return (
    <div className="w-full max-w-6xl mx-auto flex flex-col gap-8 md:pt-10">
      <section className="bg-surface-container-lowest rounded-xl p-8 border-2 border-primary-fixed shadow-sm text-center">
        <h1 className="font-display-lg text-display-lg text-primary">퀴즈 평가</h1>
        <p className="font-body-xl text-body-xl text-on-surface-variant mt-3">
          키보드와 가상 바탕화면에서 인터넷, Google 로그인/로그아웃을 실제처럼 평가해요.
        </p>
        {allDone && (
          <div className="mt-4 inline-flex items-center gap-2 bg-secondary-container text-on-secondary-container px-6 py-3 rounded-full font-label-bold text-label-bold">
            <span className="material-symbols-outlined">timer</span>
            전체 평가 시간: {formatDuration(elapsed)}
          </div>
        )}
      </section>

      <nav className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <EvalTab active={mode === 'keyboard'} done={completed.keyboard} label="키보드 15문제" icon="keyboard" onClick={() => setMode('keyboard')} />
        <EvalTab active={mode === 'desktop'} done={completed.desktop} label="가상 바탕화면 실기" icon="desktop_windows" onClick={() => setMode('desktop')} />
      </nav>

      {mode === 'keyboard' && <KeyboardQuiz onDone={() => setCompleted((prev) => ({ ...prev, keyboard: true }))} />}
      {mode === 'desktop' && <DesktopInternetQuiz onDone={() => setCompleted((prev) => ({ ...prev, desktop: true }))} />}
    </div>
  );
}

function EvalTab({ active, done, label, icon, onClick }: { active: boolean; done: boolean; label: string; icon: string; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={() => {
        playClick();
        onClick();
      }}
      className={`rounded-2xl p-5 border-2 font-label-bold text-label-bold flex items-center justify-center gap-3 transition-all ${
        active ? 'bg-primary text-on-primary border-primary' : done ? 'bg-secondary-container text-on-secondary-container border-secondary' : 'bg-surface-container-lowest border-surface-container-highest text-on-surface'
      }`}
    >
      <span className="material-symbols-outlined" style={{ fontVariationSettings: done ? "'FILL' 1" : "'FILL' 0" }}>
        {done ? 'check_circle' : icon}
      </span>
      {label}
    </button>
  );
}

function KeyboardQuiz({ onDone }: { onDone: () => void }) {
  const [idx, setIdx] = useState(0);
  const [score, setScore] = useState(0);
  const [message, setMessage] = useState('문제에 맞는 키를 눌러보세요.');
  const doneRef = useRef(false);
  const startedAtRef = useRef(Date.now());
  const q = KEY_QUESTIONS[idx];

  useEffect(() => {
    if (doneRef.current) return;
    const handler = (e: KeyboardEvent) => {
      const ctrlOk = q.ctrl ? e.ctrlKey : true;
      const shiftOk = q.shift ? e.shiftKey : true;
      const keyOk = q.key.length === 1 ? e.key.toLowerCase() === q.key.toLowerCase() : e.key === q.key;
      if (ctrlOk && shiftOk && keyOk) {
        e.preventDefault();
        playSuccess();
        setScore((s) => s + 1);
        if (idx + 1 >= KEY_QUESTIONS.length) {
          doneRef.current = true;
          setMessage(`완료! ${formatDuration(Date.now() - startedAtRef.current)} 동안 15문제를 풀었어요.`);
          playFanfare();
          onDone();
        } else {
          setIdx((i) => i + 1);
          setMessage('정답이에요! 다음 문제로 갑니다.');
        }
      } else if (isExpectedModifierPrelude(q, e)) {
        e.preventDefault();
      } else if (e.key.length === 1 || ['Enter', 'Backspace', 'Tab', ' ', 'Shift', 'Control', 'Alt', 'CapsLock'].includes(e.key)) {
        playFail();
        setMessage('아직 아니에요. 문제에 나온 키를 다시 찾아보세요.');
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [idx, q, onDone]);

  return (
    <section className="bg-surface-container-lowest rounded-xl p-8 border-2 border-primary-fixed text-center">
      <p className="font-label-bold text-label-bold text-primary">키보드 평가 {Math.min(idx + 1, KEY_QUESTIONS.length)} / {KEY_QUESTIONS.length}</p>
      <h2 className="font-display-lg text-display-lg text-on-surface mt-3">{q.prompt ?? `${q.label}를 눌러보세요`}</h2>
      <div className="mt-6 inline-flex min-w-48 items-center justify-center rounded-2xl bg-primary-container text-on-primary-container px-8 py-6 font-display-lg text-display-lg shadow-[0_6px_0_rgba(0,78,118,0.35)]">
        {q.display}
      </div>
      <p className="mt-6 font-body-xl text-body-xl text-on-surface-variant">{message}</p>
      <p className="mt-2 text-sm text-on-surface-variant">점수: {score} / {KEY_QUESTIONS.length}</p>
    </section>
  );
}

type DesktopEvalTaskId =
  | 'browserOpen'
  | 'address'
  | 'googleLogin'
  | 'googleLogout'
  | 'search'
  | 'back'
  | 'forward'
  | 'refresh'
  | 'home'
  | 'newtab'
  | 'closetab'
  | 'minimize'
  | 'maximize'
  | 'windowClose'
  | 'folderOpen'
  | 'fileMoved'
  | 'multiSelected';

const DESKTOP_EVAL_TASKS: Array<{ id: DesktopEvalTaskId; label: string; icon: string }> = [
  { id: 'browserOpen', label: '인터넷 더블클릭', icon: 'public' },
  { id: 'address', label: 'google.com 열기', icon: 'travel_explore' },
  { id: 'googleLogin', label: 'Google 로그인', icon: 'login' },
  { id: 'googleLogout', label: 'Google 로그아웃', icon: 'logout' },
  { id: 'search', label: '검색어 검색', icon: 'search' },
  { id: 'back', label: '뒤로가기', icon: 'arrow_back' },
  { id: 'forward', label: '앞으로가기', icon: 'arrow_forward' },
  { id: 'refresh', label: '새로고침', icon: 'refresh' },
  { id: 'home', label: '홈 버튼', icon: 'home' },
  { id: 'newtab', label: '새 탭 열기', icon: 'add' },
  { id: 'closetab', label: '탭 닫기', icon: 'close' },
  { id: 'minimize', label: '창 최소화', icon: 'remove' },
  { id: 'maximize', label: '창 최대화', icon: 'crop_square' },
  { id: 'windowClose', label: '브라우저 창 닫기', icon: 'disabled_by_default' },
  { id: 'folderOpen', label: '자료 폴더 열기', icon: 'folder_open' },
  { id: 'fileMoved', label: '보고서 파일을 폴더 안에 넣기', icon: 'drive_file_move' },
  { id: 'multiSelected', label: '드래그로 사진 여러 개 선택', icon: 'select_all' },
];

interface EvalSitePage {
  domain: string;
  title: string;
  icon: string;
  body: string;
}

const EVAL_HOME_PAGE: EvalSitePage = {
  domain: 'home',
  title: '인터넷 시작',
  icon: 'home',
  body: '주소창에 google.com을 입력해 보세요.',
};

const EVAL_SITES: Record<string, EvalSitePage> = {
  'google.com': {
    domain: 'google.com',
    title: 'Google',
    icon: 'search',
    body: '검색창에 궁금한 단어를 입력해 보세요.',
  },
  'naver.com': {
    domain: 'naver.com',
    title: 'NAVER',
    icon: 'travel_explore',
    body: '초록 검색창에서 정보를 찾아볼 수 있어요.',
  },
  'youtube.com': {
    domain: 'youtube.com',
    title: 'YouTube',
    icon: 'play_circle',
    body: '동영상을 검색해서 찾아볼 수 있어요.',
  },
};

interface EvalBrowserTab {
  id: number;
  history: EvalSitePage[];
  index: number;
}

interface SelectionDrag {
  startX: number;
  startY: number;
  currentX: number;
  currentY: number;
}

function createEvalTab(id: number): EvalBrowserTab {
  return { id, history: [EVAL_HOME_PAGE], index: 0 };
}

function normalizeEvalDomain(input: string): string {
  return input.trim().toLowerCase().replace(/^https?:\/\//, '').replace(/^www\./, '').replace(/\/.*$/, '');
}

function rectsIntersect(a: DOMRect | { left: number; top: number; right: number; bottom: number }, b: DOMRect): boolean {
  return a.left < b.right && a.right > b.left && a.top < b.bottom && a.bottom > b.top;
}

function DesktopInternetQuiz({ onDone }: { onDone: () => void }) {
  const { user } = useUser();
  const [completed, setCompleted] = useState<Record<DesktopEvalTaskId, boolean>>({
    browserOpen: false,
    address: false,
    googleLogin: false,
    googleLogout: false,
    search: false,
    back: false,
    forward: false,
    refresh: false,
    home: false,
    newtab: false,
    closetab: false,
    minimize: false,
    maximize: false,
    windowClose: false,
    folderOpen: false,
    fileMoved: false,
    multiSelected: false,
  });
  const [tabs, setTabs] = useState<EvalBrowserTab[]>([createEvalTab(1)]);
  const [activeTabId, setActiveTabId] = useState(1);
  const [address, setAddress] = useState('');
  const [searchInput, setSearchInput] = useState('');
  const [searchResult, setSearchResult] = useState<string | null>(null);
  const [browserMinimized, setBrowserMinimized] = useState(false);
  const [browserMaximized, setBrowserMaximized] = useState(false);
  const [browserClosed, setBrowserClosed] = useState(false);
  const [browserClosedNoticeVisible, setBrowserClosedNoticeVisible] = useState(false);
  const [googleAuthStep, setGoogleAuthStep] = useState<'home' | 'email' | 'password'>('home');
  const [googleEmail, setGoogleEmail] = useState('');
  const [googlePassword, setGooglePassword] = useState('');
  const [googleAuthError, setGoogleAuthError] = useState<string | null>(null);
  const [googleLoggedIn, setGoogleLoggedIn] = useState(false);
  const [googleAccountMenuOpen, setGoogleAccountMenuOpen] = useState(false);
  const [selectionDrag, setSelectionDrag] = useState<SelectionDrag | null>(null);
  const tabSeqRef = useRef(2);
  const doneRef = useRef(false);
  const selectionAreaRef = useRef<HTMLDivElement | null>(null);
  const photoOneRef = useRef<HTMLDivElement | null>(null);
  const photoTwoRef = useRef<HTMLDivElement | null>(null);

  const practiceAccount = getLoginPracticeAccount(user?.id);
  const googleEvalEmail = practiceAccount?.email ?? '';
  const googleEvalPassword = practiceAccount?.password ?? '';
  const browserOpen = completed.browserOpen;
  const folderOpen = completed.folderOpen;
  const fileMoved = completed.fileMoved;
  const multiSelected = completed.multiSelected;
  const done = DESKTOP_EVAL_TASKS.every((task) => completed[task.id]);
  const currentTask = DESKTOP_EVAL_TASKS.find((task) => !completed[task.id]);
  const activeTab = tabs.find((tab) => tab.id === activeTabId) ?? tabs[0];
  const currentPage = activeTab.history[activeTab.index];
  const canGoBack = activeTab.index > 0;
  const canGoForward = activeTab.index < activeTab.history.length - 1;

  useEffect(() => {
    if (done && !doneRef.current) {
      doneRef.current = true;
      playFanfare();
      onDone();
    }
  }, [done, onDone]);

  const completeTask = (id: DesktopEvalTaskId) => {
    setCompleted((prev) => (prev[id] ? prev : { ...prev, [id]: true }));
  };

  const updateActiveTab = (updater: (tab: EvalBrowserTab) => EvalBrowserTab) => {
    setTabs((prev) => prev.map((tab) => (tab.id === activeTabId ? updater(tab) : tab)));
  };

  const navigateTo = (page: EvalSitePage) => {
    updateActiveTab((tab) => {
      const nextHistory = tab.history.slice(0, tab.index + 1);
      nextHistory.push(page);
      return { ...tab, history: nextHistory, index: nextHistory.length - 1 };
    });
    setSearchInput('');
    setSearchResult(null);
  };

  const handleOpenBrowser = () => {
    playSuccess();
    setBrowserClosed(false);
    setBrowserClosedNoticeVisible(false);
    setBrowserMinimized(false);
    completeTask('browserOpen');
  };

  const handleAddressSubmit = () => {
    const normalized = normalizeEvalDomain(address);
    const site = EVAL_SITES[normalized];
    if (!site) {
      playFail();
      return;
    }
    playSuccess();
    navigateTo(site);
    completeTask('address');
    setAddress('');
  };

  const handleStartGoogleLogin = () => {
    if (!practiceAccount) {
      playFail();
      setGoogleAuthStep('email');
      setGoogleAuthError('먼저 로그인/로그아웃 연습에서 계정을 만들어 주세요.');
      setGoogleAccountMenuOpen(false);
      return;
    }
    playClick();
    setGoogleAuthStep('email');
    setGoogleAuthError(null);
    setGoogleAccountMenuOpen(false);
  };

  const handleGoogleEmailNext = () => {
    if (!practiceAccount) {
      playFail();
      setGoogleAuthError('먼저 로그인/로그아웃 연습에서 계정을 만들어 주세요.');
      return;
    }
    const normalized = googleEmail.trim().toLowerCase();
    if (normalized !== googleEvalEmail.toLowerCase() && normalized !== practiceAccount.id) {
      playFail();
      setGoogleAuthError(`아이디는 로그인 연습에서 만든 ${googleEvalEmail} 를 입력해 보세요.`);
      return;
    }
    playSuccess();
    setGoogleEmail(googleEvalEmail);
    setGoogleAuthError(null);
    setGoogleAuthStep('password');
  };

  const handleGooglePasswordSubmit = () => {
    if (!practiceAccount) {
      playFail();
      setGoogleAuthError('먼저 로그인/로그아웃 연습에서 계정을 만들어 주세요.');
      return;
    }
    if (googlePassword !== googleEvalPassword) {
      playFail();
      setGoogleAuthError('비밀번호가 로그인 연습에서 만든 것과 달라요. 대문자도 확인해 주세요.');
      return;
    }
    playSuccess();
    setGoogleLoggedIn(true);
    setGooglePassword('');
    setGoogleAuthError(null);
    setGoogleAuthStep('home');
    completeTask('googleLogin');
  };

  const handleGoogleAccountMenu = () => {
    if (!googleLoggedIn) {
      playFail();
      return;
    }
    playClick();
    setGoogleAccountMenuOpen((value) => !value);
  };

  const handleGoogleLogout = () => {
    if (!googleLoggedIn) {
      playFail();
      return;
    }
    playSuccess();
    setGoogleLoggedIn(false);
    setGoogleAccountMenuOpen(false);
    completeTask('googleLogout');
  };

  const handleSearch = () => {
    const keyword = searchInput.trim();
    if (!keyword || currentPage.domain === 'home') {
      playFail();
      return;
    }
    playSuccess();
    setSearchResult(`"${keyword}" 검색 결과를 찾았어요.`);
    completeTask('search');
  };

  const handleBack = () => {
    if (!canGoBack) {
      playFail();
      return;
    }
    playClick();
    updateActiveTab((tab) => ({ ...tab, index: tab.index - 1 }));
    setSearchResult(null);
    completeTask('back');
  };

  const handleForward = () => {
    if (!canGoForward) {
      playFail();
      return;
    }
    playClick();
    updateActiveTab((tab) => ({ ...tab, index: tab.index + 1 }));
    setSearchResult(null);
    completeTask('forward');
  };

  const handleRefresh = () => {
    playClick();
    setSearchResult(null);
    completeTask('refresh');
  };

  const handleHome = () => {
    playClick();
    if (currentPage.domain !== 'home') navigateTo(EVAL_HOME_PAGE);
    completeTask('home');
  };

  const handleNewTab = () => {
    playClick();
    const id = tabSeqRef.current++;
    setTabs((prev) => [...prev, createEvalTab(id)]);
    setActiveTabId(id);
    setSearchResult(null);
    completeTask('newtab');
  };

  const handleCloseTab = (id: number) => {
    if (tabs.length <= 1) {
      playFail();
      return;
    }
    playClick();
    setTabs((prev) => {
      const next = prev.filter((tab) => tab.id !== id);
      if (activeTabId === id) setActiveTabId(next[0].id);
      return next;
    });
    completeTask('closetab');
  };

  const handleMinimizeBrowser = () => {
    playClick();
    setBrowserMinimized(true);
    completeTask('minimize');
  };

  const handleRestoreBrowser = () => {
    playClick();
    setBrowserMinimized(false);
  };

  const handleMaximizeBrowser = () => {
    playClick();
    setBrowserMaximized((value) => !value);
    completeTask('maximize');
  };

  const handleCloseBrowser = () => {
    playClick();
    setBrowserClosed(true);
    setBrowserClosedNoticeVisible(true);
    setBrowserMinimized(false);
    completeTask('windowClose');
  };

  const handleFolderOpen = () => {
    playSuccess();
    completeTask('folderOpen');
  };

  const handleReportDrop = (e: ReactDragEvent<HTMLDivElement>) => {
    e.preventDefault();
    if (e.dataTransfer.getData('text/plain') !== 'report') return;
    if (!folderOpen) {
      playFail();
      return;
    }
    playSuccess();
    completeTask('fileMoved');
  };

  const getSelectionPoint = (e: ReactMouseEvent<HTMLDivElement>) => {
    const rect = selectionAreaRef.current?.getBoundingClientRect();
    if (!rect) return null;
    return { x: e.clientX - rect.left, y: e.clientY - rect.top };
  };

  const handleSelectionMouseDown = (e: ReactMouseEvent<HTMLDivElement>) => {
    if (multiSelected) return;
    const point = getSelectionPoint(e);
    if (!point) return;
    e.preventDefault();
    setSelectionDrag({ startX: point.x, startY: point.y, currentX: point.x, currentY: point.y });
  };

  const handleSelectionMouseMove = (e: ReactMouseEvent<HTMLDivElement>) => {
    if (!selectionDrag) return;
    const point = getSelectionPoint(e);
    if (!point) return;
    setSelectionDrag((prev) => (prev ? { ...prev, currentX: point.x, currentY: point.y } : prev));
  };

  const handleSelectionMouseUp = (e: ReactMouseEvent<HTMLDivElement>) => {
    if (!selectionDrag) return;
    const baseRect = selectionAreaRef.current?.getBoundingClientRect();
    const photoOne = photoOneRef.current?.getBoundingClientRect();
    const photoTwo = photoTwoRef.current?.getBoundingClientRect();
    if (!baseRect || !photoOne || !photoTwo) {
      setSelectionDrag(null);
      return;
    }

    const point = getSelectionPoint(e) ?? { x: selectionDrag.currentX, y: selectionDrag.currentY };
    const localRect = {
      left: Math.min(selectionDrag.startX, point.x),
      top: Math.min(selectionDrag.startY, point.y),
      right: Math.max(selectionDrag.startX, point.x),
      bottom: Math.max(selectionDrag.startY, point.y),
    };
    const selectionRect = {
      left: baseRect.left + localRect.left,
      top: baseRect.top + localRect.top,
      right: baseRect.left + localRect.right,
      bottom: baseRect.top + localRect.bottom,
    };
    const enoughDrag = localRect.right - localRect.left > 48 && localRect.bottom - localRect.top > 48;
    const selectedBoth = enoughDrag && rectsIntersect(selectionRect, photoOne) && rectsIntersect(selectionRect, photoTwo);
    setSelectionDrag(null);

    if (selectedBoth) {
      playSuccess();
      completeTask('multiSelected');
    } else {
      playFail();
    }
  };

  const selectionStyle = selectionDrag
    ? {
        left: Math.min(selectionDrag.startX, selectionDrag.currentX),
        top: Math.min(selectionDrag.startY, selectionDrag.currentY),
        width: Math.abs(selectionDrag.currentX - selectionDrag.startX),
        height: Math.abs(selectionDrag.currentY - selectionDrag.startY),
      }
    : undefined;

  return (
    <section className="bg-surface-container-lowest rounded-xl p-8 border-2 border-primary-fixed">
      <h2 className="font-headline-md text-headline-md text-primary text-center mb-4">가상 바탕화면 평가</h2>
      <div className="mb-5 rounded-2xl bg-primary-container/60 text-on-primary-container px-5 py-4 text-center font-label-bold">
        {done ? '마우스와 인터넷 평가를 모두 완료했어요.' : `현재 평가: ${currentTask?.label}`}
      </div>

      <div className="mb-5 flex flex-wrap justify-center gap-2 rounded-2xl bg-[#071827]/85 px-4 py-3 text-white shadow-inner">
        <DesktopTaskChip icon="public" label="인터넷" done={completed.browserOpen} />
        <DesktopTaskChip icon="travel_explore" label="주소" done={completed.address} />
        <DesktopTaskChip icon="login" label="로그인" done={completed.googleLogin} />
        <DesktopTaskChip icon="logout" label="로그아웃" done={completed.googleLogout} />
        <DesktopTaskChip icon="search" label="검색" done={completed.search} />
        <DesktopTaskChip icon="tab" label="탭" done={completed.newtab && completed.closetab} />
        <DesktopTaskChip icon="select_window" label="창" done={completed.minimize && completed.maximize && completed.windowClose} />
        <DesktopTaskChip icon="folder_open" label="폴더" done={completed.folderOpen} />
        <DesktopTaskChip icon="drive_file_move" label="파일" done={completed.fileMoved} />
        <DesktopTaskChip icon="select_all" label="선택" done={completed.multiSelected} />
      </div>

      <VirtualDesktopFrame
        title="평가 데스크톱"
        status={done ? '평가 완료' : '실기 평가 진행 중'}
        contentClassName="min-h-[980px]"
        taskbarItems={
          browserOpen && !browserClosed ? (
            <DesktopTaskbarAppButton
              icon="public"
              label="가상 브라우저"
              active={!browserMinimized}
              minimized={browserMinimized}
              onClick={handleRestoreBrowser}
            />
          ) : null
        }
      >
        <div className="relative min-h-[880px]">
          <div className="grid max-w-[520px] grid-cols-2 gap-5 sm:grid-cols-3">
            <DesktopIconTile
              icon="public"
              label="인터넷"
              done={browserOpen}
              hint="더블클릭해서 열기"
              onDoubleClick={handleOpenBrowser}
            />
            <DesktopIconTile
              icon={folderOpen ? 'folder_open' : 'folder'}
              label="자료 폴더"
              done={folderOpen}
              hint="더블클릭해서 열기"
              onDoubleClick={handleFolderOpen}
              onDragOver={(e) => e.preventDefault()}
              onDrop={handleReportDrop}
            />
            {!fileMoved ? (
              <DesktopIconTile
                icon="description"
                label="보고서 파일"
                draggable
                hint="자료 폴더 안으로 끌기"
                onDragStart={(e) => e.dataTransfer.setData('text/plain', 'report')}
              />
            ) : (
              <DesktopIconTile icon="task_alt" label="폴더 안에 있음" done />
            )}
          </div>

          {browserOpen && !browserClosed && !browserMinimized && (
            <EvalBrowserWindow
              tabs={tabs}
              activeTabId={activeTabId}
              currentPage={currentPage}
              address={address}
              searchInput={searchInput}
              searchResult={searchResult}
              currentTaskId={currentTask?.id}
              googleAuthStep={googleAuthStep}
              googleEmail={googleEmail}
              googlePassword={googlePassword}
              googleAuthError={googleAuthError}
              googleLoggedIn={googleLoggedIn}
              googleAccountMenuOpen={googleAccountMenuOpen}
              googleEvalEmail={googleEvalEmail}
              googleEvalPassword={googleEvalPassword}
              maximized={browserMaximized}
              canGoBack={canGoBack}
              canGoForward={canGoForward}
              onSelectTab={(id) => {
                playClick();
                setActiveTabId(id);
              }}
              onCloseTab={handleCloseTab}
              onNewTab={handleNewTab}
              onBack={handleBack}
              onForward={handleForward}
              onRefresh={handleRefresh}
              onHome={handleHome}
              onMinimize={handleMinimizeBrowser}
              onMaximize={handleMaximizeBrowser}
              onClose={handleCloseBrowser}
              onAddressChange={setAddress}
              onAddressSubmit={handleAddressSubmit}
              onSearchInput={setSearchInput}
              onSearch={handleSearch}
              onStartGoogleLogin={handleStartGoogleLogin}
              onGoogleEmailChange={(value) => {
                setGoogleEmail(value);
                setGoogleAuthError(null);
              }}
              onGooglePasswordChange={(value) => {
                setGooglePassword(value);
                setGoogleAuthError(null);
              }}
              onGoogleEmailNext={handleGoogleEmailNext}
              onGooglePasswordSubmit={handleGooglePasswordSubmit}
              onGoogleAccountMenu={handleGoogleAccountMenu}
              onGoogleLogout={handleGoogleLogout}
            />
          )}

          {browserOpen && browserClosed && browserClosedNoticeVisible && (
            <button
              type="button"
              onClick={() => {
                playClick();
                setBrowserClosedNoticeVisible(false);
              }}
              className="mt-6 rounded-2xl bg-on-surface/75 px-5 py-4 text-center font-label-bold text-inverse-on-surface shadow-xl backdrop-blur transition-transform hover:scale-[1.02] active:scale-95 md:absolute md:left-[260px] md:top-6 md:mt-0 md:max-w-sm"
            >
              브라우저 창을 닫았어요. 필요하면 인터넷 아이콘을 다시 더블클릭해 열 수 있어요.
              <span className="mt-2 block text-sm text-inverse-on-surface/80">클릭하면 안내가 사라져요.</span>
            </button>
          )}

          {folderOpen && (
            <DesktopWindow
              title="자료 폴더"
              icon="folder_open"
              className="mt-6 md:absolute md:left-6 md:bottom-6 md:mt-0 md:w-[360px]"
            >
              <div
                onDragOver={(e) => e.preventDefault()}
                onDrop={handleReportDrop}
                className={`rounded-2xl border-2 border-dashed p-5 text-center transition-colors ${
                  fileMoved
                    ? 'border-secondary bg-secondary-container text-on-secondary-container'
                    : 'border-primary-fixed bg-primary-container/30 text-on-surface'
                }`}
              >
                <span className="material-symbols-outlined text-5xl" style={{ fontVariationSettings: "'FILL' 1" }}>
                  {fileMoved ? 'description' : 'drive_file_move'}
                </span>
                <p className="mt-2 font-label-bold text-label-bold">
                  {fileMoved ? '보고서 파일이 자료 폴더 안에 들어왔어요.' : '보고서 파일을 이 폴더 안으로 끌어오세요.'}
                </p>
              </div>
            </DesktopWindow>
          )}

          <div
            ref={selectionAreaRef}
            onMouseDown={handleSelectionMouseDown}
            onMouseMove={handleSelectionMouseMove}
            onMouseUp={handleSelectionMouseUp}
            className={cn(
              'relative mt-6 min-h-60 overflow-hidden rounded-[1.75rem] border-2 border-dashed p-5 shadow-[0_18px_36px_rgba(0,0,0,0.16)] backdrop-blur-md md:absolute md:bottom-6 md:right-6 md:mt-0 md:w-[360px]',
              multiSelected ? 'border-secondary bg-secondary-container/95' : 'border-white/70 bg-white/16',
            )}
          >
            <p className={cn('mb-4 text-center font-label-bold', multiSelected ? 'text-on-secondary-container' : 'text-white')}>
              {multiSelected ? '사진 1과 사진 2를 함께 선택했어요.' : '마우스를 누른 채 사진 1과 사진 2를 둘러싸게 드래그하세요.'}
            </p>
            <div className="relative flex items-center justify-center gap-8">
              <div ref={photoOneRef}>
                <DesktopIconTile icon="image" label="사진 1" selected={multiSelected} className="w-24" />
              </div>
              <div ref={photoTwoRef}>
                <DesktopIconTile icon="image" label="사진 2" selected={multiSelected} className="w-24" />
              </div>
            </div>
            {selectionDrag && (
              <div
                className="pointer-events-none absolute rounded-xl border-2 border-primary bg-primary-fixed/35 shadow-[0_0_0_999px_rgba(255,255,255,0.04)]"
                style={selectionStyle}
              />
            )}
          </div>
        </div>
      </VirtualDesktopFrame>

      <div className="mt-5 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2">
        {DESKTOP_EVAL_TASKS.map((task) => (
          <EvalCheck key={task.id} done={completed[task.id]} label={task.label} />
        ))}
      </div>
    </section>
  );
}

interface EvalBrowserWindowProps {
  tabs: EvalBrowserTab[];
  activeTabId: number;
  currentPage: EvalSitePage;
  address: string;
  searchInput: string;
  searchResult: string | null;
  currentTaskId?: DesktopEvalTaskId;
  googleAuthStep: 'home' | 'email' | 'password';
  googleEmail: string;
  googlePassword: string;
  googleAuthError: string | null;
  googleLoggedIn: boolean;
  googleAccountMenuOpen: boolean;
  googleEvalEmail: string;
  googleEvalPassword: string;
  maximized: boolean;
  canGoBack: boolean;
  canGoForward: boolean;
  onSelectTab: (id: number) => void;
  onCloseTab: (id: number) => void;
  onNewTab: () => void;
  onBack: () => void;
  onForward: () => void;
  onRefresh: () => void;
  onHome: () => void;
  onMinimize: () => void;
  onMaximize: () => void;
  onClose: () => void;
  onAddressChange: (value: string) => void;
  onAddressSubmit: () => void;
  onSearchInput: (value: string) => void;
  onSearch: () => void;
  onStartGoogleLogin: () => void;
  onGoogleEmailChange: (value: string) => void;
  onGooglePasswordChange: (value: string) => void;
  onGoogleEmailNext: () => void;
  onGooglePasswordSubmit: () => void;
  onGoogleAccountMenu: () => void;
  onGoogleLogout: () => void;
}

function EvalBrowserWindow({
  tabs,
  activeTabId,
  currentPage,
  address,
  searchInput,
  searchResult,
  currentTaskId,
  googleAuthStep,
  googleEmail,
  googlePassword,
  googleAuthError,
  googleLoggedIn,
  googleAccountMenuOpen,
  googleEvalEmail,
  googleEvalPassword,
  maximized,
  canGoBack,
  canGoForward,
  onSelectTab,
  onCloseTab,
  onNewTab,
  onBack,
  onForward,
  onRefresh,
  onHome,
  onMinimize,
  onMaximize,
  onClose,
  onAddressChange,
  onAddressSubmit,
  onSearchInput,
  onSearch,
  onStartGoogleLogin,
  onGoogleEmailChange,
  onGooglePasswordChange,
  onGoogleEmailNext,
  onGooglePasswordSubmit,
  onGoogleAccountMenu,
  onGoogleLogout,
}: EvalBrowserWindowProps) {
  return (
    <DesktopWindow
      title="가상 브라우저"
      icon="public"
      className={cn('z-30 mt-6 md:absolute md:right-0 md:top-0 md:mt-0', maximized ? 'md:left-0' : 'md:left-[240px]')}
      activeControl={
        currentTaskId === 'minimize'
          ? 'minimize'
          : currentTaskId === 'maximize'
          ? 'maximize'
          : currentTaskId === 'windowClose'
          ? 'close'
          : undefined
      }
      maximized={maximized}
      onMinimize={onMinimize}
      onMaximize={onMaximize}
      onClose={onClose}
    >
      <div className="overflow-hidden rounded-2xl border-2 border-outline-variant bg-white shadow-inner">
        <div className="flex h-12 items-end gap-1 bg-[#303134] px-3 pt-2 text-white">
          {tabs.map((tab, index) => {
            const active = tab.id === activeTabId;
            const page = tab.history[tab.index];
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => onSelectTab(tab.id)}
                className={cn(
                  'flex h-10 min-w-0 max-w-44 flex-1 items-center gap-2 rounded-t-2xl px-3 text-left text-sm font-label-bold transition-colors',
                  active ? 'bg-white text-on-surface' : 'bg-white/12 text-white hover:bg-white/20',
                )}
              >
                <span className="material-symbols-outlined text-base" style={{ fontVariationSettings: "'FILL' 1" }}>
                  {page.icon}
                </span>
                <span className="truncate">{index === 0 ? page.title : `탭 ${index + 1}`}</span>
                <span
                  role="button"
                  tabIndex={0}
                  onClick={(e) => {
                    e.stopPropagation();
                    onCloseTab(tab.id);
                  }}
                  className={cn(
                    'ml-auto flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full transition-colors',
                    currentTaskId === 'closetab' ? 'bg-primary text-on-primary ring-2 ring-tertiary-fixed' : 'hover:bg-error-container hover:text-error',
                  )}
                  aria-label="탭 닫기"
                >
                  <span className="material-symbols-outlined text-base">close</span>
                </span>
              </button>
            );
          })}
          <button
            type="button"
            onClick={onNewTab}
            className={cn(
              'mb-1 flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full transition-all',
              currentTaskId === 'newtab'
                ? 'bg-primary text-on-primary ring-4 ring-tertiary-fixed'
                : 'bg-white/15 text-white hover:bg-white/25',
            )}
            aria-label="새 탭 열기"
          >
            <span className="material-symbols-outlined">add</span>
          </button>
        </div>

        <div className="flex flex-wrap items-center gap-2 border-b border-outline-variant/40 bg-surface-container-lowest px-3 py-3">
          <MiniBrowserButton icon="arrow_back" label="뒤로가기" disabled={!canGoBack} active={currentTaskId === 'back'} onClick={onBack} />
          <MiniBrowserButton icon="arrow_forward" label="앞으로가기" disabled={!canGoForward} active={currentTaskId === 'forward'} onClick={onForward} />
          <MiniBrowserButton icon="refresh" label="새로고침" active={currentTaskId === 'refresh'} onClick={onRefresh} />
          <MiniBrowserButton icon="home" label="홈" active={currentTaskId === 'home'} onClick={onHome} />

          <div
            className={cn(
              'relative flex min-w-[220px] flex-1 items-center rounded-full bg-surface-container px-4 ring-primary-fixed transition-all',
              currentTaskId === 'address' && 'ring-4',
            )}
          >
            <span className="material-symbols-outlined text-xl text-outline mr-2">travel_explore</span>
            <input
              value={address}
              onChange={(e) => onAddressChange(e.target.value)}
              onKeyDown={(e: ReactKeyboardEvent<HTMLInputElement>) => {
                if (e.key === 'Enter') onAddressSubmit();
              }}
              placeholder={currentPage.domain === 'home' ? 'google.com 입력' : currentPage.domain}
              className="h-11 min-w-0 flex-1 bg-transparent outline-none font-body-lg text-base"
              aria-label="주소창"
            />
            <button
              type="button"
              onClick={onAddressSubmit}
              className="ml-2 rounded-full bg-primary px-3 py-1.5 text-sm font-label-bold text-on-primary"
            >
              이동
            </button>
          </div>
        </div>

        <EvalBrowserPage
          currentPage={currentPage}
          currentTaskId={currentTaskId}
          searchInput={searchInput}
          searchResult={searchResult}
          googleAuthStep={googleAuthStep}
          googleEmail={googleEmail}
          googlePassword={googlePassword}
          googleAuthError={googleAuthError}
          googleLoggedIn={googleLoggedIn}
          googleAccountMenuOpen={googleAccountMenuOpen}
          googleEvalEmail={googleEvalEmail}
          googleEvalPassword={googleEvalPassword}
          onSearchInput={onSearchInput}
          onSearch={onSearch}
          onStartGoogleLogin={onStartGoogleLogin}
          onGoogleEmailChange={onGoogleEmailChange}
          onGooglePasswordChange={onGooglePasswordChange}
          onGoogleEmailNext={onGoogleEmailNext}
          onGooglePasswordSubmit={onGooglePasswordSubmit}
          onGoogleAccountMenu={onGoogleAccountMenu}
          onGoogleLogout={onGoogleLogout}
        />
      </div>
    </DesktopWindow>
  );
}

function MiniBrowserButton({
  icon,
  label,
  disabled,
  active,
  onClick,
}: {
  icon: string;
  label: string;
  disabled?: boolean;
  active?: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-label={label}
      title={label}
      className={cn(
        'flex h-11 w-11 items-center justify-center rounded-full transition-all',
        disabled
          ? 'cursor-not-allowed text-outline-variant'
          : active
          ? 'bg-primary text-on-primary ring-4 ring-tertiary-fixed'
          : 'text-on-surface-variant hover:bg-surface-container-high',
      )}
    >
      <span className="material-symbols-outlined text-2xl">{icon}</span>
    </button>
  );
}

function EvalBrowserPage({
  currentPage,
  currentTaskId,
  searchInput,
  searchResult,
  googleAuthStep,
  googleEmail,
  googlePassword,
  googleAuthError,
  googleLoggedIn,
  googleAccountMenuOpen,
  googleEvalEmail,
  googleEvalPassword,
  onSearchInput,
  onSearch,
  onStartGoogleLogin,
  onGoogleEmailChange,
  onGooglePasswordChange,
  onGoogleEmailNext,
  onGooglePasswordSubmit,
  onGoogleAccountMenu,
  onGoogleLogout,
}: {
  currentPage: EvalSitePage;
  currentTaskId?: DesktopEvalTaskId;
  searchInput: string;
  searchResult: string | null;
  googleAuthStep: 'home' | 'email' | 'password';
  googleEmail: string;
  googlePassword: string;
  googleAuthError: string | null;
  googleLoggedIn: boolean;
  googleAccountMenuOpen: boolean;
  googleEvalEmail: string;
  googleEvalPassword: string;
  onSearchInput: (value: string) => void;
  onSearch: () => void;
  onStartGoogleLogin: () => void;
  onGoogleEmailChange: (value: string) => void;
  onGooglePasswordChange: (value: string) => void;
  onGoogleEmailNext: () => void;
  onGooglePasswordSubmit: () => void;
  onGoogleAccountMenu: () => void;
  onGoogleLogout: () => void;
}) {
  if (currentPage.domain === 'google.com') {
    if (googleAuthStep !== 'home') {
      return (
        <GoogleSignInScreen
          step={googleAuthStep}
          email={googleEmail}
          password={googlePassword}
          error={googleAuthError}
          googleEvalEmail={googleEvalEmail}
          googleEvalPassword={googleEvalPassword}
          onEmailChange={onGoogleEmailChange}
          onPasswordChange={onGooglePasswordChange}
          onEmailNext={onGoogleEmailNext}
          onPasswordSubmit={onGooglePasswordSubmit}
        />
      );
    }

    return (
      <div className="relative min-h-[420px] bg-[#202124] p-5 text-white overflow-hidden">
        <div className="flex items-center justify-between text-sm md:text-base">
          <div className="flex items-center gap-6">
            <a className="underline underline-offset-2" href="#" onClick={(e) => e.preventDefault()}>Google 정보</a>
            <a className="underline underline-offset-2" href="#" onClick={(e) => e.preventDefault()}>스토어</a>
          </div>
          <div className="flex items-center gap-5">
            <a href="#" onClick={(e) => e.preventDefault()}>Gmail</a>
            <a href="#" onClick={(e) => e.preventDefault()}>이미지</a>
            <span className="material-symbols-outlined text-3xl text-white/80">apps</span>
            {googleLoggedIn ? (
              <div className="relative">
                <button
                  type="button"
                  onClick={onGoogleAccountMenu}
                  className={cn(
                    'flex h-12 w-12 items-center justify-center rounded-full bg-primary-container font-black text-on-primary-container transition-all',
                    currentTaskId === 'googleLogout' && 'ring-4 ring-tertiary-fixed',
                  )}
                  aria-label="Google 계정 메뉴"
                >
                  새
                </button>
                {googleAccountMenuOpen && (
                  <div className="absolute right-0 top-14 z-40 w-72 rounded-[2rem] bg-[#2f3033] p-5 text-center text-white shadow-2xl border border-white/15">
                    <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-primary-container text-2xl font-black text-on-primary-container">
                      새
                    </div>
                    <p className="mt-3 font-label-bold">새싹 친구</p>
                    <p className="text-sm text-white/70">{googleEvalEmail}</p>
                    <button
                      type="button"
                      onClick={onGoogleLogout}
                      className={cn(
                        'mt-5 w-full rounded-full border border-white/25 px-5 py-3 font-label-bold transition-colors hover:bg-white/10',
                        currentTaskId === 'googleLogout' && 'bg-tertiary-fixed text-on-tertiary-fixed ring-4 ring-tertiary-fixed/50',
                      )}
                    >
                      로그아웃
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <button
                type="button"
                onClick={onStartGoogleLogin}
                className={cn(
                  'rounded-full bg-[#c2e7ff] px-8 py-3 font-label-bold text-[#001d35] transition-all hover:bg-[#d3edff]',
                  currentTaskId === 'googleLogin' && 'ring-4 ring-tertiary-fixed',
                )}
              >
                로그인
              </button>
            )}
          </div>
        </div>

        <div className="mt-24 flex flex-col items-center gap-8 text-center">
          <div className="text-[72px] md:text-[96px] font-medium tracking-[-0.06em] text-white">Google</div>
          <div
            className={cn(
              'flex w-full max-w-[780px] items-center rounded-full bg-[#4d5156] px-5 shadow-[inset_0_1px_0_rgba(255,255,255,0.08)] transition-all',
              currentTaskId === 'search' && 'ring-4 ring-tertiary-fixed',
            )}
          >
            <span className="material-symbols-outlined text-3xl text-white/90 mr-3">add</span>
            <input
              value={searchInput}
              onChange={(e) => onSearchInput(e.target.value)}
              onKeyDown={(e: ReactKeyboardEvent<HTMLInputElement>) => {
                if (e.key === 'Enter') onSearch();
              }}
              className="h-16 min-w-0 flex-1 bg-transparent text-xl text-white outline-none placeholder:text-white/55"
              placeholder="Google 검색 또는 URL 입력"
              aria-label="Google 검색어"
            />
            <span className="material-symbols-outlined text-white/90 mx-2">keyboard</span>
            <span className="material-symbols-outlined text-white/90 mx-2">mic</span>
            <span className="material-symbols-outlined text-white/90 mx-2">photo_camera</span>
            <span className="rounded-full border border-tertiary-fixed/70 px-4 py-2 font-label-bold text-white/80">AI 모드</span>
          </div>
          <div className="flex gap-4">
            <button type="button" onClick={onSearch} className="rounded-lg bg-[#303134] px-6 py-3 font-label-bold text-white hover:ring-1 hover:ring-white/30">
              Google 검색
            </button>
            <button type="button" className="rounded-lg bg-[#303134] px-6 py-3 font-label-bold text-white hover:ring-1 hover:ring-white/30">
              I'm Feeling Lucky
            </button>
          </div>
          <EvalSearchResult result={searchResult} />
        </div>
      </div>
    );
  }

  if (currentPage.domain === 'naver.com') {
    return (
      <div className="min-h-[320px] bg-white p-6 flex flex-col items-center justify-center gap-6 text-center">
        <h3 className="text-6xl font-black text-[#03c75a]">NAVER</h3>
        <EvalSearchBox
          value={searchInput}
          onValue={onSearchInput}
          onSearch={onSearch}
          active={currentTaskId === 'search'}
          placeholder="검색어를 입력하세요"
          buttonLabel="검색"
        />
        <EvalSearchResult result={searchResult} />
      </div>
    );
  }

  if (currentPage.domain === 'youtube.com') {
    return (
      <div className="min-h-[320px] bg-white p-6 flex flex-col gap-5">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-14 items-center justify-center rounded-xl bg-[#ff0000] text-white">
            <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>play_arrow</span>
          </div>
          <h3 className="text-4xl font-black">YouTube</h3>
        </div>
        <EvalSearchBox
          value={searchInput}
          onValue={onSearchInput}
          onSearch={onSearch}
          active={currentTaskId === 'search'}
          placeholder="동영상 검색"
          buttonLabel="검색"
        />
        <EvalSearchResult result={searchResult} />
      </div>
    );
  }

  return (
    <div className="min-h-[320px] bg-white p-6 flex flex-col items-center justify-center gap-4 text-center">
      <div className="flex h-24 w-24 items-center justify-center rounded-[2rem] bg-primary-container text-on-primary-container shadow-lg">
        <span className="material-symbols-outlined text-5xl" style={{ fontVariationSettings: "'FILL' 1" }}>
          {currentPage.icon}
        </span>
      </div>
      <h3 className="font-headline-md text-headline-md text-primary">{currentPage.title}</h3>
      <p className="font-body-lg text-body-lg text-on-surface-variant max-w-md">{currentPage.body}</p>
    </div>
  );
}

function GoogleSignInScreen({
  step,
  email,
  password,
  error,
  googleEvalEmail,
  googleEvalPassword,
  onEmailChange,
  onPasswordChange,
  onEmailNext,
  onPasswordSubmit,
}: {
  step: 'email' | 'password';
  email: string;
  password: string;
  error: string | null;
  googleEvalEmail: string;
  googleEvalPassword: string;
  onEmailChange: (value: string) => void;
  onPasswordChange: (value: string) => void;
  onEmailNext: () => void;
  onPasswordSubmit: () => void;
}) {
  const isEmailStep = step === 'email';

  return (
    <div className="min-h-[420px] bg-[#1f1f1f] p-6 text-white">
      <div className="mx-auto mt-6 grid max-w-4xl gap-8 rounded-[2rem] bg-[#0e0e0e] p-8 shadow-2xl md:grid-cols-[1fr_1.1fr]">
        <div>
          <div className="mb-8 flex h-12 w-12 items-center justify-center rounded-full bg-white text-2xl font-black text-[#4285f4]">
            G
          </div>
          <h3 className="text-4xl font-medium">{isEmailStep ? '로그인' : '비밀번호 입력'}</h3>
          <p className="mt-4 text-lg text-white/80">
            {isEmailStep ? 'Google 계정으로 계속합니다.' : googleEvalEmail}
          </p>
        </div>

        <div className="flex flex-col justify-between gap-6">
          {isEmailStep ? (
            <>
              <div>
                <label htmlFor="google_eval_email" className="sr-only">이메일 또는 휴대전화</label>
                <input
                  id="google_eval_email"
                  value={email}
                  onChange={(e) => onEmailChange(e.target.value)}
                  onKeyDown={(e: ReactKeyboardEvent<HTMLInputElement>) => {
                    if (e.key === 'Enter') onEmailNext();
                  }}
                  placeholder="이메일 또는 휴대전화"
                  className="h-14 w-full rounded-md border border-[#8ab4f8] bg-transparent px-4 text-lg text-white outline-none focus:ring-2 focus:ring-[#8ab4f8]"
                  autoFocus
                />
                <p className="mt-3 text-sm text-[#8ab4f8]">
                  {googleEvalEmail ? `힌트: ${googleEvalEmail}` : '힌트: 로그인/로그아웃 연습에서 만든 계정이 필요해요.'}
                </p>
              </div>
              {error && <p className="rounded-lg bg-error-container px-4 py-3 font-label-bold text-on-error-container">{error}</p>}
              <div className="flex items-center justify-end gap-4">
                <button type="button" className="rounded-full px-4 py-2 font-label-bold text-[#8ab4f8]">계정 만들기</button>
                <button type="button" onClick={onEmailNext} className="rounded-full bg-[#8ab4f8] px-6 py-2.5 font-label-bold text-[#062e6f]">
                  다음
                </button>
              </div>
            </>
          ) : (
            <>
              <div>
                <label htmlFor="google_eval_password" className="sr-only">비밀번호 입력</label>
                <input
                  id="google_eval_password"
                  type="password"
                  value={password}
                  onChange={(e) => onPasswordChange(e.target.value)}
                  onKeyDown={(e: ReactKeyboardEvent<HTMLInputElement>) => {
                    if (e.key === 'Enter') onPasswordSubmit();
                  }}
                  placeholder="비밀번호 입력"
                  className="h-14 w-full rounded-md border border-[#8ab4f8] bg-transparent px-4 text-lg text-white outline-none focus:ring-2 focus:ring-[#8ab4f8]"
                  autoFocus
                />
                <p className="mt-3 text-sm text-[#8ab4f8]">
                  {googleEvalPassword ? `힌트: 로그인 연습에서 만든 비밀번호` : '힌트: 로그인/로그아웃 연습에서 만든 계정이 필요해요.'}
                </p>
              </div>
              {error && <p className="rounded-lg bg-error-container px-4 py-3 font-label-bold text-on-error-container">{error}</p>}
              <div className="flex items-center justify-end gap-4">
                <button type="button" className="rounded-full px-4 py-2 font-label-bold text-[#8ab4f8]">비밀번호 표시</button>
                <button type="button" onClick={onPasswordSubmit} className="rounded-full bg-[#8ab4f8] px-6 py-2.5 font-label-bold text-[#062e6f]">
                  다음
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

function EvalSearchBox({
  value,
  onValue,
  onSearch,
  active,
  placeholder,
  buttonLabel,
}: {
  value: string;
  onValue: (value: string) => void;
  onSearch: () => void;
  active?: boolean;
  placeholder: string;
  buttonLabel: string;
}) {
  return (
    <div className={cn('flex w-full max-w-xl items-center rounded-full border border-outline-variant bg-white px-4 shadow-md', active && 'ring-4 ring-primary-fixed')}>
      <span className="material-symbols-outlined text-outline mr-3">search</span>
      <input
        value={value}
        onChange={(e) => onValue(e.target.value)}
        onKeyDown={(e: ReactKeyboardEvent<HTMLInputElement>) => {
          if (e.key === 'Enter') onSearch();
        }}
        placeholder={placeholder}
        className="h-14 min-w-0 flex-1 bg-transparent outline-none font-body-lg text-base"
        aria-label="검색어"
      />
      <button type="button" onClick={onSearch} className="rounded-full bg-primary-container px-4 py-2 text-sm font-label-bold text-on-primary-container">
        {buttonLabel}
      </button>
    </div>
  );
}

function EvalSearchResult({ result }: { result: string | null }) {
  if (!result) return null;
  return (
    <div className="rounded-2xl bg-secondary-container px-5 py-3 font-label-bold text-on-secondary-container">
      {result}
    </div>
  );
}

function EvalCheck({ done, label }: { done: boolean; label: string }) {
  return (
    <div className={`rounded-full px-4 py-2 font-label-bold flex items-center gap-2 ${done ? 'bg-secondary text-on-secondary' : 'bg-surface-container text-on-surface-variant'}`}>
      <span className="material-symbols-outlined text-base">{done ? 'check_circle' : 'radio_button_unchecked'}</span>
      {label}
    </div>
  );
}
