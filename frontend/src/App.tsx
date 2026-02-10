// src/App.tsx
import type { JSX } from "react"; // 👈 ADDED THIS LINE

import {
  BrowserRouter,
  Routes,
  Route,
  Navigate,
  useLocation,
} from "react-router-dom";
import "./App.css";
import { routes as allRoutes } from "./routes";
import type { AppRoute, AppRole } from "./routes";
import { AppLayout } from "@/app/components/layout/AppLayout";
import LoginPage from "@/app/features/auth/LoginPage";
import RegisterPage from "@/app/features/auth/RegisterPage";
import ChangePasswordPage from "@/app/features/auth/ChangePasswordPage";
import ForgotPasswordPage from "@/app/features/auth/ForgotPasswordPage";

// Helper to read authUser from localStorage
function getAuthUser() {
  if (typeof window === "undefined") return null;
  const raw = localStorage.getItem("authUser");
  if (!raw) return null;
  try {
    return JSON.parse(raw) as {
      id: number;
      name?: string;
      email: string;
      role: AppRole;
      mustChangePassword?: boolean;
    };
  } catch {
    return null;
  }
}

// Protects dashboard routes: if no token, redirect to /login
// If mustChangePassword === true, force /change-password
function RequireAuth({ children }: { children: JSX.Element }) {
  const location = useLocation();

  const token =
    typeof window !== "undefined" ? localStorage.getItem("authToken") : null;

  if (!token) {
    return (
      <Navigate
        to="/login"
        replace
        state={{ from: location.pathname || "/dashboard" }}
      />
    );
  }

  const authUser = getAuthUser();
  const mustChange = authUser?.mustChangePassword === true;
  const onChangePassword = location.pathname.startsWith("/change-password");

  if (mustChange && !onChangePassword) {
    return (
      <Navigate
        to="/change-password"
        replace
        state={{ from: location.pathname || "/dashboard" }}
      />
    );
  }

  return children;
}

function DashboardRoutes({ allowedRoutes }: { allowedRoutes: AppRoute[] }) {
  return (
    <Routes>
      {allowedRoutes.map((route) => {
        const Component = route.component;
        return (
          <Route key={route.path} path={route.path} element={<Component />} />
        );
      })}
      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  );
}

export default function App() {
  const authUser = getAuthUser();
  const role = authUser?.role as AppRole | undefined;

  const allowedRoutes: AppRoute[] = role
    ? allRoutes.filter((route) => !route.roles || route.roles.includes(role))
    : allRoutes;

  return (
    <BrowserRouter>
      <Routes>
        {/* Public auth routes */}
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />

        {/* Change password (must be logged in, might have mustChangePassword=true) */}
        <Route
          path="/change-password"
          element={
            <RequireAuth>
              <ChangePasswordPage />
            </RequireAuth>
          }
        />
        <Route path="/forgot-password" element={<ForgotPasswordPage />} />

        {/* Everything else must be authenticated */}
        <Route
          path="/*"
          element={
            <RequireAuth>
              <AppLayout sidebarItems={allowedRoutes}>
                <DashboardRoutes allowedRoutes={allowedRoutes} />
              </AppLayout>
            </RequireAuth>
          }
        />
      </Routes>
    </BrowserRouter>
  );
}
