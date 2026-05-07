import { useState } from 'react';
import { speak, stopSpeak } from '@/lib/sound';

interface SpeakButtonProps {
  text: string;
  label?: string;
  className?: string;
}

export function SpeakButton({ text, label = '읽어주기', className = '' }: SpeakButtonProps) {
  const [speaking, setSpeaking] = useState(false);

  const handleClick = () => {
    if (speaking) {
      stopSpeak();
      setSpeaking(false);
      return;
    }
    setSpeaking(true);
    speak(text);
    const totalDuration = Math.max(2000, text.length * 110);
    window.setTimeout(() => setSpeaking(false), totalDuration);
  };

  return (
    <button
      type="button"
      onClick={handleClick}
      aria-label={speaking ? '읽기 중지' : label}
      aria-pressed={speaking}
      className={`inline-flex items-center justify-center w-10 h-10 rounded-full transition-colors ${
        speaking
          ? 'bg-primary text-on-primary animate-[pulse_1.5s_ease-in-out_infinite]'
          : 'bg-surface-container-high text-primary hover:bg-primary-container'
      } ${className}`}
    >
      <span className="material-symbols-outlined" style={{ fontVariationSettings: speaking ? "'FILL' 1" : "'FILL' 0" }}>
        {speaking ? 'stop_circle' : 'volume_up'}
      </span>
    </button>
  );
}
