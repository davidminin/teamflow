"use client";

import Sidebar from "@/components/Sidebar";
import { usePathname } from "next/navigation";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const isEmbeddedPage =
    pathname.startsWith("/workflows") || pathname.startsWith("/observability");

  return (
    <div className="flex h-screen flex-col overflow-hidden">
      <Sidebar />
      <main className="min-h-0 flex-1 overflow-auto">
        <div className={isEmbeddedPage ? "h-full" : "h-full p-6"}>{children}</div>
      </main>
    </div>
  );
}
