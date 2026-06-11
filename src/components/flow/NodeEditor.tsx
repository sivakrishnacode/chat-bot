"use client";

import { useEffect, useRef, useState } from "react";
import { FlowNode } from "@/lib/types";

interface Props {
  node: FlowNode | null;
  allNodes: FlowNode[];
  onSave: (updated: FlowNode) => void;
  onDelete: (key: string) => void;
  onDuplicate: (key: string) => void;
  onUpdateId: (oldKey: string, newKey: string) => void;
  onClose: () => void;
}

export default function NodeEditor({ node, allNodes, onSave, onDelete, onDuplicate, onUpdateId, onClose }: Props) {
  const [title, setTitle] = useState("");
  const [nodeKey, setNodeKey] = useState("");
  const [message, setMessage] = useState("");
  const [replies, setReplies] = useState<string[]>([]);
  const [targets, setTargets] = useState<string[]>([]);
  const [keyError, setKeyError] = useState("");
  const [dragIndex, setDragIndex] = useState<number | null>(null);
  const initialized = useRef(false);
  const saveTimeout = useRef<ReturnType<typeof setTimeout>>();

  useEffect(() => {
    if (!node) return;
    if (!initialized.current) {
      initialized.current = true;
      setTitle(node.title);
      setNodeKey(node.key);
      setMessage(node.message);
      setReplies([...node.replies]);
      setTargets([...node.targets]);
      setKeyError("");
    }
  }, [node?.key]);

  function triggerAutoSave() {
    if (saveTimeout.current) clearTimeout(saveTimeout.current);
    saveTimeout.current = setTimeout(() => {
      if (!node || keyError || !nodeKey.trim()) return;
      const len = Math.max(replies.length, targets.length);
      const safeReplies = Array.from({ length: len }, (_, i) => replies[i] ?? "");
      const safeTargets = Array.from({ length: len }, (_, i) => targets[i] ?? "");
      const filteredReplies = safeReplies.filter((r) => r.trim());
      const filteredTargets = safeTargets.slice(0, filteredReplies.length);
      onSave({
        ...node,
        key: nodeKey.trim(),
        title,
        message,
        replies: filteredReplies,
        targets: filteredTargets,
      });
    }, 500);
  }

  useEffect(() => { triggerAutoSave(); }, [title, message, nodeKey, replies, targets]);
  useEffect(() => () => { if (saveTimeout.current) clearTimeout(saveTimeout.current); }, []);

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

  function handleKeyChange(value: string) {
    setNodeKey(value);
    if (!value.trim()) {
      setKeyError("Key is required");
    } else if (value !== node!.key && allNodes.find((n) => n.key === value.trim())) {
      setKeyError(`Key "${value}" already exists`);
    } else {
      setKeyError("");
    }
  }

  function handleSave() {
    if (!node) return;
    if (!nodeKey.trim()) return;
    if (keyError) return;

    const len = Math.max(replies.length, targets.length);
    const safeReplies = Array.from({ length: len }, (_, i) => replies[i] ?? "");
    const safeTargets = Array.from({ length: len }, (_, i) => targets[i] ?? "");

    const filteredReplies = safeReplies.filter((r) => r.trim());
    const filteredTargets = safeTargets.slice(0, filteredReplies.length);

    if (nodeKey.trim() !== node.key) {
      onUpdateId(node.key, nodeKey.trim());
    }

    onSave({
      ...node,
      key: nodeKey.trim(),
      title,
      message,
      replies: filteredReplies,
      targets: filteredTargets,
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

  function moveItem(from: number, to: number) {
    if (from === to) return;
    setReplies((prev) => {
      const arr = [...prev];
      const [moved] = arr.splice(from, 1);
      arr.splice(to, 0, moved);
      return arr;
    });
    setTargets((prev) => {
      const arr = [...prev];
      const [moved] = arr.splice(from, 1);
      arr.splice(to, 0, moved);
      return arr;
    });
  }

  const keyOptions = allNodes.filter((n) => n.key !== node.key).map((n) => n.key);

  return (
    <div className="flex flex-col h-full overflow-hidden">
      <div
        className="flex items-center justify-between px-4 py-3 border-b shrink-0"
        style={{ borderColor: "rgba(255,255,255,0.06)" }}
      >
        <div>
          <div className="text-sm font-semibold">Edit Node</div>
        </div>
        <button onClick={onClose} style={{ color: "#64748b", fontSize: 18 }}>
          ×
        </button>
      </div>

      <div className="flex-1 overflow-y-auto px-4 py-4 flex flex-col gap-4">
        <Field label="Node ID">
          <input
            value={nodeKey}
            onChange={(e) => handleKeyChange(e.target.value)}
            className="w-full px-3 py-2 rounded-lg border text-sm outline-none font-mono"
            style={{
              ...inputStyle,
              borderColor: keyError ? "#ef4444" : "rgba(255,255,255,0.08)",
            }}
            placeholder="unique_node_key"
          />
          {keyError && (
            <div className="text-xs mt-1" style={{ color: "#ef4444" }}>{keyError}</div>
          )}
        </Field>

        <Field label="Title">
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full px-3 py-2 rounded-lg border text-sm outline-none"
            style={inputStyle}
          />
        </Field>

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

        <div>
          <div className="flex items-center justify-between mb-2">
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
              <div
                key={i}
                draggable
                onDragStart={() => setDragIndex(i)}
                onDragOver={(e) => {
                  e.preventDefault();
                  if (dragIndex !== null && dragIndex !== i) moveItem(dragIndex, i);
                  setDragIndex(i);
                }}
                onDragEnd={() => setDragIndex(null)}
                style={{
                  opacity: dragIndex === i ? 0.4 : 1,
                  transition: "opacity 0.15s",
                  background: "rgba(255,255,255,0.03)",
                  border: "1px solid rgba(255,255,255,0.05)",
                  borderRadius: 8,
                  padding: 10,
                  display: "flex",
                  flexDirection: "column",
                  gap: 6,
                  cursor: "grab",
                }}
              >
                <div className="flex items-center gap-2">
                  <span style={{ color: "#64748b", fontSize: 14, cursor: "grab", userSelect: "none" }}>⠿</span>
                  <span className="text-xs" style={{ color: "#64748b", minWidth: 12 }}>{i + 1}.</span>
                  <input
                    value={r}
                    onChange={(e) => setReplies((arr) => arr.map((x, idx) => idx === i ? e.target.value : x))}
                    placeholder="Reply label"
                    className="flex-1 px-2 py-1.5 rounded text-xs border outline-none"
                    style={{ ...inputStyle, minWidth: 0 }}
                  />
                  <button
                    onClick={() => removeReply(i)}
                    className="text-xs px-1.5 py-1 rounded flex-shrink-0"
                    style={{ color: "#ef4444", background: "rgba(239,68,68,0.08)" }}
                  >
                    ✕
                  </button>
                </div>
                <div className="flex items-center gap-2" style={{ paddingLeft: 24 }}>
                  <span className="text-xs" style={{ color: "#475569" }}>→</span>
                  <select
                    value={targets[i] ?? ""}
                    onChange={(e) => setTargets((arr) => arr.map((x, idx) => idx === i ? e.target.value : x))}
                    className="flex-1 px-2 py-1.5 rounded text-xs border outline-none"
                    style={{ background: "#1a2133", color: "#e2e8f0", borderColor: "rgba(255,255,255,0.15)", cursor: "pointer" }}
                  >
                    <option value="" style={{ background: "#1a2133", color: "#94a3b8" }}>— no target —</option>
                    {keyOptions.map((k) => (
                      <option key={k} value={k} style={{ background: "#1a2133", color: "#e2e8f0" }}>{k}</option>
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

      <div
        className="flex items-center gap-2 px-4 py-3 border-t shrink-0"
        style={{ borderColor: "rgba(255,255,255,0.06)" }}
      >
        <button
          onClick={handleSave}
          disabled={!!keyError || !nodeKey.trim()}
          className="flex-1 py-2 rounded-lg text-sm font-semibold disabled:opacity-40"
          style={{ background: "#25d366", color: "#000" }}
        >
          Save Node
        </button>
        <button
          onClick={() => onDuplicate(node.key)}
          className="px-3 py-2 rounded-lg text-sm"
          style={{ background: "rgba(6,182,212,0.1)", color: "#06b6d4", border: "1px solid rgba(6,182,212,0.2)" }}
        >
          ⧉ Duplicate
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
