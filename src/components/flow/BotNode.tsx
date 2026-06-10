"use client";
// src/components/flow/BotNode.tsx
// Custom node rendered on the ReactFlow canvas.

import { memo } from "react";
import { Handle, Position, NodeProps } from "@xyflow/react";

export type BotNodeData = {
  key: string;
  title: string;
  message: string;
  replies: string[];
  targets: string[];
  isSelected?: boolean;
  isStart?: boolean;
  onSelect: (key: string) => void;
};

function BotNode({ data, selected }: NodeProps) {
  const d = data as BotNodeData;
  const isStart = d.isStart;

  return (
    <div
      onClick={() => d.onSelect(d.key)}
      style={{
        width: 240,
        background: selected
          ? "rgba(37,211,102,0.07)"
          : "rgba(17,24,39,0.96)",
        border: selected
          ? "1.5px solid #25d366"
          : isStart
          ? "1.5px solid #06b6d4"
          : "1px solid rgba(255,255,255,0.08)",
        borderRadius: 12,
        fontFamily: "Inter, system-ui, sans-serif",
        color: "#e2e8f0",
        boxShadow: selected
          ? "0 0 0 3px rgba(37,211,102,0.15), 0 8px 24px rgba(0,0,0,0.5)"
          : "0 4px 16px rgba(0,0,0,0.4)",
        cursor: "pointer",
        transition: "border 0.15s, box-shadow 0.15s",
        overflow: "hidden",
      }}
    >
      {/* Target handle (input) — top (always rendered — start nodes can be targets too) */}
      <Handle
        id="target-in"
        type="target"
        position={Position.Top}
        style={{
          background: "#06b6d4",
          width: 10,
          height: 10,
          border: "2px solid #0b1120",
        }}
      />

      {/* Header */}
      <div
        style={{
          padding: "10px 12px 8px",
          borderBottom: "1px solid rgba(255,255,255,0.05)",
          display: "flex",
          alignItems: "center",
          gap: 8,
        }}
      >
        {isStart && (
          <span
            style={{
              fontSize: 10,
              background: "#06b6d4",
              color: "#000",
              fontWeight: 700,
              padding: "1px 6px",
              borderRadius: 4,
              letterSpacing: "0.05em",
            }}
          >
            START
          </span>
        )}
        <span style={{ fontSize: 12, fontWeight: 600, flex: 1 }}>
          {d.title}
        </span>
        <span
          style={{
            fontSize: 10,
            color: "#64748b",
            background: "rgba(255,255,255,0.04)",
            padding: "1px 5px",
            borderRadius: 4,
            fontFamily: "monospace",
          }}
        >
          {d.key}
        </span>
      </div>

      {/* Message preview */}
      <div
        style={{
          padding: "8px 12px",
          fontSize: 12,
          color: "#94a3b8",
          lineHeight: 1.5,
          whiteSpace: "pre-wrap",
          maxHeight: 72,
          overflow: "hidden",
          borderBottom:
            d.replies.length > 0
              ? "1px solid rgba(255,255,255,0.05)"
              : "none",
        }}
      >
        {d.message.slice(0, 140)}
        {d.message.length > 140 && "…"}
      </div>

      {/* Quick replies */}
      {d.replies.length > 0 && (
        <div
          style={{
            padding: "8px 10px 10px",
            display: "flex",
            flexWrap: "wrap",
            gap: 5,
          }}
        >
          {d.replies.map((r, i) => (
            <span
              key={i}
              style={{
                fontSize: 11,
                padding: "3px 8px",
                borderRadius: 12,
                background: "rgba(37,211,102,0.08)",
                border: "1px solid rgba(37,211,102,0.2)",
                color: "#25d366",
                whiteSpace: "nowrap",
              }}
            >
              {r}
            </span>
          ))}
        </div>
      )}

      {/* Source handle (output) — bottom */}
      <Handle
        id="source-out"
        type="source"
        position={Position.Bottom}
        style={{
          background: "#25d366",
          width: 10,
          height: 10,
          border: "2px solid #0b1120",
        }}
      />
    </div>
  );
}

export default memo(BotNode);
