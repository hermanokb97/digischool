import { Outlet, useLocation } from "react-router-dom";
import { Navbar } from "./Navbar";
import { BottomNav } from "./BottomNav";
import { MuteFab } from "../MuteFab";
import { cn } from "@/lib/utils";

export function Layout() {
  const location = useLocation();
  const isResultPage = location.pathname.startsWith('/result');

  return (
    <div className={cn('min-h-screen flex flex-col font-body-xl bg-background')}>
      {!isResultPage && <Navbar />}

      <MuteFab />

      <main className="flex-grow flex flex-col items-center p-gutter mb-24 md:mb-0 w-full overflow-x-hidden">
        <Outlet />
      </main>

      {!isResultPage && <BottomNav />}
    </div>
  );
}
