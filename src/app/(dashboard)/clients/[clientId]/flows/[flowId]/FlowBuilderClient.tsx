"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  ReactFlow,
  ReactFlowProvider,
  useNodesState,
  useEdgesState,
  Background,
  Controls,
  MiniMap,
  BackgroundVariant,
  Connection,
  Edge,
  Node,
  MarkerType,
  applyNodeChanges,
  applyEdgeChanges,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import { useRouter } from "next/navigation";

import { FlowNode, BotFlow } from "@/lib/types";
import BotNodeComponent, { BotNodeData } from "@/components/flow/BotNode";
import NodeEditor from "@/components/flow/NodeEditor";
import ChatSimulator from "@/components/simulator/ChatSimulator";

const nodeTypes = { botNode: BotNodeComponent };

function toRFNode(
  n: FlowNode,
  isStart: boolean,
  onSelect: (key: string) => void,
): Node {
  return {
    id: n.key,
    type: "botNode",
    position: { x: n.posX || 0, y: n.posY || 0 },
    data: {
      key: n.key,
      title: n.title,
      message: n.message,
      replies: n.replies,
      targets: n.targets,
      inputType: n.inputType,
      isStart,
      onSelect,
    } satisfies BotNodeData,
  };
}

function buildEdges(nodes: FlowNode[]): Edge[] {
  const edges: Edge[] = [];
  const validKeys = new Set(nodes.map((n) => n.key));

  nodes.forEach((n) => {
    n.replies.forEach((reply, i) => {
      const target = n.targets[i];
      if (!target || target === "null" || !validKeys.has(target)) return;
      const edgeId = `${n.key}-${i}-${target}`;
      edges.push({
        id: edgeId,
        source: n.key,
        target,
        sourceHandle: "source-out",
        targetHandle: "target-in",
        label: reply,
        labelStyle: { fill: "#94a3b8", fontSize: 11 },
        labelBgStyle: { fill: "rgba(11,17,32,0.85)" },
        style: { stroke: "#25d366", strokeWidth: 1.5, opacity: 0.7 },
        markerEnd: { type: MarkerType.ArrowClosed, color: "#25d366" },
        animated: false,
      });
    });
  });
  return edges;
}

function autoLayout(nodes: FlowNode[]): FlowNode[] {
  const COLS = 5;
  const W = 280, H = 220;
  return nodes.map((n, i) => ({
    ...n,
    posX: (i % COLS) * W + 40,
    posY: Math.floor(i / COLS) * H + 40,
  }));
}

