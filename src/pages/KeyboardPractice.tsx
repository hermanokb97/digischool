import { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useUser } from '@/context/UserContext';
import { playClick, playFail, playFanfare, playSuccess } from '@/lib/sound';
import { SpeakButton } from '@/components/SpeakButton';
import { saveStudyResult } from '@/lib/evaluation';

interface Step {
  id: string;
  type?: 'key' | 'copy' | 'paste';
  prompt: string;
  hint: string;
  matchKey?: string;
  matchCode?: string;
  shiftKey?: boolean;
  ctrlKey?: boolean;
  altKey?: boolean;
  display: string;
  describe: string;
}

const STEPS: Step[] = [
  {
    id: 'enter',
    prompt: 'Enter 키를 눌러보세요!',
    hint: 'Enter는 결정하거나 줄바꿈을 할 때 써요. 보통 키보드 오른쪽에 있어요.',
    matchKey: 'Enter',
    display: 'Enter',
    describe: '엔터',
  },
  {
    id: 'space',
    prompt: '스페이스(Space) 키를 눌러보세요!',
    hint: 'Space는 띄어쓰기에 사용해요. 키보드에서 가장 길고 큰 키예요.',
    matchKey: ' ',
    display: 'Space',
    describe: '스페이스',
  },
  {
    id: 'backspace',
    prompt: '백스페이스(Backspace) 키를 눌러보세요!',
    hint: 'Backspace는 글자를 지울 때 써요. 보통 키보드 오른쪽 위에 있어요.',
    matchKey: 'Backspace',
    display: 'Backspace',
    describe: '백스페이스',
  },
  {
    id: 'a',
    prompt: 'A 키를 눌러보세요!',
    hint: '글자 A 키예요. 영어 소문자가 입력돼요.',
    matchKey: 'a',
    matchCode: 'KeyA',
    display: 'A',
    describe: '에이',
  },
  {
    id: 'one',
    prompt: '숫자 1 키를 눌러보세요!',
    hint: '키보드 위쪽 숫자줄에 있어요.',
    matchKey: '1',
    matchCode: 'Digit1',
    display: '1',
    describe: '숫자 일',
  },
  {
    id: 'shift',
    prompt: 'Shift 키를 눌러보세요!',
    hint: 'Shift는 다른 키와 함께 누르면 대문자나 특수 기호를 입력할 수 있어요.',
    matchKey: 'Shift',
    display: 'Shift',
    describe: '쉬프트',
  },
  {
    id: 'capslock',
    prompt: 'CapsLock 키를 눌러보세요!',
    hint: 'CapsLock은 영어 대문자를 계속 입력하고 싶을 때 켜고 끄는 키예요. 한 번 누르면 켜지고, 다시 누르면 꺼져요.',
    matchKey: 'CapsLock',
    display: 'CapsLock',
    describe: '캡스락',
  },
  {
    id: 'ctrl',
    prompt: 'Ctrl(컨트롤) 키를 눌러보세요!',
    hint: 'Ctrl은 단축키를 사용할 때 함께 눌러요. 예: Ctrl+C 복사, Ctrl+V 붙여넣기.',
    matchKey: 'Control',
    display: 'Ctrl',
    describe: '컨트롤',
  },
  {
    id: 'alt',
    prompt: 'Alt(알트) 키를 눌러보세요!',
    hint: 'Alt는 메뉴를 열거나 다른 기능을 추가로 사용할 때 써요.',
    matchKey: 'Alt',
    display: 'Alt',
    describe: '알트',
  },
  {
    id: 'tab',
    prompt: 'Tab(탭) 키를 눌러보세요!',
    hint: 'Tab은 다음 칸이나 다음 항목으로 이동할 때 써요.',
    matchKey: 'Tab',
    display: 'Tab',
    describe: '탭',
  },
  {
    id: 'arrow',
    prompt: '오른쪽 방향키 →를 눌러보세요!',
    hint: '방향키로 글자나 화면을 움직일 수 있어요.',
    matchKey: 'ArrowRight',
    display: '→',
    describe: '오른쪽 방향키',
  },
  {
    id: 'shift_exclaim',
    prompt: 'Shift를 누른 채 1을 눌러서 느낌표(!)를 만들어보세요!',
    hint: 'Shift + 1 = ! 처럼 Shift와 함께 누르면 특수 기호가 만들어져요.',
    matchKey: '!',
    shiftKey: true,
    display: 'Shift + 1',
    describe: '느낌표',
  },
  {
    id: 'shift_question',
    prompt: 'Shift를 누른 채 / 키를 눌러서 물음표(?)를 만들어보세요!',
    hint: 'Shift + / = ? 처럼 특수 기호도 키 조합으로 만들어요.',
    matchKey: '?',
    shiftKey: true,
    display: 'Shift + /',
    describe: '물음표',
  },
  {
    id: 'copy_shortcut',
    type: 'copy',
    prompt: 'Ctrl + C로 문장을 복사해보세요!',
    hint: '먼저 복사할 문장을 마우스로 드래그해서 파랗게 선택해요. 그 다음 Ctrl 키를 누른 채 C를 누르면 문장이 복사돼요.',
    matchKey: 'c',
    ctrlKey: true,
    display: 'Ctrl + C',
    describe: '복사 단축키',
  },
  {
    id: 'paste_shortcut',
    type: 'paste',
    prompt: 'Ctrl + V로 문장을 붙여넣어보세요!',
    hint: '빈 칸을 클릭하고 Ctrl 키를 누른 채 V를 누르면 복사한 문장이 옮겨져요.',
    matchKey: 'v',
    ctrlKey: true,
    display: 'Ctrl + V',
    describe: '붙여넣기 단축키',
  },
];

