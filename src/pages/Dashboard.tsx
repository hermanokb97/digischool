import { Link } from 'react-router-dom';
import { useUser } from '@/context/UserContext';
import { MODULES, ModuleMeta } from '@/lib/constants';

const COLOR_STYLES: Record<ModuleMeta['color'], { bg: string; on: string; border: string }> = {
  primary: { bg: 'bg-primary-container', on: 'text-on-primary-container', border: 'border-primary-fixed-dim' },
  secondary: { bg: 'bg-secondary-container', on: 'text-on-secondary-container', border: 'border-secondary-fixed-dim' },
  tertiary: { bg: 'bg-tertiary-container', on: 'text-on-tertiary-container', border: 'border-tertiary-fixed-dim' },
  error: { bg: 'bg-error-container', on: 'text-on-error-container', border: 'border-error/40' },
};

export function Dashboard() {
  const { user } = useUser();
  const progress = user?.progress;

  const completedCount = MODULES.filter((m) => progress?.[m.key]).length;
  const totalCount = MODULES.length;
  const overall = Math.round((completedCount / totalCount) * 100);

  return (
    <div className="w-full max-w-6xl mx-auto flex flex-col gap-8 md:pt-10">
      <section className="bg-surface-container-lowest rounded-xl p-gutter shadow-sm border border-surface-container flex flex-col md:flex-row items-center gap-gutter relative overflow-hidden">
        <div className="absolute -right-10 -top-10 w-40 h-40 bg-primary-fixed rounded-full opacity-50 blur-2xl"></div>

        <div className="flex-1 w-full z-10">
          <h1 className="font-display-lg text-display-lg text-on-background mb-2">
            {completedCount === totalCount ? '모두 마쳤어요!' : '오늘도 힘차게!'}
          </h1>
          <p className="font-body-lg text-body-lg text-on-surface-variant mb-6">
            {completedCount === totalCount ? '대단해요! 또 도전해 볼까요?' : '디지털 세상 탐험을 계속해 볼까요?'}
          </p>

          <div className="w-full">
            <div className="flex justify-between items-end mb-2">
              <span className="font-label-bold text-label-bold text-primary">
                전체 진행도 ({completedCount}/{totalCount})
              </span>
              <span className="font-label-bold text-label-bold text-secondary">{overall}%</span>
            </div>
            <div className="w-full h-8 bg-surface-container-high rounded-full overflow-hidden shadow-inner p-1">
              <div
                className="h-full bg-secondary rounded-full relative transition-all duration-1000 flex justify-end items-center pr-2"
                style={{ width: `${Math.max(overall, 4)}%` }}
              >
                <span className="material-symbols-outlined text-white text-sm" style={{ fontVariationSettings: "'FILL' 1" }}>rocket_launch</span>
              </div>
            </div>
          </div>
        </div>

        <div className="hidden md:block w-48 h-48 flex-shrink-0 bg-primary-container rounded-full overflow-hidden border-4 border-white shadow-lg z-10">
          <img
            className="w-full h-full object-cover"
            src="https://lh3.googleusercontent.com/aida-public/AB6AXuBylw2Y5QEyv4dbOZBvfQICpBFn_Adf8-jNDkB08jRFPJDOYBijGoTuypMoU4C23S6iNRDtjAampk8yAhR00lv2t_T4iRr_zXN_qJPOQfoEGN6BkXRtvfVPdK4jwNoNpr6c5CJFIVsowwQ8wCmfrWwhCvYZK9qyM6GM4qFMxP9CXS95XbtBZCk3orW-M7Q0rn6FpMXxyKtSY8385VHzNb-_SlsnQmOf7v0VL-FQpkyfzNKg6bg9hece3q7Vfg54alcmGGbOn9p9Tv8"
            alt="Robot on cube"
          />
        </div>
      </section>

      <section className="grid grid-cols-1 md:grid-cols-2 gap-8 pb-12">
        {MODULES.map((m) => (
          <ModuleCard key={m.key} module={m} completed={!!progress?.[m.key]} />
        ))}
      </section>
    </div>
  );
}

interface ModuleCardProps {
  module: ModuleMeta;
  completed: boolean;
}

function ModuleCard({ module, completed }: ModuleCardProps) {
  const styles = COLOR_STYLES[module.color];
  const stars = completed ? 3 : 0;

  return (
    <Link
      to={module.route}
      className="bg-surface-container-lowest rounded-lg p-gutter border-2 border-surface-container-highest shadow-3d flex flex-col justify-between min-h-[200px] group transition-all text-left hover:border-primary-container"
      aria-label={`${module.label} ${completed ? '완료' : '시작'}`}
    >
      <div className="flex justify-between items-start w-full">
        <div className={`w-16 h-16 rounded-[24px] ${styles.bg} flex items-center justify-center group-hover:scale-110 transition-transform`}>
          <span className={`material-symbols-outlined text-[32px] ${styles.on}`} style={{ fontVariationSettings: "'FILL' 1" }}>{module.icon}</span>
        </div>
        <div className={`px-3 py-1 rounded-full ${
          completed
            ? 'bg-secondary-fixed border border-secondary-fixed-dim'
            : 'bg-surface-container'
        }`}>
          <span className={`font-label-bold text-label-bold text-sm ${completed ? 'text-on-secondary-fixed' : 'text-primary'}`}>
            {completed ? '완료!' : '시작하기'}
          </span>
        </div>
      </div>
      <div className="mt-6 w-full">
        <h2 className="font-headline-md text-headline-md text-on-background mb-1">{module.label}</h2>
        <p className="font-body-lg text-body-lg text-on-surface-variant text-sm mb-3">{module.description}</p>
        <div className="flex gap-1" aria-label={`별 ${stars}개 / 3개`}>
          {[0, 1, 2].map((i) => (
            <span
              key={i}
              className={`material-symbols-outlined ${i < stars ? 'text-tertiary' : 'text-outline-variant'}`}
              style={{ fontVariationSettings: i < stars ? "'FILL' 1" : "'FILL' 0" }}
            >
              star
            </span>
          ))}
        </div>
      </div>
    </Link>
  );
}