function FlowCanvas({ flow }: { flow: BotFlow }) {
  const router = useRouter();
  const initialNodes = useMemo(() => {
    const needsLayout = flow.nodes.every((n) => n.posX === 0 && n.posY === 0);
    return needsLayout && flow.nodes.length > 0 ? autoLayout(flow.nodes) : flow.nodes;
  }, []);

  const initialStartKey = initialNodes.find((n) => n.isStart)?.key ?? initialNodes[0]?.key;

  const [localNodes, setLocalNodes] = useState<FlowNode[]>(initialNodes);
  const [selectedKey, setSelectedKey] = useState<string | null>(initialStartKey);
  const [showSim, setShowSim] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saveMsg, setSaveMsg] = useState("");
  const [linkCopied, setLinkCopied] = useState(false);
  const [linkCopying, setLinkCopying] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [editorOpen, setEditorOpen] = useState(false);
  const [isDirty, setIsDirty] = useState(false);
  const [showExitModal, setShowExitModal] = useState(false);
  const exitTargetRef = useRef<string | null>(null);
  const lastSavedNodesRef = useRef<string>(JSON.stringify(initialNodes));
  const localNodesRef = useRef(localNodes);
  localNodesRef.current = localNodes;
  const importInputRef = useRef<HTMLInputElement>(null);

  function hasUnsavedChanges() {
    return JSON.stringify(localNodesRef.current) !== lastSavedNodesRef.current;
  }

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 768);
    check();
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, []);

  useEffect(() => {
    function handleBeforeUnload(e: BeforeUnloadEvent) {
      if (!hasUnsavedChanges()) return;
      e.preventDefault();
    }
    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, []);

  useEffect(() => {
    function handlePopState() {
      if (hasUnsavedChanges()) {
        window.history.pushState(null, "", window.location.href);
        exitTargetRef.current = document.referrer || `/clients/${flow.clientId}`;
        setShowExitModal(true);
      }
    }
    window.history.pushState(null, "", window.location.href);
    window.addEventListener("popstate", handlePopState);
    return () => window.removeEventListener("popstate", handlePopState);
  }, [flow.clientId]);

  const onSelectRef = useRef<(key: string) => void>(() => {});
  const selectNode = useCallback((key: string) => {
    setSelectedKey(key);
  }, []);
  onSelectRef.current = selectNode;

  const stableOnSelect = useCallback((key: string) => {
    onSelectRef.current(key);
  }, []);

  const startKey = useMemo(() => {
    const start = localNodes.find((n) => n.isStart);
    return start?.key ?? localNodes[0]?.key;
  }, [localNodes]);

  const initialRFNodes = useMemo(
    () => localNodes.map((n) => toRFNode(n, n.key === startKey, stableOnSelect)),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    []
  );
  const initialRFEdges = useMemo(
    () => buildEdges(localNodes),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    []
  );

  const [rfNodes, setRfNodes] = useNodesState(initialRFNodes);
  const [rfEdges, setRfEdges] = useEdgesState(initialRFEdges);

  useEffect(() => {
    setRfNodes(() =>
      localNodes.map((n) => ({
        id: n.key,
        type: "botNode",
        position: { x: n.posX || 0, y: n.posY || 0 },
        data: {
          key: n.key,
          title: n.title,
          message: n.message,
          replies: n.replies,
          targets: n.targets,
          inputType: n.inputType,
          isStart: n.key === startKey,
          onSelect: stableOnSelect,
        } satisfies BotNodeData,
      }))
    );
    setRfEdges(buildEdges(localNodes));
  }, [localNodes, startKey, stableOnSelect]);

  const onNodeDragStop = useCallback(
    (_: MouseEvent | TouchEvent, node: Node) => {
      setLocalNodes((prev) =>
        prev.map((n) =>
          n.key === node.id
            ? { ...n, posX: Math.round(node.position.x), posY: Math.round(node.position.y) }
            : n
        )
      );
      setIsDirty(true);
    },
    []
  );

  const onConnect = useCallback(
    (connection: Connection) => {
      if (!connection.source || !connection.target) return;
      setLocalNodes((prev) =>
        prev.map((n) => {
          if (n.key !== connection.source) return n;
          const targets = [...n.targets, connection.target!];
          const replies = [...n.replies, `\u2192 ${connection.target}`];
          return { ...n, replies, targets };
        })
      );
      setIsDirty(true);
    },
    []
  );

  async function handleSave() {
    setSaving(true);
    setSaveMsg("");
    const posMap = new Map(rfNodes.map((n) => [n.id, n.position]));
    const toSave = localNodes.map((n) => {
      const pos = posMap.get(n.key);
      return {
        ...n,
        posX: pos ? Math.round(pos.x) : n.posX,
        posY: pos ? Math.round(pos.y) : n.posY,
        isStart: n.key === startKey,
      };
    });
    try {
      const res = await fetch(
        `/api/clients/${flow.clientId}/flows/${flow.id}/nodes`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ nodes: toSave }),
        }
      );
      if (!res.ok) throw new Error("Save failed");
      setSaveMsg("Saved \u2713");
      setIsDirty(false);
      lastSavedNodesRef.current = JSON.stringify(localNodes);
    } catch {
      setSaveMsg("Save failed \u2717");
    } finally {
      setSaving(false);
      setTimeout(() => setSaveMsg(""), 2500);
    }
  }

  function handleAddNode() {
    const key = prompt("Node key (no spaces, unique):\ne.g. product_info");
    if (!key?.trim()) return;
    if (localNodes.find((n) => n.key === key.trim())) {
      alert(`Key "${key}" already exists`);
      return;
    }
    const title = prompt("Title (short)") || key.trim();
    const newNode: FlowNode = {
      id: "",
      key: key.trim(),
      title,
      message: "Type your bot message here\u2026",
      replies: [],
      targets: [],
      isStart: false,
      posX: 40 + Math.random() * 200,
      posY: 40 + Math.random() * 200,
      flowId: flow.id,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    setLocalNodes((prev) => [...prev, newNode]);
    setIsDirty(true);
    setSelectedKey(key.trim());
  }

  function handleAutoLayout() {
    setLocalNodes((prev) => autoLayout(prev));
    setIsDirty(true);
  }

  function handleExport() {
    const data = {
      name: flow.name,
      description: flow.description,
      exportedAt: new Date().toISOString(),
      nodes: localNodes.map((n) => ({
        key: n.key,
        title: n.title,
        message: n.message,
        replies: n.replies,
        targets: n.targets,
        isStart: n.key === startKey,
        posX: n.posX,
        posY: n.posY,
      })),
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${flow.name.replace(/\s+/g, "_")}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  function handleImportFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      try {
        const data = JSON.parse(ev.target?.result as string);
        if (!data.nodes || !Array.isArray(data.nodes)) {
          alert("Invalid file: missing \"nodes\" array");
          return;
        }
        const imported = data.nodes as Array<{
          key: string; title: string; message: string;
          replies: string[]; targets: string[];
          isStart?: boolean; posX?: number; posY?: number;
        }>;
        if (imported.length === 0) {
          alert("Imported flow has no nodes");
          return;
        }
        const keys = imported.map((n) => n.key);
        if (new Set(keys).size !== keys.length) {
          alert("Invalid file: duplicate node keys");
          return;
        }
        if (!confirm(`Replace current flow (${localNodes.length} nodes) with imported flow (${imported.length} nodes)?`)) return;
        const now = new Date().toISOString();
        setLocalNodes(
          imported.map((n) => ({
            id: "",
            key: n.key,
            title: n.title || n.key,
            message: n.message || "",
            replies: n.replies || [],
            targets: n.targets || [],
            isStart: n.isStart ?? false,
            posX: n.posX ?? 0,
            posY: n.posY ?? 0,
            flowId: flow.id,
            createdAt: now,
            updatedAt: now,
          }))
        );
        setIsDirty(true);
      } catch {
        alert("Invalid JSON file");
      }
    };
    reader.readAsText(file);
    if (importInputRef.current) importInputRef.current.value = "";
  }

  const selectedNodeData = localNodes.find((n) => n.key === selectedKey) ?? null;

  function handleEditorSave(updated: FlowNode) {
    setLocalNodes((prev) =>
      prev.map((n) => (n.key === updated.key ? { ...n, ...updated } : n))
    );
    setIsDirty(true);
  }

  function handleDuplicateNode(key: string) {
    const node = localNodes.find((n) => n.key === key);
    if (!node) return;
    let newKey = `${key}_copy`;
    let i = 1;
    while (localNodes.find((n) => n.key === newKey)) {
      newKey = `${key}_copy${i}`;
      i++;
    }
    const dup: FlowNode = {
      ...node,
      id: "",
      key: newKey,
      title: `${node.title} (copy)`,
      posX: node.posX + 30,
      posY: node.posY + 30,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    setLocalNodes((prev) => [...prev, dup]);
    setIsDirty(true);
    setSelectedKey(newKey);
  }

  function handleUpdateNodeId(oldKey: string, newKey: string) {
    if (!newKey.trim() || newKey.trim() === oldKey) return;
    if (localNodes.find((n) => n.key === newKey.trim())) return;
    setLocalNodes((prev) =>
      prev.map((n) => ({
        ...n,
        key: n.key === oldKey ? newKey.trim() : n.key,
        targets: n.targets.map((t) => (t === oldKey ? newKey.trim() : t)),
      }))
    );
    setIsDirty(true);
    setSelectedKey(newKey.trim());
  }

  function handleEditorDelete(key: string) {
    if (!confirm(`Delete node "${key}"?`)) return;
    setLocalNodes((prev) => {
      const filtered = prev.filter((n) => n.key !== key);
      return filtered.map((n) => ({
        ...n,
        targets: n.targets.map((t) => (t === key ? "" : t)),
      }));
    });
    setIsDirty(true);
    setSelectedKey(localNodes.find((n) => n.key !== key)?.key ?? null);
  }

  function handleBack() {
    if (hasUnsavedChanges()) {
      exitTargetRef.current = `/clients/${flow.clientId}`;
      setShowExitModal(true);
    } else {
      router.push(`/clients/${flow.clientId}`);
    }
  }

  async function handleExitSave() {
    setSaving(true);
    const posMap = new Map(rfNodes.map((n) => [n.id, n.position]));
    const toSave = localNodes.map((n) => {
      const pos = posMap.get(n.key);
      return { ...n, posX: pos ? Math.round(pos.x) : n.posX, posY: pos ? Math.round(pos.y) : n.posY, isStart: n.key === startKey };
    });
    try {
      await fetch(`/api/clients/${flow.clientId}/flows/${flow.id}/nodes`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ nodes: toSave }),
      });
    } catch {}
    setIsDirty(false);
    lastSavedNodesRef.current = JSON.stringify(localNodes);
    setShowExitModal(false);
    router.push(exitTargetRef.current || `/clients/${flow.clientId}`);
  }

  function handleExitDiscard() {
    setIsDirty(false);
    setLocalNodes(JSON.parse(lastSavedNodesRef.current));
    setShowExitModal(false);
    router.push(exitTargetRef.current || `/clients/${flow.clientId}`);
  }

  return (
    <div className="flex flex-col h-screen" style={{ background: "#0b1120" }}>
      <div
        className="flex items-center gap-2 px-3 sm:px-5 py-2 sm:py-3 border-b shrink-0 flex-wrap"
        style={{
          background: "#111827",
          borderColor: "rgba(255,255,255,0.06)",
        }}
      >
        <button
          onClick={handleBack}
          className="text-xs px-2 py-1 rounded shrink-0"
          style={{ color: "#64748b", background: "rgba(255,255,255,0.04)", border: "none", cursor: "pointer" }}
        >
          ← Back
        </button>

        <div className="h-4 w-px shrink-0" style={{ background: "rgba(255,255,255,0.08)" }} />

        <div className="min-w-0 flex-1 sm:flex-initial">
          <span className="text-xs sm:text-sm font-semibold truncate">{flow.name}</span>
          <span className="ml-1.5 text-xs" style={{ color: "#475569" }}>
            {localNodes.length} nodes
          </span>
        </div>

        <div className="hidden sm:block flex-1" />

        {saveMsg && (
          <span
            className="text-xs px-2 py-1 rounded hidden sm:inline"
            style={{
              color: saveMsg.includes("\u2713") ? "#25d366" : "#ef4444",
              background: saveMsg.includes("\u2713")
                ? "rgba(37,211,102,0.08)"
                : "rgba(239,68,68,0.08)",
            }}
          >
            {saveMsg}
          </span>
        )}

        <button
          onClick={handleAutoLayout}
          className="text-xs px-2 sm:px-3 py-1 sm:py-1.5 rounded-lg border shrink-0"
          style={{
            borderColor: "rgba(255,255,255,0.08)",
            color: "#94a3b8",
          }}
        >
          <span className="hidden sm:inline">Auto Layout</span>
          <span className="sm:hidden" title="Auto Layout">⟳</span>
        </button>

        <button
          onClick={handleAddNode}
          className="text-xs px-2 sm:px-3 py-1 sm:py-1.5 rounded-lg shrink-0"
          style={{ background: "rgba(6,182,212,0.1)", color: "#06b6d4", border: "1px solid rgba(6,182,212,0.2)" }}
        >
          + Node
        </button>

        <button
          onClick={handleExport}
          className="text-xs px-2 sm:px-3 py-1 sm:py-1.5 rounded-lg shrink-0"
          style={{ background: "rgba(139,92,246,0.1)", color: "#a78bfa", border: "1px solid rgba(139,92,246,0.2)" }}
        >
          Export
        </button>

        <button
          onClick={() => importInputRef.current?.click()}
          className="text-xs px-2 sm:px-3 py-1 sm:py-1.5 rounded-lg shrink-0"
          style={{ background: "rgba(139,92,246,0.1)", color: "#a78bfa", border: "1px solid rgba(139,92,246,0.2)" }}
        >
          Import
        </button>

        <button
          onClick={async () => {
            setLinkCopying(true);
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
            setLinkCopying(false);
            setLinkCopied(true);
            setTimeout(() => setLinkCopied(false), 2000);
          }}
          disabled={linkCopying}
          className="text-xs px-2 sm:px-3 py-1 sm:py-1.5 rounded-lg shrink-0 disabled:opacity-40"
          style={{
            color: linkCopied ? "#25d366" : "#94a3b8",
            border: "1px solid rgba(255,255,255,0.08)",
          }}
          title={linkCopying ? "Copying…" : linkCopied ? "Copied!" : "Copy demo link"}
        >
          {linkCopying ? "..." : linkCopied ? "\u2713 Copied" : "\uD83D\uDD17 Link"}
        </button>

        <button
          onClick={() => setShowSim(true)}
          className="text-xs px-2 sm:px-3 py-1 sm:py-1.5 rounded-lg font-semibold shrink-0"
          style={{ background: "#25d366", color: "#000" }}
        >
          ▶ Demo
        </button>

        <button
          onClick={handleSave}
          disabled={saving}
          className="text-xs px-3 sm:px-4 py-1 sm:py-1.5 rounded-lg font-semibold disabled:opacity-50 shrink-0"
          style={{ background: "#1d4ed8", color: "#fff" }}
        >
          {saving ? "Saving\u2026" : "Save"}
        </button>

        <input
          ref={importInputRef}
          type="file"
          accept=".json"
          style={{ display: "none" }}
          onChange={handleImportFile}
        />
      </div>

      <div className="flex flex-1 overflow-hidden">
        <div className="flex-1 relative">
          <ReactFlow
            nodes={rfNodes}
            edges={rfEdges}
            onNodesChange={(changes) => {
              setRfNodes((nds) => applyNodeChanges(changes, nds));
            }}
            onEdgesChange={(changes) =>
              setRfEdges((eds) => applyEdgeChanges(changes, eds))
            }
            onConnect={onConnect}
            onNodeDragStop={onNodeDragStop}
            onNodeClick={(_, node) => selectNode(node.id)}
            nodeTypes={nodeTypes}
            colorMode="dark"
            fitView
            fitViewOptions={{ padding: 0.2 }}
            minZoom={0.2}
            maxZoom={1.5}
            deleteKeyCode={null}
          >
            <Background
              variant={BackgroundVariant.Dots}
              gap={20}
              size={1}
              color="rgba(255,255,255,0.05)"
            />
            <Controls
              style={{
                background: "#111827",
                border: "1px solid rgba(255,255,255,0.06)",
                borderRadius: 8,
              }}
            />
            <MiniMap
              nodeColor={() => "#1e293b"}
              maskColor="rgba(0,0,0,0.6)"
              style={{
                background: "#111827",
                border: "1px solid rgba(255,255,255,0.06)",
                borderRadius: 8,
              }}
            />
          </ReactFlow>

          {isMobile && selectedNodeData && (
            <button
              onClick={() => setEditorOpen(true)}
              className="fixed bottom-4 right-4 z-20 w-12 h-12 rounded-full shadow-lg flex items-center justify-center text-sm font-semibold"
              style={{ background: "#25d366", color: "#000" }}
              aria-label="Edit node"
            >
              ✎
            </button>
          )}
        </div>

        {!isMobile && (
          <div
            className="shrink-0 border-l overflow-hidden hidden md:block"
            style={{
              width: 300,
              background: "#111827",
              borderColor: "rgba(255,255,255,0.06)",
            }}
          >
            <NodeEditor
              node={selectedNodeData}
              allNodes={localNodes}
              onSave={handleEditorSave}
              onDelete={handleEditorDelete}
              onDuplicate={handleDuplicateNode}
              onUpdateId={handleUpdateNodeId}
              onClose={() => setSelectedKey(null)}
            />
          </div>
        )}
      </div>

      {isMobile && editorOpen && (
        <div
          className="fixed inset-0 z-30"
          style={{ background: "rgba(0,0,0,0.5)" }}
          onClick={() => setEditorOpen(false)}
        >
          <div
            className="absolute bottom-0 left-0 right-0 max-h-[75vh] overflow-auto rounded-t-2xl"
            style={{ background: "#111827" }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-center pt-2 pb-1">
              <div className="w-8 h-1 rounded-full" style={{ background: "rgba(255,255,255,0.15)" }} />
            </div>
            <NodeEditor
              node={selectedNodeData}
              allNodes={localNodes}
              onSave={handleEditorSave}
              onDelete={handleEditorDelete}
              onDuplicate={handleDuplicateNode}
              onUpdateId={handleUpdateNodeId}
              onClose={() => setEditorOpen(false)}
            />
          </div>
        </div>
      )}

      {showSim && (
        <div
          className="fixed inset-0 flex items-center justify-center z-50 p-4"
          style={{ background: "rgba(0,0,0,0.65)" }}
          onClick={(e) => {
            if (e.target === e.currentTarget) setShowSim(false);
          }}
        >
          <ChatSimulator
            nodes={localNodes}
            startKey={startKey}
            onClose={() => setShowSim(false)}
          />
        </div>
      )}

      {showExitModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="rounded-xl p-6 w-full max-w-sm shadow-2xl" style={{ background: "#111827" }}>
            <h2 className="text-base font-semibold mb-2">Unsaved changes</h2>
            <p className="text-sm mb-5" style={{ color: "#94a3b8" }}>
              You have unsaved changes. What would you like to do?
            </p>
            <div className="flex flex-col gap-2">
              <button
                onClick={handleExitSave}
                disabled={saving}
                className="w-full py-2 rounded-lg text-sm font-semibold disabled:opacity-40"
                style={{ background: "#1d4ed8", color: "#fff" }}
              >
                {saving ? "Saving…" : "Save & Leave"}
              </button>
              <button
                onClick={handleExitDiscard}
                disabled={saving}
                className="w-full py-2 rounded-lg text-sm"
                style={{ background: "rgba(239,68,68,0.1)", color: "#ef4444", border: "1px solid rgba(239,68,68,0.2)" }}
              >
                Discard Changes
              </button>
              <button
                onClick={() => setShowExitModal(false)}
                className="w-full py-2 rounded-lg text-sm border"
                style={{ borderColor: "rgba(255,255,255,0.08)", color: "#94a3b8" }}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function FlowBuilderClient({ flow }: { flow: BotFlow }) {
  return (
    <ReactFlowProvider>
      <FlowCanvas flow={flow} />
    </ReactFlowProvider>
  );
}
