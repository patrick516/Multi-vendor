// src/app/components/layout/Sidebar.tsx
import { NavLink, useNavigate } from "react-router-dom";

interface RouteItem {
  path: string;
  label: string;
}

interface UserInfo {
  name: string;
  email: string;
  role: string;
}

interface SidebarProps {
  items: RouteItem[];
  currentPath: string;
  user: UserInfo;
}

export function Sidebar({ items, currentPath, user }: SidebarProps) {
  const navigate = useNavigate();

  function handleLogout() {
    // Clear localStorage auth data
    localStorage.removeItem("authToken");
    localStorage.removeItem("authUser");

    // Redirect to login
    navigate("/login");
  }

  const panelLabel =
    user.role === "SUPER_ADMIN"
      ? "Admin Panel"
      : user.role === "VENDOR"
      ? "Vendor Panel"
      : "User Panel";

  return (
    <aside className="h-full bg-brand-blue text-white flex flex-col w-56 flex-shrink-0">
      {/* Logo */}
      <div className="px-6 py-4 border-b border-white/10 flex items-center gap-2">
        <div className="h-9 w-9 rounded-full bg-brand-yellow flex items-center justify-center text-xs font-bold text-brand-blue">
          MV
        </div>
        <div className="leading-tight">
          <p className="text-sm font-semibold">Multi Vendor</p>
          <p className="text-[11px] text-white/70">{panelLabel}</p>
        </div>
      </div>

      {/* User info */}
      <div className="px-6 py-4 border-b border-white/10 flex items-center gap-3">
        <div className="h-12 w-12 rounded-full bg-white/90 flex items-center justify-center text-brand-blue font-bold">
          {user.name.charAt(0).toUpperCase()}
        </div>
        <div className="leading-tight">
          <p className="text-sm font-semibold truncate max-w-[140px]">
            {user.name}
          </p>
          <p className="text-[11px] text-white/70 truncate max-w-[140px]">
            {user.email}
          </p>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-4 space-y-1 text-sm overflow-y-auto">
        {items.map((item) => {
          const isActive = currentPath === item.path;
          return (
            <NavLink
              key={item.path}
              to={item.path}
              className={[
                "flex items-center px-3 py-2 rounded-md font-medium transition-colors",
                isActive
                  ? "bg-white text-brand-blue shadow-sm"
                  : "text-white/80 hover:bg-white/10 hover:text-white",
              ].join(" ")}
            >
              {item.label}
            </NavLink>
          );
        })}
      </nav>

      {/* Logout Button */}
      <div className="px-4 py-4 border-t border-white/10">
        <button
          onClick={handleLogout}
          className="w-full text-left px-3 py-2 text-white/80 hover:text-white hover:bg-white/10 rounded-md text-sm font-medium transition-colors"
        >
          Logout
        </button>

        <div className="mt-3 text-[11px] text-white/60">
          © {new Date().getFullYear()} Multi Vendor Shop
        </div>
      </div>
    </aside>
  );
}
