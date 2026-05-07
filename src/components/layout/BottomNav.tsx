import { Link, useLocation } from "react-router-dom";
import { cn } from "@/lib/utils";

interface NavItem {
  to: string;
  label: string;
  icon: string;
  match: (path: string) => boolean;
}

const NAV_ITEMS: NavItem[] = [
  { to: '/', label: '홈', icon: 'home', match: (p) => p === '/' },
  {
    to: '/dashboard',
    label: '학습하기',
    icon: 'menu_book',
    match: (p) => p === '/dashboard' || p.startsWith('/keyboard') || p.startsWith('/mouse') || p.startsWith('/browser') || p.startsWith('/login-practice'),
  },
  { to: '/playground', label: '연습장', icon: 'sports_esports', match: (p) => p.startsWith('/playground') },
  { to: '/evaluation', label: '평가', icon: 'quiz', match: (p) => p.startsWith('/evaluation') },
];

export function BottomNav() {
  const location = useLocation();
  const path = location.pathname;

  return (
    <nav
      aria-label="하단 메뉴"
      className="md:hidden fixed bottom-0 left-0 w-full z-50 flex justify-around items-center px-4 pb-6 pt-3 bg-surface-container-lowest text-primary font-lexend text-xs font-semibold border-t-4 border-surface-container-highest rounded-t-[40px] shadow-[0_-10px_25px_-5px_rgba(0,0,0,0.1)]"
    >
      {NAV_ITEMS.map((item) => {
        const active = item.match(path);
        return (
          <Link
            key={item.to}
            to={item.to}
            aria-current={active ? 'page' : undefined}
            className={cn(
              'flex flex-col items-center justify-center rounded-full px-4 py-2 transition-transform active:scale-95 active:translate-y-[2px]',
              active
                ? 'bg-primary-container text-on-primary-container shadow-[inset_0_4px_0_rgba(0,0,0,0.05)]'
                : 'text-outline hover:bg-surface-container-low',
            )}
          >
            <span className="material-symbols-outlined" style={{ fontVariationSettings: active ? "'FILL' 1" : "'FILL' 0" }}>
              {item.icon}
            </span>
            <span className="mt-1">{item.label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
