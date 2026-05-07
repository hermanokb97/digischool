import { DragEvent, useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { playClick, playFail, playSuccess } from '@/lib/sound';
import { cn } from '@/lib/utils';

const TARGET_COUNT = 3;

const BALLOON_COLORS = ['bg-error-container', 'bg-tertiary-fixed', 'bg-secondary-fixed'];
const BALLOON_ICON_COLORS = ['text-error', 'text-tertiary', 'text-secondary'];
const TOY_ICONS = ['toys', 'sports_basketball', 'extension'];

type BasicMission = 'balloon' | 'box' | 'toy';

export function MousePractice() {
  const navigate = useNavigate();

  const [activeMission, setActiveMission] = useState<BasicMission>('balloon');
  const [balloonsLeft, setBalloonsLeft] = useState(TARGET_COUNT);
  const [boxOpenCount, setBoxOpenCount] = useState(0);
  const [boxOpenAnim, setBoxOpenAnim] = useState(false);
  const [boxShake, setBoxShake] = useState(false);
  const [toysInBox, setToysInBox] = useState(0);
  const [hint, setHint] = useState<string | null>(null);
  const [navigating, setNavigating] = useState(false);
  const hintTimerRef = useRef<number | null>(null);
  const advanceTimerRef = useRef<number | null>(null);
  const startedAtRef = useRef(Date.now());

  const balloonsDone = balloonsLeft === 0;
  const boxDone = boxOpenCount >= TARGET_COUNT;
  const toyDone = toysInBox >= TARGET_COUNT;
  const basicDone = balloonsDone && boxDone && toyDone;
  const desktopCtaTextClass = basicDone ? 'text-on-secondary-container' : 'text-on-surface';

  useEffect(() => {
    return () => {
      if (hintTimerRef.current) window.clearTimeout(hintTimerRef.current);
      if (advanceTimerRef.current) window.clearTimeout(advanceTimerRef.current);
    };
  }, []);

  const showHint = (msg: string) => {
    setHint(msg);
    if (hintTimerRef.current) window.clearTimeout(hintTimerRef.current);
    hintTimerRef.current = window.setTimeout(() => setHint(null), 1800);
  };

  const advanceToMission = (next: BasicMission) => {
    if (advanceTimerRef.current) window.clearTimeout(advanceTimerRef.current);
    advanceTimerRef.current = window.setTimeout(() => {
      setActiveMission(next);
      setHint(null);
    }, 700);
  };

  const handleBalloonClick = () => {
    if (activeMission !== 'balloon' || balloonsDone) return;
    const next = Math.max(0, balloonsLeft - 1);
    setBalloonsLeft(next);
    playSuccess();
    if (next === 0) advanceToMission('box');
  };

  const handleBoxClickSingle = () => {
    if (activeMission !== 'box' || boxOpenAnim || boxDone) return;
    setBoxShake(true);
    playFail();
    showHint('빠르게 두 번 클릭해 보세요!');
    window.setTimeout(() => setBoxShake(false), 400);
  };

  const handleBoxDoubleClick = () => {
    if (activeMission !== 'box' || boxOpenAnim || boxDone) return;
    const next = Math.min(TARGET_COUNT, boxOpenCount + 1);
    setBoxOpenAnim(true);
    setBoxOpenCount(next);
    playSuccess();
    window.setTimeout(() => setBoxOpenAnim(false), 700);
    if (next >= TARGET_COUNT) advanceToMission('toy');
  };

  const handleDragStart = (e: DragEvent<HTMLDivElement>, idx: number) => {
    if (activeMission !== 'toy') return;
    e.dataTransfer.setData('text/plain', `toy:${idx}`);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const handleDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    if (activeMission !== 'toy' || toyDone) return;
    const data = e.dataTransfer.getData('text/plain');
    if (data.startsWith('toy:')) {
      setToysInBox((current) => Math.min(TARGET_COUNT, current + 1));
      playSuccess();
    }
  };

  const handleNext = () => {
    if (!basicDone || navigating) return;
    setNavigating(true);
    playClick();
    navigate('/mouse/desktop', { state: { startedAt: startedAtRef.current } });
  };

  const resetMission = (mission: BasicMission) => {
    playClick();
    if (advanceTimerRef.current) window.clearTimeout(advanceTimerRef.current);
    if (mission === 'balloon') {
      setBalloonsLeft(TARGET_COUNT);
      setBoxOpenCount(0);
      setToysInBox(0);
      setActiveMission('balloon');
    }
    if (mission === 'box') {
      setBoxOpenCount(0);
      setToysInBox(0);
      setActiveMission('box');
    }
    if (mission === 'toy') {
      setToysInBox(0);
      setActiveMission('toy');
    }
    startedAtRef.current = Date.now();
    setNavigating(false);
  };

  const activeMissionTitle =
    activeMission === 'balloon' ? '미션 1: 풍선 터트리기' : activeMission === 'box' ? '미션 2: 상자 열기' : '미션 3: 장난감 정리하기';

  return (
    <div className="max-w-7xl w-full mx-auto flex flex-col gap-8 md:pt-12">
      <section className="flex flex-col gap-4 text-center items-center">
        <h1 className="font-display-lg text-display-lg text-primary">마우스 놀이터</h1>
        <p className="font-body-xl text-body-xl text-on-surface-variant max-w-2xl">
          마우스를 사용해서 여러 가지 재미있는 미션을 성공해보세요! 클릭, 더블클릭, 드래그를 차례로 연습해요.
        </p>
        <ProgressBadges active={activeMission} balloon={balloonsDone} box={boxDone} toy={toyDone} />
      </section>

      <section className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <InfoCard active={activeMission === 'balloon'} icon="ads_click" title="클릭" body="마우스 왼쪽 버튼을 한 번 눌러요. 선택하거나 버튼을 누를 때 사용해요." />
        <InfoCard active={activeMission === 'box'} icon="touch_app" title="더블 클릭" body="빠르게 두 번 눌러요. 바탕화면에서 폴더나 파일을 열 때 자주 사용해요." />
        <InfoCard active={activeMission === 'toy'} icon="open_with" title="드래그" body="마우스를 누른 채 움직여요. 파일을 옮기거나 여러 개를 선택할 때 사용해요." />
      </section>

      <section className="bg-surface-container-lowest rounded-xl shadow-[0_8px_28px_rgba(0,0,0,0.06)] p-gutter border-b-[5px] border-primary-fixed-dim min-h-[480px] flex flex-col gap-6 relative">
        <div className="text-center">
          <span className="inline-flex items-center gap-2 rounded-full bg-primary-container px-4 py-1 font-label-bold text-label-bold text-on-primary-container">
            <span className="material-symbols-outlined text-base">{activeMission === 'balloon' ? 'ads_click' : activeMission === 'box' ? 'touch_app' : 'open_with'}</span>
            {activeMissionTitle}
          </span>
        </div>

        {activeMission === 'balloon' && (
          <article className="flex flex-1 flex-col items-center gap-6">
            <div className="flex flex-col items-center gap-2 text-center">
              <h2 className="font-headline-md text-headline-md text-on-surface">풍선 터트리기</h2>
              <p className="font-body-lg text-body-lg text-on-surface-variant">
                풍선을 <b>한 번씩 클릭</b>해서 모두 터트려보세요!
              </p>
              <span className="font-label-bold text-label-bold text-primary">({TARGET_COUNT - balloonsLeft}/{TARGET_COUNT})</span>
            </div>
            <div className="flex-grow w-full bg-surface-container-low rounded-lg border-2 border-dashed border-outline-variant relative overflow-hidden flex flex-wrap gap-5 items-center justify-center p-6">
              {balloonsDone ? (
                <MissionDone icon="celebration" label="전부 펑!" onReset={() => resetMission('balloon')} resetLabel="다시 풍선 띄우기" />
              ) : (
                Array.from({ length: balloonsLeft }).map((_, i) => {
                  const colorIdx = (TARGET_COUNT - balloonsLeft + i) % BALLOON_COLORS.length;
                  return (
                    <button
                      key={i}
                      type="button"
                      onClick={handleBalloonClick}
                      className={`w-24 h-32 ${BALLOON_COLORS[colorIdx]} rounded-full shadow-md flex items-center justify-center hover:scale-110 active:scale-95 transition-transform cursor-pointer relative animate-[bob_2s_ease-in-out_infinite]`}
                      style={{ animationDelay: `${i * 0.2}s` }}
                      aria-label={`풍선 ${i + 1} 클릭하기`}
                    >
                      <div className="absolute -bottom-6 left-1/2 w-0.5 h-7 bg-outline-variant -translate-x-1/2" />
                      <span
                        className={`material-symbols-outlined text-4xl ${BALLOON_ICON_COLORS[colorIdx]}`}
                        style={{ fontVariationSettings: "'FILL' 1" }}
                      >
                        celebration
                      </span>
                    </button>
                  );
                })
              )}
            </div>
          </article>
        )}

        {activeMission === 'box' && (
          <article className="flex flex-1 flex-col items-center gap-6 relative">
            <div className="flex flex-col items-center gap-2 text-center">
              <h2 className="font-headline-md text-headline-md text-on-surface">상자 열기</h2>
              <p className="font-body-lg text-body-lg text-on-surface-variant">
                상자를 <b>빠르게 두 번 클릭(더블클릭)</b>해서 모두 열어보세요!
              </p>
              <span className="font-label-bold text-label-bold text-primary">({boxOpenCount}/{TARGET_COUNT})</span>
            </div>
            <div className="flex-grow w-full bg-surface-container-low rounded-lg border-2 border-dashed border-outline-variant relative overflow-hidden flex items-center justify-center p-6">
              {boxDone ? (
                <MissionDone icon="redeem" label="선물 다 열었어요!" onReset={() => resetMission('box')} resetLabel="상자 다시 가져오기" />
              ) : (
                <button
                  type="button"
                  onClick={handleBoxClickSingle}
                  onDoubleClick={handleBoxDoubleClick}
                  className={`w-40 h-40 bg-secondary text-on-secondary rounded-lg shadow-md flex items-center justify-center transition-all cursor-pointer ${
                    boxShake ? 'animate-[shake_0.4s_ease-in-out]' : boxOpenAnim ? 'animate-[pop_0.6s_ease-out]' : 'hover:scale-105'
                  }`}
                  aria-label={`상자 ${boxOpenCount + 1}번째 열기`}
                >
                  <span className="material-symbols-outlined text-6xl" style={{ fontVariationSettings: "'FILL' 1" }}>
                    {boxOpenAnim ? 'redeem' : 'inventory_2'}
                  </span>
                </button>
              )}
            </div>
            {hint && !boxDone && (
              <div className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-on-surface text-inverse-on-surface text-sm font-label-bold px-4 py-2 rounded-full shadow-lg whitespace-nowrap">
                {hint}
              </div>
            )}
          </article>
        )}

        {activeMission === 'toy' && (
          <article className="flex flex-1 flex-col items-center gap-6">
            <div className="flex flex-col items-center gap-2 text-center">
              <h2 className="font-headline-md text-headline-md text-on-surface">장난감 정리하기</h2>
              <p className="font-body-lg text-body-lg text-on-surface-variant">
                장난감을 <b>드래그(누른 채로 끌기)</b>해서 모두 상자에 넣어보세요!
              </p>
              <span className="font-label-bold text-label-bold text-primary">({toysInBox}/{TARGET_COUNT})</span>
            </div>
            <div className="flex-grow w-full bg-surface-container-low rounded-lg border-2 border-dashed border-outline-variant relative p-5 flex flex-col justify-between gap-4">
              <div className="flex gap-4 flex-wrap">
                {Array.from({ length: TARGET_COUNT - toysInBox }).map((_, i) => {
                  const idx = toysInBox + i;
                  return (
                    <div
                      key={idx}
                      draggable
                      onDragStart={(e) => handleDragStart(e, idx)}
                      className="w-20 h-20 bg-primary-fixed text-on-primary-fixed rounded-full shadow-md flex items-center justify-center cursor-grab active:cursor-grabbing hover:scale-110 transition-transform"
                      aria-label={`장난감 ${idx + 1} 드래그`}
                    >
                      <span className="material-symbols-outlined text-4xl">{TOY_ICONS[idx % TOY_ICONS.length]}</span>
                    </div>
                  );
                })}
                {toyDone && <MissionDone icon="task_alt" label="정리 완료!" onReset={() => resetMission('toy')} resetLabel="장난감 다시 꺼내기" compact />}
              </div>
              <div
                onDragOver={handleDragOver}
                onDrop={handleDrop}
                className={`w-full min-h-36 rounded-lg border-4 border-dashed flex items-center justify-center font-label-bold text-label-bold transition-colors ${
                  toyDone
                    ? 'bg-secondary-container border-secondary text-on-secondary-container'
                    : 'bg-surface-container-highest border-outline-variant text-on-surface-variant hover:bg-primary-container hover:border-primary'
                }`}
              >
                {toyDone ? (
                  <span className="flex items-center gap-2">
                    <span className="material-symbols-outlined">check_circle</span> 정리 완료!
                  </span>
                ) : (
                  `장난감 상자 (${toysInBox}/${TARGET_COUNT})`
                )}
              </div>
            </div>
          </article>
        )}
      </section>

      <section
        className={`mt-8 rounded-xl p-8 flex flex-col items-center justify-center text-center gap-4 relative overflow-hidden transition-all ${
          basicDone ? 'bg-secondary-container' : 'bg-surface-container-low'
        }`}
      >
        <div className="absolute inset-0 opacity-10 flex items-center justify-center pointer-events-none">
          <span className="material-symbols-outlined text-[200px]" style={{ fontVariationSettings: "'FILL' 1" }}>
            celebration
          </span>
        </div>
        <span className={`material-symbols-outlined text-6xl ${desktopCtaTextClass} z-10`} style={{ fontVariationSettings: "'FILL' 1" }}>
          stars
        </span>
        <span className="bg-primary-container text-on-primary-container font-label-bold text-label-bold px-4 py-1 rounded-full z-10">
          바탕화면 시뮬레이션
        </span>
        <h3 className={`font-display-lg text-display-lg ${desktopCtaTextClass} z-10`}>
          {basicDone ? '실제 컴퓨터처럼 연습해요' : '기초 미션을 차례대로 끝내면 열려요'}
        </h3>
        <p className={`font-body-xl text-body-xl ${desktopCtaTextClass} z-10`}>
          {basicDone ? '폴더 열기, 파일 옮기기, 여러 개 선택하기를 이어서 해봐요.' : '풍선, 상자, 장난감 미션을 순서대로 완료해 주세요.'}
        </p>
        <button
          type="button"
          onClick={handleNext}
          disabled={!basicDone || navigating}
          className="mt-4 px-8 py-4 bg-secondary text-on-secondary rounded-full font-label-bold text-label-bold shadow-[0_4px_0_rgba(0,0,0,0.1)] active:shadow-none active:translate-y-[4px] transition-all z-10 disabled:opacity-40 disabled:cursor-not-allowed disabled:active:translate-y-0"
        >
          바탕화면 시뮬레이션 하기
        </button>
      </section>

      <style>{`
        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          25% { transform: translateX(-8px); }
          75% { transform: translateX(8px); }
        }
        @keyframes pop {
          0% { transform: scale(0.5); opacity: 0; }
          50% { transform: scale(1.2); }
          100% { transform: scale(1); opacity: 1; }
        }
        @keyframes bob {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-10px); }
        }
      `}</style>
    </div>
  );
}

function MissionDone({
  icon,
  label,
  resetLabel,
  compact,
  onReset,
}: {
  icon: string;
  label: string;
  resetLabel: string;
  compact?: boolean;
  onReset: () => void;
}) {
  return (
    <div className={cn('flex flex-col items-center gap-2 animate-[pop_0.5s_ease-out]', compact ? 'p-2' : '')}>
      <span className="material-symbols-outlined text-7xl text-secondary" style={{ fontVariationSettings: "'FILL' 1" }}>
        {icon}
      </span>
      <span className="font-headline-md text-headline-md text-secondary">{label}</span>
      <button
        type="button"
        onClick={onReset}
        className="mt-2 px-4 py-2 rounded-full bg-surface-container-high text-on-surface font-label-bold text-sm hover:bg-surface-variant transition-colors"
      >
        <span className="material-symbols-outlined text-base align-middle mr-1">refresh</span>
        {resetLabel}
      </button>
    </div>
  );
}

function ProgressBadges({ active, balloon, box, toy }: { active: BasicMission; balloon: boolean; box: boolean; toy: boolean }) {
  const items: Array<{ id: BasicMission; label: string; done: boolean; icon: string }> = [
    { id: 'balloon', label: '풍선', done: balloon, icon: 'celebration' },
    { id: 'box', label: '상자', done: box, icon: 'inventory_2' },
    { id: 'toy', label: '장난감', done: toy, icon: 'toys' },
  ];
  return (
    <div className="flex gap-2 flex-wrap justify-center">
      {items.map((it) => {
        const isActive = it.id === active && !it.done;
        return (
          <div
            key={it.label}
            className={`flex items-center gap-2 px-4 py-2 rounded-full font-label-bold text-sm transition-colors ${
              it.done
                ? 'bg-secondary text-on-secondary'
                : isActive
                ? 'bg-primary text-on-primary ring-4 ring-primary-container'
                : 'bg-surface-container-high text-on-surface-variant'
            }`}
          >
            <span
              className="material-symbols-outlined text-base"
              style={{ fontVariationSettings: it.done || isActive ? "'FILL' 1" : "'FILL' 0" }}
            >
              {it.done ? 'check_circle' : it.icon}
            </span>
            {it.label}
          </div>
        );
      })}
    </div>
  );
}

function InfoCard({ icon, title, body, active }: { icon: string; title: string; body: string; active?: boolean }) {
  return (
    <div
      className={cn(
        'bg-surface-container-lowest rounded-xl p-5 border-2 shadow-sm text-center transition-colors',
        active ? 'border-primary-fixed bg-primary-container/35' : 'border-surface-container-highest',
      )}
    >
      <span className="material-symbols-outlined text-4xl text-primary" style={{ fontVariationSettings: active ? "'FILL' 1" : "'FILL' 0" }}>
        {icon}
      </span>
      <h3 className="font-headline-md text-headline-md text-on-surface mt-2">{title}</h3>
      <p className="font-body-lg text-body-lg text-on-surface-variant text-sm mt-2">{body}</p>
    </div>
  );
}
