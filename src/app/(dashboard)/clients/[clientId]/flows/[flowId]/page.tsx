"use client";
// src/app/(dashboard)/clients/[clientId]/flows/[flowId]/page.tsx

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  ReactFlow,
  ReactFlowProvider,
  useNodesState,
  useEdgesState,
  useUpdateNodeInternals,
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
import { useParams } from "next/navigation";
import Link from "next/link";

import { FlowNode, BotFlow } from "@/lib/types";
import BotNodeComponent, { BotNodeData } from "@/components/flow/BotNode";
import NodeEditor from "@/components/flow/NodeEditor";
import ChatSimulator from "@/components/simulator/ChatSimulator";

// Register custom node type OUTSIDE component to avoid re-creating on every render
const nodeTypes = { botNode: BotNodeComponent };

// ---------- helpers ----------

function toRFNode(
  n: FlowNode,
  isStart: boolean,
  onSelect: (key: string) => void
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
      isStart,
      onSelect,
    } satisfies BotNodeData,
  };
}

function buildEdges(nodes: FlowNode[]): Edge[] {
  const edges: Edge[] = [];
  // Track node keys for target validation
  const validKeys = new Set(nodes.map((n) => n.key));

  nodes.forEach((n) => {
    n.replies.forEach((reply, i) => {
      const target = n.targets[i];
      // Skip empty, null, "null" strings, or non-existent targets
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


// Auto-layout: grid
function autoLayout(nodes: FlowNode[]): FlowNode[] {
  const COLS = 5;
  const W = 280, H = 220;
  return nodes.map((n, i) => ({
    ...n,
    posX: (i % COLS) * W + 40,
    posY: Math.floor(i / COLS) * H + 40,
  }));
}

// ---------- inner canvas (must be inside ReactFlowProvider) ----------
function FlowCanvas({
  flow,
  onFlowChange,
}: {
  flow: BotFlow;
  onFlowChange: (nodes: FlowNode[]) => void;
}) {
  // Single source of truth for node data (non-position state)
  const [localNodes, setLocalNodes] = useState<FlowNode[]>(flow.nodes);
  const [selectedKey, setSelectedKey] = useState<string | null>(
    flow.nodes[0]?.key ?? null
  );
  const [showSim, setShowSim] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saveMsg, setSaveMsg] = useState("");

  // Stable callback ref — avoids re-creating onSelect on every render
  const onSelectRef = useRef<(key: string) => void>(() => {});
  const selectNode = useCallback((key: string) => {
    setSelectedKey(key);
  }, []);
  onSelectRef.current = selectNode;

  // Stable onSelect wrapper that reads from ref — never changes identity
  const stableOnSelect = useCallback((key: string) => {
    onSelectRef.current(key);
  }, []);

  // Build initial RF nodes/edges once, then manage positions via RF state
  const initialRFNodes = useMemo(
    () => localNodes.map((n, i) => toRFNode(n, i === 0, stableOnSelect)),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [] // only on mount
  );
  const initialRFEdges = useMemo(
    () => buildEdges(localNodes),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [] // only on mount
  );

  const [rfNodes, setRfNodes] = useNodesState(initialRFNodes);
  const [rfEdges, setRfEdges] = useEdgesState(initialRFEdges);
  const updateNodeInternals = useUpdateNodeInternals();

  // When localNodes data changes (title/message/replies), update RF node data only
  // but preserve positions from RF state
  const prevLocalNodesRef = useRef(localNodes);
  useEffect(() => {
    const prev = prevLocalNodesRef.current;
    prevLocalNodesRef.current = localNodes;

    setRfNodes((currentNodes) => {
      // Build a quick lookup of current positions
      const posMap = new Map(currentNodes.map((n) => [n.id, n.position]));
      return localNodes.map((n, i) => ({
        id: n.key,
        type: "botNode",
        position: posMap.get(n.key) ?? { x: n.posX || 0, y: n.posY || 0 },
        data: {
          key: n.key,
          title: n.title,
          message: n.message,
          replies: n.replies,
          targets: n.targets,
          isStart: i === 0,
          onSelect: stableOnSelect,
        } satisfies BotNodeData,
      }));
    });
    setRfEdges(buildEdges(localNodes));
  }, [localNodes, stableOnSelect]);

  // Re-register handles after nodes change (handles are conditionally rendered based on isStart)
  useEffect(() => {
    localNodes.forEach((n) => updateNodeInternals(n.key));
  }, [localNodes]);

  // Persist drag positions back to localNodes (only position, no full rebuild)
  const onNodeDragStop = useCallback(
    (_: MouseEvent | TouchEvent, node: Node) => {
      setLocalNodes((prev) =>
        prev.map((n) =>
          n.key === node.id
            ? { ...n, posX: Math.round(node.position.x), posY: Math.round(node.position.y) }
            : n
        )
      );
    },
    []
  );

  // Edge connect: add target to source node
  const onConnect = useCallback(
    (connection: Connection) => {
      if (!connection.source || !connection.target) return;
      setLocalNodes((prev) =>
        prev.map((n) => {
          if (n.key !== connection.source) return n;
          const targets = [...n.targets, connection.target!];
          const replies = [...n.replies, `→ ${connection.target}`];
          return { ...n, replies, targets };
        })
      );
    },
    []
  );

  // Save to DB — collect current positions from RF nodes
  async function handleSave() {
    setSaving(true);
    setSaveMsg("");
    // Merge current RF positions into localNodes before saving
    const posMap = new Map(rfNodes.map((n) => [n.id, n.position]));
    const toSave = localNodes.map((n) => {
      const pos = posMap.get(n.key);
      return pos ? { ...n, posX: Math.round(pos.x), posY: Math.round(pos.y) } : n;
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
      setSaveMsg("Saved ✓");
      onFlowChange(toSave);
    } catch {
      setSaveMsg("Save failed ✗");
    } finally {
      setSaving(false);
      setTimeout(() => setSaveMsg(""), 2500);
    }
  }

  // Add new node
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
      message: "Type your bot message here…",
      replies: [],
      targets: [],
      posX: 40 + Math.random() * 200,
      posY: 40 + Math.random() * 200,
      flowId: flow.id,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    setLocalNodes((prev) => [...prev, newNode]);
    setSelectedKey(key.trim());
  }

  // Auto-layout
  function handleAutoLayout() {
    setLocalNodes((prev) => autoLayout(prev));
  }

  // NodeEditor callbacks
  const selectedNodeData = localNodes.find((n) => n.key === selectedKey) ?? null;

  function handleEditorSave(updated: FlowNode) {
    setLocalNodes((prev) =>
      prev.map((n) => (n.key === updated.key ? { ...n, ...updated } : n))
    );
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
    setSelectedKey(localNodes.find((n) => n.key !== key)?.key ?? null);
  }

  return (
    <div className="flex flex-col h-screen" style={{ background: "#0b1120" }}>
      {/* Top bar */}
      <div
        className="flex items-center gap-3 px-5 py-3 border-b shrink-0"
        style={{
          background: "#111827",
          borderColor: "rgba(255,255,255,0.06)",
        }}
      >
        <Link
          href={`/clients/${flow.clientId}`}
          className="text-xs px-2 py-1 rounded"
          style={{ color: "#64748b", background: "rgba(255,255,255,0.04)" }}
        >
          ← Back
        </Link>

        <div className="h-4 w-px" style={{ background: "rgba(255,255,255,0.08)" }} />

        <div>
          <span className="text-sm font-semibold">{flow.name}</span>
          <span className="ml-2 text-xs" style={{ color: "#475569" }}>
            {localNodes.length} nodes
          </span>
        </div>

        <div className="flex-1" />

        {saveMsg && (
          <span
            className="text-xs px-2 py-1 rounded"
            style={{
              color: saveMsg.includes("✓") ? "#25d366" : "#ef4444",
              background: saveMsg.includes("✓")
                ? "rgba(37,211,102,0.08)"
                : "rgba(239,68,68,0.08)",
            }}
          >
            {saveMsg}
          </span>
        )}

        <button
          onClick={handleAutoLayout}
          className="text-xs px-3 py-1.5 rounded-lg border"
          style={{
            borderColor: "rgba(255,255,255,0.08)",
            color: "#94a3b8",
          }}
        >
          Auto Layout
        </button>

        <button
          onClick={handleAddNode}
          className="text-xs px-3 py-1.5 rounded-lg"
          style={{ background: "rgba(6,182,212,0.1)", color: "#06b6d4", border: "1px solid rgba(6,182,212,0.2)" }}
        >
          + Node
        </button>

        <button
          onClick={() => setShowSim(true)}
          className="text-xs px-3 py-1.5 rounded-lg font-semibold"
          style={{ background: "#25d366", color: "#000" }}
        >
          ▶ Demo
        </button>

        <button
          onClick={handleSave}
          disabled={saving}
          className="text-xs px-4 py-1.5 rounded-lg font-semibold disabled:opacity-50"
          style={{ background: "#1d4ed8", color: "#fff" }}
        >
          {saving ? "Saving…" : "Save"}
        </button>
      </div>

      {/* Canvas + Right panel */}
      <div className="flex flex-1 overflow-hidden">
        {/* ReactFlow Canvas */}
        <div className="flex-1 relative">
          <ReactFlow
            nodes={rfNodes}
            edges={rfEdges}
            onNodesChange={(changes) => {
              // Only allow position/selection changes from RF, not data changes
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
        </div>

        {/* Right panel: node editor */}
        <div
          className="shrink-0 border-l overflow-hidden"
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
            onClose={() => setSelectedKey(null)}
          />
        </div>
      </div>

      {/* Chat simulator overlay */}
      {showSim && (
        <div
          className="fixed inset-0 flex items-center justify-center z-50"
          style={{ background: "rgba(0,0,0,0.65)" }}
          onClick={(e) => {
            if (e.target === e.currentTarget) setShowSim(false);
          }}
        >
          <ChatSimulator
            nodes={localNodes}
            startKey={localNodes[0]?.key}
            onClose={() => setShowSim(false)}
          />
        </div>
      )}
    </div>
  );
}

// ---------- Page (loads flow data, wraps provider) ----------
export default function FlowBuilderPage() {
  const params = useParams<{ clientId: string; flowId: string }>();
  const [flow, setFlow] = useState<BotFlow | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`/api/clients/${params.clientId}/flows/${params.flowId}`)
      .then((r) => r.json())
      .then((data) => {
        // auto-layout if all nodes are at (0,0)
        const needsLayout = data.nodes.every(
          (n: FlowNode) => n.posX === 0 && n.posY === 0
        );
        if (needsLayout) data.nodes = autoLayout(data.nodes);
        setFlow(data);
      })
      .finally(() => setLoading(false));
  }, [params.flowId]);

  if (loading)
    return (
      <div
        className="flex items-center justify-center h-screen text-sm"
        style={{ color: "#475569" }}
      >
        Loading flow…
      </div>
    );

  if (!flow)
    return (
      <div className="flex items-center justify-center h-screen text-sm" style={{ color: "#ef4444" }}>
        Flow not found.
      </div>
    );

  return (
    <ReactFlowProvider>
      <FlowCanvas
        flow={flow}
        onFlowChange={(nodes) => setFlow((f) => f ? { ...f, nodes } : f)}
      />
    </ReactFlowProvider>
  );
}
