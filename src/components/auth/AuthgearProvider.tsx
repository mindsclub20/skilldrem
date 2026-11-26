"use client";

import authgear from "@authgear/web";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { usePathname, useRouter } from "next/navigation";
import { createClient as createSupabaseClient } from "@/lib/supabase/client";
import { safeAuthRedirect } from "@/lib/auth-redirect";

export type AuthgearUser = {
  sub: string;
  email?: string;
  email_verified?: boolean;
  name?: string;
  picture?: string;
};

type AuthContextValue = {
  ready: boolean;
  user: AuthgearUser | null;
  error: string | null;
  login: (next?: string) => Promise<void>;
  signup: (next?: string) => Promise<void>;
  logout: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

function toUser(value: unknown): AuthgearUser | null {
  if (!value || typeof value !== "object") return null;
  const info = value as Record<string, unknown>;
  if (typeof info.sub !== "string") return null;
  return {
    sub: info.sub,
    ...(typeof info.email === "string" ? { email: info.email } : {}),
    ...(typeof info.email_verified === "boolean" ? { email_verified: info.email_verified } : {}),
    ...(typeof info.name === "string" ? { name: info.name } : {}),
    ...(typeof info.picture === "string" ? { picture: info.picture } : {}),
  };
}

export function AuthgearProvider({ children }: { children: ReactNode }) {
  const [ready, setReady] = useState(false);
  const [user, setUser] = useState<AuthgearUser | null>(null);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    let active = true;

    async function initialize() {
      const endpoint = process.env.NEXT_PUBLIC_AUTHGEAR_ENDPOINT;
      const clientID = process.env.NEXT_PUBLIC_AUTHGEAR_CLIENT_ID;
      if (!endpoint || !clientID) {
        throw new Error("Authgear endpoint or client ID is missing from environment variables.");
      }

      await authgear.configure({
        endpoint,
        clientID,
        sessionType: "refresh_token",
      });

      const callbackUrl = new URL(window.location.href);
      if (callbackUrl.searchParams.has("code") || callbackUrl.searchParams.has("error")) {
        await authgear.finishAuthentication();
        callbackUrl.searchParams.delete("code");
        callbackUrl.searchParams.delete("state");
        callbackUrl.searchParams.delete("error");
        callbackUrl.searchParams.delete("error_description");
        window.history.replaceState(
          {},
          document.title,
          callbackUrl.pathname + callbackUrl.search + callbackUrl.hash
        );
      }

      let currentUser: AuthgearUser | null = null;
      if (authgear.sessionState === "AUTHENTICATED") {
        try {
          await authgear.refreshAccessTokenIfNeeded();
          currentUser = toUser(await authgear.fetchUserInfo());
        } catch {
          currentUser = null;
        }
      }

      if (active) {
        setUser(currentUser);
        setReady(true);
        if (currentUser) {
          const supabase = createSupabaseClient();
          // Link a pre-existing Supabase account by verified email before
          // creating a new profile, so saved chats and learning progress survive.
          const { error: linkError } = await supabase.rpc("link_authgear_identity");
          if (linkError) {
            console.warn("[authgear] legacy account link deferred:", linkError.message);
          }

          const profile = {
            id: currentUser.sub,
            email: currentUser.email ?? null,
            full_name: currentUser.name ?? null,
            avatar_url: currentUser.picture ?? null,
          };
          const { error: profileError } = await supabase
            .from("profiles")
            .upsert(profile, { onConflict: "id", ignoreDuplicates: false });
          if (profileError) {
            console.warn("[authgear] profile bootstrap deferred:", profileError.message);
          }
        }
      }
    }

    initialize().catch((cause: unknown) => {
      if (!active) return;
      setError(cause instanceof Error ? cause.message : "Authgear initialization failed");
      setReady(true);
    });

    return () => {
      active = false;
    };
  }, []);

  const login = useCallback(async (next?: string) => {
    const safeNext = safeAuthRedirect(next);
    if (typeof window !== "undefined") {
      sessionStorage.setItem("authgear_next", safeNext);
    }
    await authgear.startAuthentication({
      redirectURI: `${window.location.origin}/auth/callback`,
      prompt: "login",
    });
  }, []);

  const signup = useCallback(async (next?: string) => {
    const safeNext = safeAuthRedirect(next);
    if (typeof window !== "undefined") {
      sessionStorage.setItem("authgear_next", safeNext);
    }
    await authgear.startAuthentication({
      redirectURI: `${window.location.origin}/auth/callback`,
    });
  }, []);

  const logout = useCallback(async () => {
    if (typeof window !== "undefined") sessionStorage.removeItem("authgear_next");
    await authgear.logout({ redirectURI: window.location.origin });
  }, []);

  useEffect(() => {
    if (!ready) return;
    const isProtected = [
      "/dashboard",
      "/assistant",
      "/onboarding",
      "/workspace",
      "/admin",
    ].some((path) => pathname === path || pathname.startsWith(`${path}/`));
    const isAuthPage = pathname === "/auth/login" || pathname === "/auth/signup";

    if (isProtected && !user) {
      router.replace(`/auth/login?redirect=${encodeURIComponent(pathname)}`);
    } else if (isAuthPage && user) {
      router.replace("/assistant");
    } else if (pathname === "/auth/callback" && user) {
      const next = safeAuthRedirect(sessionStorage.getItem("authgear_next"));
      sessionStorage.removeItem("authgear_next");
      router.replace(next);
    }
  }, [ready, user, pathname, router]);

  const value = useMemo(
    () => ({ ready, user, error, login, signup, logout }),
    [ready, user, error, login, signup, logout]
  );

  const guarded = pathname && (
    ["/dashboard", "/assistant", "/onboarding", "/workspace", "/admin"].some(
      (path) => pathname === path || pathname.startsWith(`${path}/`)
    )
  );

  return (
    <AuthContext.Provider value={value}>
      {guarded && (!ready || !user) ? (
        <div className="min-h-screen flex items-center justify-center text-sm text-muted-foreground">
          {ready ? "Redirecting to sign in…" : "Loading secure session…"}
        </div>
      ) : (
        children
      )}
    </AuthContext.Provider>
  );
}

export function useAuthgear() {
  const value = useContext(AuthContext);
  if (!value) throw new Error("useAuthgear must be used inside AuthgearProvider");
  return value;
}
