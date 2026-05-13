import { useEffect, useState } from "react";

const KEY = "refera.auth.user";

export type AuthUser = {
  name: string;
  email: string;
  role: "GP" | "Specialist" | "Admin";
  organization: string;
};

export const DEFAULT_USER: AuthUser = {
  name: "Dr. Eleanor Voss",
  email: "eleanor.voss@riverside.health",
  role: "GP",
  organization: "Riverside Family Practice",
};

export function getStoredUser(): AuthUser | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(KEY);
    return raw ? (JSON.parse(raw) as AuthUser) : null;
  } catch {
    return null;
  }
}

export function setStoredUser(u: AuthUser | null) {
  if (typeof window === "undefined") return;
  if (u) window.localStorage.setItem(KEY, JSON.stringify(u));
  else window.localStorage.removeItem(KEY);
  window.dispatchEvent(new Event("refera-auth"));
}

export function useAuth() {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [ready, setReady] = useState(false);
  useEffect(() => {
    setUser(getStoredUser());
    setReady(true);
    const onChange = () => setUser(getStoredUser());
    window.addEventListener("refera-auth", onChange);
    window.addEventListener("storage", onChange);
    return () => {
      window.removeEventListener("refera-auth", onChange);
      window.removeEventListener("storage", onChange);
    };
  }, []);
  return { user, ready, signOut: () => setStoredUser(null) };
}