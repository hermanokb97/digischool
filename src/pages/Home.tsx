import { Link, useNavigate } from 'react-router-dom';
import { useUser } from '@/context/UserContext';
import { GUEST_PROFILE_IMAGE_SRC, MODULES } from '@/lib/constants';
import { playClick } from '@/lib/sound';

export function Home() {
  const { user } = useUser();
  const navigate = useNavigate();
  const progress = user?.progress;

  const completedCount = MODULES.filter((m) => progress?.[m.key]).length;
  const remainingCount = MODULES.length - completedCount;
  const nextModule = MODULES.find((m) => !progress?.[m.key]);
  const profileImageSrc = user?.isGuest ? GUEST_PROFILE_IMAGE_SRC : '/digischool-icon.png';
  const profileImageAlt = user?.isGuest ? '손님 프로필 사진' : '디지 스쿨 로봇 아이콘';

  const handleStart = () => {
    playClick();
    if (nextModule) {
      navigate(nextModule.route);
    } else {
      navigate('/dashboard');
    }
  };

  return (
    <div className="max-w-4xl w-full text-center space-y-12 bg-surface-container-lowest p-12 rounded-xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] my-auto mt-12 md:mt-auto">
      <div className="space-y-4">
        <h1 className="font-display-xl text-display-xl text-primary font-black">안녕! {user?.nickname} 환영해!</h1>
        <p className="font-body-xl text-body-xl text-on-surface-variant">
          {nextModule ? '오늘도 즐거운 디지털 여행을 떠나볼까?' : '모든 모험을 끝냈어요. 다시 도전해 볼까요?'}
        </p>
      </div>

      <div className="relative w-64 h-64 mx-auto">
        <img
          src={profileImageSrc}
          alt={profileImageAlt}
          className="w-full h-full object-cover rounded-full shadow-[0_12px_40px_rgba(0,100,150,0.2)] border-8 border-surface"
        />
      </div>

      <div>
        <button
          type="button"
          onClick={handleStart}
          className="bg-primary text-on-primary font-display-lg text-display-lg px-16 py-6 rounded-full shadow-[0_8px_0_rgba(0,78,118,1)] hover:scale-105 active:scale-95 active:shadow-[0_2px_0_rgba(0,78,118,1)] active:translate-y-[6px] transition-all inline-flex items-center justify-center gap-4 mx-auto min-h-[96px] min-w-[300px]"
        >
          <span className="material-symbols-outlined text-[64px]" style={{ fontVariationSettings: "'FILL' 1" }}>play_arrow</span>
          {nextModule ? '시작하기' : '대시보드'}
        </button>
        {nextModule && (
          <p className="mt-3 font-label-bold text-label-bold text-on-surface-variant">
            다음 학습: <span className="text-primary">{nextModule.label}</span>
          </p>
        )}
      </div>

      <div className="flex flex-wrap justify-center gap-4 pt-8 border-t border-outline-variant/30">
        <div className="bg-secondary-container text-on-secondary-container px-6 py-3 rounded-full font-label-bold text-label-bold flex items-center gap-2">
          <span className="material-symbols-outlined">star</span> 오늘의 목표: {Math.max(remainingCount, 0)}개
        </div>
        <div className="bg-tertiary-container text-on-tertiary-container px-6 py-3 rounded-full font-label-bold text-label-bold flex items-center gap-2">
          <span className="material-symbols-outlined">military_tech</span> 배지: {completedCount}개
        </div>
        <Link
          to="/evaluation"
          className="bg-surface-container-high text-on-surface px-6 py-3 rounded-full font-label-bold text-label-bold flex items-center gap-2 hover:bg-surface-container-highest transition-colors"
        >
          <span className="material-symbols-outlined">leaderboard</span> 평가 보기
        </Link>
      </div>
    </div>
  );
}
