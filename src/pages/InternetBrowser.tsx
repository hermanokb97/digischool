import { KeyboardEvent, useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useUser } from '@/context/UserContext';
import { playClick, playFail, playFanfare, playSuccess } from '@/lib/sound';
import { SpeakButton } from '@/components/SpeakButton';
import { saveStudyResult } from '@/lib/evaluation';

interface SitePage {
  domain: string;
  title: string;
  color: string;
  icon: string;
  body: string;
}

const HOME_PAGE: SitePage = {
  domain: 'home',
  title: '인터넷 시작하기',
  color: 'primary',
  icon: 'public',
  body: '주소창에 가고 싶은 사이트 주소를 입력해 보세요.',
};

const SITES: Record<string, SitePage> = {
  'naver.com': {
    domain: 'naver.com',
    title: '네이버',
    color: 'secondary',
    icon: 'travel_explore',
    body: '안녕하세요! 무엇이든 검색해 보세요. (예: 동물, 우주, 게임)',
  },
  'google.com': {
    domain: 'google.com',
    title: '구글',
    color: 'primary',
    icon: 'search',
    body: '구글에 오신 걸 환영해요. 궁금한 것이 있으면 검색해 보세요!',
  },
  'youtube.com': {
    domain: 'youtube.com',
    title: '유튜브',
    color: 'error',
    icon: 'play_circle',
    body: '재미있는 동영상이 가득해요! 보고 싶은 영상을 검색해 봐요.',
  },
  'daum.net': {
    domain: 'daum.net',
    title: '다음',
    color: 'tertiary',
    icon: 'newspaper',
    body: '오늘의 뉴스와 검색을 함께! 궁금한 걸 검색해 보세요.',
  },
};

