"use client";

import React from "react";
import { NavLink, useNavigate } from "react-router-dom";
import type { AppRoute, AppRole } from "../../../routes";

interface SidebarUser {
  name: string;
  email: string;
  role: AppRole;
}

interface SidebarProps {
  items: AppRoute[]; // filtered sidebar routes
  currentPath: string; // current location pathname
  user: SidebarUser; // user info from AppLayout
  isOpen?: boolean; // mobile
  onClose?: () => void; // mobile
}

// Allow optional path/to on top of whatever AppRoute already has
type RouteWithOptionalPath = AppRoute & {
  path?: string;
  to?: string;
};

const Sidebar: React.FC<SidebarProps> = ({
  items,
  currentPath,
  user,
  isOpen,
  onClose,
}) => {
  const navigate = useNavigate();
  const role = user.role;

  function handleLogout() {
    localStorage.removeItem("authToken");
    localStorage.removeItem("authUser");
    navigate("/login");
    if (onClose) onClose();
  }

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

      {/* User info (avatar + name + email + role) */}
      <div className="px-4 py-4 border-b border-white/10">
        <div className="flex flex-col items-center gap-2">
          <div className="flex items-center justify-center w-12 h-12 text-xl font-bold text-white bg-green-400 rounded-full">
            {user.name?.[0]?.toUpperCase() || "U"}
          </div>

          <div className="text-center">
            <p className="text-sm font-semibold text-white truncate max-w-[160px]">
              {user.name || "User"}
            </p>
            <p className="text-[11px] text-white/70 truncate max-w-[160px]">
              {user.email || ""}
            </p>
          </div>

          {role && (
            <span className="mt-1 rounded-full bg-white/10 px-3 py-0.5 text-[10px] uppercase tracking-wide text-white/80">
              {role.replace("_", " ")}
            </span>
          )}
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto text-md">
        {items.map((routeItem) => {
          const item = routeItem as RouteWithOptionalPath;

          // Prefer `path`, fall back to `to`, then "/"
          const routePath = item.path ?? item.to ?? "/";

          const isActive = currentPath === routePath;

          return (
            <NavLink
              key={routePath}
              to={routePath}
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
};

export default Sidebar;
