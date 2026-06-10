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
import Link from "next/link";

import { FlowNode, BotFlow } from "@/lib/types";
import BotNodeComponent, { BotNodeData } from "@/components/flow/BotNode";
import NodeEditor from "@/components/flow/NodeEditor";
import ChatSimulator from "@/components/simulator/ChatSimulator";

const nodeTypes = { botNode: BotNodeComponent };

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
  const [isMobile, setIsMobile] = useState(false);
  const [editorOpen, setEditorOpen] = useState(false);

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 768);
    check();
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, []);

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

  const prevLocalNodesRef = useRef(localNodes);
  useEffect(() => {
    const prev = prevLocalNodesRef.current;
    prevLocalNodesRef.current = localNodes;

    setRfNodes((currentNodes) => {
      const posMap = new Map(currentNodes.map((n) => [n.id, n.position]));
      return localNodes.map((n) => ({
        id: n.key,
        type: "botNode",
        position: posMap.get(n.key) ?? { x: n.posX || 0, y: n.posY || 0 },
        data: {
          key: n.key,
          title: n.title,
          message: n.message,
          replies: n.replies,
          targets: n.targets,
          isStart: n.key === startKey,
          onSelect: stableOnSelect,
        } satisfies BotNodeData,
      }));
    });
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
    setSelectedKey(key.trim());
  }

  function handleAutoLayout() {
    setLocalNodes((prev) => autoLayout(prev));
  }

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
      <div
        className="flex items-center gap-2 px-3 sm:px-5 py-2 sm:py-3 border-b shrink-0 flex-wrap"
        style={{
          background: "#111827",
          borderColor: "rgba(255,255,255,0.06)",
        }}
      >
        <Link
          href={`/clients/${flow.clientId}`}
          className="text-xs px-2 py-1 rounded shrink-0"
          style={{ color: "#64748b", background: "rgba(255,255,255,0.04)" }}
        >
          ← Back
        </Link>

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
