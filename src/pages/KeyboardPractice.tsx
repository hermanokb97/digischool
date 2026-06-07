import { KeyboardEvent as ReactKeyboardEvent, useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { SpeakButton } from '@/components/SpeakButton';
import { useUser } from '@/context/UserContext';
import {
  formatDuration,
  getStudyResult,
  KeyboardTrack,
  KeyboardTrackResult,
  saveStudyResult,
} from '@/lib/evaluation';
import { playClick, playFail, playFanfare, playSuccess } from '@/lib/sound';
import { cn } from '@/lib/utils';

type TrackId = KeyboardTrack;
type StageId = 'position' | 'words' | 'short' | 'long' | 'complete';
type KeyWidth = 'normal' | 'wide' | 'extraWide' | 'space';

interface LetterKey {
  code: string;
  en: string;
  ko: string;
  finger: string;
  row: 'top' | 'home' | 'bottom';
  anchor?: boolean;
}

interface DisplayKey {
  code: string;
  label: string;
  width?: KeyWidth;
  letter?: LetterKey;
}

interface PositionRound {
  id: string;
  title: string;
  hint: string;
  keyCodes: string[];
  count: number;
}

interface PositionQuestion {
  id: string;
  roundTitle: string;
  roundHint: string;
  key: LetterKey;
  answer: string;
  options: string[];
}

interface TypingStats {
  correctChars: number;
  comparedChars: number;
  mistakes: number;
}

interface ScoreResult {
  correctChars: number;
  comparedChars: number;
  mistakes: number;
  accuracy: number;
}

const LETTER_KEYS: LetterKey[] = [
  { code: 'KeyQ', en: 'Q', ko: 'ㅂ', finger: '왼손 새끼', row: 'top' },
  { code: 'KeyW', en: 'W', ko: 'ㅈ', finger: '왼손 약지', row: 'top' },
  { code: 'KeyE', en: 'E', ko: 'ㄷ', finger: '왼손 중지', row: 'top' },
  { code: 'KeyR', en: 'R', ko: 'ㄱ', finger: '왼손 검지', row: 'top' },
  { code: 'KeyT', en: 'T', ko: 'ㅅ', finger: '왼손 검지', row: 'top' },
  { code: 'KeyY', en: 'Y', ko: 'ㅛ', finger: '오른손 검지', row: 'top' },
  { code: 'KeyU', en: 'U', ko: 'ㅕ', finger: '오른손 검지', row: 'top' },
  { code: 'KeyI', en: 'I', ko: 'ㅑ', finger: '오른손 중지', row: 'top' },
  { code: 'KeyO', en: 'O', ko: 'ㅐ', finger: '오른손 약지', row: 'top' },
  { code: 'KeyP', en: 'P', ko: 'ㅔ', finger: '오른손 새끼', row: 'top' },
  { code: 'KeyA', en: 'A', ko: 'ㅁ', finger: '왼손 새끼', row: 'home' },
  { code: 'KeyS', en: 'S', ko: 'ㄴ', finger: '왼손 약지', row: 'home' },
  { code: 'KeyD', en: 'D', ko: 'ㅇ', finger: '왼손 중지', row: 'home' },
  { code: 'KeyF', en: 'F', ko: 'ㄹ', finger: '왼손 검지', row: 'home', anchor: true },
  { code: 'KeyG', en: 'G', ko: 'ㅎ', finger: '왼손 검지', row: 'home' },
  { code: 'KeyH', en: 'H', ko: 'ㅗ', finger: '오른손 검지', row: 'home' },
  { code: 'KeyJ', en: 'J', ko: 'ㅓ', finger: '오른손 검지', row: 'home', anchor: true },
  { code: 'KeyK', en: 'K', ko: 'ㅏ', finger: '오른손 중지', row: 'home' },
  { code: 'KeyL', en: 'L', ko: 'ㅣ', finger: '오른손 약지', row: 'home' },
  { code: 'KeyZ', en: 'Z', ko: 'ㅋ', finger: '왼손 새끼', row: 'bottom' },
  { code: 'KeyX', en: 'X', ko: 'ㅌ', finger: '왼손 약지', row: 'bottom' },
  { code: 'KeyC', en: 'C', ko: 'ㅊ', finger: '왼손 중지', row: 'bottom' },
  { code: 'KeyV', en: 'V', ko: 'ㅍ', finger: '왼손 검지', row: 'bottom' },
  { code: 'KeyB', en: 'B', ko: 'ㅠ', finger: '왼손 검지', row: 'bottom' },
  { code: 'KeyN', en: 'N', ko: 'ㅜ', finger: '오른손 검지', row: 'bottom' },
  { code: 'KeyM', en: 'M', ko: 'ㅡ', finger: '오른손 검지', row: 'bottom' },
];

const KEY_BY_CODE = Object.fromEntries(LETTER_KEYS.map((key) => [key.code, key])) as Record<string, LetterKey>;

const KEYBOARD_ROWS: DisplayKey[][] = [
  [
    { code: 'Backquote', label: '`' },
    { code: 'Digit1', label: '1' },
    { code: 'Digit2', label: '2' },
    { code: 'Digit3', label: '3' },
    { code: 'Digit4', label: '4' },
    { code: 'Digit5', label: '5' },
    { code: 'Digit6', label: '6' },
    { code: 'Digit7', label: '7' },
    { code: 'Digit8', label: '8' },
    { code: 'Digit9', label: '9' },
    { code: 'Digit0', label: '0' },
    { code: 'Backspace', label: 'Backspace', width: 'extraWide' },
  ],
  [
    { code: 'Tab', label: 'Tab', width: 'wide' },
    ...LETTER_KEYS.filter((key) => key.row === 'top').map((letter) => ({ code: letter.code, label: letter.en, letter })),
  ],
  [
    { code: 'CapsLock', label: 'Caps', width: 'extraWide' },
    ...LETTER_KEYS.filter((key) => key.row === 'home').map((letter) => ({ code: letter.code, label: letter.en, letter })),
    { code: 'Enter', label: 'Enter', width: 'extraWide' },
  ],
  [
    { code: 'ShiftLeft', label: 'Shift', width: 'extraWide' },
    ...LETTER_KEYS.filter((key) => key.row === 'bottom').map((letter) => ({ code: letter.code, label: letter.en, letter })),
    { code: 'Slash', label: '/' },
    { code: 'ShiftRight', label: 'Shift', width: 'extraWide' },
  ],
  [
    { code: 'ControlLeft', label: 'Ctrl', width: 'wide' },
    { code: 'AltLeft', label: 'Alt', width: 'wide' },
    { code: 'Space', label: 'Space', width: 'space' },
    { code: 'AltRight', label: 'Alt', width: 'wide' },
    { code: 'ControlRight', label: 'Ctrl', width: 'wide' },
  ],
];

const POSITION_ROUNDS: Record<TrackId, PositionRound[]> = {
  ko: [
    { id: 'anchor', title: '1. 기준 자리 익히기', hint: '돌기가 있는 F와 J 자리를 먼저 기억해요.', keyCodes: ['KeyF', 'KeyJ'], count: 4 },
    { id: 'left_home', title: '2. 왼손 홈줄', hint: '왼손이 쉬는 줄의 자음을 맞혀요.', keyCodes: ['KeyA', 'KeyS', 'KeyD', 'KeyF', 'KeyG'], count: 5 },
    { id: 'right_home', title: '3. 오른손 홈줄', hint: '오른손 홈줄에는 자주 쓰는 모음이 있어요.', keyCodes: ['KeyH', 'KeyJ', 'KeyK', 'KeyL'], count: 5 },
    { id: 'top', title: '4. 윗줄', hint: '자음과 모음이 함께 있는 윗줄을 익혀요.', keyCodes: ['KeyQ', 'KeyW', 'KeyE', 'KeyR', 'KeyT', 'KeyY', 'KeyU', 'KeyI', 'KeyO', 'KeyP'], count: 8 },
    { id: 'bottom', title: '5. 아랫줄', hint: '아랫줄의 자음과 모음을 기억해요.', keyCodes: ['KeyZ', 'KeyX', 'KeyC', 'KeyV', 'KeyB', 'KeyN', 'KeyM'], count: 7 },
    { id: 'vowels', title: '6. 모음 자리', hint: '한글 모음 자리를 한 번 더 확인해요.', keyCodes: ['KeyY', 'KeyU', 'KeyI', 'KeyO', 'KeyP', 'KeyH', 'KeyJ', 'KeyK', 'KeyL', 'KeyB', 'KeyN', 'KeyM'], count: 8 },
    { id: 'confusing', title: '7. 헷갈리는 자리', hint: '비슷하게 보이는 자리를 반복해요.', keyCodes: ['KeyJ', 'KeyK', 'KeyH', 'KeyN', 'KeyB', 'KeyM', 'KeyO', 'KeyP'], count: 8 },
    { id: 'all', title: '8. 전체 자리 퀴즈', hint: '빈 키에 들어갈 자모를 맞혀요.', keyCodes: LETTER_KEYS.map((key) => key.code), count: 12 },
  ],
  en: [
    { id: 'anchor', title: '1. 기준 자리 익히기', hint: '돌기가 있는 F와 J 자리를 먼저 기억해요.', keyCodes: ['KeyF', 'KeyJ'], count: 4 },
    { id: 'left_home', title: '2. 왼손 홈줄', hint: '왼손 홈줄 A S D F G를 익혀요.', keyCodes: ['KeyA', 'KeyS', 'KeyD', 'KeyF', 'KeyG'], count: 5 },
    { id: 'right_home', title: '3. 오른손 홈줄', hint: '오른손 홈줄 H J K L을 익혀요.', keyCodes: ['KeyH', 'KeyJ', 'KeyK', 'KeyL'], count: 5 },
    { id: 'top', title: '4. 윗줄', hint: 'Q W E R T Y U I O P 위치를 맞혀요.', keyCodes: ['KeyQ', 'KeyW', 'KeyE', 'KeyR', 'KeyT', 'KeyY', 'KeyU', 'KeyI', 'KeyO', 'KeyP'], count: 8 },
    { id: 'bottom', title: '5. 아랫줄', hint: 'Z X C V B N M 위치를 맞혀요.', keyCodes: ['KeyZ', 'KeyX', 'KeyC', 'KeyV', 'KeyB', 'KeyN', 'KeyM'], count: 7 },
    { id: 'vowels', title: '6. 모음과 자주 쓰는 글쇠', hint: '영어 모음과 자주 쓰는 글쇠를 복습해요.', keyCodes: ['KeyA', 'KeyE', 'KeyI', 'KeyO', 'KeyU', 'KeyT', 'KeyN', 'KeyS', 'KeyR'], count: 8 },
    { id: 'confusing', title: '7. 헷갈리는 자리', hint: '서로 가까운 글쇠를 반복해서 구분해요.', keyCodes: ['KeyQ', 'KeyW', 'KeyE', 'KeyI', 'KeyO', 'KeyP', 'KeyB', 'KeyN', 'KeyM'], count: 8 },
    { id: 'all', title: '8. 전체 자리 퀴즈', hint: '빈 키에 들어갈 알파벳을 맞혀요.', keyCodes: LETTER_KEYS.map((key) => key.code), count: 12 },
  ],
};

const TRACKS: Record<TrackId, { title: string; shortTitle: string; description: string; words: string[]; shortTexts: string[]; longTexts: string[] }> = {
  ko: {
    title: '한글 자판',
    shortTitle: '한글',
    description: '표준 두벌식 자음과 모음 위치를 외우고 한글 문장으로 연습해요.',
    words: ['나라', '학교', '사과', '바다', '구름', '친구', '가나다', '디지스쿨'],
    shortTexts: ['나는 키보드 자리를 외워요.', '오늘도 차분하게 연습해요.', '손가락이 자리를 기억해요.'],
    longTexts: [
      '디지 스쿨에서 키보드 자리를 배워요. 자음과 모음을 기억하면 글을 더 빠르게 쓸 수 있어요. 천천히 정확하게 입력해요.',
    ],
  },
  en: {
    title: '영어 자판',
    shortTitle: '영어',
    description: 'QWERTY 알파벳 위치를 외우고 영어 단어와 문장으로 연습해요.',
    words: ['desk', 'school', 'friend', 'keyboard', 'garden', 'window', 'planet', 'digital'],
    shortTexts: ['I know the keyboard now.', 'Typing gets better with practice.', 'Find each key and type slowly.'],
    longTexts: [
      'I practice typing every day. I remember each key position and type with care. Slow and steady typing builds strong skills.',
    ],
  },
};

const STAGES: Array<{ id: StageId; title: string; icon: string }> = [
  { id: 'position', title: '자리 연습', icon: 'grid_view' },
  { id: 'words', title: '낱말 연습', icon: 'abc' },
  { id: 'short', title: '짧은 글 연습', icon: 'short_text' },
  { id: 'long', title: '긴 글 연습', icon: 'notes' },
];

function getKeyLabel(track: TrackId, key: LetterKey): string {
  return track === 'ko' ? key.ko : key.en;
}

function rotate<T>(items: T[], amount: number): T[] {
  if (items.length === 0) return [];
  const offset = amount % items.length;
  return [...items.slice(offset), ...items.slice(0, offset)];
}

function buildPositionQuestions(track: TrackId): PositionQuestion[] {
  const allLabels = LETTER_KEYS.map((key) => getKeyLabel(track, key));
  return POSITION_ROUNDS[track].flatMap((round, roundIndex) => {
    const keys = round.keyCodes.map((code) => KEY_BY_CODE[code]).filter(Boolean);
    return Array.from({ length: round.count }, (_, questionIndex) => {
      const key = keys[(questionIndex + roundIndex) % keys.length];
      const answer = getKeyLabel(track, key);
      const distractors = allLabels.filter((label) => label !== answer);
      const rotated = rotate(distractors, questionIndex * 3 + roundIndex * 5);
      const options = rotate([answer, ...rotated.slice(0, 3)], questionIndex + roundIndex);
      return {
        id: `${round.id}-${questionIndex}`,
        roundTitle: round.title,
        roundHint: round.hint,
        key,
        answer,
        options,
      };
    });
  });
}

function getPositionRoundProgress(track: TrackId, index: number): { current: number; total: number } {
  let seen = 0;
  for (const round of POSITION_ROUNDS[track]) {
    if (index < seen + round.count) {
      return { current: index - seen + 1, total: round.count };
    }
    seen += round.count;
  }
  const last = POSITION_ROUNDS[track][POSITION_ROUNDS[track].length - 1];
  return { current: last.count, total: last.count };
}

function scoreText(input: string, target: string): ScoreResult {
  const inputChars = Array.from(input.trim());
  const targetChars = Array.from(target.trim());
  const comparedChars = Math.max(inputChars.length, targetChars.length, 1);
  let correctChars = 0;
  for (let index = 0; index < targetChars.length; index += 1) {
    if (inputChars[index] === targetChars[index]) correctChars += 1;
  }
  const mistakes = comparedChars - correctChars;
  return {
    correctChars,
    comparedChars,
    mistakes,
    accuracy: Math.round((correctChars / comparedChars) * 100),
  };
}

function isExactMatch(input: string, target: string): boolean {
  return input.trim() === target.trim();
}

function percentage(value: number, total: number): number {
  if (total <= 0) return 0;
  return Math.round((value / total) * 100);
}

function getTypingItems(track: TrackId, stage: StageId): string[] {
  if (stage === 'words') return TRACKS[track].words;
  if (stage === 'short') return TRACKS[track].shortTexts;
  if (stage === 'long') return TRACKS[track].longTexts;
  return [];
}

function getNextIncompleteTrack(results: Partial<Record<TrackId, KeyboardTrackResult>>, current: TrackId): TrackId {
  if (!results.ko && current !== 'ko') return 'ko';
  if (!results.en && current !== 'en') return 'en';
  return current === 'ko' ? 'en' : 'ko';
}

export function KeyboardPractice() {
  const navigate = useNavigate();
  const { markComplete } = useUser();
  const savedKeyboardTracks = getStudyResult('keyboard')?.details?.keyboardTracks ?? {};
  const [track, setTrack] = useState<TrackId>('ko');
  const [stage, setStage] = useState<StageId>('position');
  const [positionQuestions, setPositionQuestions] = useState<PositionQuestion[]>(() => buildPositionQuestions('ko'));
  const [positionIndex, setPositionIndex] = useState(0);
  const [positionCorrect, setPositionCorrect] = useState(0);
  const [positionTotal, setPositionTotal] = useState(0);
  const [typingStats, setTypingStats] = useState<TypingStats>({ correctChars: 0, comparedChars: 0, mistakes: 0 });
  const [entryIndex, setEntryIndex] = useState(0);
  const [entryValue, setEntryValue] = useState('');
  const [message, setMessage] = useState('빈칸이 된 키 위치에 들어갈 글자를 골라보세요.');
  const [pressedCode, setPressedCode] = useState<string | null>(null);
  const [wrongCode, setWrongCode] = useState<string | null>(null);
  const [shake, setShake] = useState(false);
  const [trackResults, setTrackResults] = useState<Partial<Record<TrackId, KeyboardTrackResult>>>(savedKeyboardTracks);
  const trackStartedAtRef = useRef(Date.now());
  const moduleStartedAtRef = useRef(Date.now());
  const completingRef = useRef(false);

  const currentQuestion = positionQuestions[positionIndex];
  const currentTypingItems = useMemo(() => getTypingItems(track, stage), [track, stage]);
  const currentTarget = currentTypingItems[entryIndex] ?? '';
  const positionAccuracy = percentage(positionCorrect, positionTotal);
  const typingAccuracy = percentage(typingStats.correctChars, typingStats.comparedChars);
  const typingCpm = Math.round((typingStats.correctChars / Math.max(Date.now() - trackStartedAtRef.current, 1000)) * 60000);
  const positionRoundProgress = getPositionRoundProgress(track, positionIndex);
  const activeStageIndex = Math.max(0, STAGES.findIndex((item) => item.id === stage));
  const overallProgress = stage === 'complete'
    ? 100
    : Math.min(99, Math.round(((activeStageIndex + (stage === 'position' ? positionIndex / positionQuestions.length : (entryIndex + 1) / Math.max(currentTypingItems.length, 1))) / STAGES.length) * 100));
  const otherTrack = track === 'ko' ? 'en' : 'ko';
  const bothTracksDone = !!trackResults.ko && !!trackResults.en;

  const resetTrackPractice = (nextTrack: TrackId, nextStage: StageId = 'position') => {
    setTrack(nextTrack);
    setStage(nextStage);
    setPositionQuestions(buildPositionQuestions(nextTrack));
    setPositionIndex(0);
    setPositionCorrect(0);
    setPositionTotal(0);
    setTypingStats({ correctChars: 0, comparedChars: 0, mistakes: 0 });
    setEntryIndex(0);
    setEntryValue('');
    setMessage('빈칸이 된 키 위치에 들어갈 글자를 골라보세요.');
    setPressedCode(null);
    setWrongCode(null);
    setShake(false);
    trackStartedAtRef.current = Date.now();
  };

  const showWrongFeedback = (code?: string) => {
    playFail();
    setWrongCode(code ?? currentQuestion?.key.code ?? null);
    setShake(true);
    window.setTimeout(() => setWrongCode(null), 450);
    window.setTimeout(() => setShake(false), 450);
  };

  const finishTrack = (finalTypingStats: TypingStats = typingStats) => {
    const elapsedMs = Math.max(1000, Date.now() - trackStartedAtRef.current);
    const result: KeyboardTrackResult = {
      label: TRACKS[track].title,
      positionAccuracy: percentage(positionCorrect, positionTotal),
      typingAccuracy: percentage(finalTypingStats.correctChars, finalTypingStats.comparedChars),
      mistakes: finalTypingStats.mistakes,
      elapsedMs,
      cpm: Math.round((finalTypingStats.correctChars / elapsedMs) * 60000),
      completedAt: new Date().toISOString(),
    };

    setTrackResults((previous) => {
      const next = { ...previous, [track]: result };
      saveStudyResult('keyboard', moduleStartedAtRef.current, { keyboardTracks: next });
      if (next.ko && next.en && !completingRef.current) {
        completingRef.current = true;
        playFanfare();
        markComplete('keyboard');
        window.setTimeout(() => navigate('/result/keyboard'), 900);
      } else {
        playFanfare();
      }
      return next;
    });
    setStage('complete');
    setMessage(`${TRACKS[track].title}을 마쳤어요. ${TRACKS[otherTrack].title}도 이어서 해볼까요?`);
  };

  const advanceTypingStage = (finalTypingStats: TypingStats = typingStats) => {
    if (stage === 'words') {
      setStage('short');
      setEntryIndex(0);
      setEntryValue('');
      setMessage('이제 짧은 문장을 입력해요.');
      return;
    }
    if (stage === 'short') {
      setStage('long');
      setEntryIndex(0);
      setEntryValue('');
      setMessage('마지막으로 긴 글을 차분하게 입력해요.');
      return;
    }
    finishTrack(finalTypingStats);
  };

  const handlePositionAnswer = (answer: string, code?: string) => {
    if (stage !== 'position' || !currentQuestion) return;
    const correct = answer === currentQuestion.answer || code === currentQuestion.key.code;
    setPositionTotal((value) => value + 1);
    setPressedCode(code ?? currentQuestion.key.code);
    window.setTimeout(() => setPressedCode((value) => (value === (code ?? currentQuestion.key.code) ? null : value)), 250);

    if (!correct) {
      setMessage(`아직 아니에요. ${currentQuestion.roundTitle}의 위치를 다시 살펴보세요.`);
      showWrongFeedback(code);
      return;
    }

    playSuccess();
    setPositionCorrect((value) => value + 1);
    if (positionIndex + 1 >= positionQuestions.length) {
      setStage('words');
      setEntryIndex(0);
      setEntryValue('');
      setMessage('자리 연습 완료! 이제 낱말을 입력해요.');
    } else {
      setPositionIndex((value) => value + 1);
      setMessage('정답이에요. 다음 빈칸도 맞혀보세요.');
    }
  };

  const handleTypingSubmit = () => {
    if (!currentTarget) return;
    const score = scoreText(entryValue, currentTarget);
    const exact = isExactMatch(entryValue, currentTarget);
    const nextTypingStats = {
      correctChars: typingStats.correctChars + score.correctChars,
      comparedChars: typingStats.comparedChars + score.comparedChars,
      mistakes: typingStats.mistakes + score.mistakes,
    };
    setTypingStats(nextTypingStats);

    if (!exact) {
      setMessage(`정확도 ${score.accuracy}%예요. 틀린 부분을 고쳐서 다시 확인해요.`);
      showWrongFeedback();
      return;
    }

    playSuccess();
    if (entryIndex + 1 < currentTypingItems.length) {
      setEntryIndex((value) => value + 1);
      setEntryValue('');
      setMessage('좋아요. 다음 글도 이어서 입력해요.');
    } else {
      advanceTypingStage(nextTypingStats);
    }
  };

  const handleTypingKeyDown = (event: ReactKeyboardEvent<HTMLTextAreaElement | HTMLInputElement>) => {
    if (event.key === 'Enter' && (stage === 'words' || event.ctrlKey || event.metaKey)) {
      event.preventDefault();
      handleTypingSubmit();
    }
  };

  const handleVirtualKeyClick = (key: DisplayKey) => {
    if (stage !== 'position' || !key.letter) return;
    handlePositionAnswer(getKeyLabel(track, key.letter), key.code);
  };

  useEffect(() => {
    if (stage !== 'position') return;
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.defaultPrevented) return;
      const target = event.target as HTMLElement | null;
      if (target?.tagName === 'INPUT' || target?.tagName === 'TEXTAREA') return;
      const key = KEY_BY_CODE[event.code];
      if (!key) return;
      event.preventDefault();
      handlePositionAnswer(getKeyLabel(track, key), event.code);
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [stage, track, currentQuestion]);

  return (
    <div className="w-full max-w-7xl mx-auto flex flex-col gap-6 md:pt-8">
      <section className="bg-surface-container-lowest rounded-xl border-2 border-primary-fixed p-5 md:p-8 shadow-sm">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <p className="font-label-bold text-label-bold text-primary">한컴타자식 키보드 학습</p>
            <h1 className="mt-2 font-display-lg text-display-lg text-on-surface">자리부터 긴 글까지 차근차근 익혀요</h1>
            <p className="mt-3 max-w-3xl font-body-lg text-body-lg text-on-surface-variant">
              먼저 자판 위치를 퀴즈로 외우고, 낱말과 문장 입력으로 타자 실력을 확인해요. iPad에서는 화면 버튼만으로 자리 연습을 할 수 있어요.
            </p>
          </div>
          <div className="grid grid-cols-2 gap-3 min-w-[260px]">
            {(['ko', 'en'] as TrackId[]).map((trackId) => {
              const selected = track === trackId;
              const complete = !!trackResults[trackId];
              return (
                <button
                  key={trackId}
                  type="button"
                  onClick={() => {
                    playClick();
                    resetTrackPractice(trackId);
                  }}
                  className={cn(
                    'rounded-xl border-2 px-4 py-4 text-left transition-all',
                    selected
                      ? 'border-primary bg-primary text-on-primary shadow-[0_4px_0_rgba(0,78,118,0.45)]'
                      : complete
                      ? 'border-secondary bg-secondary-container text-on-secondary-container'
                      : 'border-surface-container-highest bg-surface-container-low text-on-surface',
                  )}
                >
                  <span className="material-symbols-outlined block text-3xl" style={{ fontVariationSettings: complete ? "'FILL' 1" : "'FILL' 0" }}>
                    {complete ? 'check_circle' : 'keyboard'}
                  </span>
                  <span className="mt-2 block font-label-bold text-label-bold">{TRACKS[trackId].title}</span>
                </button>
              );
            })}
          </div>
        </div>
      </section>

      <section className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_360px]">
        <div className="flex flex-col gap-6">
          <div
            className="bg-surface-container-highest rounded-xl p-5 md:p-8 border-b-[8px] border-surface-variant shadow-sm"
            style={{ animation: shake ? 'shake 0.4s ease-in-out' : undefined }}
          >
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div>
                <p className="font-label-bold text-label-bold text-primary">{TRACKS[track].title}</p>
                <h2 className="font-headline-md text-headline-md text-on-surface">
                  {stage === 'position' && currentQuestion ? currentQuestion.roundTitle : STAGES.find((item) => item.id === stage)?.title ?? '트랙 완료'}
                </h2>
              </div>
              <SpeakButton
                text={
                  stage === 'position' && currentQuestion
                    ? `${TRACKS[track].title}. ${currentQuestion.roundTitle}. ${currentQuestion.roundHint}`
                    : `${TRACKS[track].title}. ${message}`
                }
              />
            </div>

            <div className="mt-5 grid gap-3 md:grid-cols-4">
              {STAGES.map((item, index) => {
                const done = stage === 'complete' || index < activeStageIndex;
                const active = item.id === stage;
                return (
                  <div
                    key={item.id}
                    className={cn(
                      'rounded-lg border px-3 py-3 font-label-bold text-sm flex items-center gap-2',
                      active
                        ? 'bg-primary text-on-primary border-primary'
                        : done
                        ? 'bg-secondary-container text-on-secondary-container border-secondary-fixed-dim'
                        : 'bg-surface-container-lowest text-on-surface-variant border-surface-container-highest',
                    )}
                  >
                    <span className="material-symbols-outlined text-xl" style={{ fontVariationSettings: done ? "'FILL' 1" : "'FILL' 0" }}>
                      {done ? 'check_circle' : item.icon}
                    </span>
                    {item.title}
                  </div>
                );
              })}
            </div>

            <div className="mt-5 h-4 w-full overflow-hidden rounded-full bg-surface-container-low shadow-inner">
              <div className="h-full rounded-full bg-secondary transition-all duration-500" style={{ width: `${overallProgress}%` }} />
            </div>

            {stage === 'position' && currentQuestion && (
              <div className="mt-8 grid gap-6 lg:grid-cols-[1fr_280px]">
                <div>
                  <p className="font-body-xl text-body-xl text-on-surface">
                    강조된 빈 키에는 어떤 {track === 'ko' ? '자모' : '알파벳'}가 들어갈까요?
                  </p>
                  <p className="mt-2 font-body-lg text-body-lg text-on-surface-variant">
                    {currentQuestion.roundHint} {currentQuestion.key.finger} 자리예요.
                  </p>
                  <p className="mt-3 font-label-bold text-label-bold text-primary">
                    소단계 {positionRoundProgress.current} / {positionRoundProgress.total}
                  </p>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  {currentQuestion.options.map((option) => (
                    <button
                      key={option}
                      type="button"
                      onClick={() => handlePositionAnswer(option)}
                      className="min-h-[72px] rounded-xl bg-surface-container-lowest border-2 border-outline-variant text-on-surface font-display-lg text-display-lg shadow-[0_4px_0_rgba(112,120,129,0.35)] active:translate-y-1 active:shadow-none transition-all hover:border-primary"
                    >
                      {option}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {(stage === 'words' || stage === 'short' || stage === 'long') && (
              <TypingPracticePanel
                stage={stage}
                target={currentTarget}
                index={entryIndex}
                total={currentTypingItems.length}
                value={entryValue}
                onValue={setEntryValue}
                onSubmit={handleTypingSubmit}
                onKeyDown={handleTypingKeyDown}
              />
            )}

            {stage === 'complete' && (
              <div className="mt-8 rounded-xl bg-surface-container-lowest border-2 border-secondary-fixed-dim p-6 text-center">
                <span className="material-symbols-outlined text-6xl text-secondary" style={{ fontVariationSettings: "'FILL' 1" }}>
                  workspace_premium
                </span>
                <h2 className="mt-3 font-headline-md text-headline-md text-on-surface">{TRACKS[track].title} 완료</h2>
                <p className="mt-2 font-body-lg text-body-lg text-on-surface-variant">{message}</p>
                <div className="mt-5 flex flex-wrap justify-center gap-3">
                  {!bothTracksDone && (
                    <button
                      type="button"
                      onClick={() => {
                        playClick();
                        resetTrackPractice(getNextIncompleteTrack(trackResults, track));
                      }}
                      className="rounded-full bg-primary px-6 py-3 font-label-bold text-label-bold text-on-primary shadow-[0_3px_0_rgba(0,78,118,0.55)] active:translate-y-[2px] active:shadow-none"
                    >
                      다른 트랙 시작
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => {
                      playClick();
                      resetTrackPractice(track);
                    }}
                    className="rounded-full bg-surface-container-high px-6 py-3 font-label-bold text-label-bold text-on-surface"
                  >
                    이 트랙 다시 하기
                  </button>
                </div>
              </div>
            )}

            <p className="mt-6 rounded-lg bg-surface-container-lowest px-4 py-3 font-body-lg text-body-lg text-on-surface-variant">
              {message}
            </p>
          </div>

          <VirtualKeyboard
            track={track}
            highlightedCode={stage === 'position' ? currentQuestion?.key.code : undefined}
            pressedCode={pressedCode}
            wrongCode={wrongCode}
            blankCode={stage === 'position' ? currentQuestion?.key.code : undefined}
            onKeyClick={handleVirtualKeyClick}
          />
        </div>

        <aside className="flex flex-col gap-4">
          <MetricCard icon="location_on" label="자리 정확도" value={`${positionAccuracy}%`} detail={`${positionCorrect} / ${positionTotal}`} />
          <MetricCard icon="spellcheck" label="타자 정확도" value={`${typingAccuracy}%`} detail={`오타 ${typingStats.mistakes}개`} />
          <MetricCard icon="speed" label="현재 타수" value={`${typingCpm}`} detail="분당 글자 수" />
          <div className="rounded-xl bg-surface-container-lowest border-2 border-surface-container-highest p-5">
            <p className="font-label-bold text-label-bold text-primary mb-3">트랙 완료 기록</p>
            {(['ko', 'en'] as TrackId[]).map((trackId) => {
              const result = trackResults[trackId];
              return (
                <div key={trackId} className="flex items-center justify-between gap-3 border-t border-outline-variant/40 py-3 first:border-t-0">
                  <span className="font-label-bold text-sm text-on-surface">{TRACKS[trackId].title}</span>
                  <span className={cn('rounded-full px-3 py-1 text-sm font-label-bold', result ? 'bg-secondary-container text-on-secondary-container' : 'bg-surface-container text-on-surface-variant')}>
                    {result ? `${result.positionAccuracy}% / ${result.cpm}타` : '진행 전'}
                  </span>
                </div>
              );
            })}
          </div>
        </aside>
      </section>

      <style>{`
        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          20% { transform: translateX(-8px); }
          40% { transform: translateX(8px); }
          60% { transform: translateX(-6px); }
          80% { transform: translateX(6px); }
        }
      `}</style>
    </div>
  );
}

function TypingPracticePanel({
  stage,
  target,
  index,
  total,
  value,
  onValue,
  onSubmit,
  onKeyDown,
}: {
  stage: StageId;
  target: string;
  index: number;
  total: number;
  value: string;
  onValue: (value: string) => void;
  onSubmit: () => void;
  onKeyDown: (event: ReactKeyboardEvent<HTMLTextAreaElement | HTMLInputElement>) => void;
}) {
  const score = scoreText(value, target);
  const isLong = stage === 'long';
  return (
    <div className="mt-8 grid gap-5">
      <div className="rounded-xl bg-surface-container-lowest border-2 border-primary-fixed p-5">
        <p className="font-label-bold text-label-bold text-primary">
          {STAGES.find((item) => item.id === stage)?.title} {index + 1} / {total}
        </p>
        <p className="mt-3 font-headline-md text-headline-md text-on-surface break-words">{target}</p>
      </div>
      <div>
        <label htmlFor="keyboard_typing_input" className="font-label-bold text-label-bold text-on-surface">
          그대로 입력하기
        </label>
        {isLong ? (
          <textarea
            id="keyboard_typing_input"
            value={value}
            onChange={(event) => onValue(event.target.value)}
            onKeyDown={onKeyDown}
            className="mt-2 min-h-40 w-full rounded-xl border-2 border-outline-variant bg-surface-container-lowest p-4 font-body-xl text-body-xl outline-none focus:border-primary focus:ring-4 focus:ring-primary-fixed"
            autoComplete="off"
            autoCorrect="off"
            spellCheck={false}
          />
        ) : (
          <input
            id="keyboard_typing_input"
            value={value}
            onChange={(event) => onValue(event.target.value)}
            onKeyDown={onKeyDown}
            className="mt-2 h-16 w-full rounded-xl border-2 border-outline-variant bg-surface-container-lowest px-4 font-body-xl text-body-xl outline-none focus:border-primary focus:ring-4 focus:ring-primary-fixed"
            autoComplete="off"
            autoCorrect="off"
            spellCheck={false}
          />
        )}
      </div>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-wrap gap-2 text-sm font-label-bold text-on-surface-variant">
          <span className="rounded-full bg-surface-container px-3 py-2">현재 정확도 {score.accuracy}%</span>
          <span className="rounded-full bg-surface-container px-3 py-2">현재 오타 {score.mistakes}개</span>
        </div>
        <button
          type="button"
          onClick={onSubmit}
          className="rounded-full bg-primary px-8 py-4 font-label-bold text-label-bold text-on-primary shadow-[0_4px_0_rgba(0,78,118,0.55)] active:translate-y-[3px] active:shadow-none"
        >
          확인
        </button>
      </div>
    </div>
  );
}

function VirtualKeyboard({
  track,
  highlightedCode,
  pressedCode,
  wrongCode,
  blankCode,
  onKeyClick,
}: {
  track: TrackId;
  highlightedCode?: string;
  pressedCode: string | null;
  wrongCode: string | null;
  blankCode?: string;
  onKeyClick: (key: DisplayKey) => void;
}) {
  return (
    <div className="w-full overflow-x-auto rounded-xl bg-surface-container-low p-4 md:p-6 border-b-[6px] border-surface-dim shadow-inner">
      <div className="mx-auto flex min-w-[760px] max-w-5xl flex-col items-center gap-2">
        {KEYBOARD_ROWS.map((row, rowIndex) => (
          <div key={rowIndex} className="flex justify-center gap-2">
            {row.map((key) => {
              const active = highlightedCode === key.code;
              const pressed = pressedCode === key.code;
              const wrong = wrongCode === key.code;
              const label = key.letter ? getKeyLabel(track, key.letter) : key.label;
              return (
                <button
                  key={`${rowIndex}-${key.code}`}
                  type="button"
                  onClick={() => onKeyClick(key)}
                  disabled={!key.letter}
                  aria-label={key.letter ? `${TRACKS[track].shortTitle} ${label} 자리` : key.label}
                  className={cn(
                    'relative flex h-14 flex-shrink-0 flex-col items-center justify-center rounded-lg border-b-4 font-label-bold text-label-bold transition-all',
                    key.width === 'space'
                      ? 'w-64'
                      : key.width === 'extraWide'
                      ? 'w-24'
                      : key.width === 'wide'
                      ? 'w-18'
                      : 'w-12',
                    key.letter ? 'cursor-pointer' : 'cursor-default',
                    active
                      ? 'scale-105 bg-primary text-on-primary border-on-primary-fixed-variant shadow-[0_8px_16px_rgba(0,100,150,0.35)]'
                      : wrong
                      ? 'bg-error-container text-on-error-container border-error'
                      : 'bg-surface-container-lowest text-on-surface-variant border-outline-variant',
                    pressed && 'translate-y-1 border-b-0',
                  )}
                >
                  {key.letter && blankCode === key.code ? (
                    <span className="text-2xl">?</span>
                  ) : key.letter ? (
                    <>
                      <span>{label}</span>
                      {track === 'ko' && <span className="text-[11px] text-current/70">{key.letter.en}</span>}
                    </>
                  ) : (
                    <span className="text-sm">{key.label}</span>
                  )}
                  {key.letter?.anchor && <span className="absolute bottom-1 h-1 w-5 rounded-full bg-current/40" />}
                </button>
              );
            })}
          </div>
        ))}
      </div>
    </div>
  );
}

function MetricCard({ icon, label, value, detail }: { icon: string; label: string; value: string; detail: string }) {
  return (
    <div className="rounded-xl bg-surface-container-lowest border-2 border-surface-container-highest p-5">
      <div className="flex items-center gap-3">
        <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary-container text-on-primary-container">
          <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>
            {icon}
          </span>
        </div>
        <div>
          <p className="font-label-bold text-sm text-on-surface-variant">{label}</p>
          <p className="font-headline-md text-headline-md text-on-surface">{value}</p>
        </div>
      </div>
      <p className="mt-3 font-body-lg text-sm text-on-surface-variant">{detail}</p>
    </div>
  );
}
