// src/app/hooks/useAuth.ts
"use client";

import { useEffect, useState } from "react";

export type Role = "SUPER_ADMIN" | "VENDOR" | "CUSTOMER";

export interface AuthUser {
  id: number;
  email: string;
  name?: string;
  role: Role;
}

interface UseAuthResult {
  user: AuthUser | null;
  isLoading: boolean;
  isSuperAdmin: boolean;
  isVendor: boolean;
  isCustomer: boolean;
  logout: () => void;
}

export function useAuth(): UseAuthResult {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (typeof window === "undefined") {
      setIsLoading(false);
      return;
    }

    try {
      const raw = window.localStorage.getItem("authUser");
      if (!raw) {
        setUser(null);
        setIsLoading(false);
        return;
      }

      const parsed = JSON.parse(raw) as Partial<AuthUser>;

      if (
        parsed &&
        typeof parsed.id === "number" &&
        typeof parsed.email === "string" &&
        (parsed.role === "SUPER_ADMIN" ||
          parsed.role === "VENDOR" ||
          parsed.role === "CUSTOMER")
      ) {
        setUser({
          id: parsed.id,
          email: parsed.email,
          name: parsed.name,
          role: parsed.role,
        });
      } else {
        setUser(null);
      }
    } catch (err) {
      console.error(
        "[useAuth] Failed to parse authUser from localStorage",
        err
      );
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const logout = () => {
    if (typeof window !== "undefined") {
      try {
        window.localStorage.removeItem("authUser");
        window.localStorage.removeItem("authToken");
      } catch (e) {
        console.error("[useAuth] Failed to clear auth storage:", e);
      }
      window.location.href = "/login";
    }
  };

  return {
    user,
    isLoading,
    isSuperAdmin: user?.role === "SUPER_ADMIN",
    isVendor: user?.role === "VENDOR",
    isCustomer: user?.role === "CUSTOMER",
    logout,
  };
}
