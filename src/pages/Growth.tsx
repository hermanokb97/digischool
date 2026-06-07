import { Link } from 'react-router-dom';
import { useUser } from '@/context/UserContext';
import { MODULES } from '@/lib/constants';
import { formatDuration, getEvaluationLabel, getStudyResult } from '@/lib/evaluation';

const KEYBOARD_TRACK_LABELS = {
  ko: '한글',
  en: '영어',
} as const;

function formatDate(iso?: string): string {
  if (!iso) return '아직 학습 전';
  try {
    return new Date(iso).toLocaleDateString('ko-KR', { year: 'numeric', month: 'long', day: 'numeric' });
  } catch {
    return '아직 학습 전';
  }
}

export function Growth() {
  const { user, resetProgress } = useUser();
  const progress = user?.progress;
  const lastStudied = user?.lastStudiedAt;

  const completedCount = MODULES.filter((m) => progress?.[m.key]).length;
  const totalCount = MODULES.length;
  const overall = Math.round((completedCount / totalCount) * 100);

  return (
    <div className="w-full max-w-5xl mx-auto flex flex-col gap-8 md:pt-10">
      <section className="bg-surface-container-lowest rounded-xl p-gutter shadow-sm border border-surface-container relative overflow-hidden">
        <div className="absolute -right-10 -top-10 w-40 h-40 bg-tertiary-fixed rounded-full opacity-50 blur-2xl"></div>
        <div className="z-10 relative">
          <h1 className="font-display-lg text-display-lg text-on-background mb-2">{user?.nickname}의 성장 기록과 평가</h1>
          <p className="font-body-lg text-body-lg text-on-surface-variant mb-6">
            {completedCount === 0
              ? '이제부터 멋진 모험이 시작될 거예요!'
              : completedCount === totalCount
              ? '모든 모험을 끝냈어요. 정말 대단해요!'
              : `${completedCount}개의 모험을 끝냈어요. 계속해서 도전해 봐요!`}
          </p>

          <div className="flex flex-wrap gap-4">
            <div className="bg-secondary-container text-on-secondary-container px-6 py-3 rounded-full font-label-bold text-label-bold flex items-center gap-2">
              <span className="material-symbols-outlined">military_tech</span> 배지 {completedCount}개
            </div>
            <div className="bg-tertiary-container text-on-tertiary-container px-6 py-3 rounded-full font-label-bold text-label-bold flex items-center gap-2">
              <span className="material-symbols-outlined">trending_up</span> {overall}% 완료
            </div>
            <div className="bg-primary-container text-on-primary-container px-6 py-3 rounded-full font-label-bold text-label-bold flex items-center gap-2">
              <span className="material-symbols-outlined">cake</span> 가입일 {formatDate(user?.createdAt)}
            </div>
          </div>
        </div>
      </section>

      <section className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {MODULES.map((m) => {
          const done = !!progress?.[m.key];
          const studiedAt = lastStudied?.[m.key];
          const result = getStudyResult(m.key);
          const keyboardTrackEntries =
            m.key === 'keyboard' && result?.details?.keyboardTracks
              ? (['ko', 'en'] as const)
                  .map((track) => ({ track, result: result.details?.keyboardTracks?.[track] }))
                  .filter((entry): entry is { track: 'ko' | 'en'; result: NonNullable<typeof entry.result> } => !!entry.result)
              : [];
          return (
            <article
              key={m.key}
              className={`rounded-xl p-6 border-2 shadow-sm flex flex-col gap-4 ${
                done ? 'bg-secondary-container border-secondary-fixed-dim' : 'bg-surface-container-lowest border-surface-container-highest'
              }`}
            >
              <div className="flex items-center gap-4">
                <div className={`w-14 h-14 rounded-2xl flex items-center justify-center ${done ? 'bg-secondary text-on-secondary' : 'bg-surface-variant text-on-surface-variant'}`}>
                  <span className="material-symbols-outlined text-2xl" style={{ fontVariationSettings: "'FILL' 1" }}>{m.icon}</span>
                </div>
                <div className="flex-1">
                  <h2 className="font-headline-md text-headline-md text-on-background">{m.label}</h2>
                  <p className="font-body-lg text-body-lg text-on-surface-variant text-sm">
                    {done ? `완료: ${formatDate(studiedAt)}` : '아직 도전 전이에요'}
                  </p>
                </div>
              </div>

              <div className="flex gap-1" aria-label={done ? '별 3개 / 3개' : '별 0개 / 3개'}>
                {[0, 1, 2].map((i) => (
                  <span
                    key={i}
                    className={`material-symbols-outlined text-3xl ${done ? 'text-tertiary' : 'text-outline-variant'}`}
                    style={{ fontVariationSettings: done ? "'FILL' 1" : "'FILL' 0" }}
                  >
                    star
                  </span>
                ))}
              </div>

              {result ? (
                <div className="bg-surface-container-lowest/70 rounded-xl p-4 border border-surface-container-highest">
                  <p className="font-label-bold text-label-bold text-primary mb-1">평가 결과</p>
                  <p className="font-body-lg text-body-lg text-on-surface-variant text-sm">
                    걸린 시간: <strong>{formatDuration(result.durationMs)}</strong>
                  </p>
                  <p className="font-body-lg text-body-lg text-on-surface-variant text-sm">
                    평가: <strong>{getEvaluationLabel(result.rating)}</strong>
                  </p>
                  {keyboardTrackEntries.length > 0 && (
                    <div className="mt-3 grid gap-2">
                      {keyboardTrackEntries.map(({ track, result: trackResult }) => (
                        <p key={track} className="rounded-lg bg-surface-container px-3 py-2 text-sm">
                          <strong>{KEYBOARD_TRACK_LABELS[track]}</strong> 자리 {trackResult.positionAccuracy}%, 타자 {trackResult.typingAccuracy}%, {trackResult.cpm}타, 오타 {trackResult.mistakes}개
                        </p>
                      ))}
                    </div>
                  )}
                </div>
              ) : (
                <div className="bg-surface-container rounded-xl p-4 border border-surface-container-highest">
                  <p className="font-body-lg text-body-lg text-on-surface-variant text-sm">
                    아직 평가 기록이 없어요. 학습을 완료하면 시간이 자동으로 기록돼요.
                  </p>
                </div>
              )}

              <div className="flex gap-2 mt-auto pt-2">
                <Link
                  to={m.route}
                  className="flex-1 bg-primary text-on-primary text-center px-4 py-2 rounded-full font-label-bold text-sm shadow-[0_2px_0_rgb(0,78,118)] active:translate-y-[2px] active:shadow-none transition-all"
                >
                  {done ? '다시 학습' : '시작하기'}
                </Link>
                {done && (
                  <button
                    type="button"
                    onClick={() => {
                      if (confirm(`${m.label} 진행도를 초기화할까요?`)) {
                        resetProgress(m.key);
                      }
                    }}
                    className="px-4 py-2 rounded-full font-label-bold text-sm border-2 border-outline-variant text-on-surface-variant hover:bg-surface-container hover:text-error transition-colors"
                    aria-label={`${m.label} 진행도 초기화`}
                  >
                    초기화
                  </button>
                )}
              </div>
            </article>
          );
        })}
      </section>
    </div>
  );
}