function normalizeDomain(input: string): string {
  return input
    .trim()
    .toLowerCase()
    .replace(/^https?:\/\//, '')
    .replace(/^www\./, '')
    .replace(/\/$/, '')
    .replace(/\/.*$/, '');
}

interface Tab {
  id: number;
  history: SitePage[];
  index: number;
}

function newTab(id: number): Tab {
  return { id, history: [HOME_PAGE], index: 0 };
}

interface IntroSlide {
  icon: string;
  title: string;
  body: string;
  target: PreviewTarget;
}

type PreviewTarget =
  | 'back'
  | 'forward'
  | 'refresh'
  | 'home'
  | 'newtab'
  | 'closetab'
  | 'windowClose'
  | 'minimize'
  | 'maximize';

const INTRO_SLIDES: IntroSlide[] = [
  {
    icon: 'arrow_back',
    title: '뒤로가기 버튼이에요',
    body: '방금 보던 페이지로 돌아갈 때 사용해요. 다른 사이트로 갔다가 이전 페이지가 보고 싶으면 이 버튼을 눌러요.',
    target: 'back',
  },
  {
    icon: 'arrow_forward',
    title: '앞으로가기 버튼이에요',
    body: '뒤로가기를 한 다음에, 다시 앞으로 가고 싶을 때 사용해요. 뒤로/앞으로 버튼은 짝꿍이에요.',
    target: 'forward',
  },
  {
    icon: 'refresh',
    title: '새로고침 버튼이에요',
    body: '지금 보고 있는 페이지를 다시 불러와요. 페이지가 이상하거나 새로운 내용을 보고 싶을 때 눌러요.',
    target: 'refresh',
  },
  {
    icon: 'home',
    title: '홈 버튼이에요',
    body: '시작 페이지로 한 번에 돌아가게 해 줘요. 길을 잃었으면 홈 버튼!',
    target: 'home',
  },
  {
    icon: 'add',
    title: '탭(+) 새로 열기',
    body: '여러 사이트를 한꺼번에 열어 두려면 탭을 새로 만들어요. 탭마다 다른 사이트를 띄울 수 있어요.',
    target: 'newtab',
  },
  {
    icon: 'close',
    title: '탭 닫기 버튼이에요',
    body: '탭 안에 있는 작은 ✕ 버튼은 지금 보고 있는 탭 하나만 닫아요. 브라우저 창 전체를 닫는 버튼과 달라요.',
    target: 'closetab',
  },
  {
    icon: 'remove',
    title: '최소화 버튼이에요',
    body: '창을 잠깐 아래로 숨길 때 사용해요. 프로그램을 끝내는 것이 아니라, 화면에서 잠시 치워 두는 거예요.',
    target: 'minimize',
  },
  {
    icon: 'crop_square',
    title: '최대화 버튼이에요',
    body: '브라우저 창을 화면에 크게 펼칠 때 사용해요. 다시 누르면 원래 크기로 돌아올 수 있어요.',
    target: 'maximize',
  },
  {
    icon: 'close',
    title: '창 닫기 버튼이에요',
    body: '오른쪽 위 ✕ 버튼은 브라우저 창 전체를 닫을 때 사용해요. 탭의 작은 ✕와 헷갈리지 않도록 조심해요.',
    target: 'windowClose',
  },
];

type MissionId = 'address' | 'search' | 'back' | 'forward' | 'refresh' | 'newtab' | 'closetab';

interface MissionItem {
  id: MissionId;
  label: string;
  description: string;
}

const MISSIONS: MissionItem[] = [
  { id: 'address', label: '주소창에 주소를 입력해보세요!', description: '인터넷 주소(예: google.com 또는 naver.com)를 입력하고 엔터를 눌러요.' },
  { id: 'search', label: '검색어를 입력해보세요!', description: '사이트 안의 검색창에 무엇이든 입력하고 검색해 보세요.' },
  { id: 'back', label: '뒤로가기 버튼을 눌러보세요!', description: '이전 페이지로 돌아가요.' },
  { id: 'forward', label: '앞으로가기 버튼을 눌러보세요!', description: '뒤로 간 페이지에서 다시 앞으로 와요.' },
  { id: 'refresh', label: '새로고침 버튼을 눌러보세요!', description: '지금 페이지를 다시 불러와요.' },
  { id: 'newtab', label: '새 탭을 열어보세요!', description: '주소창 위쪽 + 버튼을 눌러서 새 탭을 만들어요.' },
  { id: 'closetab', label: '탭의 ✕ 버튼으로 탭을 닫아보세요!', description: '필요 없는 탭은 ✕로 닫을 수 있어요.' },
];

export function InternetBrowser() {
  const navigate = useNavigate();
  const { markComplete } = useUser();

  const [introIndex, setIntroIndex] = useState(0);
  const [introDone, setIntroDone] = useState(false);
  const [dismissedMissionPopups, setDismissedMissionPopups] = useState<Partial<Record<MissionId, boolean>>>({});
  const [missionPanelCollapsed, setMissionPanelCollapsed] = useState(false);

  const [tabs, setTabs] = useState<Tab[]>([newTab(1)]);
  const [activeTabId, setActiveTabId] = useState(1);
  const tabSeqRef = useRef(2);

  const [addressInput, setAddressInput] = useState('');
  const [searchInput, setSearchInput] = useState('');
  const [searchResult, setSearchResult] = useState<string | null>(null);
  const [windowState, setWindowState] = useState<'normal' | 'minimized' | 'maximized'>('normal');
  const [completed, setCompleted] = useState<Record<MissionId, boolean>>({
    address: false,
    search: false,
    back: false,
    forward: false,
    refresh: false,
    newtab: false,
    closetab: false,
  });
  const completedRef = useRef(false);
  const startedAtRef = useRef(Date.now());

  const activeTab = tabs.find((t) => t.id === activeTabId) ?? tabs[0];
  const currentPage = activeTab.history[activeTab.index];
  const allDone = MISSIONS.every((m) => completed[m.id]);

  const currentMissionId: MissionId = useMemo(() => {
    const next = MISSIONS.find((m) => !completed[m.id]);
    return next ? next.id : 'address';
  }, [completed]);
  const currentMission = MISSIONS.find((m) => m.id === currentMissionId) ?? MISSIONS[0];
  const showMissionPopup = introDone && !allDone && !dismissedMissionPopups[currentMissionId];

  useEffect(() => {
    if (allDone && !completedRef.current) {
      completedRef.current = true;
      saveStudyResult('browser', startedAtRef.current);
      playFanfare();
      markComplete('browser');
      const t = window.setTimeout(() => navigate('/result/browser'), 1200);
      return () => window.clearTimeout(t);
    }
  }, [allDone, markComplete, navigate]);

  const updateActiveTab = (updater: (tab: Tab) => Tab) => {
    setTabs((prev) => prev.map((t) => (t.id === activeTabId ? updater(t) : t)));
  };

  const navigateTo = (page: SitePage) => {
    updateActiveTab((tab) => {
      const next = tab.history.slice(0, tab.index + 1);
      next.push(page);
      return { ...tab, history: next, index: next.length - 1 };
    });
    setSearchResult(null);
    setSearchInput('');
  };

  const handleAddressSubmit = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key !== 'Enter') return;
    const normalized = normalizeDomain(addressInput);
    if (!normalized) return;
    const site = SITES[normalized];
    if (site) {
      playSuccess();
      navigateTo(site);
      setCompleted((c) => ({ ...c, address: true }));
    } else {
      playFail();
      navigateTo({
        domain: normalized,
        title: '찾을 수 없어요',
        color: 'error',
        icon: 'error',
        body: `"${normalized}" 사이트를 찾을 수 없어요. 다른 주소를 입력해 보세요. (예: naver.com)`,
      });
    }
    setAddressInput('');
  };

  const handleSearch = () => {
    if (!searchInput.trim() || currentPage.domain === 'home') {
      playFail();
      return;
    }
    playSuccess();
    setSearchResult(`"${searchInput.trim()}"에 대한 결과를 찾았어요!`);
    setCompleted((c) => ({ ...c, search: true }));
  };

  const canGoBack = activeTab.index > 0;
  const canGoForward = activeTab.index < activeTab.history.length - 1;

  const handleBack = () => {
    if (!canGoBack) {
      playFail();
      return;
    }
    playClick();
    updateActiveTab((tab) => ({ ...tab, index: tab.index - 1 }));
    setSearchResult(null);
    setCompleted((c) => ({ ...c, back: true }));
  };

  const handleForward = () => {
    if (!canGoForward) {
      playFail();
      return;
    }
    playClick();
    updateActiveTab((tab) => ({ ...tab, index: tab.index + 1 }));
    setSearchResult(null);
    setCompleted((c) => ({ ...c, forward: true }));
  };

  const handleHome = () => {
    playClick();
    if (activeTab.history[activeTab.index].domain !== 'home') {
      navigateTo(HOME_PAGE);
    }
    setSearchResult(null);
  };

  const handleRefresh = () => {
    playClick();
    setSearchResult(null);
    setCompleted((c) => ({ ...c, refresh: true }));
  };

  const handleNewTab = () => {
    playClick();
    const id = tabSeqRef.current++;
    setTabs((prev) => [...prev, newTab(id)]);
    setActiveTabId(id);
    setCompleted((c) => ({ ...c, newtab: true }));
  };

  const handleCloseTab = (id: number) => {
    if (tabs.length <= 1) {
      showShake();
      playFail();
      return;
    }
    playClick();
    setTabs((prev) => {
      const next = prev.filter((t) => t.id !== id);
      if (id === activeTabId) {
        setActiveTabId(next[0].id);
      }
      return next;
    });
    setCompleted((c) => ({ ...c, closetab: true }));
  };

  const handleSelectTab = (id: number) => {
    playClick();
    setActiveTabId(id);
  };

  const [windowShake, setWindowShake] = useState(false);
  const showShake = () => {
    setWindowShake(true);
    window.setTimeout(() => setWindowShake(false), 400);
  };

  const handleMinimize = () => {
    playClick();
    setWindowState('minimized');
  };

  const handleMaximize = () => {
    playClick();
    setWindowState((s) => (s === 'maximized' ? 'normal' : 'maximized'));
  };

  const handleClose = () => {
    playFail();
    showShake();
  };

  const dismissMissionPopup = () => {
    playClick();
    setDismissedMissionPopups((prev) => ({ ...prev, [currentMissionId]: true }));
  };

  if (!introDone) {
    const slide = INTRO_SLIDES[introIndex];
    return (
      <div className="max-w-3xl w-full mx-auto flex flex-col gap-8 md:pt-12 items-center text-center">
        <h1 className="font-display-lg text-display-lg text-primary">먼저 브라우저 친구들 만나봐요!</h1>
        <div className="bg-surface-container-lowest rounded-2xl p-10 border-b-[6px] border-primary-container shadow-lg flex flex-col items-center gap-6 w-full">
          <div className="w-32 h-32 rounded-full bg-primary-container text-on-primary-container flex items-center justify-center shadow-[0_8px_0_rgba(0,100,150,0.3)]">
            <span className="material-symbols-outlined text-[80px]" style={{ fontVariationSettings: "'FILL' 1" }}>
              {slide.icon}
            </span>
          </div>
          <div className="flex items-center gap-3 flex-wrap justify-center">
            <h2 className="font-headline-md text-headline-md text-on-background">{slide.title}</h2>
            <SpeakButton text={`${slide.title}. ${slide.body}`} />
          </div>
          <p className="font-body-xl text-body-xl text-on-surface-variant max-w-xl">{slide.body}</p>

          <BrowserChromePreview activeIcon={slide.icon} activeTitle={slide.title} target={slide.target} />

          <div className="flex justify-center gap-1">
            {INTRO_SLIDES.map((_, i) => (
              <span
                key={i}
                className={`w-2.5 h-2.5 rounded-full transition-colors ${
                  i === introIndex ? 'bg-primary' : i < introIndex ? 'bg-primary/40' : 'bg-outline-variant'
                }`}
              />
            ))}
          </div>

          <div className="flex gap-3 flex-wrap justify-center w-full">
            {introIndex > 0 && (
              <button
                type="button"
                onClick={() => {
                  playClick();
                  setIntroIndex((i) => i - 1);
                }}
                className="px-6 py-3 rounded-full bg-surface-container-high text-on-surface font-label-bold text-label-bold hover:bg-surface-variant transition-colors"
              >
                ← 이전
              </button>
            )}
            {introIndex < INTRO_SLIDES.length - 1 ? (
              <button
                type="button"
                onClick={() => {
                  playClick();
                  setIntroIndex((i) => i + 1);
                }}
                className="px-8 py-3 rounded-full bg-primary text-on-primary font-label-bold text-label-bold shadow-[0_4px_0_rgb(0,78,118)] active:translate-y-[2px] active:shadow-none transition-all"
              >
                다음 →
              </button>
            ) : (
              <button
                type="button"
                onClick={() => {
                  playSuccess();
                  setIntroDone(true);
                }}
                className="px-8 py-3 rounded-full bg-secondary text-on-secondary font-label-bold text-label-bold shadow-[0_4px_0_rgba(0,33,14,0.4)] active:translate-y-[2px] active:shadow-none transition-all"
              >
                직접 해볼게요!
              </button>
            )}
            <button
              type="button"
              onClick={() => {
                playClick();
                setIntroDone(true);
              }}
              className="px-6 py-3 rounded-full text-on-surface-variant hover:bg-surface-container-high transition-colors font-label-bold text-label-bold"
            >
              건너뛰기
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-grow flex w-full flex-col md:flex-row gap-gutter md:pt-4 max-w-7xl mx-auto pb-8 md:pb-0">
      {/* 미션 사이드바 */}
      <aside className={`w-full ${missionPanelCollapsed ? 'md:w-[92px]' : 'md:w-1/3 lg:w-1/4'} bg-surface-container-lowest rounded-3xl shadow-lg border-b-4 border-outline-variant p-gutter flex flex-col gap-4 transition-all`}>
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 bg-primary-container rounded-full flex items-center justify-center text-on-primary-container">
            <span className="material-symbols-outlined text-3xl" style={{ fontVariationSettings: "'FILL' 1" }}>school</span>
          </div>
          {!missionPanelCollapsed && <div>
            <h2 className="font-headline-md text-headline-md text-primary">미션</h2>
            <p className="font-body-lg text-body-lg text-on-surface-variant text-sm">브라우저 사용해보기</p>
          </div>}
          <button
            type="button"
            onClick={() => setMissionPanelCollapsed((v) => !v)}
            className="ml-auto w-10 h-10 rounded-full bg-surface-container-high text-on-surface-variant hover:bg-primary-container hover:text-primary flex items-center justify-center transition-colors"
            aria-label={missionPanelCollapsed ? '미션 펼치기' : '미션 접기'}
          >
            <span className="material-symbols-outlined">{missionPanelCollapsed ? 'chevron_right' : 'chevron_left'}</span>
          </button>
        </div>

        {!missionPanelCollapsed && <div className="flex flex-col gap-3">
          {MISSIONS.map((m) => {
            const isCurrent = m.id === currentMissionId && !allDone;
            const isDone = completed[m.id];
            return (
              <div
                key={m.id}
                className={`bg-surface-container-low rounded-xl p-4 border-l-4 transition-all ${
                  isDone ? 'border-secondary opacity-90' : isCurrent ? 'border-primary shadow-md' : 'border-outline-variant opacity-60'
                }`}
              >
                <div className="flex items-start justify-between gap-2">
                  <p className="font-label-bold text-label-bold text-on-surface flex-1 text-sm">
                    <span className={`inline-flex items-center justify-center w-5 h-5 rounded-full mr-2 text-xs ${
                      isDone ? 'bg-secondary text-on-secondary' : 'bg-surface-variant text-on-surface-variant'
                    }`}>
                      {isDone ? '✓' : ''}
                    </span>
                    {m.label}
                  </p>
                  {isCurrent && <SpeakButton text={`${m.label} ${m.description}`} className="flex-shrink-0 w-7 h-7" />}
                </div>
                <p className="font-body-lg text-body-lg text-on-surface-variant text-xs mt-1">{m.description}</p>
              </div>
            );
          })}
        </div>}

        {!missionPanelCollapsed && <button
          type="button"
          onClick={() => {
            playClick();
            setIntroDone(false);
            setIntroIndex(0);
          }}
          className="mt-2 text-primary text-sm font-label-bold hover:underline"
        >
          버튼 설명 다시 보기
        </button>}
      </aside>

      {/* 브라우저 시뮬레이터 */}
      <section
        className={`relative flex-grow bg-surface-container-lowest rounded-3xl shadow-xl border-b-[8px] border-outline-variant overflow-hidden flex flex-col transition-all ${
          windowState === 'minimized' ? 'h-16' : windowState === 'maximized' ? 'min-h-[720px]' : 'min-h-[560px]'
        } ${windowShake ? 'animate-[shake_0.4s_ease-in-out]' : ''}`}
      >
        {showMissionPopup && (
          <MissionPopup
            mission={currentMission}
            step={MISSIONS.findIndex((m) => m.id === currentMissionId) + 1}
            total={MISSIONS.length}
            onClose={dismissMissionPopup}
          />
        )}

        {!showMissionPopup && !allDone && dismissedMissionPopups[currentMissionId] && (
          <MissionTopBar
            mission={currentMission}
            step={MISSIONS.findIndex((m) => m.id === currentMissionId) + 1}
            total={MISSIONS.length}
            onOpen={() => setDismissedMissionPopups((prev) => ({ ...prev, [currentMissionId]: false }))}
          />
        )}

        {/* Windows/Chrome 스타일 창 컨트롤 */}
        <div className="bg-[#3c4043] h-12 flex items-center justify-between pl-4 border-b border-black/20 text-white">
          <div className="flex items-center gap-2 min-w-0">
            <span className="material-symbols-outlined text-base">public</span>
            <span className="font-label-bold text-sm truncate">디지 스쿨 브라우저</span>
          </div>
          {windowState === 'minimized' && (
            <button
              type="button"
              onClick={() => setWindowState('normal')}
              className="text-sm font-label-bold text-white hover:underline"
            >
              창을 다시 열기 →
            </button>
          )}
          <div className="ml-auto flex h-full">
            <WindowButton icon="remove" label="최소화" onClick={handleMinimize} />
            <WindowButton icon={windowState === 'maximized' ? 'filter_none' : 'crop_square'} label="최대화" onClick={handleMaximize} />
            <WindowButton icon="close" label="닫기" onClick={handleClose} danger />
          </div>
        </div>

        {windowState !== 'minimized' && (
          <>
            {/* 탭 영역 */}
            <div className="bg-[#3c4043] h-14 flex items-end px-3 gap-1 overflow-x-auto">
              {tabs.map((tab) => {
                const tabPage = tab.history[tab.index];
                const isActive = tab.id === activeTabId;
                return (
                  <div
                    key={tab.id}
                    className={`h-11 min-w-[160px] max-w-[220px] rounded-t-2xl flex items-center justify-between px-3 cursor-pointer relative transition-colors ${
                      isActive
                        ? 'bg-surface-container-lowest text-on-surface z-10'
                        : 'bg-[#2f3133] text-white hover:bg-[#4a4d50]'
                    }`}
                    onClick={() => handleSelectTab(tab.id)}
                  >
                    <div className="flex items-center gap-2 flex-1 min-w-0">
                      <span className={`material-symbols-outlined text-sm ${isActive ? 'text-primary' : 'text-on-surface-variant'}`} style={{ fontVariationSettings: "'FILL' 1" }}>
                        {tabPage.icon}
                      </span>
                      <span className="font-label-bold text-label-bold text-sm truncate">{tabPage.title}</span>
                    </div>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleCloseTab(tab.id);
                      }}
                      title="이 탭 닫기"
                      aria-label="탭 닫기"
                      className={`relative ml-2 w-6 h-6 rounded-full hover:bg-error-container hover:text-error flex items-center justify-center text-on-surface-variant transition-colors flex-shrink-0 ${
                        currentMissionId === 'closetab' ? 'bg-primary text-on-primary animate-[pulse_2s_ease-in-out_infinite]' : ''
                      }`}
                    >
                      <span className="material-symbols-outlined text-base">close</span>
                      {currentMissionId === 'closetab' && <InlineIndicator label="탭 닫기" />}
                    </button>
                  </div>
                );
              })}
              <button
                type="button"
                onClick={handleNewTab}
                title="새 탭 열기"
                aria-label="새 탭 열기"
                className={`relative h-9 w-9 rounded-full flex items-center justify-center cursor-pointer mb-1 shadow-sm flex-shrink-0 transition-all ${
                  currentMissionId === 'newtab' ? 'bg-primary text-on-primary animate-[pulse_2s_ease-in-out_infinite]' : 'bg-surface-container-high'
                }`}
              >
                <span className="material-symbols-outlined">add</span>
                {currentMissionId === 'newtab' && <InlineIndicator label="새 탭" />}
              </button>
            </div>

            {/* 네비게이션 바 */}
            <div className="bg-surface-container-lowest h-20 flex items-center px-4 gap-3 border-b-2 border-surface-container-highest">
              <NavButton
                onClick={handleBack}
                disabled={!canGoBack}
                icon="arrow_back"
                label="뒤로"
                tooltip="이전 페이지로 돌아가요"
                pulsing={currentMissionId === 'back' && canGoBack}
              />
              <NavButton
                onClick={handleForward}
                disabled={!canGoForward}
                icon="arrow_forward"
                label="앞으로"
                tooltip="앞으로 갔던 페이지로 가요"
                pulsing={currentMissionId === 'forward' && canGoForward}
              />
              <NavButton
                onClick={handleRefresh}
                icon="refresh"
                label="새로고침"
                tooltip="이 페이지를 다시 불러와요"
                pulsing={currentMissionId === 'refresh'}
              />
              <NavButton
                onClick={handleHome}
                icon="home"
                label="홈"
                tooltip="시작 페이지로 가요"
              />

              <div
                className={`flex-grow h-14 bg-surface-container rounded-full flex items-center px-4 md:px-6 border-b-4 transition-colors cursor-text group ${
                  currentMissionId === 'address'
                    ? 'border-primary animate-[pulse_2s_ease-in-out_infinite]'
                    : 'border-surface-container-high hover:border-primary-container focus-within:border-primary'
                }`}
              >
                <span className="material-symbols-outlined text-on-surface-variant mr-3 group-focus-within:text-primary">info</span>
                <input
                  type="text"
                  value={addressInput}
                  onChange={(e) => setAddressInput(e.target.value)}
                  onKeyDown={handleAddressSubmit}
                  className="bg-transparent border-none outline-none w-full font-body-lg text-body-lg text-on-surface placeholder-outline-variant h-full"
                  placeholder="주소를 입력하세요 (예: google.com)"
                  aria-label="주소창"
                />
                {currentMissionId === 'address' && <InlineIndicator label="주소창" />}
              </div>
            </div>

            <SiteContent
              currentPage={currentPage}
              currentMissionId={currentMissionId}
              searchInput={searchInput}
              searchResult={searchResult}
              onSearchInput={setSearchInput}
              onSearch={handleSearch}
            />
          </>
        )}
      </section>

      <style>{`
        @keyframes pop {
          0% { transform: scale(0.8); opacity: 0; }
          100% { transform: scale(1); opacity: 1; }
        }
        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          25% { transform: translateX(-8px); }
          75% { transform: translateX(8px); }
        }
      `}</style>
    </div>
  );
}

