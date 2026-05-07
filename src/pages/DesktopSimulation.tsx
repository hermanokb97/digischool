import { DragEvent, PointerEvent as ReactPointerEvent, useEffect, useRef, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useUser } from '@/context/UserContext';
import { playClick, playFail, playFanfare, playSuccess } from '@/lib/sound';
import { saveStudyResult } from '@/lib/evaluation';
import { cn } from '@/lib/utils';
import {
  DesktopIconTile,
  DesktopTaskChip,
  DesktopTaskbarAppButton,
  DesktopWindow,
  VirtualDesktopFrame,
} from '@/components/VirtualDesktop';

interface DesktopRouteState {
  startedAt?: number;
}

interface SelectionDrag {
  startX: number;
  startY: number;
  currentX: number;
  currentY: number;
}

type DesktopItem = 'folder' | 'file' | 'photo1' | 'photo2';
type DesktopWindowState = 'closed' | 'open' | 'minimized';
type DesktopAppWindow = 'folder';

function rectsIntersect(a: DOMRect | { left: number; top: number; right: number; bottom: number }, b: DOMRect): boolean {
  return a.left < b.right && a.right > b.left && a.top < b.bottom && a.bottom > b.top;
}

export function DesktopSimulation() {
  const navigate = useNavigate();
  const location = useLocation();
  const { markComplete } = useUser();
  const routeState = location.state as DesktopRouteState | null;

  const [folderOpened, setFolderOpened] = useState(false);
  const [folderWindowState, setFolderWindowState] = useState<DesktopWindowState>('closed');
  const [folderMaximized, setFolderMaximized] = useState(false);
  const [activeWindow, setActiveWindow] = useState<DesktopAppWindow | null>(null);
  const [desktopFileMoved, setDesktopFileMoved] = useState(false);
  const [desktopMultiSelected, setDesktopMultiSelected] = useState(false);
  const [computerShutdown, setComputerShutdown] = useState(false);
  const [startMenuOpen, setStartMenuOpen] = useState(false);
  const [powerMenuOpen, setPowerMenuOpen] = useState(false);
  const [selectedDesktopItem, setSelectedDesktopItem] = useState<DesktopItem | null>(null);
  const [selectionDrag, setSelectionDrag] = useState<SelectionDrag | null>(null);
  const [filePointerDragging, setFilePointerDragging] = useState(false);
  const [navigating, setNavigating] = useState(false);
  const folderIconRef = useRef<HTMLDivElement | null>(null);
  const folderDropZoneRef = useRef<HTMLDivElement | null>(null);
  const selectionAreaRef = useRef<HTMLDivElement | null>(null);
  const photoOneRef = useRef<HTMLDivElement | null>(null);
  const photoTwoRef = useRef<HTMLDivElement | null>(null);
  const desktopFileMovedRef = useRef(false);
  const filePointerDragRef = useRef(false);
  const filePointerStartRef = useRef<{ x: number; y: number } | null>(null);
  const selectionDragRef = useRef<SelectionDrag | null>(null);
  const completedRef = useRef(false);
  const startedAtRef = useRef(routeState?.startedAt ?? Date.now());

  const desktopWorkDone = folderOpened && desktopFileMoved && desktopMultiSelected;
  const desktopDone = desktopWorkDone && computerShutdown;
  const folderWindowVisible = folderOpened && folderWindowState === 'open';

  useEffect(() => {
    if (desktopDone && !completedRef.current) {
      completedRef.current = true;
      saveStudyResult('mouse', startedAtRef.current);
      playFanfare();
      markComplete('mouse');
    }
  }, [desktopDone, markComplete]);

  useEffect(() => {
    const handleWindowPointerMove = (e: PointerEvent) => {
      updateSelectionDragFromPoint(e);
    };
    const handleWindowPointerUp = (e: PointerEvent) => {
      finishSelectionDrag(e);
      finishFilePointerDrag(e);
    };

    window.addEventListener('pointermove', handleWindowPointerMove);
    window.addEventListener('pointerup', handleWindowPointerUp);
    window.addEventListener('pointercancel', handleWindowPointerUp);
    return () => {
      window.removeEventListener('pointermove', handleWindowPointerMove);
      window.removeEventListener('pointerup', handleWindowPointerUp);
      window.removeEventListener('pointercancel', handleWindowPointerUp);
    };
  }, []);

  function setActiveSelectionDrag(next: SelectionDrag | null) {
    selectionDragRef.current = next;
    setSelectionDrag(next);
  }

  function getFallbackActiveWindow(excluding?: DesktopAppWindow): DesktopAppWindow | null {
    if (excluding !== 'folder' && folderOpened && folderWindowState === 'open') return 'folder';
    return null;
  }

  function moveFileIntoFolder() {
    if (desktopFileMovedRef.current) return;
    desktopFileMovedRef.current = true;
    setDesktopFileMoved(true);
    setSelectedDesktopItem(null);
    playSuccess();
  }

  const selectDesktopItem = (item: DesktopItem) => {
    setStartMenuOpen(false);
    setPowerMenuOpen(false);
    setSelectedDesktopItem(item);
  };

  const handleFolderDoubleClick = () => {
    const firstOpen = !folderOpened;
    setFolderOpened(true);
    setFolderWindowState('open');
    setActiveWindow('folder');
    setStartMenuOpen(false);
    setPowerMenuOpen(false);
    setSelectedDesktopItem('folder');
    if (firstOpen) {
      playSuccess();
    } else {
      playClick();
    }
  };

  const handleStartMenuClick = () => {
    playClick();
    setStartMenuOpen((value) => !value);
    setPowerMenuOpen(false);
  };

  const handlePowerMenuClick = () => {
    playClick();
    setPowerMenuOpen((value) => !value);
  };

  const handleShutdown = () => {
    if (!desktopWorkDone) {
      playFail();
      return;
    }
    playSuccess();
    setComputerShutdown(true);
    setStartMenuOpen(false);
    setPowerMenuOpen(false);
    setFolderWindowState('closed');
    setFolderMaximized(false);
    setActiveWindow(null);
    setSelectedDesktopItem(null);
  };

  const handleDragOver = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const handleDesktopFileDragStart = (e: DragEvent<HTMLDivElement>) => {
    setSelectedDesktopItem('file');
    e.dataTransfer.setData('text/plain', 'desktop-file');
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDesktopFolderDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    if (e.dataTransfer.getData('text/plain') === 'desktop-file') {
      moveFileIntoFolder();
    }
  };

  const handleFilePointerDown = (e: ReactPointerEvent<HTMLDivElement>) => {
    if (desktopFileMovedRef.current) return;
    if (e.button !== 0) return;
    filePointerDragRef.current = true;
    filePointerStartRef.current = { x: e.clientX, y: e.clientY };
    setFilePointerDragging(true);
    setSelectedDesktopItem('file');
  };

  function finishFilePointerDrag(e: { clientX: number; clientY: number }) {
    if (!filePointerDragRef.current) return;
    filePointerDragRef.current = false;
    setFilePointerDragging(false);

    if (desktopFileMovedRef.current) return;
    const folderIcon = folderIconRef.current?.getBoundingClientRect();
    const folderDropZone = folderDropZoneRef.current?.getBoundingClientRect();
    const point = { left: e.clientX, right: e.clientX, top: e.clientY, bottom: e.clientY };
    const droppedOnFolder =
      (folderIcon && rectsIntersect(point, folderIcon)) || (folderDropZone && rectsIntersect(point, folderDropZone));
    if (droppedOnFolder) {
      moveFileIntoFolder();
      return;
    }

    const start = filePointerStartRef.current;
    const movedFar = start ? Math.abs(e.clientX - start.x) > 48 || Math.abs(e.clientY - start.y) > 48 : false;
    if (movedFar) playFail();
  }

  const getSelectionPoint = (e: { clientX: number; clientY: number }) => {
    const rect = selectionAreaRef.current?.getBoundingClientRect();
    if (!rect) return null;
    return { x: e.clientX - rect.left, y: e.clientY - rect.top };
  };

  function updateSelectionDragFromPoint(e: { clientX: number; clientY: number }) {
    const activeDrag = selectionDragRef.current;
    if (!activeDrag) return;
    const point = getSelectionPoint(e);
    if (!point) return;
    setActiveSelectionDrag({ ...activeDrag, currentX: point.x, currentY: point.y });
  }

  function finishSelectionDrag(e: { clientX: number; clientY: number }) {
    const activeDrag = selectionDragRef.current;
    if (!activeDrag) return;
    const baseRect = selectionAreaRef.current?.getBoundingClientRect();
    const photoOne = photoOneRef.current?.getBoundingClientRect();
    const photoTwo = photoTwoRef.current?.getBoundingClientRect();
    if (!baseRect || !photoOne || !photoTwo) {
      setActiveSelectionDrag(null);
      return;
    }

    const point = getSelectionPoint(e) ?? { x: activeDrag.currentX, y: activeDrag.currentY };
    const localRect = {
      left: Math.min(activeDrag.startX, point.x),
      top: Math.min(activeDrag.startY, point.y),
      right: Math.max(activeDrag.startX, point.x),
      bottom: Math.max(activeDrag.startY, point.y),
    };
    const selectionRect = {
      left: baseRect.left + localRect.left,
      top: baseRect.top + localRect.top,
      right: baseRect.left + localRect.right,
      bottom: baseRect.top + localRect.bottom,
    };
    const enoughDrag = localRect.right - localRect.left > 48 && localRect.bottom - localRect.top > 48;
    const selectedBoth = enoughDrag && rectsIntersect(selectionRect, photoOne) && rectsIntersect(selectionRect, photoTwo);
    setActiveSelectionDrag(null);

    if (selectedBoth) {
      setDesktopMultiSelected(true);
      setSelectedDesktopItem(null);
      playSuccess();
    } else if (enoughDrag) {
      playFail();
    }
  }

  const handleSelectionPointerDown = (e: ReactPointerEvent<HTMLDivElement>) => {
    if (desktopMultiSelected) return;
    if (e.button !== 0) return;
    const point = getSelectionPoint(e);
    if (!point) return;
    setActiveSelectionDrag({ startX: point.x, startY: point.y, currentX: point.x, currentY: point.y });
  };

  const handleSelectionPointerMove = (e: ReactPointerEvent<HTMLDivElement>) => {
    updateSelectionDragFromPoint(e);
  };

  const handleSelectionPointerUp = (e: ReactPointerEvent<HTMLDivElement>) => {
    finishSelectionDrag(e);
  };

  const selectionStyle = selectionDrag
    ? {
        left: Math.min(selectionDrag.startX, selectionDrag.currentX),
        top: Math.min(selectionDrag.startY, selectionDrag.currentY),
        width: Math.abs(selectionDrag.currentX - selectionDrag.startX),
        height: Math.abs(selectionDrag.currentY - selectionDrag.startY),
      }
    : undefined;

  const resetDesktop = () => {
    playClick();
    setFolderOpened(false);
    setFolderWindowState('closed');
    setFolderMaximized(false);
    setActiveWindow(null);
    desktopFileMovedRef.current = false;
    filePointerDragRef.current = false;
    filePointerStartRef.current = null;
    setDesktopFileMoved(false);
    setDesktopMultiSelected(false);
    setComputerShutdown(false);
    setStartMenuOpen(false);
    setPowerMenuOpen(false);
    setSelectedDesktopItem(null);
    setActiveSelectionDrag(null);
    setFilePointerDragging(false);
    setNavigating(false);
    completedRef.current = false;
    startedAtRef.current = Date.now();
  };

  const handleNext = () => {
    if (!desktopDone || navigating) return;
    setNavigating(true);
    playClick();
    navigate('/result/mouse');
  };

  return (
    <div className="max-w-7xl w-full mx-auto flex flex-col gap-8 md:pt-12">
      <section className="flex flex-col gap-4 text-center items-center">
        <button
          type="button"
          onClick={() => {
            playClick();
            navigate('/mouse');
          }}
          className="self-start inline-flex items-center gap-2 px-4 py-2 rounded-full bg-surface-container-high text-on-surface-variant font-label-bold text-sm hover:bg-surface-variant transition-colors"
        >
          <span className="material-symbols-outlined text-base">arrow_back</span>
          마우스 놀이터
        </button>
        <span className="bg-primary-container text-on-primary-container font-label-bold text-label-bold px-4 py-1 rounded-full">
          바탕화면 시뮬레이션
        </span>
        <h1 className="font-display-lg text-display-lg text-primary">실제 컴퓨터처럼 연습해요</h1>
        <p className="font-body-xl text-body-xl text-on-surface-variant max-w-2xl">
          폴더 열기, 파일 옮기기, 여러 개 선택하기, 컴퓨터 종료하기를 한 화면에서 차례대로 연습해 봐요.
        </p>
      </section>

      <section className="bg-surface-container-lowest rounded-xl p-8 border-2 border-primary-fixed shadow-lg flex flex-col gap-6">
        <div className="flex flex-wrap justify-center gap-2 rounded-2xl bg-[#071827]/85 px-4 py-3 text-white shadow-inner">
          <DesktopTaskChip icon="folder" label="폴더 열기" done={folderOpened} />
          <DesktopTaskChip icon="description" label="파일 이동" done={desktopFileMoved} />
          <DesktopTaskChip icon="select_all" label="사진 선택" done={desktopMultiSelected} />
          <DesktopTaskChip icon="power_settings_new" label="컴퓨터 종료" done={computerShutdown} />
        </div>

        <VirtualDesktopFrame
          title="디지 데스크톱"
          status={desktopDone ? '바탕화면 미션 완료' : '폴더, 파일, 사진, 종료 연습 중'}
          contentClassName="min-h-[560px]"
          startButtonActive={startMenuOpen}
          onStartClick={computerShutdown ? undefined : handleStartMenuClick}
          taskbarItems={
            !computerShutdown ? (
              <>
                {folderOpened && folderWindowState !== 'closed' && (
                  <DesktopTaskbarAppButton
                    icon="folder_open"
                    label="공부 폴더"
                    active={folderWindowState === 'open' && activeWindow === 'folder'}
                    minimized={folderWindowState === 'minimized'}
                    onClick={() => {
                      playClick();
                      setFolderWindowState('open');
                      setActiveWindow('folder');
                    }}
                  />
                )}
              </>
            ) : null
          }
        >
          <div className="relative min-h-[460px]">
            {startMenuOpen && !computerShutdown && (
              <div className="absolute bottom-0 left-0 z-40 w-80 overflow-hidden rounded-3xl border border-white/25 bg-[#102236]/95 text-white shadow-2xl backdrop-blur-xl">
                <div className="border-b border-white/10 px-5 py-4">
                  <p className="font-label-bold text-sm text-white/70">Digi OS</p>
                  <p className="mt-1 font-headline-md text-headline-md">시작 메뉴</p>
                </div>
                <div className="grid gap-2 p-4">
                  <div className="rounded-2xl bg-white/10 px-4 py-3">
                    <p className="font-label-bold text-sm">오늘의 마무리</p>
                    <p className="mt-1 text-xs text-white/70">작업을 모두 끝낸 뒤 전원 메뉴에서 컴퓨터를 종료해요.</p>
                  </div>
                  <button
                    type="button"
                    onClick={handlePowerMenuClick}
                    aria-expanded={powerMenuOpen}
                    className={cn(
                      'flex h-12 items-center gap-3 rounded-2xl px-4 font-label-bold transition-colors',
                      powerMenuOpen ? 'bg-primary text-on-primary' : 'bg-white/10 hover:bg-white/18',
                    )}
                  >
                    <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>
                      power_settings_new
                    </span>
                    전원
                    <span className="material-symbols-outlined ml-auto text-base">
                      {powerMenuOpen ? 'expand_less' : 'expand_more'}
                    </span>
                  </button>
                  {powerMenuOpen && (
                    <div className="rounded-2xl bg-[#071827]/80 p-2">
                      <button
                        type="button"
                        onClick={handleShutdown}
                        disabled={!desktopWorkDone}
                        className="flex h-12 w-full items-center gap-3 rounded-xl px-4 text-left font-label-bold transition-colors disabled:cursor-not-allowed disabled:opacity-55 enabled:hover:bg-white/12"
                      >
                        <span className="material-symbols-outlined text-error-container" style={{ fontVariationSettings: "'FILL' 1" }}>
                          power_settings_new
                        </span>
                        종료
                      </button>
                      {!desktopWorkDone && (
                        <p className="px-4 pb-2 text-xs font-label-bold text-white/60">
                          폴더, 파일, 사진 미션을 끝내고 마지막에 종료해요.
                        </p>
                      )}
                    </div>
                  )}
                </div>
              </div>
            )}

            {computerShutdown && (
              <div className="absolute inset-0 z-50 flex flex-col items-center justify-center gap-5 rounded-[1.5rem] bg-[#071827]/95 p-8 text-center text-white shadow-inner backdrop-blur-xl">
                <span className="material-symbols-outlined text-7xl text-secondary" style={{ fontVariationSettings: "'FILL' 1" }}>
                  power_settings_new
                </span>
                <div>
                  <h3 className="font-display-lg text-display-lg">컴퓨터가 종료되었어요</h3>
                  <p className="mt-3 font-body-xl text-body-xl text-white/75">
                    공용 컴퓨터를 다 쓴 뒤에는 이렇게 종료하거나 로그아웃하는 습관을 들여요.
                  </p>
                </div>
              </div>
            )}

            <div className="grid max-w-[480px] grid-cols-2 gap-5 sm:grid-cols-3">
              <div ref={folderIconRef}>
                <DesktopIconTile
                  icon={folderOpened ? 'folder_open' : 'folder'}
                  label="공부 폴더"
                  done={folderOpened}
                  selected={selectedDesktopItem === 'folder'}
                  hint="더블클릭해서 열기"
                  onClick={() => selectDesktopItem('folder')}
                  onDoubleClick={handleFolderDoubleClick}
                  onDragOver={handleDragOver}
                  onDrop={handleDesktopFolderDrop}
                />
              </div>

              {!desktopFileMoved && (
                <div onPointerDown={handleFilePointerDown}>
                  <DesktopIconTile
                    icon="description"
                    label="숙제 파일"
                    draggable
                    selected={selectedDesktopItem === 'file' || filePointerDragging}
                    hint="공부 폴더로 끌기"
                    onClick={() => selectDesktopItem('file')}
                    onDragStart={handleDesktopFileDragStart}
                  />
                </div>
              )}
            </div>

            {folderWindowVisible && (
              <DesktopWindow
                title="공부 폴더"
                icon="folder_open"
                maximized={folderMaximized}
                activeControl={folderMaximized ? 'maximize' : undefined}
                onMinimize={() => {
                  playClick();
                  setFolderWindowState('minimized');
                  setActiveWindow((current) => (current === 'folder' ? getFallbackActiveWindow('folder') : current));
                }}
                onMaximize={() => {
                  playClick();
                  setActiveWindow('folder');
                  setFolderMaximized((value) => !value);
                }}
                onClose={() => {
                  playClick();
                  setFolderWindowState('closed');
                  setFolderMaximized(false);
                  setActiveWindow((current) => (current === 'folder' ? getFallbackActiveWindow('folder') : current));
                }}
                className={cn(
                  'mt-6 md:absolute md:mt-0',
                  activeWindow === 'folder' ? 'z-30' : 'z-20',
                  folderMaximized ? 'md:inset-x-4 md:bottom-6 md:top-4' : 'md:left-[320px] md:right-6 md:top-4',
                )}
              >
                <div
                  ref={folderDropZoneRef}
                  onDragOver={handleDragOver}
                  onDrop={handleDesktopFolderDrop}
                  className={cn(
                    'rounded-2xl border-2 border-dashed p-5 text-center transition-colors',
                    desktopFileMoved
                      ? 'border-secondary bg-secondary-container text-on-secondary-container'
                      : 'border-primary-fixed bg-primary-container/30 text-on-surface',
                    folderMaximized && 'min-h-64',
                  )}
                >
                  {desktopFileMoved ? (
                    <div className="flex flex-col items-center gap-4">
                      <span className="material-symbols-outlined text-5xl" style={{ fontVariationSettings: "'FILL' 1" }}>
                        inventory_2
                      </span>
                      <p className="font-label-bold text-label-bold">숙제 파일이 폴더 안으로 이동했어요!</p>
                      <div className="grid w-full max-w-xs place-items-center rounded-2xl bg-surface-container-lowest/80 p-4 text-on-surface shadow-inner">
                        <span className="material-symbols-outlined text-5xl text-primary" style={{ fontVariationSettings: "'FILL' 1" }}>
                          description
                        </span>
                        <span className="mt-2 font-label-bold text-sm">숙제 파일</span>
                        <span className="mt-1 rounded-full bg-secondary-container px-3 py-1 text-xs font-label-bold text-on-secondary-container">
                          폴더 안에 있음
                        </span>
                      </div>
                    </div>
                  ) : (
                    <>
                      <span className="material-symbols-outlined text-5xl" style={{ fontVariationSettings: "'FILL' 1" }}>
                        drive_file_move
                      </span>
                      <p className="mt-2 font-label-bold text-label-bold">숙제 파일을 이 폴더 창 안에 놓아도 돼요.</p>
                      <p className="mt-2 text-sm text-on-surface-variant">
                        폴더 아이콘이나 열린 폴더 창 둘 다 드래그 목표로 사용할 수 있어요.
                      </p>
                    </>
                  )}
                </div>
              </DesktopWindow>
            )}

            <div
              ref={selectionAreaRef}
              onPointerDown={handleSelectionPointerDown}
              onPointerMove={handleSelectionPointerMove}
              onPointerUp={handleSelectionPointerUp}
              className={cn(
                'relative mt-6 min-h-60 select-none overflow-hidden rounded-[1.75rem] border-2 border-dashed p-5 shadow-[0_18px_36px_rgba(0,0,0,0.16)] backdrop-blur-md md:absolute md:bottom-6 md:right-6 md:mt-0 md:w-[360px]',
                desktopMultiSelected ? 'border-secondary bg-secondary-container/95' : 'border-white/70 bg-white/16',
              )}
            >
              <p className={cn('mb-4 text-center font-label-bold', desktopMultiSelected ? 'text-on-secondary-container' : 'text-white')}>
                {desktopMultiSelected ? '사진 1과 사진 2를 함께 선택했어요.' : '마우스를 누른 채 사진 1과 사진 2를 둘러싸게 드래그하세요.'}
              </p>
              <div className="relative flex items-center justify-center gap-8">
                <div ref={photoOneRef}>
                  <DesktopIconTile
                    icon="image"
                    label="사진 1"
                    selected={desktopMultiSelected || selectedDesktopItem === 'photo1'}
                    className="w-24"
                    onClick={() => selectDesktopItem('photo1')}
                  />
                </div>
                <div ref={photoTwoRef}>
                  <DesktopIconTile
                    icon="image"
                    label="사진 2"
                    selected={desktopMultiSelected || selectedDesktopItem === 'photo2'}
                    className="w-24"
                    onClick={() => selectDesktopItem('photo2')}
                  />
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

        <div className="grid grid-cols-1 md:grid-cols-4 gap-3 text-sm">
          <MissionCheck done={folderOpened} label="폴더를 더블클릭해서 열기" />
          <MissionCheck done={desktopFileMoved} label="숙제 파일을 공부 폴더로 드래그하기" />
          <MissionCheck done={desktopMultiSelected} label="드래그로 사진 여러 개 선택하기" />
          <MissionCheck done={computerShutdown} label="시작 메뉴에서 컴퓨터 종료하기" />
        </div>
      </section>

      <section
        className={`rounded-xl p-8 flex flex-col items-center justify-center text-center gap-4 relative overflow-hidden transition-all ${
          desktopDone ? 'bg-secondary-container' : 'bg-surface-container-low opacity-80'
        }`}
      >
        <div className="absolute inset-0 opacity-10 flex items-center justify-center pointer-events-none">
          <span className="material-symbols-outlined text-[200px]" style={{ fontVariationSettings: "'FILL' 1" }}>
            celebration
          </span>
        </div>
        <span className="material-symbols-outlined text-6xl text-on-secondary-container z-10" style={{ fontVariationSettings: "'FILL' 1" }}>
          stars
        </span>
        <h2 className="font-display-lg text-display-lg text-on-secondary-container z-10">
          {desktopDone ? '참 잘했어요!' : '바탕화면 미션을 모두 성공해보세요'}
        </h2>
        <p className="font-body-xl text-body-xl text-on-secondary-container z-10">
          {desktopDone
            ? '실제 컴퓨터에서 자주 쓰는 마우스 동작과 종료 방법을 잘 익혔네요.'
            : '폴더 열기, 파일 이동, 사진 선택, 컴퓨터 종료를 차례로 해봐요.'}
        </p>
        <div className="mt-4 flex flex-wrap gap-3 justify-center z-10">
          <button
            type="button"
            onClick={resetDesktop}
            className="px-6 py-4 bg-surface-container-high text-on-surface rounded-full font-label-bold text-label-bold shadow-[0_4px_0_rgba(0,0,0,0.1)] active:shadow-none active:translate-y-[4px] transition-all"
          >
            다시 연습하기
          </button>
          <button
            type="button"
            onClick={handleNext}
            disabled={!desktopDone || navigating}
            className="px-8 py-4 bg-secondary text-on-secondary rounded-full font-label-bold text-label-bold shadow-[0_4px_0_rgba(0,0,0,0.1)] active:shadow-none active:translate-y-[4px] transition-all disabled:opacity-40 disabled:cursor-not-allowed disabled:active:translate-y-0"
          >
            결과 보기
          </button>
        </div>
      </section>
    </div>
  );
}

function MissionCheck({ done, label }: { done: boolean; label: string }) {
  return (
    <div
      className={`rounded-full px-4 py-2 font-label-bold flex items-center gap-2 ${
        done ? 'bg-secondary text-on-secondary' : 'bg-surface-container-high text-on-surface-variant'
      }`}
    >
      <span className="material-symbols-outlined text-base">{done ? 'check_circle' : 'radio_button_unchecked'}</span>
      {label}
    </div>
  );
}
