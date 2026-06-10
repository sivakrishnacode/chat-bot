"use client";

import { useState } from "react";
import Link from "next/link";

export default function SidebarClient() {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        onClick={() => setOpen(!open)}
        className="fixed top-3 left-3 z-50 w-9 h-9 rounded-lg flex items-center justify-center md:hidden"
        style={{ background: "var(--surface)", border: "1px solid var(--border)", color: "var(--text)" }}
        aria-label="Toggle sidebar"
      >
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
          {open ? (
            <>
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </>
          ) : (
            <>
              <line x1="3" y1="6" x2="21" y2="6" />
              <line x1="3" y1="12" x2="21" y2="12" />
              <line x1="3" y1="18" x2="21" y2="18" />
            </>
          )}
        </svg>
      </button>

      {open && (
        <div
          className="fixed inset-0 z-30 md:hidden"
          style={{ background: "rgba(0,0,0,0.5)" }}
          onClick={() => setOpen(false)}
        />
      )}

      <aside
        className={`
          fixed md:relative z-40 flex flex-col w-56 h-screen border-r
          transition-transform duration-200 ease-in-out
          ${open ? "translate-x-0" : "-translate-x-full"}
          md:translate-x-0 md:shrink-0
        `}
        style={{ background: "var(--surface)", borderColor: "var(--border)" }}
      >
        <div className="flex items-center gap-2 px-5 py-5 border-b" style={{ borderColor: "var(--border)" }}>
          <div
            className="w-8 h-8 rounded-lg flex items-center justify-center font-bold text-sm"
            style={{ background: "var(--accent)", color: "#000" }}
          >
            BF
          </div>
          <span className="font-semibold text-sm tracking-wide">BotFlow Studio</span>
        </div>

        <nav className="flex-1 px-3 py-4 flex flex-col gap-1">
          <Link
            href="/clients"
            onClick={() => setOpen(false)}
            className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors hover:bg-white/5"
            style={{ color: "var(--text-dim)" }}
          >
            <span>👥</span>
            <span>Clients</span>
          </Link>
        </nav>

        <div className="px-4 py-4 border-t text-xs" style={{ borderColor: "var(--border)", color: "var(--muted)" }}>
          Conceps WhatsApp Bot Platform
        </div>
      </aside>
    </>
  );
}
