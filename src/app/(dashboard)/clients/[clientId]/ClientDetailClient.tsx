"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
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

function FlowCardMenu({
  flow,
  clientId,
  onUpdate,
  onDuplicate,
  onDelete,
}: {
  flow: FlowSummary;
  clientId: string;
  onUpdate: (flow: FlowSummary) => void;
  onDuplicate: (flowId: string, name: string) => void;
  onDelete: (flowId: string, name: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const [copying, setCopying] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  async function handleCopy() {
    setCopying(true);
    const url = `${window.location.origin}/demo/${flow.id}`;
    try {
      await navigator.clipboard.writeText(url);
    } catch {
      const ta = document.createElement("textarea");
      ta.value = url;
      ta.style.position = "fixed";
      ta.style.opacity = "0";
      document.body.appendChild(ta);
      ta.select();
      document.execCommand("copy");
      document.body.removeChild(ta);
    }
    setCopying(false);
    setCopied(true);
    setOpen(false);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen((o) => !o)}
        className="p-2 rounded-lg text-sm"
        style={{ color: "#64748b", background: "rgba(255,255,255,0.04)" }}
        title="More actions"
      >
        ⋯
      </button>
      {open && (
        <div
          className="absolute right-0 top-full mt-1 z-50 min-w-40 rounded-lg border py-1 shadow-xl"
          style={{ background: "#1a2133", borderColor: "rgba(255,255,255,0.08)" }}
        >
          <button
            onClick={() => {
              setOpen(false);
              onUpdate(flow);
            }}
            className="w-full flex items-center gap-2 px-3 py-2 text-xs text-left hover:opacity-80"
            style={{ color: "#e2e8f0" }}
          >
            ✏️ Update
          </button>
          <button
            onClick={handleCopy}
            disabled={copying}
            className="w-full flex items-center gap-2 px-3 py-2 text-xs text-left hover:opacity-80 disabled:opacity-40"
            style={{ color: copied ? "#25d366" : "#e2e8f0" }}
          >
            {copying ? "..." : copied ? "✓ Copied" : "🔗 Copy Link"}
          </button>
          <button
            onClick={() => {
              setOpen(false);
              onDuplicate(flow.id, flow.name);
            }}
            className="w-full flex items-center gap-2 px-3 py-2 text-xs text-left hover:opacity-80"
            style={{ color: "#e2e8f0" }}
          >
            ⧉ Duplicate
          </button>
          <div
            className="my-1 mx-2 h-px"
            style={{ background: "rgba(255,255,255,0.06)" }}
          />
          <button
            onClick={() => {
              setOpen(false);
              onDelete(flow.id, flow.name);
            }}
            className="w-full flex items-center gap-2 px-3 py-2 text-xs text-left hover:opacity-80"
            style={{ color: "#ef4444" }}
          >
            🗑 Delete
          </button>
        </div>
      )}
    </div>
  );
}

export default function ClientDetailClient({
  initialClient,
  clientId,
}: {
  initialClient: ClientDetail;
  clientId: string;
}) {
  const router = useRouter();
  const [client, setClient] = useState<ClientDetail>(initialClient);
  const [showNew, setShowNew] = useState(false);
  const [newName, setNewName] = useState("");
  const [newDesc, setNewDesc] = useState("");
  const [creating, setCreating] = useState(false);
  const [updating, setUpdating] = useState<FlowSummary | null>(null);
  const [updateName, setUpdateName] = useState("");
  const [updateDesc, setUpdateDesc] = useState("");
  const [savingUpdate, setSavingUpdate] = useState(false);
  const [duplicating, setDuplicating] = useState<string | null>(null);
  const [deleting, setDeleting] = useState<string | null>(null);

  async function createFlow() {
    if (!newName.trim()) return;
    setCreating(true);
    const res = await fetch(`/api/clients/${clientId}/flows`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: newName.trim(), description: newDesc }),
    });
    const flow = await res.json();
    setCreating(false);
    setShowNew(false);
    setNewName("");
    setNewDesc("");
    router.push(`/clients/${clientId}/flows/${flow.id}`);
  }

  async function updateFlow() {
    if (!updating || !updateName.trim()) return;
    setSavingUpdate(true);
    await fetch(`/api/clients/${clientId}/flows/${updating.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: updateName.trim(), description: updateDesc }),
    });
    setClient((prev) => ({
      ...prev,
      flows: prev.flows.map((f) =>
        f.id === updating.id
          ? { ...f, name: updateName.trim(), description: updateDesc }
          : f
      ),
    }));
    setSavingUpdate(false);
    setUpdating(null);
  }

  async function duplicateFlow(flowId: string, name: string) {
    setDuplicating(flowId);
    const res = await fetch(`/api/clients/${clientId}/flows/${flowId}`);
    const original = await res.json();
    const dupRes = await fetch(`/api/clients/${clientId}/flows`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: `Copy of ${name}`, description: original.description }),
    });
    const dupFlow = await dupRes.json();
    await fetch(`/api/clients/${clientId}/flows/${dupFlow.id}/nodes`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ nodes: original.nodes }),
    });
    const updatedRes = await fetch(`/api/clients/${clientId}/flows/`);
    const updatedFlows = await updatedRes.json();
    setClient((prev) => ({ ...prev, flows: updatedFlows }));
    setDuplicating(null);
  }

  async function deleteFlow(flowId: string, name: string) {
    if (!confirm(`Delete flow "${name}"? This cannot be undone.`)) return;
    setDeleting(flowId);
    await fetch(`/api/clients/${clientId}/flows/${flowId}`, {
      method: "DELETE",
    });
    setClient((prev) => ({
      ...prev,
      flows: prev.flows.filter((f) => f.id !== flowId),
    }));
    setDeleting(null);
  }

  return (
    <div className="p-4 sm:p-8 max-w-4xl mx-auto">
      {/* Breadcrumb */}
      <Link href="/clients" className="text-xs mb-6 block" style={{ color: "#475569" }}>
        ← All Clients
      </Link>

      {/* Client header */}
      <div
        className="flex flex-col sm:flex-row sm:items-start gap-4 mb-8 p-5 rounded-xl border"
        style={{ background: "#111827", borderColor: "rgba(255,255,255,0.06)" }}
      >
        <div className="flex items-start gap-4 w-full sm:w-auto">
          <div
            className="w-12 h-12 rounded-xl flex items-center justify-center font-bold text-xl shrink-0"
            style={{ background: "rgba(37,211,102,0.1)", color: "#25d366" }}
          >
            {client.name[0].toUpperCase()}
          </div>
          <div className="flex-1 min-w-0">
            <h1 className="text-lg sm:text-xl font-bold truncate">{client.name}</h1>
            <div className="flex flex-wrap gap-x-4 gap-y-1 mt-1">
              {client.industry && (
                <span className="text-xs" style={{ color: "#64748b" }}>
                  🏢 {client.industry}
                </span>
              )}
              {client.email && (
                <span className="text-xs truncate" style={{ color: "#64748b" }}>
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
        </div>
        <div
          className="text-sm font-semibold px-3 py-1 rounded-full self-start sm:self-auto shrink-0"
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
                  style={{
                    background: "#1a2133",
                    borderColor: "rgba(255,255,255,0.08)",
                    color: "#e2e8f0",
                  }}
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
                  style={{
                    background: "#1a2133",
                    borderColor: "rgba(255,255,255,0.08)",
                    color: "#e2e8f0",
                  }}
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
                style={{
                  borderColor: "rgba(255,255,255,0.08)",
                  color: "#94a3b8",
                }}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Update Flow modal */}
      {updating && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div
            className="rounded-xl p-6 w-full max-w-md shadow-2xl"
            style={{ background: "#111827" }}
          >
            <h2 className="text-lg font-semibold mb-4">Update Flow</h2>
            <div className="flex flex-col gap-3">
              <div>
                <label className="block text-xs mb-1" style={{ color: "#94a3b8" }}>
                  Flow Name *
                </label>
                <input
                  value={updateName}
                  onChange={(e) => setUpdateName(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border text-sm outline-none"
                  style={{
                    background: "#1a2133",
                    borderColor: "rgba(255,255,255,0.08)",
                    color: "#e2e8f0",
                  }}
                  onKeyDown={(e) => e.key === "Enter" && updateFlow()}
                />
              </div>
              <div>
                <label className="block text-xs mb-1" style={{ color: "#94a3b8" }}>
                  Description
                </label>
                <input
                  value={updateDesc}
                  onChange={(e) => setUpdateDesc(e.target.value)}
                  placeholder="Optional short description"
                  className="w-full px-3 py-2 rounded-lg border text-sm outline-none"
                  style={{
                    background: "#1a2133",
                    borderColor: "rgba(255,255,255,0.08)",
                    color: "#e2e8f0",
                  }}
                />
              </div>
            </div>
            <div className="flex gap-3 mt-5">
              <button
                onClick={updateFlow}
                disabled={savingUpdate || !updateName.trim()}
                className="flex-1 py-2 rounded-lg font-semibold text-sm disabled:opacity-40"
                style={{ background: "#2563eb", color: "#fff" }}
              >
                {savingUpdate ? "Saving…" : "Save"}
              </button>
              <button
                onClick={() => setUpdating(null)}
                className="px-4 py-2 rounded-lg text-sm border"
                style={{
                  borderColor: "rgba(255,255,255,0.08)",
                  color: "#94a3b8",
                }}
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
                  href={`/clients/${clientId}/flows/${f.id}`}
                  className="flex-1 text-center text-sm py-2 rounded-lg font-medium transition-opacity hover:opacity-80"
                  style={{ background: "#25d366", color: "#000" }}
                >
                  Open Builder
                </Link>
                <FlowCardMenu
                  flow={f}
                  clientId={clientId}
                  onUpdate={(flow) => {
                    setUpdateName(flow.name);
                    setUpdateDesc(flow.description ?? "");
                    setUpdating(flow);
                  }}
                  onDuplicate={duplicateFlow}
                  onDelete={deleteFlow}
                />
              </div>
            </div>
          ))}
        </div>
      )}


    </div>
  );
}
