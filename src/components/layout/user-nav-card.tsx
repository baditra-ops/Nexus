"use client";

import * as React from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { Badge } from "@/components/ui/badge";
import { LogIn, LogOut, User as UserIcon, ShieldAlert, Bell } from "lucide-react";
import { signOut } from "@/app/auth/actions";

interface UserState {
  id: string;
  email?: string;
  fullName?: string;
  role?: string;
  verificationStatus?: string;
  unreadCount?: number;
}

let cachedUserState: UserState | null | undefined = undefined;

export function UserNavCard() {
  const [user, setUser] = React.useState<UserState | null>(
    cachedUserState !== undefined ? cachedUserState : null
  );
  const [loading, setLoading] = React.useState(cachedUserState === undefined);

  React.useEffect(() => {
    const supabase = createClient();

    async function resolveUser() {
      try {
        const {
          data: { user: authUser },
        } = await supabase.auth.getUser();

        if (authUser) {
          const [{ data }, { count: unreadCount }] = await Promise.all([
            supabase
              .from("profiles")
              .select("*")
              .eq("id", authUser.id)
              .single(),
            supabase
              .from("notifications")
              .select("id", { count: "exact", head: true })
              .eq("user_id", authUser.id)
              .eq("is_read", false),
          ]);

          const profile = data as { full_name?: string | null; role?: string; verification_status?: string } | null;

          const resolved: UserState = {
            id: authUser.id,
            email: authUser.email,
            fullName: profile?.full_name || authUser.user_metadata?.full_name || "Member",
            role: profile?.role || "member",
            verificationStatus: profile?.verification_status || "unverified",
            unreadCount: unreadCount || 0,
          };
          cachedUserState = resolved;
          setUser(resolved);
        } else {
          cachedUserState = null;
          setUser(null);
        }
      } catch {
        cachedUserState = null;
        setUser(null);
      } finally {
        setLoading(false);
      }
    }

    resolveUser();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (_event, session) => {
      if (session?.user) {
        setUser({
          id: session.user.id,
          email: session.user.email,
          fullName: session.user.user_metadata?.full_name || "Member",
          role: "member",
          verificationStatus: "unverified",
        });
      } else {
        setUser(null);
      }
      setLoading(false);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  if (loading) {
    return (
      <div className="flex items-center gap-3 rounded-lg border border-slate-100 bg-slate-50 p-3 animate-pulse dark:border-slate-800 dark:bg-slate-900/60">
        <div className="h-8 w-8 rounded-full bg-slate-200 dark:bg-slate-800" />
        <div className="space-y-1.5 flex-1">
          <div className="h-3 w-20 bg-slate-200 rounded dark:bg-slate-800" />
          <div className="h-2.5 w-14 bg-slate-200 rounded dark:bg-slate-800" />
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="rounded-lg border border-slate-200/80 bg-slate-50/80 p-3 dark:border-slate-800 dark:bg-slate-900/50">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <UserIcon className="h-4 w-4 text-slate-400" />
            <span className="text-xs font-medium text-slate-600 dark:text-slate-400">
              Not Signed In
            </span>
          </div>
          <Badge variant="neutral" className="text-[10px]">
            Guest
          </Badge>
        </div>
        <div className="mt-3 flex items-center gap-2">
          <Link
            href="/auth/sign-in"
            className="flex-1 inline-flex items-center justify-center gap-1.5 rounded-md bg-slate-900 px-3 py-1.5 text-xs font-medium text-white transition-colors hover:bg-slate-800 dark:bg-slate-100 dark:text-slate-900 dark:hover:bg-white"
          >
            <LogIn className="h-3.5 w-3.5" />
            <span>Sign In</span>
          </Link>
          <Link
            href="/auth/sign-up"
            className="inline-flex items-center justify-center rounded-md border border-slate-300 bg-white px-2.5 py-1.5 text-xs font-medium text-slate-700 transition-colors hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700"
          >
            Register
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-lg border border-slate-200/80 bg-white p-3 shadow-xs dark:border-slate-800 dark:bg-slate-900">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-teal-100 font-bold text-xs text-teal-800 dark:bg-teal-950 dark:text-teal-300">
            {user.fullName ? user.fullName[0]?.toUpperCase() : "U"}
          </div>
          <div className="min-w-0 flex-1">
            <p className="truncate text-xs font-semibold text-slate-900 dark:text-slate-100">
              {user.fullName}
            </p>
            <p className="truncate text-[10px] text-slate-500 dark:text-slate-400">
              {user.email}
            </p>
          </div>
        </div>

        <Link
          href="/notifications"
          className="relative rounded-full p-1.5 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-700 dark:hover:bg-slate-800 dark:hover:text-slate-200"
          title="Notifications & Alerts"
        >
          <Bell className="h-4 w-4" />
          {user.unreadCount !== undefined && user.unreadCount > 0 && (
            <span className="absolute -top-0.5 -right-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-teal-600 px-1 text-[9px] font-bold text-white shadow-2xs">
              {user.unreadCount > 9 ? "9+" : user.unreadCount}
            </span>
          )}
        </Link>
      </div>

      <div className="mt-2.5 flex items-center justify-between border-t border-slate-100 pt-2 dark:border-slate-800/80">
        <div className="flex items-center gap-1.5">
          <Badge variant="teal" className="text-[10px] capitalize">
            {user.role}
          </Badge>
          {user.verificationStatus === "unverified" && (
            <span
              className="flex items-center gap-1 text-[10px] text-amber-600 dark:text-amber-400"
              title="Verification pending approval by institutional manager"
            >
              <ShieldAlert className="h-3 w-3" />
              <span>Unverified</span>
            </span>
          )}
        </div>

        <form action={signOut}>
          <button
            type="submit"
            className="inline-flex items-center gap-1 text-[11px] font-medium text-slate-500 transition-colors hover:text-rose-600 dark:text-slate-400 dark:hover:text-rose-400 cursor-pointer"
            title="Sign out of your session"
          >
            <LogOut className="h-3 w-3" />
            <span>Sign Out</span>
          </button>
        </form>
      </div>
    </div>
  );
}
