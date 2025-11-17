// src/app/components/layout/AppLayout.tsx
import type { ReactNode } from "react";
import { useLocation } from "react-router-dom";
import { Sidebar } from "./Sidebar";
import { TopBar } from "./TopBar";
import type { AppRoute, AppRole } from "../../../routes";

interface AppLayoutProps {
  children: ReactNode;
  sidebarItems: AppRoute[];
}

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
    };
  } catch {
    return null;
  }
}

export function AppLayout({ children, sidebarItems }: AppLayoutProps) {
  const location = useLocation();

  const authUser = getAuthUser();

  const currentUser = {
    name: authUser?.name || authUser?.email || "User",
    email: authUser?.email || "unknown@local",
    role: authUser?.role || "CUSTOMER",
  };

  const isSuperAdmin = currentUser.role === "SUPER_ADMIN";

  // Filter sidebar items based on role
  const filteredItems = sidebarItems.filter((item) => {
    if (!item.roles || isSuperAdmin) return true;
    return item.roles.includes(currentUser.role as AppRole);
  });

  return (
    <div className="h-screen w-screen overflow-hidden bg-muted text-foreground">
      <div className="flex h-full w-full ">
        {/* Sidebar */}
        <Sidebar
          items={filteredItems}
          currentPath={location.pathname}
          user={currentUser}
        />

        {/* Right side (topbar + page) */}
        <div className="flex flex-1 flex-col min-w-0 bg-background">
          <TopBar currentPath={location.pathname} user={currentUser} />

          <main className="flex-1 overflow-y-auto p-4 md:p-6">
            <div className="w-full h-full">{children}</div>
          </main>
        </div>
      </div>
    </div>
  );
}