const TopRow = ['Q', 'W', 'E', 'R', 'T', 'Y', 'U', 'I', 'O', 'P'];
const HomeRow = ['A', 'S', 'D', 'F', 'G', 'H', 'J', 'K', 'L'];
const BottomRow = ['Z', 'X', 'C', 'V', 'B', 'N', 'M'];
const SHORTCUT_TEXT = '디지 스쿨에서 단축키를 배워요!';

function matches(step: Step, e: KeyboardEvent): boolean {
  if (step.shiftKey && !e.shiftKey) return false;
  if (step.ctrlKey && !e.ctrlKey) return false;
  if (step.altKey && !e.altKey) return false;
  if (step.matchCode && e.code === step.matchCode) return true;
  if (step.matchKey === ' ' && (e.key === ' ' || e.code === 'Space')) return true;
  if (step.matchKey === 'Control' && (e.key === 'Control' || e.code.startsWith('Control'))) return true;
  if (step.matchKey === 'Alt' && (e.key === 'Alt' || e.code.startsWith('Alt'))) return true;
  if (step.matchKey === 'Shift' && (e.key === 'Shift' || e.code.startsWith('Shift'))) return true;
  if (step.matchKey === 'CapsLock' && e.key === 'CapsLock') return true;
  if (step.matchKey === 'Tab' && e.key === 'Tab') return true;
  if (step.matchKey === 'ArrowRight' && e.key === 'ArrowRight') return true;
  if (step.matchKey && step.matchKey.length === 1) {
    return e.key.toLowerCase() === step.matchKey.toLowerCase();
  }
  return e.key === step.matchKey;
}

function isExpectedModifierPrelude(step: Step, e: KeyboardEvent): boolean {
  if (step.ctrlKey && step.matchKey !== 'Control' && (e.key === 'Control' || e.code.startsWith('Control'))) return true;
  if (step.shiftKey && step.matchKey !== 'Shift' && (e.key === 'Shift' || e.code.startsWith('Shift'))) return true;
  if (step.altKey && step.matchKey !== 'Alt' && (e.key === 'Alt' || e.code.startsWith('Alt'))) return true;
  return false;
}

