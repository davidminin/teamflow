"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut, useSession } from "next-auth/react";

const navItems = [
  { href: "/", label: "Dashboard", icon: "📊" },
  { href: "/tasks", label: "Tasks", icon: "📋" },
  { href: "/workflows", label: "Workflows", icon: "⚙️" },
  { href: "/observability", label: "Observability", icon: "📈" },
  { href: "/teams", label: "Teams", icon: "👥" },
];

export default function Sidebar() {
  const pathname = usePathname();
  const { data: session } = useSession();

  return (
    <aside className="flex h-screen w-56 flex-col border-r border-zinc-800 bg-zinc-950">
      <div className="flex h-14 items-center border-b border-zinc-800 px-4">
        <Link href="/" className="text-lg font-bold text-white">
          TeamFlow
        </Link>
      </div>

      <nav className="flex-1 space-y-1 p-3">
        {navItems.map((item) => {
          const active =
            pathname === item.href ||
            (item.href !== "/" && pathname.startsWith(item.href));
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-2 rounded-lg px-3 py-2 text-sm transition ${
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

      <div className="border-t border-zinc-800 p-3">
        <div className="flex items-center justify-between">
          <div className="truncate">
            <p className="truncate text-sm text-white">
              {session?.user?.name || "User"}
            </p>
            <p className="truncate text-xs text-zinc-500">
              {session?.user?.email}
            </p>
          </div>
          <button
            onClick={() => signOut({ callbackUrl: "/login" })}
            className="ml-2 rounded-md px-2 py-1 text-xs text-zinc-400 hover:bg-zinc-800 hover:text-white"
          >
            Sign out
          </button>
        </div>
      </div>
    </aside>
  );
}
