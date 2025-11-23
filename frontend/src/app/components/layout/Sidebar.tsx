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
    localStorage.removeItem("authToken");
    localStorage.removeItem("authUser");
    navigate("/login");
  }

  const panelLabel =
    user.role === "SUPER_ADMIN"
      ? "Admin Panel"
      : user.role === "VENDOR"
      ? "Vendor Panel"
      : "User Panel";

  return (
    <aside className="flex flex-col flex-shrink-0 w-56 h-full text-white bg-brand-blue">
      {/* Logo / Brand */}
      <div className="flex items-center gap-2 px-6 py-4 border-b border-white/10">
        <div className="flex items-center justify-center text-xs font-bold rounded-full h-9 w-9 bg-brand-yellow text-brand-blue">
          TP
        </div>
        <div className="leading-tight">
          <p className="text-sm font-semibold">Trade Point Malawi</p>
          <p className="text-[11px] text-white/70">{panelLabel}</p>
        </div>
      </div>

      {/* User info */}
      <div className="flex items-center gap-3 px-6 py-4 border-b border-white/10">
        <div className="flex items-center justify-center w-12 h-12 font-bold rounded-full bg-white/90 text-brand-blue">
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
      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto text-sm">
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

      {/* Logout & footer */}
      <div className="px-4 py-4 border-t border-white/10">
        <button
          onClick={handleLogout}
          className="w-full px-3 py-2 text-sm font-medium text-left transition-colors rounded-md text-white/80 hover:text-white hover:bg-white/10"
        >
          Logout
        </button>

        <div className="mt-3 text-[11px] text-white/60">
          © {new Date().getFullYear()} Trade Point Malawi
        </div>
      </div>
    </aside>
  );
}
