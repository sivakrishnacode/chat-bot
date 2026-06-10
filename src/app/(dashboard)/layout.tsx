// src/app/(dashboard)/layout.tsx
import Link from "next/link";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex h-screen overflow-hidden" style={{ background: "var(--bg)" }}>
      {/* Sidebar */}
      <aside
        className="flex flex-col shrink-0 w-56 border-r"
        style={{ background: "var(--surface)", borderColor: "var(--border)" }}
      >
        {/* Logo */}
        <div className="flex items-center gap-2 px-5 py-5 border-b" style={{ borderColor: "var(--border)" }}>
          <div
            className="w-8 h-8 rounded-lg flex items-center justify-center font-bold text-sm"
            style={{ background: "var(--accent)", color: "#000" }}
          >
            BF
          </div>
          <span className="font-semibold text-sm tracking-wide">BotFlow Studio</span>
        </div>

        {/* Nav */}
        <nav className="flex-1 px-3 py-4 flex flex-col gap-1">
          <SidebarLink href="/clients" label="Clients" icon="👥" />
        </nav>

        {/* Footer */}
        <div className="px-4 py-4 border-t text-xs" style={{ borderColor: "var(--border)", color: "var(--muted)" }}>
          Conceps WhatsApp Bot Platform
        </div>
      </aside>

      {/* Main */}
      <main className="flex-1 overflow-auto">{children}</main>
    </div>
  );
}

function SidebarLink({ href, label, icon }: { href: string; label: string; icon: string }) {
  return (
    <Link
      href={href}
      className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors hover:bg-white/5"
      style={{ color: "var(--text-dim)" }}
    >
      <span>{icon}</span>
      <span>{label}</span>
    </Link>
  );
}
