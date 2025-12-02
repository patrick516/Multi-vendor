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
  isOpen?: boolean; // mobile
  onClose?: () => void; // mobile
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

  const roleLabel =
    user.role === "SUPER_ADMIN"
      ? "Super Admin"
      : user.role === "VENDOR"
      ? "Vendor"
      : "Customer";

  const content = (
    <>
      {/* Logo / Brand */}
      <div className="flex items-center gap-2 px-3 py-3 border-b border-white/10">
        <div className="flex items-center justify-center w-full px-2">
          <img
            src="/icons/tp_logo.svg"
            alt="Logo"
            className="object-contain w-auto h-10"
          />
        </div>
      </div>

      {/* User info */}
      <div className="px-4 py-4 border-b border-white/10">
        <div className="flex flex-col gap-1">
          <p className="text-sm font-semibold text-white text-center truncate max-w-[160px]">
            {user.name}
          </p>
          <p className="text-[11px] text-center text-white/70 truncate max-w-[160px]">
            {user.email}
          </p>
          {/* <span className="inline-flex items-center mt-2 rounded-full bg-white/10 px-2 py-[2px] text-[10px] font-medium uppercase tracking-wide text-white/80">
            {roleLabel}
          </span> */}
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
                "flex items-center rounded-md px-3 py-2 font-medium transition-colors",
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
      <aside className="flex-col flex-shrink-0 hidden w-56 h-full mt-1 ml-2 text-white rounded-md bg-brand-blue md:flex">
        {content}
      </aside>

      {/* Mobile overlay sidebar */}
      {isOpen && (
        <div className="fixed inset-0 z-40 flex md:hidden">
          <div className="flex flex-col h-full max-w-[80vw] w-64 rounded-r-md bg-brand-blue text-white shadow-xl">
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
