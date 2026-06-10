"use client";
// src/app/(dashboard)/clients/[clientId]/page.tsx

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";

interface FlowSummary {
  id: string;
  name: string;
  description: string | null;
  isActive: boolean;
  _count: { nodes: number };
  createdAt: string;
}

interface ClientDetail {
  id: string;
  name: string;
  industry: string | null;
  email: string | null;
  phone: string | null;
  flows: FlowSummary[];
}

export default function ClientDetailPage() {
  const params = useParams<{ clientId: string }>();
  const router = useRouter();
  const [client, setClient] = useState<ClientDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [showNew, setShowNew] = useState(false);
  const [newName, setNewName] = useState("");
  const [newDesc, setNewDesc] = useState("");
  const [creating, setCreating] = useState(false);

  async function load() {
    const res = await fetch(`/api/clients/${params.clientId}`);
    if (!res.ok) { router.push("/clients"); return; }
    setClient(await res.json());
    setLoading(false);
  }

  useEffect(() => { load(); }, []);

  async function createFlow() {
    if (!newName.trim()) return;
    setCreating(true);
    const res = await fetch(`/api/clients/${params.clientId}/flows`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: newName.trim(), description: newDesc }),
    });
    const flow = await res.json();
    setCreating(false);
    setShowNew(false);
    setNewName("");
    setNewDesc("");
    router.push(`/clients/${params.clientId}/flows/${flow.id}`);
  }

  async function deleteFlow(flowId: string, name: string) {
    if (!confirm(`Delete flow "${name}"? This cannot be undone.`)) return;
    await fetch(`/api/clients/${params.clientId}/flows/${flowId}`, { method: "DELETE" });
    load();
  }

  if (loading)
    return (
      <div className="flex items-center justify-center h-64 text-sm" style={{ color: "#475569" }}>
        Loading…
      </div>
    );

  if (!client) return null;

  return (
    <div className="p-8 max-w-4xl mx-auto">
      {/* Breadcrumb */}
      <Link href="/clients" className="text-xs mb-6 block" style={{ color: "#475569" }}>
        ← All Clients
      </Link>

      {/* Client header */}
      <div
        className="flex items-start gap-4 mb-8 p-5 rounded-xl border"
        style={{ background: "#111827", borderColor: "rgba(255,255,255,0.06)" }}
      >
        <div
          className="w-12 h-12 rounded-xl flex items-center justify-center font-bold text-xl shrink-0"
          style={{ background: "rgba(37,211,102,0.1)", color: "#25d366" }}
        >
          {client.name[0].toUpperCase()}
        </div>
        <div className="flex-1">
          <h1 className="text-xl font-bold">{client.name}</h1>
          <div className="flex gap-4 mt-1">
            {client.industry && (
              <span className="text-xs" style={{ color: "#64748b" }}>
                🏢 {client.industry}
              </span>
            )}
            {client.email && (
              <span className="text-xs" style={{ color: "#64748b" }}>
                ✉️ {client.email}
              </span>
            )}
            {client.phone && (
              <span className="text-xs" style={{ color: "#64748b" }}>
                📞 {client.phone}
              </span>
            )}
          </div>
        </div>
        <div
          className="text-sm font-semibold px-3 py-1 rounded-full"
          style={{ background: "rgba(37,211,102,0.08)", color: "#25d366" }}
        >
          {client.flows.length} {client.flows.length === 1 ? "flow" : "flows"}
        </div>
      </div>

      {/* Flows section */}
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-base font-semibold">Bot Flows</h2>
        <button
          onClick={() => setShowNew(true)}
          className="text-sm px-4 py-2 rounded-lg font-medium"
          style={{ background: "#25d366", color: "#000" }}
        >
          + New Flow
        </button>
      </div>

      {/* New Flow modal */}
      {showNew && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div
            className="rounded-xl p-6 w-full max-w-md shadow-2xl"
            style={{ background: "#111827" }}
          >
            <h2 className="text-lg font-semibold mb-4">New Bot Flow</h2>
            <div className="flex flex-col gap-3">
              <div>
                <label className="block text-xs mb-1" style={{ color: "#94a3b8" }}>
                  Flow Name *
                </label>
                <input
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  placeholder="e.g. Solar Support Bot, Restaurant Menu Bot"
                  className="w-full px-3 py-2 rounded-lg border text-sm outline-none"
                  style={{ background: "#1a2133", borderColor: "rgba(255,255,255,0.08)", color: "#e2e8f0" }}
                  onKeyDown={(e) => e.key === "Enter" && createFlow()}
                />
              </div>
              <div>
                <label className="block text-xs mb-1" style={{ color: "#94a3b8" }}>
                  Description
                </label>
                <input
                  value={newDesc}
                  onChange={(e) => setNewDesc(e.target.value)}
                  placeholder="Optional short description"
                  className="w-full px-3 py-2 rounded-lg border text-sm outline-none"
                  style={{ background: "#1a2133", borderColor: "rgba(255,255,255,0.08)", color: "#e2e8f0" }}
                />
              </div>
            </div>
            <div className="flex gap-3 mt-5">
              <button
                onClick={createFlow}
                disabled={creating || !newName.trim()}
                className="flex-1 py-2 rounded-lg font-semibold text-sm disabled:opacity-40"
                style={{ background: "#25d366", color: "#000" }}
              >
                {creating ? "Creating…" : "Create Flow"}
              </button>
              <button
                onClick={() => setShowNew(false)}
                className="px-4 py-2 rounded-lg text-sm border"
                style={{ borderColor: "rgba(255,255,255,0.08)", color: "#94a3b8" }}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Flow cards */}
      {client.flows.length === 0 ? (
        <div
          className="text-center py-16 rounded-xl border"
          style={{ borderColor: "rgba(255,255,255,0.06)", color: "#475569" }}
        >
          <div className="text-4xl mb-3">🤖</div>
          <div className="text-sm">No flows yet. Create one to start building.</div>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {client.flows.map((f) => (
            <div
              key={f.id}
              className="rounded-xl border p-5 flex flex-col gap-3 group"
              style={{ background: "#111827", borderColor: "rgba(255,255,255,0.06)" }}
            >
              <div className="flex items-start justify-between">
                <div>
                  <div className="font-semibold text-sm">{f.name}</div>
                  {f.description && (
                    <div className="text-xs mt-1" style={{ color: "#64748b" }}>
                      {f.description}
                    </div>
                  )}
                </div>
                <span
                  className="text-xs px-2 py-1 rounded-full shrink-0"
                  style={{ background: "rgba(255,255,255,0.04)", color: "#64748b" }}
                >
                  {f._count?.nodes ?? 0} nodes
                </span>
              </div>

              <div className="flex items-center gap-2 mt-auto">
                <Link
                  href={`/clients/${params.clientId}/flows/${f.id}`}
                  className="flex-1 text-center text-sm py-2 rounded-lg font-medium transition-opacity hover:opacity-80"
                  style={{ background: "#25d366", color: "#000" }}
                >
                  Open Builder
                </Link>
                <button
                  onClick={() => deleteFlow(f.id, f.name)}
                  className="p-2 rounded-lg text-sm"
                  style={{ color: "#64748b", background: "rgba(255,255,255,0.04)" }}
                  title="Delete flow"
                >
                  🗑
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
