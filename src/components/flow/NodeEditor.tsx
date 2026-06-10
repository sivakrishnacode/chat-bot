"use client";
// src/components/flow/NodeEditor.tsx
// Right-panel editor for the currently selected FlowNode.

import { useEffect, useState } from "react";
import { FlowNode } from "@/lib/types";

interface Props {
  node: FlowNode | null;
  allNodes: FlowNode[];
  onSave: (updated: FlowNode) => void;
  onDelete: (key: string) => void;
  onClose: () => void;
}

export default function NodeEditor({ node, allNodes, onSave, onDelete, onClose }: Props) {
  const [title, setTitle] = useState("");
  const [message, setMessage] = useState("");
  const [replies, setReplies] = useState<string[]>([]);
  const [targets, setTargets] = useState<string[]>([]);

  useEffect(() => {
    if (!node) return;
    setTitle(node.title);
    setMessage(node.message);
    setReplies([...node.replies]);
    setTargets([...node.targets]);
  }, [node?.key]);

  if (!node) {
    return (
      <div
        className="flex flex-col items-center justify-center h-full text-center p-6"
        style={{ color: "#475569" }}
      >
        <div className="text-3xl mb-3">👆</div>
        <div className="text-sm">Click a node to edit it</div>
      </div>
    );
  }

  function handleSave() {
    if (!node) return;
    // Sync replies and targets arrays to same length
    const len = Math.max(replies.length, targets.length);
    const safeReplies = Array.from({ length: len }, (_, i) => replies[i] ?? "");
    const safeTargets = Array.from({ length: len }, (_, i) => targets[i] ?? "");
    onSave({
      ...node,
      title,
      message,
      replies: safeReplies.filter((r) => r.trim()),
      targets: safeTargets.slice(0, safeReplies.filter((r) => r.trim()).length),
    });
  }

  function addReply() {
    setReplies((r) => [...r, ""]);
    setTargets((t) => [...t, ""]);
  }

  function removeReply(i: number) {
    setReplies((r) => r.filter((_, idx) => idx !== i));
    setTargets((t) => t.filter((_, idx) => idx !== i));
  }

  const keyOptions = allNodes.filter((n) => n.key !== node.key).map((n) => n.key);

  return (
    <div className="flex flex-col h-full overflow-hidden">
      {/* Header */}
      <div
        className="flex items-center justify-between px-4 py-3 border-b shrink-0"
        style={{ borderColor: "rgba(255,255,255,0.06)" }}
      >
        <div>
          <div className="text-sm font-semibold">Edit Node</div>
          <div className="text-xs mt-0.5" style={{ color: "#64748b", fontFamily: "monospace" }}>
            {node.key}
          </div>
        </div>
        <button onClick={onClose} style={{ color: "#64748b", fontSize: 18 }}>
          ×
        </button>
      </div>

      {/* Body */}
      <div className="flex-1 overflow-y-auto px-4 py-4 flex flex-col gap-4">
        {/* Title */}
        <Field label="Title">
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full px-3 py-2 rounded-lg border text-sm outline-none"
            style={inputStyle}
          />
        </Field>

        {/* Message */}
        <Field label="Bot Message">
          <textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            rows={5}
            className="w-full px-3 py-2 rounded-lg border text-sm outline-none resize-none"
            style={inputStyle}
            placeholder="What should the bot say?"
          />
        </Field>

        {/* Quick Replies */}
        <div>
          <div
            className="flex items-center justify-between mb-2"
          >
            <label className="text-xs font-medium" style={{ color: "#94a3b8" }}>
              Quick Replies & Targets
            </label>
            <button
              onClick={addReply}
              className="text-xs px-2 py-1 rounded"
              style={{ background: "rgba(37,211,102,0.1)", color: "#25d366" }}
            >
              + Add
            </button>
          </div>

          <div className="flex flex-col gap-2">
            {replies.map((r, i) => (
              <div key={i} className="flex flex-col gap-1.5 p-3 rounded-lg" style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.05)" }}>
                <div className="flex items-center gap-2">
                  <span className="text-xs" style={{ color: "#64748b", minWidth: 16 }}>{i + 1}.</span>
                  <input
                    value={r}
                    onChange={(e) => setReplies((arr) => arr.map((x, idx) => idx === i ? e.target.value : x))}
                    placeholder="Reply label"
                    className="flex-1 px-2 py-1.5 rounded text-xs border outline-none"
                    style={inputStyle}
                  />
                  <button
                    onClick={() => removeReply(i)}
                    className="text-xs px-1.5 py-1 rounded"
                    style={{ color: "#ef4444", background: "rgba(239,68,68,0.08)" }}
                  >
                    ✕
                  </button>
                </div>
                <div className="flex items-center gap-2 pl-5">
                  <span className="text-xs" style={{ color: "#475569" }}>→</span>
                  <select
                    value={targets[i] ?? ""}
                    onChange={(e) => setTargets((arr) => arr.map((x, idx) => idx === i ? e.target.value : x))}
                    className="flex-1 px-2 py-1.5 rounded text-xs border outline-none"
                    style={{ ...inputStyle, cursor: "pointer" }}
                  >
                    <option value="">— no target —</option>
                    {keyOptions.map((k) => (
                      <option key={k} value={k}>{k}</option>
                    ))}
                  </select>
                </div>
              </div>
            ))}

            {replies.length === 0 && (
              <div className="text-xs text-center py-3" style={{ color: "#475569" }}>
                No quick replies yet. Add one above.
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Footer buttons */}
      <div
        className="flex items-center gap-2 px-4 py-3 border-t shrink-0"
        style={{ borderColor: "rgba(255,255,255,0.06)" }}
      >
        <button
          onClick={handleSave}
          className="flex-1 py-2 rounded-lg text-sm font-semibold"
          style={{ background: "#25d366", color: "#000" }}
        >
          Save Node
        </button>
        <button
          onClick={() => onDelete(node.key)}
          className="px-3 py-2 rounded-lg text-sm"
          style={{ background: "rgba(239,68,68,0.1)", color: "#ef4444", border: "1px solid rgba(239,68,68,0.2)" }}
        >
          Delete
        </button>
      </div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-xs font-medium mb-1.5" style={{ color: "#94a3b8" }}>
        {label}
      </label>
      {children}
    </div>
  );
}

const inputStyle: React.CSSProperties = {
  background: "rgba(255,255,255,0.04)",
  borderColor: "rgba(255,255,255,0.08)",
  color: "#e2e8f0",
};
