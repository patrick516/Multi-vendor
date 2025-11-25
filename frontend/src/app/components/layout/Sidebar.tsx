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
  isOpen?: boolean; // 🔹 mobile
  onClose?: () => void; // 🔹 mobile
}

export function Sidebar({
  items,
  currentPath,
  user,
  isOpen,
  onClose,
}: SidebarProps) {
  const navigate = useNavigate();

  function handleLogout() {
    localStorage.removeItem("authToken");
    localStorage.removeItem("authUser");
    navigate("/login");
    if (onClose) onClose();
  }

  const content = (
    <>
      {/* Logo / Brand */}
      <div className="flex items-center gap-2 px-2 py-1 border-b border-white/10">
        <div className="flex items-center justify-center w-full px-2 py-1 border-white/10">
          <img
            src="/icons/tp_logo.svg"
            alt="Logo"
            className="object-contain w-auto h-12"
          />
        </div>
      </div>

      {/* User info */}
      <div className="flex items-center gap-3 px-6 py-4 border-b border-white/10">
        <div className="leading-tight">
          <p className="text-md font-semibold text-center truncate max-w-[140px]">
            {user.name}
          </p>
          <p className="text-[11px] text-white/70 truncate max-w-[140px]">
            {user.email}
          </p>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto text-md">
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
              onClick={onClose}
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
    </>
  );

  return (
    <>
      {/* Desktop sidebar */}
      <aside className="flex-col flex-shrink-0 hidden w-56 h-full mt-1 ml-2 text-white rounded-md md:flex bg-brand-blue">
        {content}
      </aside>

      {/* Mobile overlay sidebar */}
      {isOpen && (
        <div className="fixed inset-0 z-40 flex md:hidden">
          <div className="flex flex-col w-64 max-w-[80vw] h-full text-white bg-brand-blue rounded-r-md shadow-xl">
            {content}
          </div>
          {/* backdrop */}
          <div
            className="flex-1 bg-black/40"
            onClick={onClose}
            aria-label="Close sidebar"
          />
        </div>
      )}
    </>
  );
}
