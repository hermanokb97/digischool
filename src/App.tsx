import { lazy, ReactNode, Suspense } from "react";
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import { Layout } from "./components/layout/Layout";
import { UserProvider, useUser } from "./context/UserContext";
import { ErrorBoundary } from "./components/ErrorBoundary";

const Home = lazy(() => import("./pages/Home").then((module) => ({ default: module.Home })));
const Dashboard = lazy(() => import("./pages/Dashboard").then((module) => ({ default: module.Dashboard })));
const MousePractice = lazy(() => import("./pages/MousePractice").then((module) => ({ default: module.MousePractice })));
const DesktopSimulation = lazy(() =>
  import("./pages/DesktopSimulation").then((module) => ({ default: module.DesktopSimulation })),
);
const Result = lazy(() => import("./pages/Result").then((module) => ({ default: module.Result })));
const InternetBrowser = lazy(() =>
  import("./pages/InternetBrowser").then((module) => ({ default: module.InternetBrowser })),
);
const LoginPractice = lazy(() => import("./pages/LoginPractice").then((module) => ({ default: module.LoginPractice })));
const LoginSimulation = lazy(() =>
  import("./pages/LoginSimulation").then((module) => ({ default: module.LoginSimulation })),
);
const KeyboardPractice = lazy(() =>
  import("./pages/KeyboardPractice").then((module) => ({ default: module.KeyboardPractice })),
);
const KeyboardTypingPractice = lazy(() =>
  import("./pages/KeyboardTypingPractice").then((module) => ({ default: module.KeyboardTypingPractice })),
);
const Registration = lazy(() => import("./pages/Registration").then((module) => ({ default: module.Registration })));
const Growth = lazy(() => import("./pages/Growth").then((module) => ({ default: module.Growth })));
const Playground = lazy(() => import("./pages/Playground").then((module) => ({ default: module.Playground })));
const NotFound = lazy(() => import("./pages/NotFound").then((module) => ({ default: module.NotFound })));
const Evaluation = lazy(() => import("./pages/Evaluation").then((module) => ({ default: module.Evaluation })));

function RequireAuth({ children }: { children: ReactNode }) {
  const { user } = useUser();
  if (!user) {
    return <Navigate to="/register" replace />;
  }
  return <>{children}</>;
}

function RedirectIfAuthed({ children }: { children: ReactNode }) {
  const { user } = useUser();
  if (user) {
    return <Navigate to="/" replace />;
  }
  return <>{children}</>;
}

export default function App() {
  return (
    <ErrorBoundary>
      <UserProvider>
        <Router>
          <Suspense fallback={null}>
            <Routes>
              <Route
                path="/register"
                element={
                  <RedirectIfAuthed>
                    <Registration />
                  </RedirectIfAuthed>
                }
              />
              <Route
                path="/"
                element={
                  <RequireAuth>
                    <Layout />
                  </RequireAuth>
                }
              >
                <Route index element={<Home />} />
                <Route path="dashboard" element={<Dashboard />} />
                <Route path="mouse" element={<MousePractice />} />
                <Route path="mouse/desktop" element={<DesktopSimulation />} />
                <Route path="browser" element={<InternetBrowser />} />
                <Route path="login-practice" element={<LoginPractice />} />
                <Route path="login-practice/simulation" element={<LoginSimulation />} />
                <Route path="keyboard" element={<KeyboardPractice />} />
                <Route path="keyboard-typing" element={<KeyboardTypingPractice />} />
                <Route path="result/:module" element={<Result />} />
                <Route path="growth" element={<Growth />} />
                <Route path="evaluation" element={<Evaluation />} />
                <Route path="playground" element={<Playground />} />
                <Route path="*" element={<NotFound />} />
              </Route>
            </Routes>
          </Suspense>
        </Router>
      </UserProvider>
    </ErrorBoundary>
  );
}