interface NavButtonProps {
  onClick: () => void;
  disabled?: boolean;
  icon: string;
  label: string;
  tooltip: string;
  pulsing?: boolean;
}

function NavButton({ onClick, disabled, icon, label, tooltip, pulsing }: NavButtonProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      title={tooltip}
      aria-label={`${label}: ${tooltip}`}
      className={`group relative flex items-center justify-center w-12 h-12 rounded-full transition-all flex-shrink-0 ${
        disabled
          ? 'text-outline-variant/50 cursor-not-allowed'
          : pulsing
          ? 'bg-primary text-on-primary animate-[pulse_2s_ease-in-out_infinite]'
          : 'text-on-surface-variant hover:bg-surface-container-high active:bg-surface-container-highest'
      }`}
    >
      <span className="material-symbols-outlined text-2xl">{icon}</span>
      {pulsing && <InlineIndicator label={label} />}
      <span className="pointer-events-none absolute -bottom-9 left-1/2 -translate-x-1/2 text-xs font-label-bold text-on-surface bg-surface-container-high px-2 py-1 rounded shadow-md whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity z-20">
        {label}
      </span>
    </button>
  );
}

function InlineIndicator({ label }: { label: string }) {
  return (
    <span className="pointer-events-none absolute left-1/2 top-full z-30 mt-2 -translate-x-1/2 flex flex-col items-center whitespace-nowrap">
      <span className="rounded-full bg-tertiary-fixed text-on-tertiary-fixed px-3 py-1 text-xs font-label-bold shadow-lg border-2 border-surface-container-lowest">
        {label}
      </span>
      <span className="material-symbols-outlined -mt-1 text-4xl text-tertiary drop-shadow-lg rotate-180" style={{ fontVariationSettings: "'FILL' 1" }}>
        arrow_upward
      </span>
    </span>
  );
}

