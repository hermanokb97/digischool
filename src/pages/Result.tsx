import { Link, Navigate, useNavigate, useParams } from 'react-router-dom';
import { motion } from 'motion/react';
import { useMemo } from 'react';
import { useUser } from '@/context/UserContext';
import { MODULES, getModule, isModuleKey } from '@/lib/constants';
import { formatDuration, getEvaluationLabel, getStudyResult } from '@/lib/evaluation';

export function Result() {
  const { module } = useParams<{ module: string }>();
  const navigate = useNavigate();
  const { user } = useUser();

  if (!isModuleKey(module)) {
    return <Navigate to="/dashboard" replace />;
  }

  const meta = getModule(module);
  const studyResult = getStudyResult(module);
  const progress = user?.progress;
  const completedCount = MODULES.filter((m) => progress?.[m.key]).length;
  const totalCount = MODULES.length;
  const isAllComplete = completedCount === totalCount;
  const nextModule = MODULES.find((m) => !progress?.[m.key] && m.key !== module);

  const today = new Date().toLocaleDateString('ko-KR', { year: 'numeric', month: 'long', day: 'numeric' });

  const confettiPieces = useMemo(() => {
    if (!isAllComplete) return [];
    return Array.from({ length: 24 }, (_, i) => ({
      id: i,
      left: `${(i * 4) % 100}%`,
      delay: (i % 8) * 0.12,
      color: ['#ffd54f', '#ff8a65', '#90cdff', '#aeefbf', '#ce93d8'][i % 5],
      size: 8 + (i % 3) * 4,
    }));
  }, [isAllComplete]);

  return (
    <div className="w-full max-w-[900px] mx-auto flex flex-col items-center justify-center relative z-10 py-12">
      <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
        <div className="absolute top-[-10%] left-[-10%] w-[50vw] h-[50vw] bg-primary-container/30 rounded-full blur-[100px]"></div>
        <div className="absolute bottom-[-10%] right-[-10%] w-[60vw] h-[60vw] bg-tertiary-fixed/30 rounded-full blur-[120px]"></div>
        <div className="absolute top-[20%] right-[10%] w-[30vw] h-[30vw] bg-secondary-container/20 rounded-full blur-[80px]"></div>

        {confettiPieces.map((piece) => (
          <motion.div
            key={piece.id}
            initial={{ y: -40, opacity: 0, rotate: 0 }}
            animate={{ y: '120vh', opacity: [0, 1, 1, 0], rotate: 720 }}
            transition={{ duration: 4 + (piece.id % 4) * 0.5, delay: piece.delay, repeat: Infinity, repeatDelay: 1.5, ease: 'easeIn' }}
            style={{ left: piece.left, width: piece.size, height: piece.size, backgroundColor: piece.color }}
            className="absolute top-0 rounded-sm"
          />
        ))}
      </div>

      <motion.header
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: 'easeOut' }}
        className="text-center w-full mb-gutter flex flex-col items-center z-10"
      >
        <div className="w-48 h-48 md:w-64 md:h-64 mb-6 relative">
          <div className="w-full h-full rounded-full bg-tertiary-fixed flex items-center justify-center shadow-lg shadow-primary-container/50 border-8 border-surface-container-lowest">
            <span className="material-symbols-outlined text-[120px] text-on-tertiary-fixed" style={{ fontVariationSettings: "'FILL' 1" }}>
              {isAllComplete ? 'workspace_premium' : meta.icon}
            </span>
          </div>
          <div className="absolute -top-4 -right-4 bg-tertiary-fixed text-on-tertiary-fixed p-3 rounded-full shadow-md flex items-center justify-center transform rotate-12 animate-[bob_2s_ease-in-out_infinite]">
            <span className="material-symbols-outlined text-3xl">local_fire_department</span>
          </div>
          <div className="absolute -bottom-4 -left-4 bg-primary text-on-primary p-3 rounded-full shadow-md flex items-center justify-center transform -rotate-12 animate-[bob_2s_ease-in-out_infinite_0.5s]">
            <span className="material-symbols-outlined text-3xl">star</span>
          </div>
        </div>
        <h1 className="font-display-xl text-display-xl text-primary tracking-tight mb-unit">
          {isAllComplete ? '모든 학습 완료!' : '참 잘했어요!'}
        </h1>
        <p className="font-body-xl text-body-xl text-on-surface-variant max-w-2xl">
          {isAllComplete
            ? '모든 학습 과정을 훌륭하게 마쳤습니다. 오늘의 노력이 멋진 성장이 될 거예요!'
            : `${meta.label} 미션을 멋지게 끝냈어요!`}
        </p>
        {studyResult && (
          <div className="mt-6 flex flex-col sm:flex-row gap-3 justify-center">
            <div className="bg-primary-container text-on-primary-container px-6 py-3 rounded-full font-label-bold text-label-bold flex items-center justify-center gap-2">
              <span className="material-symbols-outlined">timer</span>
              걸린 시간: {formatDuration(studyResult.durationMs)}
            </div>
            <div className="bg-secondary-container text-on-secondary-container px-6 py-3 rounded-full font-label-bold text-label-bold flex items-center justify-center gap-2">
              <span className="material-symbols-outlined">reviews</span>
              {getEvaluationLabel(studyResult.rating)}
            </div>
          </div>
        )}
      </motion.header>

      <div className="w-full grid grid-cols-1 md:grid-cols-12 gap-gutter mb-margin-tablet z-10">
        <div className="md:col-span-7 bg-surface-container-lowest rounded-xl p-8 shadow-[0_8px_30px_rgb(0,0,0,0.06)] border-2 border-primary-fixed relative overflow-hidden flex flex-col justify-center items-center text-center group">
          <div className="absolute top-0 left-0 w-full h-4 bg-primary"></div>
          <div className="absolute -right-12 -bottom-12 text-primary-container/20 pointer-events-none">
            <span className="material-symbols-outlined text-[200px]" style={{ fontVariationSettings: "'FILL' 1" }}>workspace_premium</span>
          </div>
          <div className="bg-surface-container-high text-on-surface p-4 rounded-full mb-6 inline-flex shadow-sm">
            <span className="material-symbols-outlined text-5xl text-primary" style={{ fontVariationSettings: "'FILL' 1" }}>military_tech</span>
          </div>
          <h2 className="font-headline-md text-headline-md text-on-surface mb-2">
            {isAllComplete ? '디지 스쿨 마스터 증서' : `${meta.label} 수료증`}
          </h2>
          <h3 className="font-body-xl text-body-xl text-primary font-bold mb-6">{user?.nickname ?? '디지 스쿨 친구'}</h3>
          <div className="w-16 h-1 bg-outline-variant/50 rounded-full mb-6"></div>
          <p className="font-body-lg text-body-lg text-on-surface-variant mb-2">위 어린이는</p>
          <p className="font-body-lg text-body-lg text-on-surface-variant mb-8">
            {isAllComplete
              ? '모든 디지털 기초 과정을 우수한 성적으로 수료하였기에 이 증서를 수여합니다.'
              : `${meta.label} 과정을 끝까지 완수하였기에 이 증서를 수여합니다.`}
          </p>
          {studyResult && (
            <div className="mb-6 bg-surface-container rounded-2xl p-5 w-full max-w-md">
              <p className="font-label-bold text-label-bold text-primary mb-2">이번 학습 평가</p>
              <p className="font-body-lg text-body-lg text-on-surface-variant">
                총 {formatDuration(studyResult.durationMs)} 동안 연습했어요. {getEvaluationLabel(studyResult.rating)}
              </p>
            </div>
          )}
          <div className="font-label-bold text-label-bold text-on-surface bg-surface-container px-6 py-3 rounded-full">{today}</div>
        </div>

        <div className="md:col-span-5 grid grid-cols-2 gap-unit md:gap-gutter">
          {MODULES.map((m) => {
            const done = !!progress?.[m.key];
            return (
              <div
                key={m.key}
                className={`rounded-lg p-5 shadow-[0_4px_15px_rgb(0,0,0,0.04)] flex flex-col items-center justify-center text-center border transition-transform ${
                  done ? 'bg-secondary-container border-secondary' : 'bg-surface-container-lowest border-surface-variant'
                }`}
              >
                <div className={`p-3 rounded-full mb-3 ${done ? 'bg-secondary text-on-secondary' : 'bg-surface-variant text-on-surface-variant'}`}>
                  <span className="material-symbols-outlined text-3xl" style={{ fontVariationSettings: "'FILL' 1" }}>{m.icon}</span>
                </div>
                <span className="font-label-bold text-label-bold text-on-surface mb-3 text-sm">{m.shortLabel}</span>
                <div className="flex gap-1">
                  {[0, 1, 2].map((i) => (
                    <span
                      key={i}
                      className={`material-symbols-outlined text-2xl ${done ? 'text-tertiary' : 'text-outline-variant'}`}
                      style={{ fontVariationSettings: done ? "'FILL' 1" : "'FILL' 0" }}
                    >
                      star
                    </span>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <div className="w-full flex flex-col sm:flex-row gap-gutter justify-center mt-auto z-10">
        <Link
          to={meta.route}
          className="flex-1 max-w-[300px] min-h-[touch-min] bg-surface-container-high text-on-surface py-5 px-8 rounded-full font-label-bold text-label-bold flex items-center justify-center gap-3 border-b-4 border-outline-variant shadow-sm hover:bg-surface-variant active:border-b-0 active:translate-y-1 transition-all"
        >
          <span className="material-symbols-outlined">refresh</span>
          다시 학습하기
        </Link>
        {nextModule ? (
          <button
            type="button"
            onClick={() => navigate(nextModule.route)}
            className="flex-1 max-w-[300px] min-h-[touch-min] bg-primary text-on-primary py-5 px-8 rounded-full font-label-bold text-label-bold flex items-center justify-center gap-3 border-b-4 border-on-primary-container shadow-lg shadow-primary/20 hover:bg-primary/90 active:border-b-0 active:translate-y-1 transition-all"
          >
            다음 학습: {nextModule.shortLabel}
            <span className="material-symbols-outlined">arrow_forward</span>
          </button>
        ) : (
          <Link
            to="/dashboard"
            className="flex-1 max-w-[300px] min-h-[touch-min] bg-primary text-on-primary py-5 px-8 rounded-full font-label-bold text-label-bold flex items-center justify-center gap-3 border-b-4 border-on-primary-container shadow-lg shadow-primary/20 hover:bg-primary/90 active:border-b-0 active:translate-y-1 transition-all"
          >
            대시보드로
            <span className="material-symbols-outlined">exit_to_app</span>
          </Link>
        )}
      </div>

      <style>{`
        @keyframes bob {
          0%, 100% { transform: translateY(0) rotate(12deg); }
          50% { transform: translateY(-6px) rotate(12deg); }
        }
      `}</style>
    </div>
  );
}
