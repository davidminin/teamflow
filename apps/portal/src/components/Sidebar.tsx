"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut, useSession } from "next-auth/react";

const navItems = [
  { href: "/", label: "Dashboard", icon: "📊" },
  { href: "/tasks", label: "Tasks", icon: "📋" },
  { href: "/workflows", label: "Workflows", icon: "⚙️" },
  { href: "/workers", label: "Workers", icon: "🖥️" },
  { href: "/observability", label: "Observability", icon: "📈" },
  { href: "/teams", label: "Teams", icon: "👥" },
];

const bottomNavItems = [
  { href: "/settings", label: "Settings", icon: "🔧" },
];

export default function Sidebar() {
  const pathname = usePathname();
  const { data: session } = useSession();

  return (
    <header className="border-b border-zinc-800 bg-zinc-950">
      <div className="flex h-14 items-center gap-6 px-6">
        <Link href="/" className="shrink-0 text-lg font-bold text-white">
          TeamFlow
        </Link>

        <nav className="flex min-w-0 flex-1 items-center gap-1 overflow-x-auto">
          {navItems.map((item) => {
            const active =
              pathname === item.href ||
              (item.href !== "/" && pathname.startsWith(item.href));
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex shrink-0 items-center gap-2 rounded-md px-3 py-1.5 text-sm transition ${
                  active
                    ? "bg-zinc-800 text-white"
                    : "text-zinc-400 hover:bg-zinc-900 hover:text-white"
                }`}
              >
                <span>{item.icon}</span>
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="flex items-center gap-3">
          {bottomNavItems.map((item) => {
            const active =
              pathname === item.href ||
              (item.href !== "/" && pathname.startsWith(item.href));
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex shrink-0 items-center gap-2 rounded-md px-3 py-1.5 text-sm transition ${
                  active
                    ? "bg-zinc-800 text-white"
                    : "text-zinc-400 hover:bg-zinc-900 hover:text-white"
                }`}
              >
                <span>{item.icon}</span>
                {item.label}
              </Link>
            );
          })}

          <div className="hidden border-l border-zinc-800 pl-3 sm:block">
            <p className="max-w-40 truncate text-sm text-white">
              {session?.user?.name || "User"}
            </p>
            <p className="max-w-40 truncate text-xs text-zinc-500">
              {session?.user?.email}
            </p>
          </div>

          <button
            onClick={() => signOut({ callbackUrl: "/login" })}
            className="rounded-md px-2 py-1 text-xs text-zinc-400 hover:bg-zinc-800 hover:text-white"
          >
            Sign out
          </button>
        </div>
      </div>
    </header>
  );
}