interface MissionPopupProps {
  mission: MissionItem;
  step: number;
  total: number;
  onClose: () => void;
}

function MissionPopup({ mission, step, total, onClose }: MissionPopupProps) {
  return (
    <div className="absolute inset-0 z-40 bg-black/35 backdrop-blur-[2px] flex items-start justify-center p-6 pt-20">
      <div className="w-full max-w-xl bg-surface-container-lowest rounded-[2rem] shadow-2xl border-b-[8px] border-primary-container p-8 text-center relative animate-[pop_0.25s_ease-out]">
        <button
          type="button"
          onClick={onClose}
          className="absolute top-5 right-5 w-12 h-12 rounded-full bg-surface-container-high text-on-surface-variant hover:bg-error-container hover:text-error flex items-center justify-center transition-colors"
          aria-label="미션 안내 닫기"
        >
          <span className="material-symbols-outlined">close</span>
        </button>

        <div className="mx-auto mb-5 w-20 h-20 rounded-full bg-primary-container text-on-primary-container flex items-center justify-center shadow-[0_6px_0_rgba(0,78,118,0.25)]">
          <span className="material-symbols-outlined text-5xl" style={{ fontVariationSettings: "'FILL' 1" }}>
            flag
          </span>
        </div>

        <p className="font-label-bold text-label-bold text-primary mb-2">
          브라우저 미션 {step} / {total}
        </p>
        <h2 className="font-headline-md text-headline-md text-on-surface mb-4">{mission.label}</h2>
        <p className="font-body-xl text-body-xl text-on-surface-variant mb-6">{mission.description}</p>

        <div className="flex items-center justify-center gap-3 flex-wrap">
          <SpeakButton text={`${mission.label} ${mission.description}`} />
          <button
            type="button"
            onClick={onClose}
            className="px-8 py-4 bg-primary text-on-primary rounded-full font-label-bold text-label-bold shadow-[0_4px_0_rgb(0,78,118)] active:translate-y-1 active:shadow-none transition-all"
          >
            알겠어요! 해볼게요
          </button>
        </div>
      </div>
    </div>
  );
}

