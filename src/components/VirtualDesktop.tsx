import { DragEventHandler, MouseEventHandler, ReactNode } from 'react';
import { cn } from '@/lib/utils';

interface VirtualDesktopFrameProps {
  title: string;
  status: string;
  children: ReactNode;
  taskbarItems?: ReactNode;
  startButtonActive?: boolean;
  onStartClick?: MouseEventHandler<HTMLButtonElement>;
  className?: string;
  contentClassName?: string;
}

export function VirtualDesktopFrame({
  title,
  status,
  children,
  taskbarItems,
  startButtonActive,
  onStartClick,
  className,
  contentClassName,
}: VirtualDesktopFrameProps) {
  return (
    <div
      className={cn(
        'relative overflow-hidden rounded-[2rem] border-[6px] border-[#10263d] bg-[#10263d] shadow-[0_26px_70px_rgba(11,28,48,0.28)]',
        className,
      )}
    >
      <div className="h-12 flex items-center justify-between gap-3 px-4 bg-gradient-to-r from-[#102236] via-[#1f3c5d] to-[#102236] text-white border-b border-white/10">
        <div className="flex items-center gap-2">
          <span className="w-3 h-3 rounded-full bg-[#ff6b6b] shadow-[0_0_12px_rgba(255,107,107,0.8)]" />
          <span className="w-3 h-3 rounded-full bg-[#ffd166] shadow-[0_0_12px_rgba(255,209,102,0.75)]" />
          <span className="w-3 h-3 rounded-full bg-[#6ee7b7] shadow-[0_0_12px_rgba(110,231,183,0.75)]" />
        </div>
        <div className="min-w-0 flex items-center gap-2 rounded-full bg-white/10 px-4 py-1.5 backdrop-blur">
          <span className="material-symbols-outlined text-base" style={{ fontVariationSettings: "'FILL' 1" }}>
            desktop_windows
          </span>
          <span className="truncate font-label-bold text-sm">{title}</span>
        </div>
        <div className="hidden sm:flex items-center gap-2 rounded-full bg-white/10 px-3 py-1.5 text-xs font-label-bold text-white/85">
          <span className="material-symbols-outlined text-base">wifi</span>
          Digi OS
        </div>
      </div>

      <div
        className={cn('relative min-h-[500px] overflow-hidden p-5 pb-24 md:p-7 md:pb-24', contentClassName)}
        style={{
          backgroundColor: '#194f86',
          backgroundImage:
            'radial-gradient(circle at 18% 18%, rgba(144,205,255,0.95) 0 12%, transparent 34%), radial-gradient(circle at 84% 12%, rgba(174,239,191,0.75) 0 10%, transparent 30%), radial-gradient(circle at 78% 80%, rgba(249,226,135,0.7) 0 12%, transparent 34%), linear-gradient(135deg, #11345f 0%, #1d74a8 48%, #64b5d7 100%)',
        }}
      >
        <div
          className="absolute inset-0 opacity-20 pointer-events-none"
          style={{
            backgroundImage:
              'linear-gradient(rgba(255,255,255,0.5) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.5) 1px, transparent 1px)',
            backgroundSize: '42px 42px',
          }}
        />
        <div className="absolute -left-20 top-20 w-64 h-64 rounded-full bg-white/10 blur-3xl pointer-events-none" />
        <div className="absolute right-10 top-24 w-32 h-32 rounded-[2rem] bg-white/10 rotate-12 blur-sm pointer-events-none" />
        <div className="relative z-10">{children}</div>

        <div className="absolute bottom-0 left-0 right-0 z-20 flex h-16 items-center gap-3 border-t border-white/15 bg-[#071827]/75 px-4 text-white shadow-[0_-16px_40px_rgba(0,0,0,0.22)] backdrop-blur-xl">
          {onStartClick ? (
            <button
              type="button"
              onClick={onStartClick}
              aria-pressed={startButtonActive}
              aria-label="시작 메뉴"
              className={cn(
                'flex h-10 items-center gap-2 rounded-full px-4 font-label-bold text-sm shadow-inner transition-all',
                startButtonActive ? 'bg-primary text-on-primary ring-2 ring-white/70' : 'bg-white/15 text-white hover:bg-white/25',
              )}
            >
              <span className="material-symbols-outlined text-xl" style={{ fontVariationSettings: "'FILL' 1" }}>
                apps
              </span>
              시작
            </button>
          ) : (
            <div className="flex h-10 items-center gap-2 rounded-full bg-white/15 px-4 font-label-bold text-sm shadow-inner">
              <span className="material-symbols-outlined text-xl" style={{ fontVariationSettings: "'FILL' 1" }}>
                apps
              </span>
              시작
            </div>
          )}
          <div className="flex min-w-0 flex-1 items-center gap-2 overflow-hidden">
            {taskbarItems}
          </div>
          <div className="hidden md:flex items-center gap-2 rounded-full bg-white/10 px-3 py-2 text-xs font-label-bold text-white/85">
            <span className="material-symbols-outlined text-base">tips_and_updates</span>
            {status}
          </div>
        </div>
      </div>
    </div>
  );
}

