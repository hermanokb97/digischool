import { ReactNode } from "react";
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import { Layout } from "./components/layout/Layout";
import { Home } from "./pages/Home";
import { Dashboard } from "./pages/Dashboard";
import { MousePractice } from "./pages/MousePractice";
import { DesktopSimulation } from "./pages/DesktopSimulation";
import { Result } from "./pages/Result";
import { InternetBrowser } from "./pages/InternetBrowser";
import { LoginPractice } from "./pages/LoginPractice";
import { LoginSimulation } from "./pages/LoginSimulation";
import { KeyboardPractice } from "./pages/KeyboardPractice";
import { Registration } from "./pages/Registration";
import { Growth } from "./pages/Growth";
import { Playground } from "./pages/Playground";
import { NotFound } from "./pages/NotFound";
import { Evaluation } from "./pages/Evaluation";
import { UserProvider, useUser } from "./context/UserContext";
import { ErrorBoundary } from "./components/ErrorBoundary";

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
              <Route path="result/:module" element={<Result />} />
              <Route path="growth" element={<Growth />} />
              <Route path="evaluation" element={<Evaluation />} />
              <Route path="playground" element={<Playground />} />
              <Route path="*" element={<NotFound />} />
            </Route>
          </Routes>
        </Router>
      </UserProvider>
    </ErrorBoundary>
  );
}