interface MissionTopBarProps {
  mission: MissionItem;
  step: number;
  total: number;
  onOpen: () => void;
}

function MissionTopBar({ mission, step, total, onOpen }: MissionTopBarProps) {
  return (
    <div className="absolute top-3 left-1/2 -translate-x-1/2 z-30 w-[min(92%,560px)] bg-surface-container-lowest/95 backdrop-blur rounded-2xl border-2 border-primary-container shadow-xl px-5 py-3 text-center">
      <div className="flex items-center justify-between gap-3">
        <div className="text-left min-w-0">
          <p className="font-label-bold text-xs text-primary">
            미션 {step} / {total}
          </p>
          <p className="font-label-bold text-label-bold text-on-surface truncate">{mission.label}</p>
        </div>
        <button
          type="button"
          onClick={onOpen}
          className="flex-shrink-0 px-4 py-2 rounded-full bg-primary-container text-on-primary-container font-label-bold text-sm hover:bg-primary hover:text-on-primary transition-colors"
        >
          다시 보기
        </button>
      </div>
    </div>
  );
}

function MissionArrow({ missionId }: { missionId: MissionId }) {
  const position: Record<MissionId, string> = {
    address: 'top-[145px] left-[58%]',
    search: 'top-[410px] left-1/2',
    back: 'top-[145px] left-[44px]',
    forward: 'top-[145px] left-[92px]',
    refresh: 'top-[145px] left-[140px]',
    newtab: 'top-[58px] left-[250px]',
    closetab: 'top-[65px] left-[175px]',
  };

  const label: Record<MissionId, string> = {
    address: '여기에 주소를 입력해요',
    search: '여기에 검색어를 입력해요',
    back: '이 버튼을 눌러요',
    forward: '이 버튼을 눌러요',
    refresh: '이 버튼을 눌러요',
    newtab: '+ 버튼을 눌러요',
    closetab: '탭의 ✕를 눌러요',
  };

  return (
    <div
      className={`pointer-events-none absolute ${position[missionId]} z-20 -translate-x-1/2 flex flex-col items-center animate-[bounce_1.1s_ease-in-out_infinite]`}
      aria-hidden="true"
    >
      <div className="bg-tertiary-fixed text-on-tertiary-fixed px-4 py-2 rounded-full font-label-bold text-sm shadow-lg border-2 border-surface-container-lowest whitespace-nowrap">
        {label[missionId]}
      </div>
      <span className="material-symbols-outlined text-[64px] text-tertiary drop-shadow-lg rotate-180" style={{ fontVariationSettings: "'FILL' 1" }}>
        arrow_upward
      </span>
    </div>
  );
}