interface DesktopIconTileProps {
  icon: string;
  label: string;
  done?: boolean;
  selected?: boolean;
  draggable?: boolean;
  hint?: string;
  className?: string;
  onClick?: MouseEventHandler<HTMLDivElement>;
  onDoubleClick?: MouseEventHandler<HTMLDivElement>;
  onDragStart?: DragEventHandler<HTMLDivElement>;
  onDragOver?: DragEventHandler<HTMLDivElement>;
  onDrop?: DragEventHandler<HTMLDivElement>;
}

export function DesktopIconTile({
  icon,
  label,
  done,
  selected,
  draggable,
  hint,
  className,
  onClick,
  onDoubleClick,
  onDragStart,
  onDragOver,
  onDrop,
}: DesktopIconTileProps) {
  const active = done || selected;

  return (
    <div
      draggable={draggable}
      onClick={onClick}
      onDoubleClick={onDoubleClick}
      onDragStart={onDragStart}
      onDragOver={onDragOver}
      onDrop={onDrop}
      className={cn(
        'group relative flex w-28 select-none flex-col items-center gap-2 rounded-2xl p-3 text-center text-white transition-all',
        draggable ? 'cursor-grab active:cursor-grabbing' : 'cursor-pointer',
        active
          ? 'bg-white/25 ring-4 ring-tertiary-fixed shadow-[0_16px_32px_rgba(0,0,0,0.18)]'
          : 'hover:-translate-y-1 hover:bg-white/15 hover:shadow-[0_14px_30px_rgba(0,0,0,0.18)]',
        className,
      )}
    >
      <div
        className={cn(
          'relative flex h-16 w-16 items-center justify-center rounded-[1.35rem] border border-white/25 bg-white/20 shadow-[inset_0_1px_0_rgba(255,255,255,0.25),0_10px_24px_rgba(0,0,0,0.16)] backdrop-blur-md transition-transform group-hover:scale-105',
          active && 'bg-tertiary-fixed text-on-tertiary-fixed',
        )}
      >
        <span className="material-symbols-outlined text-4xl drop-shadow-sm" style={{ fontVariationSettings: "'FILL' 1" }}>
          {icon}
        </span>
        {done && (
          <span className="absolute -right-2 -top-2 flex h-7 w-7 items-center justify-center rounded-full bg-secondary text-on-secondary ring-2 ring-white">
            <span className="material-symbols-outlined text-base" style={{ fontVariationSettings: "'FILL' 1" }}>
              check
            </span>
          </span>
        )}
      </div>
      <span className="max-w-full rounded-xl bg-[#071827]/45 px-2 py-1 text-sm font-label-bold leading-tight text-white shadow-sm backdrop-blur">
        {label}
      </span>
      {hint && (
        <span className="pointer-events-none absolute left-1/2 top-full z-20 mt-2 -translate-x-1/2 whitespace-nowrap rounded-full bg-on-surface px-3 py-1 text-xs font-label-bold text-inverse-on-surface opacity-0 shadow-lg transition-opacity group-hover:opacity-100">
          {hint}
        </span>
      )}
    </div>
  );
}

interface DesktopWindowProps {
  title: string;
  icon: string;
  children: ReactNode;
  className?: string;
  activeControl?: 'minimize' | 'maximize' | 'close';
  maximized?: boolean;
  onMinimize?: () => void;
  onMaximize?: () => void;
  onClose?: () => void;
}

export function DesktopWindow({
  title,
  icon,
  children,
  className,
  activeControl,
  maximized,
  onMinimize,
  onMaximize,
  onClose,
}: DesktopWindowProps) {
  const hasWindowControls = Boolean(onMinimize || onMaximize || onClose);

  return (
    <div
      className={cn(
        'overflow-hidden rounded-[1.5rem] border border-white/35 bg-white/95 text-on-surface shadow-[0_24px_55px_rgba(0,0,0,0.25)] backdrop-blur-xl',
        className,
      )}
    >
      <div className="flex h-11 items-center justify-between bg-[#17293d] px-4 text-white">
        <div className="flex min-w-0 items-center gap-2">
          <span className="material-symbols-outlined text-xl" style={{ fontVariationSettings: "'FILL' 1" }}>
            {icon}
          </span>
          <span className="truncate font-label-bold text-sm">{title}</span>
        </div>
        <div className="flex items-center gap-2" aria-hidden={hasWindowControls ? undefined : true}>
          <WindowControlButton
            icon="remove"
            label="최소화"
            active={activeControl === 'minimize'}
            onClick={onMinimize}
          />
          <WindowControlButton
            icon={maximized ? 'filter_none' : 'crop_square'}
            label="최대화"
            active={activeControl === 'maximize'}
            onClick={onMaximize}
          />
          <WindowControlButton
            icon="close"
            label="닫기"
            danger
            active={activeControl === 'close'}
            onClick={onClose}
          />
        </div>
      </div>
      <div className="p-5">{children}</div>
    </div>
  );
}

