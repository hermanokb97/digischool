import { useEffect, useState } from 'react';
import { isMuted, setMuted, stopSpeak } from '@/lib/sound';

export function MuteFab() {
  const [muted, setMutedState] = useState(false);

  useEffect(() => {
    setMutedState(isMuted());
  }, []);

  const toggle = () => {
    const next = !muted;
    setMuted(next);
    setMutedState(next);
    if (next) stopSpeak();
  };

  return (
    <button
      type="button"
      onClick={toggle}
      title={muted ? '소리 켜기' : '소리 끄기'}
      aria-label={muted ? '소리 켜기' : '소리 끄기'}
      aria-pressed={muted}
      className="md:hidden fixed top-4 right-4 z-40 w-12 h-12 rounded-full bg-surface-container-lowest text-primary border-2 border-surface-container-highest shadow-md flex items-center justify-center hover:bg-primary-container active:translate-y-[2px] transition-all"
    >
      <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 0" }}>
        {muted ? 'volume_off' : 'volume_up'}
      </span>
    </button>
  );
}
