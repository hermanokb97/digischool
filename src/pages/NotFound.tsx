import { Link } from 'react-router-dom';

export function NotFound() {
  return (
    <div className="max-w-3xl w-full text-center space-y-8 bg-surface-container-lowest p-12 rounded-xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] my-auto mt-12 md:mt-auto">
      <div className="w-40 h-40 mx-auto bg-primary-container rounded-full flex items-center justify-center shadow-[0_8px_0_rgb(112,193,255)]">
        <span className="material-symbols-outlined text-[80px] text-on-primary-container" style={{ fontVariationSettings: "'FILL' 1" }}>
          travel_explore
        </span>
      </div>
      <div className="space-y-4">
        <h1 className="font-display-xl text-display-xl text-primary font-black">길을 잃었나요?</h1>
        <p className="font-body-xl text-body-xl text-on-surface-variant">
          이런! 찾으려던 페이지가 없어요. 다시 홈에서 시작해 봐요.
        </p>
      </div>
      <Link
        to="/"
        className="inline-flex items-center gap-3 bg-primary text-on-primary font-headline-md text-headline-md px-12 py-5 rounded-full shadow-[0_8px_0_rgba(0,78,118,1)] hover:scale-105 active:scale-95 active:shadow-[0_2px_0_rgba(0,78,118,1)] active:translate-y-[6px] transition-all"
      >
        <span className="material-symbols-outlined text-[40px]" style={{ fontVariationSettings: "'FILL' 1" }}>home</span>
        홈으로 가기
      </Link>
    </div>
  );
}
