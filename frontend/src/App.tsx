// src/App.tsx
import {
  BrowserRouter,
  Routes,
  Route,
  Navigate,
  useLocation,
} from "react-router-dom";
import "./App.css";
import { routes } from "./routes";
import { AppLayout } from "@/app/components/layout/AppLayout";
import LoginPage from "@/app/features/auth/LoginPage";
import RegisterPage from "@/app/features/auth/RegisterPage";

// Protects dashboard routes: if no token, redirect to /login
function RequireAuth({ children }: { children: JSX.Element }) {
  const location = useLocation();

  // Simple token check from localStorage
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

  return children;
}

function DashboardRoutes() {
  return (
    <Routes>
      {routes.map((route) => {
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
  return (
    <BrowserRouter>
      <Routes>
        {/* Public auth routes */}
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />

        {/* Everything else must be authenticated */}
        <Route
          path="/*"
          element={
            <RequireAuth>
              <AppLayout sidebarItems={routes}>
                <DashboardRoutes />
              </AppLayout>
            </RequireAuth>
          }
        />
      </Routes>
    </BrowserRouter>
  );
}