interface WindowButtonProps {
  icon: string;
  label: string;
  onClick: () => void;
  danger?: boolean;
}

function WindowButton({ icon, label, onClick, danger }: WindowButtonProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      title={label}
      aria-label={label}
      className={`w-12 h-full flex items-center justify-center transition-colors ${
        danger ? 'hover:bg-[#e81123]' : 'hover:bg-white/15'
      }`}
    >
      <span className="material-symbols-outlined text-[18px] text-white">{icon}</span>
    </button>
  );
}

function highlightTarget(current: PreviewTarget, expected: PreviewTarget): string {
  return current === expected
    ? 'ring-4 ring-tertiary-fixed bg-tertiary-fixed text-on-tertiary-fixed scale-110 z-10'
    : '';
}

function BrowserChromePreview({
  activeIcon,
  activeTitle,
  target,
}: {
  activeIcon: string;
  activeTitle: string;
  target: PreviewTarget;
}) {
  return (
    <div className="w-full max-w-2xl rounded-xl overflow-hidden shadow-xl border border-outline-variant bg-white text-left">
      <div className="h-10 bg-[#3c4043] text-white flex items-center justify-between pl-3">
        <div className="flex items-center gap-2 text-sm">
          <span className="material-symbols-outlined text-base">{activeIcon}</span>
          <span className="font-label-bold truncate">{activeTitle}</span>
        </div>
        <div className="flex h-full">
          <span className={`w-10 h-full flex items-center justify-center transition-all ${highlightTarget(target, 'minimize')}`}>
            <span className="material-symbols-outlined text-base">remove</span>
          </span>
          <span className={`w-10 h-full flex items-center justify-center transition-all ${highlightTarget(target, 'maximize')}`}>
            <span className="material-symbols-outlined text-base">crop_square</span>
          </span>
          <span
            className={`w-10 h-full flex items-center justify-center transition-all ${
              target === 'windowClose' ? 'ring-4 ring-tertiary-fixed bg-[#e81123] text-white scale-110 z-10' : 'bg-[#e81123]'
            }`}
          >
            <span className="material-symbols-outlined text-base">close</span>
          </span>
        </div>
      </div>
      <div className="h-11 bg-[#3c4043] flex items-end px-3 gap-1">
        <div className="h-9 w-40 rounded-t-xl bg-white flex items-center gap-2 px-3">
          <span className="material-symbols-outlined text-sm text-primary">public</span>
          <span className="text-xs font-label-bold text-on-surface truncate">새 탭</span>
          <span
            className={`material-symbols-outlined text-sm ml-auto text-on-surface-variant rounded-full transition-all ${
              target === 'closetab' ? 'ring-4 ring-tertiary-fixed bg-tertiary-fixed text-on-tertiary-fixed scale-125' : ''
            }`}
          >
            close
          </span>
        </div>
        <div
          className={`h-8 w-8 mb-1 rounded-full bg-white/10 text-white flex items-center justify-center transition-all ${
            highlightTarget(target, 'newtab')
          }`}
        >
          <span className="material-symbols-outlined text-base">add</span>
        </div>
      </div>
      <div className="h-12 bg-white flex items-center gap-2 px-3 border-b">
        <span className={`material-symbols-outlined text-on-surface-variant rounded-full p-1 transition-all ${highlightTarget(target, 'back')}`}>
          arrow_back
        </span>
        <span className={`material-symbols-outlined text-on-surface-variant rounded-full p-1 transition-all ${highlightTarget(target, 'forward')}`}>
          arrow_forward
        </span>
        <span className={`material-symbols-outlined text-on-surface-variant rounded-full p-1 transition-all ${highlightTarget(target, 'refresh')}`}>
          refresh
        </span>
        <span className={`material-symbols-outlined text-on-surface-variant rounded-full p-1 transition-all ${highlightTarget(target, 'home')}`}>
          home
        </span>
        <div className="flex-1 h-8 bg-surface-container rounded-full flex items-center px-3 text-sm text-on-surface-variant">
          <span className="material-symbols-outlined text-base mr-2">search</span>
          주소창
        </div>
      </div>
    </div>
  );
}

