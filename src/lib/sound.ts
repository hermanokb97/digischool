import { STORAGE_KEYS } from './constants';

let ctx: AudioContext | null = null;

function getCtx(): AudioContext | null {
  if (typeof window === 'undefined') return null;
  if (!ctx) {
    const AC = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (!AC) return null;
    try {
      ctx = new AC();
    } catch {
      return null;
    }
  }
  return ctx;
}

export function isMuted(): boolean {
  if (typeof window === 'undefined') return false;
  return localStorage.getItem(STORAGE_KEYS.muted) === '1';
}

export function setMuted(muted: boolean) {
  if (typeof window === 'undefined') return;
  if (muted) localStorage.setItem(STORAGE_KEYS.muted, '1');
  else localStorage.removeItem(STORAGE_KEYS.muted);
}

interface ToneSpec {
  freq: number;
  duration: number;
  type?: OscillatorType;
  volume?: number;
  attack?: number;
}

function playTones(tones: ToneSpec[], gap = 0) {
  if (isMuted()) return;
  const audio = getCtx();
  if (!audio) return;
  if (audio.state === 'suspended') {
    audio.resume().catch(() => {});
  }

  let t = audio.currentTime;
  for (const tone of tones) {
    const osc = audio.createOscillator();
    const gain = audio.createGain();
    osc.type = tone.type ?? 'sine';
    osc.frequency.setValueAtTime(tone.freq, t);
    const vol = tone.volume ?? 0.18;
    const attack = tone.attack ?? 0.01;
    gain.gain.setValueAtTime(0, t);
    gain.gain.linearRampToValueAtTime(vol, t + attack);
    gain.gain.exponentialRampToValueAtTime(0.0001, t + tone.duration);
    osc.connect(gain).connect(audio.destination);
    osc.start(t);
    osc.stop(t + tone.duration + 0.02);
    t += tone.duration + gap;
  }
}

export function playClick() {
  playTones([{ freq: 660, duration: 0.06, type: 'square', volume: 0.08 }]);
}

export function playSuccess() {
  playTones(
    [
      { freq: 660, duration: 0.12, type: 'triangle' },
      { freq: 880, duration: 0.16, type: 'triangle' },
      { freq: 990, duration: 0.22, type: 'triangle' },
    ],
    0.02,
  );
}

export function playFail() {
  playTones(
    [
      { freq: 280, duration: 0.18, type: 'sawtooth', volume: 0.12 },
      { freq: 200, duration: 0.22, type: 'sawtooth', volume: 0.12 },
    ],
    0.02,
  );
}

export function playFanfare() {
  playTones(
    [
      { freq: 523.25, duration: 0.14, type: 'triangle' },
      { freq: 659.25, duration: 0.14, type: 'triangle' },
      { freq: 783.99, duration: 0.18, type: 'triangle' },
      { freq: 1046.5, duration: 0.32, type: 'triangle' },
    ],
    0.03,
  );
}

export function speak(text: string) {
  if (isMuted()) return;
  if (typeof window === 'undefined' || !('speechSynthesis' in window)) return;
  try {
    window.speechSynthesis.cancel();
    const utter = new SpeechSynthesisUtterance(text);
    utter.lang = 'ko-KR';
    utter.rate = 1;
    utter.pitch = 1.05;
    window.speechSynthesis.speak(utter);
  } catch {
  }
}

export function stopSpeak() {
  if (typeof window === 'undefined' || !('speechSynthesis' in window)) return;
  try {
    window.speechSynthesis.cancel();
  } catch {
  }
}
