"use client";

import { useState } from "react";
import Link from "next/link";
import { ClientSummary } from "@/lib/types";

export default function ClientsPageClient({
  initialClients,
}: {
  initialClients: ClientSummary[];
}) {
  const [clients, setClients] = useState<ClientSummary[]>(initialClients);
  const [showNew, setShowNew] = useState(false);
  const [form, setForm] = useState({ name: "", industry: "", email: "" });
  const [saving, setSaving] = useState(false);

  async function createClient() {
    if (!form.name.trim()) return;
    setSaving(true);
    const res = await fetch("/api/clients", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    const created = await res.json();
    setForm({ name: "", industry: "", email: "" });
    setShowNew(false);
    setSaving(false);
    setClients((prev) => [created, ...prev]);
  }

  return (
    <div className="p-4 sm:p-8 max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-8">
        <div>
          <h1 className="text-2xl font-bold">Clients</h1>
          <p className="text-sm mt-1" style={{ color: "var(--text-dim)" }}>
            Each client has their own bot flows for demos.
          </p>
        </div>
        <button
          onClick={() => setShowNew(true)}
          className="px-4 py-2 rounded-lg text-sm font-semibold transition-opacity hover:opacity-80"
          style={{ background: "var(--accent)", color: "#000" }}
        >
          + New Client
        </button>
      </div>

      {/* New Client Modal */}
      {showNew && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div
            className="rounded-xl p-6 w-full max-w-md shadow-2xl"
            style={{ background: "var(--surface)" }}
          >
            <h2 className="text-lg font-semibold mb-4">New Client</h2>
            <div className="flex flex-col gap-3">
              <Field
                label="Business Name *"
                value={form.name}
                onChange={(v) => setForm((f) => ({ ...f, name: v }))}
                placeholder="SpaceSolar, Raj Caterers…"
              />
              <Field
                label="Industry"
                value={form.industry}
                onChange={(v) => setForm((f) => ({ ...f, industry: v }))}
                placeholder="Solar Energy, Restaurant…"
              />
              <Field
                label="Email"
                value={form.email}
                onChange={(v) => setForm((f) => ({ ...f, email: v }))}
                placeholder="owner@business.com"
              />
            </div>
            <div className="flex gap-3 mt-5">
              <button
                onClick={createClient}
                disabled={saving || !form.name.trim()}
                className="flex-1 py-2 rounded-lg font-semibold text-sm transition-opacity hover:opacity-80 disabled:opacity-40"
                style={{ background: "var(--accent)", color: "#000" }}
              >
          {saving ? "Creating…" : "Create Client"}
              </button>
              <button
                onClick={() => setShowNew(false)}
                className="px-4 py-2 rounded-lg text-sm border"
                style={{ borderColor: "var(--border)", color: "var(--text-dim)" }}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Client Grid */}
      {clients.length === 0 ? (
        <EmptyState onNew={() => setShowNew(true)} />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {clients.map((c) => (
            <Link
              key={c.id}
              href={`/clients/${c.id}`}
              className="block rounded-xl p-5 border transition-colors hover:border-white/10 group"
              style={{ background: "var(--surface)", borderColor: "var(--border)" }}
            >
              <div className="flex items-start justify-between mb-3">
                <div
                  className="w-10 h-10 rounded-lg flex items-center justify-center font-bold text-base"
                  style={{ background: "var(--surface-2)", color: "var(--accent)" }}
                >
                  {c.name[0].toUpperCase()}
                </div>
                <span
                  className="text-xs px-2 py-1 rounded-full"
                  style={{ background: "var(--surface-2)", color: "var(--text-dim)" }}
                >
                  {c._count.flows} {c._count.flows === 1 ? "flow" : "flows"}
                </span>
              </div>
              <div className="font-semibold text-sm mb-1">{c.name}</div>
              {c.industry && (
                <div className="text-xs" style={{ color: "var(--text-dim)" }}>
                  {c.industry}
                </div>
              )}
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}

function Field({
  label,
  value,
  onChange,
  placeholder,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
}) {
  return (
    <div>
      <label className="block text-xs mb-1" style={{ color: "var(--text-dim)" }}>
        {label}
      </label>
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full px-3 py-2 rounded-lg border text-sm outline-none focus:border-white/20"
        style={{
          background: "var(--surface-2)",
          borderColor: "var(--border)",
          color: "var(--text)",
        }}
      />
    </div>
  );
}

function EmptyState({ onNew }: { onNew: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center py-24 text-center">
      <div className="text-5xl mb-4">💬</div>
      <div className="font-semibold text-lg mb-2">No clients yet</div>
      <div className="text-sm mb-6" style={{ color: "var(--text-dim)" }}>
        Add your first client to start building bot flow demos.
      </div>
      <button
        onClick={onNew}
        className="px-5 py-2 rounded-lg font-semibold text-sm"
        style={{ background: "var(--accent)", color: "#000" }}
      >
        + Add Client
      </button>
    </div>
  );
}
