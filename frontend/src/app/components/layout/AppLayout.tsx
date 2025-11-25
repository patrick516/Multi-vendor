// src/app/components/layout/AppLayout.tsx
import type { ReactNode } from "react";
import { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { Sidebar } from "./Sidebar";
import { TopBar } from "./TopBar";
import type { AppRoute, AppRole } from "../../../routes";

const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || "http://localhost:5000/api";

interface AppLayoutProps {
  children: ReactNode;
  sidebarItems: AppRoute[];
}

interface CurrentUser {
  id: number;
  name?: string;
  email: string;
  role: AppRole;
  subscriptionActive?: boolean;
  mustPay?: boolean;
}

// Helper to read authUser from localStorage
function getAuthUser(): CurrentUser | null {
  if (typeof window === "undefined") return null;
  const raw = localStorage.getItem("authUser");
  if (!raw) return null;
  try {
    return JSON.parse(raw) as CurrentUser;
  } catch {
    return null;
  }
}

const ADMIN_ACCOUNT_TNM =
  import.meta.env.VITE_ADMIN_ACCOUNT_TNM || "TNM Mpamba: (set in env)";
const ADMIN_ACCOUNT_AIRTEL =
  import.meta.env.VITE_ADMIN_ACCOUNT_AIRTEL || "Airtel Money: (set in env)";
const ADMIN_ACCOUNT_BANK =
  import.meta.env.VITE_ADMIN_ACCOUNT_BANK || "Bank: (set in env)";

export function AppLayout({ children, sidebarItems }: AppLayoutProps) {
  const location = useLocation();
  const navigate = useNavigate();

  const [currentUser, setCurrentUser] = useState<CurrentUser | null>(
    getAuthUser()
  );
  const [loadingUser, setLoadingUser] = useState(true);

  // 🔹 mobile sidebar open/close state
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Load /users/me on mount and then poll every 60s
  useEffect(() => {
    let isMounted = true;

    async function fetchMe() {
      try {
        const token = localStorage.getItem("authToken");
        if (!token) {
          if (isMounted) navigate("/login", { replace: true });
          return;
        }

        const res = await fetch(`${API_BASE_URL}/users/me`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (res.status === 401) {
          if (isMounted) {
            localStorage.removeItem("authToken");
            localStorage.removeItem("authUser");
            navigate("/login", { replace: true });
          }
          return;
        }

        if (!res.ok) {
          // some other error; keep using local storage data
          return;
        }

        const me = await res.json();
        const updated: CurrentUser = {
          id: me.id,
          name: me.name || me.email,
          email: me.email,
          role: me.role as AppRole,
          subscriptionActive: me.subscriptionActive,
          mustPay: me.mustPay,
        };

        if (isMounted) {
          setCurrentUser(updated);
          localStorage.setItem("authUser", JSON.stringify(updated));
        }
      } catch (err) {
        console.error("fetchMe error:", err);
      } finally {
        if (isMounted) {
          setLoadingUser(false);
        }
      }
    }

    // initial load
    fetchMe();

    // poll every 60 seconds
    const intervalId = setInterval(fetchMe, 60_000);

    return () => {
      isMounted = false;
      clearInterval(intervalId);
    };
  }, [navigate]);

  if (loadingUser && !currentUser) {
    return (
      <div className="flex items-center justify-center w-screen h-screen text-sm bg-muted text-muted-foreground">
        Loading dashboard…
      </div>
    );
  }

  const safeUser: CurrentUser = currentUser ||
    getAuthUser() || {
      id: 0,
      name: "User",
      email: "unknown@local",
      role: "CUSTOMER",
      subscriptionActive: true,
      mustPay: false,
    };

  const isSuperAdmin = safeUser.role === "SUPER_ADMIN";
  const isVendor = safeUser.role === "VENDOR";
  const isVendorBlocked =
    isVendor &&
    safeUser.mustPay === true &&
    safeUser.subscriptionActive === false;

  // Filter sidebar items based on role (for admins/active users)
  const filteredItems = sidebarItems.filter((item) => {
    if (!item.roles || isSuperAdmin) return true;
    return item.roles.includes(safeUser.role as AppRole);
  });

  // HARD GATE: If vendor is blocked, show only subscription banner, no dashboard
  if (isVendorBlocked) {
    return (
      <div className="flex flex-col items-center justify-center w-screen h-screen px-4 bg-muted">
        <div className="w-full max-w-lg p-5 space-y-3 bg-white border border-red-200 shadow-lg rounded-2xl">
          {/* Brand */}
          <div className="flex items-center gap-2 mb-1">
            <div className="flex items-center justify-center text-xs font-bold text-white rounded-full h-9 w-9 bg-brand-blue">
              TP
            </div>
            <div className="leading-tight">
              <p className="text-sm font-semibold text-slate-900">
                Trade Point Malawi
              </p>
              <p className="text-[11px] text-slate-500">
                Vendor subscription required
              </p>
            </div>
          </div>

          <h1 className="text-base font-semibold text-red-700">
            Your vendor account is currently blocked
          </h1>
          <p className="text-[12px] text-slate-700">
            Hello{" "}
            <span className="font-semibold">
              {safeUser.name || safeUser.email}
            </span>
            , your account has been marked as{" "}
            <span className="font-semibold">unpaid</span> for this subscription
            period. To continue using Trade Point Malawi and keep your products
            visible on the marketplace, please pay your subscription fee.
          </p>

          <div className="mt-2 rounded-lg border border-slate-200 bg-slate-50 p-3 text-[11px] space-y-1">
            <p className="font-semibold text-slate-800">
              Payment details (Malawi):
            </p>
            <p className="text-slate-700">• {ADMIN_ACCOUNT_TNM}</p>
            <p className="text-slate-700">• {ADMIN_ACCOUNT_AIRTEL}</p>
            <p className="text-slate-700">• {ADMIN_ACCOUNT_BANK}</p>
          </div>

          <p className="text-[11px] text-slate-600">
            After making payment, please contact the system administrator so
            that your subscription can be marked as paid and your account
            reactivated. Please make sure to include a screenshot of your
            payment receipt when contacting us.
            <br />
            <a
              href="mailto:tradepoint@mail.com"
              className="text-blue-600 underline"
            >
              Email: tradepoint@mail.com
            </a>
            <br />
            <a
              href="https://wa.me/265995049331"
              className="text-blue-600 underline"
              target="_blank"
              rel="noopener noreferrer"
            >
              WhatsApp: 0995 049 331
            </a>
          </p>

          <p className="text-[11px] font-semibold text-slate-700">
            Until your account is reactivated, the vendor dashboard and product
            management features are disabled.
          </p>

          <div className="flex justify-end gap-2 pt-2">
            <button
              onClick={() => {
                // allow vendor to refresh state without logging them out
                window.location.reload();
              }}
              className="rounded-md border border-slate-200 px-3 py-1.5 text-xs text-slate-700 hover:bg-slate-50"
            >
              Refresh
            </button>
            <button
              onClick={() => {
                localStorage.removeItem("authToken");
                localStorage.removeItem("authUser");
                navigate("/login", { replace: true });
              }}
              className="rounded-md bg-brand-blue px-4 py-1.5 text-xs font-semibold text-white hover:bg-brand-blue/90"
            >
              Logout
            </button>
          </div>
        </div>
      </div>
    );
  }

  // NORMAL LAYOUT (admin / active vendor / customer)
  const userForLayout = {
    name: safeUser.name || safeUser.email,
    email: safeUser.email,
    role: safeUser.role,
  };

  return (
    <div className="w-screen h-screen overflow-hidden bg-muted text-foreground">
      <div className="flex w-full h-full">
        {/* Sidebar (desktop + mobile overlay) */}
        <Sidebar
          items={filteredItems}
          currentPath={location.pathname}
          user={userForLayout}
          isOpen={sidebarOpen}
          onClose={() => setSidebarOpen(false)}
        />

        {/* Right side (topbar + page) */}
        <div className="flex flex-col flex-1 min-w-0 bg-background">
          <TopBar
            currentPath={location.pathname}
            user={userForLayout}
            onToggleSidebar={() => setSidebarOpen((v) => !v)}
          />

          <main className="flex-1 p-4 overflow-y-auto md:p-6">
            <div className="w-full h-full">{children}</div>
          </main>
        </div>
      </div>
    </div>
  );
}