function WindowControlButton({
  icon,
  label,
  active,
  danger,
  onClick,
}: {
  icon: string;
  label: string;
  active?: boolean;
  danger?: boolean;
  onClick?: () => void;
}) {
  if (!onClick) {
    return <span className={cn('material-symbols-outlined text-base', danger ? 'text-error-container' : 'text-white/75')}>{icon}</span>;
  }

  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      title={label}
      className={cn(
        'flex h-7 w-7 items-center justify-center rounded-full transition-all',
        active ? 'bg-tertiary-fixed text-on-tertiary-fixed ring-2 ring-white' : danger ? 'text-error-container hover:bg-[#e81123] hover:text-white' : 'text-white/75 hover:bg-white/15 hover:text-white',
      )}
    >
      <span className="material-symbols-outlined text-base">{icon}</span>
    </button>
  );
}

interface DesktopSelectionZoneProps {
  selected: boolean;
  selecting: boolean;
  label: string;
  selectedLabel: string;
  className?: string;
  onMouseDown: MouseEventHandler<HTMLDivElement>;
  onMouseUp: MouseEventHandler<HTMLDivElement>;
}

export function DesktopSelectionZone({
  selected,
  selecting,
  label,
  selectedLabel,
  className,
  onMouseDown,
  onMouseUp,
}: DesktopSelectionZoneProps) {
  return (
    <div
      role="button"
      tabIndex={0}
      onMouseDown={onMouseDown}
      onMouseUp={onMouseUp}
      className={cn(
        'relative flex min-h-36 items-center justify-center overflow-hidden rounded-[1.5rem] border-2 border-dashed p-5 text-center font-label-bold shadow-[0_18px_36px_rgba(0,0,0,0.16)] transition-all',
        selected
          ? 'border-secondary bg-secondary-container/95 text-on-secondary-container'
          : selecting
          ? 'border-primary bg-primary-container/90 text-on-primary-container'
          : 'border-white/70 bg-white/16 text-white backdrop-blur-md hover:bg-white/24',
        className,
      )}
    >
      <div className="absolute inset-3 rounded-[1.1rem] border border-white/35 pointer-events-none" />
      {selecting && !selected && (
        <div className="absolute left-6 top-6 h-20 w-40 rounded-xl border-2 border-primary bg-primary-fixed/35 shadow-[0_0_0_999px_rgba(255,255,255,0.04)]" />
      )}
      <div className="relative z-10 flex flex-col items-center gap-2">
        <span className="material-symbols-outlined text-4xl" style={{ fontVariationSettings: "'FILL' 1" }}>
          {selected ? 'select_check_box' : 'select_all'}
        </span>
        <span>{selected ? selectedLabel : label}</span>
      </div>
    </div>
  );
}

interface DesktopTaskChipProps {
  icon: string;
  label: string;
  done?: boolean;
}

interface DesktopTaskbarAppButtonProps {
  icon: string;
  label: string;
  active?: boolean;
  minimized?: boolean;
  onClick?: MouseEventHandler<HTMLButtonElement>;
}

export function DesktopTaskbarAppButton({
  icon,
  label,
  active,
  minimized,
  onClick,
}: DesktopTaskbarAppButtonProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={!onClick}
      aria-pressed={active}
      title={minimized ? `${label} 복원` : label}
      className={cn(
        'flex h-10 min-w-[8rem] max-w-[14rem] items-center gap-2 rounded-full px-3 text-xs font-label-bold shadow-inner transition-all',
        active
          ? 'bg-white/30 text-white ring-2 ring-white/35'
          : minimized
          ? 'border border-white/20 bg-white/12 text-white/85 hover:bg-white/20'
          : 'bg-white/18 text-white/90 hover:bg-white/25',
        !onClick && 'cursor-default',
      )}
    >
      <span className="material-symbols-outlined text-base" style={{ fontVariationSettings: active ? "'FILL' 1" : "'FILL' 0" }}>
        {icon}
      </span>
      <span className="truncate">{label}</span>
      {minimized && (
        <span className="material-symbols-outlined ml-auto text-sm text-white/75" aria-hidden="true">
          keyboard_arrow_up
        </span>
      )}
    </button>
  );
}

export function DesktopTaskChip({ icon, label, done }: DesktopTaskChipProps) {
  return (
    <span
      className={cn(
        'flex h-10 min-w-0 items-center gap-2 rounded-full px-3 text-xs font-label-bold shadow-inner',
        done ? 'bg-secondary-container text-on-secondary-container' : 'bg-white/12 text-white/85',
      )}
    >
      <span className="material-symbols-outlined text-base" style={{ fontVariationSettings: done ? "'FILL' 1" : "'FILL' 0" }}>
        {done ? 'check_circle' : icon}
      </span>
      <span className="hidden sm:inline truncate">{label}</span>
    </span>
  );
}