interface SiteContentProps {
  currentPage: SitePage;
  currentMissionId: MissionId;
  searchInput: string;
  searchResult: string | null;
  onSearchInput: (value: string) => void;
  onSearch: () => void;
}

function SiteContent({ currentPage, currentMissionId, searchInput, searchResult, onSearchInput, onSearch }: SiteContentProps) {
  if (currentPage.domain === 'google.com') {
    return (
      <SiteShell>
        <div className="w-full max-w-3xl flex flex-col items-center text-center gap-8">
          <div className="text-[64px] md:text-[88px] font-black tracking-tight">
            <span className="text-[#4285f4]">G</span>
            <span className="text-[#ea4335]">o</span>
            <span className="text-[#fbbc05]">o</span>
            <span className="text-[#4285f4]">g</span>
            <span className="text-[#34a853]">l</span>
            <span className="text-[#ea4335]">e</span>
          </div>
          <SearchBox
            value={searchInput}
            onValue={onSearchInput}
            onSearch={onSearch}
            pulsing={currentMissionId === 'search'}
            placeholder="Google 검색 또는 URL 입력"
            buttonLabel="Google 검색"
            className="rounded-full border border-outline-variant shadow-[0_3px_12px_rgba(0,0,0,0.12)]"
          />
          <SearchResult result={searchResult} />
        </div>
      </SiteShell>
    );
  }

  if (currentPage.domain === 'naver.com') {
    return (
      <SiteShell>
        <div className="w-full max-w-3xl flex flex-col items-center text-center gap-8">
          <h3 className="text-[64px] md:text-[84px] font-black text-[#03c75a] tracking-tight">NAVER</h3>
          <SearchBox
            value={searchInput}
            onValue={onSearchInput}
            onSearch={onSearch}
            pulsing={currentMissionId === 'search'}
            placeholder="검색어를 입력하세요"
            buttonLabel="검색"
            className="rounded-md border-[3px] border-[#03c75a]"
            buttonClassName="bg-[#03c75a] text-white"
          />
          <div className="grid grid-cols-3 gap-3 text-sm text-on-surface-variant">
            {['뉴스', '카페', '블로그', '지도', '웹툰', '메일'].map((item) => (
              <div key={item} className="bg-surface-container-low rounded-lg px-4 py-3 font-label-bold">{item}</div>
            ))}
          </div>
          <SearchResult result={searchResult} />
        </div>
      </SiteShell>
    );
  }

  if (currentPage.domain === 'youtube.com') {
    return (
      <SiteShell>
        <div className="w-full max-w-4xl flex flex-col gap-8">
          <div className="flex items-center gap-3">
            <div className="w-14 h-10 bg-[#ff0000] rounded-xl flex items-center justify-center text-white">
              <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>play_arrow</span>
            </div>
            <h3 className="text-4xl font-black text-on-surface">YouTube</h3>
          </div>
          <SearchBox
            value={searchInput}
            onValue={onSearchInput}
            onSearch={onSearch}
            pulsing={currentMissionId === 'search'}
            placeholder="동영상 검색"
            buttonLabel="검색"
            className="rounded-full border border-outline-variant"
            buttonClassName="bg-surface-container-high text-on-surface"
          />
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {[1, 2, 3].map((n) => (
              <div key={n} className="bg-surface-container-low rounded-xl overflow-hidden">
                <div className="h-28 bg-error-container flex items-center justify-center text-error">
                  <span className="material-symbols-outlined text-5xl">play_circle</span>
                </div>
                <div className="p-3 text-sm font-label-bold">연습 동영상 {n}</div>
              </div>
            ))}
          </div>
          <SearchResult result={searchResult} />
        </div>
      </SiteShell>
    );
  }

  if (currentPage.domain === 'daum.net') {
    return (
      <SiteShell>
        <div className="w-full max-w-3xl flex flex-col items-center text-center gap-8">
          <h3 className="text-[64px] font-black text-[#4c6fff]">Daum</h3>
          <SearchBox
            value={searchInput}
            onValue={onSearchInput}
            onSearch={onSearch}
            pulsing={currentMissionId === 'search'}
            placeholder="Daum 검색"
            buttonLabel="검색"
            className="rounded-full border-[3px] border-[#4c6fff]"
            buttonClassName="bg-[#4c6fff] text-white"
          />
          <SearchResult result={searchResult} />
        </div>
      </SiteShell>
    );
  }

  return (
    <SiteShell>
      <div className="max-w-2xl text-center z-10 flex flex-col items-center gap-6 w-full">
        <div className={`w-28 h-28 rounded-[3rem] flex items-center justify-center shadow-lg border-b-8 transform rotate-3 ${
          currentPage.color === 'primary' ? 'bg-primary-fixed border-primary-fixed-dim text-primary'
            : currentPage.color === 'secondary' ? 'bg-secondary-fixed border-secondary-fixed-dim text-secondary'
            : currentPage.color === 'tertiary' ? 'bg-tertiary-fixed border-tertiary-fixed-dim text-tertiary'
            : 'bg-error-container border-error text-error'
        }`}>
          <span className="material-symbols-outlined text-[56px]" style={{ fontVariationSettings: "'FILL' 1" }}>{currentPage.icon}</span>
        </div>

        <h3 className="font-display-lg text-display-lg text-primary">{currentPage.title}</h3>
        <p className="font-body-lg text-body-lg text-on-surface-variant max-w-md">{currentPage.body}</p>
      </div>
    </SiteShell>
  );
}

function SiteShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex-grow bg-white relative overflow-hidden flex items-center justify-center p-6">
      <div className="absolute inset-0 opacity-10 pointer-events-none" style={{ backgroundImage: 'radial-gradient(circle at 50% 50%, #70c1ff 0%, transparent 60%)' }} />
      <div className="z-10 w-full flex justify-center">{children}</div>
    </div>
  );
}

interface SearchBoxProps {
  value: string;
  onValue: (value: string) => void;
  onSearch: () => void;
  pulsing: boolean;
  placeholder: string;
  buttonLabel: string;
  className?: string;
  buttonClassName?: string;
}

function SearchBox({ value, onValue, onSearch, pulsing, placeholder, buttonLabel, className = '', buttonClassName = 'bg-primary-container text-on-primary-container' }: SearchBoxProps) {
  return (
    <div className={`relative w-full max-w-xl bg-white flex items-center px-4 md:px-5 shadow-[0_8px_30px_rgb(0,0,0,0.05)] transition-all cursor-text group ${className} ${pulsing ? 'ring-4 ring-primary-fixed' : ''}`}>
      <span className="material-symbols-outlined text-2xl text-outline-variant mr-3 group-focus-within:text-primary">search</span>
      <input
        type="text"
        value={value}
        onChange={(e) => onValue(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === 'Enter') onSearch();
        }}
        className="bg-transparent border-none outline-none w-full font-body-lg text-body-lg text-on-surface placeholder-outline-variant h-16"
        placeholder={placeholder}
        aria-label="검색어"
      />
      <button
        type="button"
        onClick={onSearch}
        className={`min-w-16 h-10 rounded-full flex items-center justify-center shadow-sm px-4 font-label-bold text-sm transition-colors ${buttonClassName}`}
        aria-label={buttonLabel}
      >
        {buttonLabel}
      </button>
      {pulsing && <InlineIndicator label="검색창" />}
    </div>
  );
}

function SearchResult({ result }: { result: string | null }) {
  if (!result) return null;
  return (
    <div className="bg-secondary-container text-on-secondary-container px-6 py-4 rounded-2xl font-label-bold text-label-bold animate-[pop_0.4s_ease-out]">
      {result}
    </div>
  );
}