export function KeyboardPractice() {
  const navigate = useNavigate();
  const { markComplete } = useUser();
  const [stepIndex, setStepIndex] = useState(0);
  const [pressedKey, setPressedKey] = useState<string | null>(null);
  const [shake, setShake] = useState(false);
  const [done, setDone] = useState(false);
  const [copiedText, setCopiedText] = useState('');
  const [pastedText, setPastedText] = useState('');
  const [selectedText, setSelectedText] = useState('');
  const completedRef = useRef(false);
  const startedAtRef = useRef(Date.now());

  const currentStep = STEPS[stepIndex];
  const progress = useMemo(() => Math.round((stepIndex / STEPS.length) * 100), [stepIndex]);

  const finishCurrentStep = () => {
    const nextIndex = stepIndex + 1;
    if (nextIndex >= STEPS.length) {
      setDone(true);
      if (!completedRef.current) {
        completedRef.current = true;
        saveStudyResult('keyboard', startedAtRef.current);
        playFanfare();
        markComplete('keyboard');
        window.setTimeout(() => navigate('/result/keyboard'), 1100);
      }
    } else {
      setStepIndex(nextIndex);
    }
  };

  useEffect(() => {
    if (done) return;
    const handler = (e: KeyboardEvent) => {
      const display =
        e.key === ' '
          ? 'Space'
          : ['Control', 'Shift', 'Alt', 'Tab', 'Enter', 'Backspace', 'CapsLock'].includes(e.key)
          ? e.key === 'Control'
            ? 'Ctrl'
            : e.key
          : e.key === 'ArrowRight'
          ? '→'
          : e.key.length === 1
          ? e.key.toUpperCase()
          : e.key;
      setPressedKey(display);
      window.setTimeout(() => setPressedKey((p) => (p === display ? null : p)), 250);

      if (matches(currentStep, e)) {
        if (currentStep.matchKey === 'Tab') e.preventDefault();
        if (e.ctrlKey || e.altKey || e.key === 'Backspace' || e.key === ' ' || e.key === 'Enter') e.preventDefault();
        if (currentStep.type === 'copy') {
          const liveSelection = window.getSelection()?.toString().trim() ?? '';
          if (selectedText.trim() !== SHORTCUT_TEXT && liveSelection !== SHORTCUT_TEXT) {
            playFail();
            setShake(true);
            window.setTimeout(() => setShake(false), 400);
            return;
          }
          playSuccess();
          setSelectedText(SHORTCUT_TEXT);
          setCopiedText(SHORTCUT_TEXT);
          navigator.clipboard?.writeText(SHORTCUT_TEXT).catch(() => {});
        } else if (currentStep.type === 'paste') {
          if (!copiedText) {
            playFail();
            setShake(true);
            window.setTimeout(() => setShake(false), 400);
            return;
          }
          playSuccess();
          setPastedText(copiedText);
        } else {
          playSuccess();
        }
        finishCurrentStep();
      } else if (isExpectedModifierPrelude(currentStep, e)) {
        return;
      } else if (
        e.key.length === 1 ||
        ['Enter', 'Backspace', 'Tab', ' ', 'Control', 'Alt'].includes(e.key) ||
        e.code.startsWith('Key') ||
        e.code.startsWith('Digit')
      ) {
        playFail();
        setShake(true);
        window.setTimeout(() => setShake(false), 400);
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [currentStep, stepIndex, done, copiedText, selectedText, markComplete, navigate]);

  const handleTextSelection = () => {
    const selection = window.getSelection()?.toString().trim() ?? '';
    if (selection === SHORTCUT_TEXT) {
      setSelectedText(selection);
      playSuccess();
    }
  };

  const markShortcutTextSelected = () => {
    setSelectedText(SHORTCUT_TEXT);
    playSuccess();
  };

  const isHighlighted = (display: string) => {
    return currentStep.display.toLowerCase().split(' + ').some((part) => part.trim().toLowerCase() === display.toLowerCase());
  };

  const isPressed = (display: string) => pressedKey?.toUpperCase() === display.toUpperCase();

  return (
    <div className="flex-grow flex flex-col items-center justify-center gap-8 w-full max-w-7xl mx-auto relative md:pt-12">
      <div
        className={`relative w-full max-w-4xl bg-surface-container-highest rounded-xl p-8 border-b-[8px] border-surface-variant shadow-sm flex flex-col items-center text-center transition-transform ${
          shake ? '' : ''
        }`}
        style={{ animation: shake ? 'shake 0.4s ease-in-out' : undefined }}
      >
        <span className="font-label-bold text-label-bold text-primary mb-2 uppercase tracking-widest">
          {done ? '완료' : `미션 ${stepIndex + 1} / ${STEPS.length}`}
        </span>
        <div className="flex items-center justify-center gap-3 flex-wrap">
          <h1 className="font-display-lg text-display-lg text-on-surface">
            {done ? '참 잘했어요! 모든 미션 완료!' : currentStep.prompt}
          </h1>
          {!done && <SpeakButton text={`${currentStep.prompt} ${currentStep.hint}`} />}
        </div>

        {!done && (
          <p className="mt-3 font-body-lg text-body-lg text-on-surface-variant max-w-2xl">{currentStep.hint}</p>
        )}

        <div className="mt-6 w-full max-w-md">
          <div className="flex justify-between text-sm font-label-bold text-on-surface-variant mb-2">
            <span>진행도</span>
            <span>
              {Math.min(stepIndex, STEPS.length)} / {STEPS.length}
            </span>
          </div>
          <div className="w-full h-4 bg-surface-container-low rounded-full overflow-hidden shadow-inner">
            <div
              className="h-full bg-secondary rounded-full transition-all duration-500"
              style={{ width: `${done ? 100 : progress}%` }}
            />
          </div>
        </div>

        {(currentStep.type === 'copy' || currentStep.type === 'paste' || copiedText || pastedText) && (
          <div className="mt-6 w-full max-w-2xl grid grid-cols-1 md:grid-cols-2 gap-4">
            <div
              tabIndex={0}
              onMouseUp={handleTextSelection}
              onKeyUp={handleTextSelection}
              className={`rounded-xl p-4 border-2 text-left ${
                currentStep.type === 'copy'
                  ? 'border-primary bg-primary-container/30 ring-4 ring-primary-fixed'
                  : 'border-surface-container-highest bg-surface-container-low'
              }`}
              aria-label="복사할 문장"
            >
              <p className="font-label-bold text-label-bold text-primary mb-2">복사할 문장</p>
              <p className="font-body-xl text-body-xl text-on-surface bg-surface-container-lowest rounded-lg p-3 select-text">
                {SHORTCUT_TEXT}
              </p>
              {currentStep.type === 'copy' && (
                <div
                  className={`mt-3 rounded-lg p-3 font-label-bold text-sm ${
                    selectedText === SHORTCUT_TEXT
                      ? 'bg-secondary-container text-on-secondary-container'
                      : 'bg-tertiary-container text-on-tertiary-container'
                  }`}
                >
                  {selectedText === SHORTCUT_TEXT
                    ? '좋아요! 문장이 선택됐어요. 이제 Ctrl + C를 눌러 복사해요.'
                    : '1단계: 문장 위에서 마우스를 누른 채 끝까지 드래그해서 선택해요.'}
                </div>
              )}
              {currentStep.type === 'copy' && selectedText !== SHORTCUT_TEXT && (
                <button
                  type="button"
                  onClick={markShortcutTextSelected}
                  className="mt-3 px-4 py-2 rounded-full bg-primary text-on-primary font-label-bold text-sm shadow-[0_2px_0_rgb(0,78,118)] active:translate-y-[2px] active:shadow-none transition-all"
                >
                  드래그가 어려워요: 선택한 것으로 연습하기
                </button>
              )}
              <p className="mt-2 text-sm text-on-surface-variant">
                {copiedText ? '복사 완료! 이제 빈 칸에 붙여넣어 봐요.' : '2단계: 선택한 뒤 Ctrl + C를 누르면 문장이 복사돼요.'}
              </p>
            </div>
            <div
              className={`rounded-xl p-4 border-2 text-left ${
                currentStep.type === 'paste'
                  ? 'border-primary bg-primary-container/30 ring-4 ring-primary-fixed'
                  : 'border-surface-container-highest bg-surface-container-low'
              }`}
            >
              <label htmlFor="paste_target" className="font-label-bold text-label-bold text-primary mb-2 block">
                붙여넣을 칸
              </label>
              <textarea
                id="paste_target"
                value={pastedText}
                onChange={(e) => setPastedText(e.target.value)}
                className="w-full min-h-24 rounded-lg border-2 border-outline-variant bg-surface-container-lowest p-3 font-body-lg text-body-lg outline-none focus:border-primary focus:ring-4 focus:ring-primary-fixed"
                placeholder="Ctrl + V를 누르면 여기에 문장이 들어와요"
                aria-label="붙여넣기 연습 칸"
              />
            </div>
          </div>
        )}

        {done && (
          <div className="absolute -top-8 -right-4 bg-secondary text-on-secondary rounded-full p-4 shadow-[0_8px_16px_rgba(45,106,68,0.3)] transform rotate-12 flex items-center justify-center border-4 border-surface-container-lowest">
            <span className="material-symbols-outlined text-5xl" style={{ fontVariationSettings: "'FILL' 1" }}>
              check_circle
            </span>
          </div>
        )}
      </div>

      <div className="w-full max-w-5xl bg-surface-container-low rounded-xl p-gutter border-b-[6px] border-surface-dim shadow-inner overflow-x-auto">
        <div className="flex flex-col gap-unit min-w-[900px] justify-center items-center">
          {/* 숫자줄 */}
          <div className="flex justify-center gap-unit w-full max-w-4xl">
            {[1, 2, 3, 4, 5, 6, 7, 8, 9, 0].map((n) => (
              <KeyCap key={`num-${n}`} label={String(n)} highlighted={isHighlighted(String(n))} pressed={isPressed(String(n))} />
            ))}
            <KeyCap label="Backspace" wide highlighted={isHighlighted('Backspace')} pressed={isPressed('Backspace')} />
          </div>

          {/* QWERTY */}
          <div className="flex justify-center gap-unit w-full max-w-4xl">
            <KeyCap label="Tab" wide highlighted={isHighlighted('Tab')} pressed={isPressed('Tab')} />
            {TopRow.map((char) => (
              <KeyCap key={char} label={char} highlighted={isHighlighted(char)} pressed={isPressed(char)} />
            ))}
          </div>

          {/* 홈 행 */}
          <div className="flex justify-center gap-unit w-full max-w-4xl pl-6">
            <KeyCap label="CapsLock" extraWide highlighted={isHighlighted('CapsLock')} pressed={isPressed('CapsLock')} />
            {HomeRow.map((char) => (
              <KeyCap key={char} label={char} highlighted={isHighlighted(char)} pressed={isPressed(char)} />
            ))}
            <KeyCap label="Enter" extraWide highlighted={isHighlighted('Enter')} pressed={isPressed('Enter')} />
          </div>

          {/* 아래 행 */}
          <div className="flex justify-center gap-unit w-full max-w-4xl">
            <KeyCap label="Shift" wide highlighted={isHighlighted('Shift')} pressed={isPressed('Shift')} />
            {BottomRow.map((char) => (
              <KeyCap key={char} label={char} highlighted={isHighlighted(char)} pressed={isPressed(char)} />
            ))}
            <KeyCap label="/" highlighted={isHighlighted('/')} pressed={isPressed('/')} />
            <KeyCap label="Shift" wide highlighted={isHighlighted('Shift')} pressed={isPressed('Shift')} />
          </div>

          {/* 스페이스 행 + 컨트롤/알트 */}
          <div className="flex justify-center gap-unit mt-2 w-full max-w-4xl">
            <KeyCap label="Ctrl" wide highlighted={isHighlighted('Ctrl')} pressed={isPressed('Ctrl')} />
            <KeyCap label="Alt" wide highlighted={isHighlighted('Alt')} pressed={isPressed('Alt')} />
            <KeyCap label="Space" superWide highlighted={isHighlighted('Space')} pressed={isPressed('Space')} />
            <KeyCap label="Alt" wide highlighted={isHighlighted('Alt')} pressed={isPressed('Alt')} />
            <KeyCap label="Ctrl" wide highlighted={isHighlighted('Ctrl')} pressed={isPressed('Ctrl')} />
          </div>

          {/* 방향키 */}
          <div className="flex justify-center gap-unit mt-2 w-full max-w-4xl">
            <KeyCap label="←" />
            <KeyCap label="↑" />
            <KeyCap label="↓" />
            <KeyCap label="→" highlighted={isHighlighted('→')} pressed={isPressed('→')} />
          </div>
        </div>
      </div>

      <div className="flex gap-3 flex-wrap justify-center">
        <button
          onClick={() => {
            playClick();
            setStepIndex(0);
            setDone(false);
            setCopiedText('');
            setPastedText('');
            setSelectedText('');
            completedRef.current = false;
            startedAtRef.current = Date.now();
          }}
          className="text-primary hover:text-on-primary-container hover:bg-primary-container px-6 py-3 rounded-full font-label-bold text-label-bold transition-colors"
        >
          처음부터 다시 시작
        </button>
        {!done && stepIndex > 0 && (
          <button
            onClick={() => {
              playClick();
              setStepIndex((i) => Math.max(0, i - 1));
            }}
            className="text-on-surface-variant hover:bg-surface-container-high px-6 py-3 rounded-full font-label-bold text-label-bold transition-colors"
          >
            ← 이전 미션
          </button>
        )}
        {!done && (
          <button
            onClick={() => {
              playClick();
              if (stepIndex + 1 >= STEPS.length) return;
              setStepIndex((i) => Math.min(STEPS.length - 1, i + 1));
            }}
            className="text-on-surface-variant hover:bg-surface-container-high px-6 py-3 rounded-full font-label-bold text-label-bold transition-colors"
          >
            건너뛰기 →
          </button>
        )}
      </div>

      <style>{`
        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          20% { transform: translateX(-8px); }
          40% { transform: translateX(8px); }
          60% { transform: translateX(-6px); }
          80% { transform: translateX(6px); }
        }
        @keyframes keyglow {
          0% { box-shadow: 0 0 0 0 rgba(0,100,150,0.6); }
          100% { box-shadow: 0 0 0 16px rgba(0,100,150,0); }
        }
      `}</style>
    </div>
  );
}

interface KeyCapProps {
  label: string;
  wide?: boolean;
  extraWide?: boolean;
  superWide?: boolean;
  highlighted?: boolean;
  pressed?: boolean;
}

function KeyCap({ label, wide, extraWide, superWide, highlighted, pressed }: KeyCapProps) {
  const widthClass = superWide
    ? 'w-72'
    : extraWide
    ? 'w-28'
    : wide
    ? 'w-20'
    : label.length > 1 && !['→', '←', '↑', '↓'].includes(label)
    ? 'w-20'
    : 'w-12';
  const baseHeight = 'h-14';

  let classes = `${widthClass} ${baseHeight} rounded-lg border-b-4 flex items-center justify-center font-label-bold text-label-bold shadow-sm flex-shrink-0 transition-all relative`;

  if (highlighted) {
    classes +=
      ' bg-primary text-on-primary border-on-primary-fixed-variant scale-105 z-10 shadow-[0_8px_16px_rgba(0,100,150,0.4)]';
  } else {
    classes += ' bg-surface-container-lowest border-outline-variant text-on-surface-variant';
  }

  if (pressed) {
    classes += ' translate-y-1 border-b-0';
  }

  return (
    <div
      className={classes}
      style={pressed && highlighted ? { animation: 'keyglow 0.4s ease-out' } : undefined}
      aria-label={`키 ${label}`}
    >
      {label}
      {highlighted && <div className="absolute inset-0 rounded-lg bg-white opacity-20 blur-md pointer-events-none" />}
    </div>
  );
}
