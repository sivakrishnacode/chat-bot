"use client";

import { useMemo } from "react";
import { FlowNode } from "@/lib/types";
import ChatSimulator from "@/components/simulator/ChatSimulator";

export default function DemoPageClient({
  nodes,
  flowName,
  clientName,
}: {
  nodes: FlowNode[];
  flowName: string;
  clientName: string | null;
}) {
  const startKey = useMemo(() => {
    const start = nodes.find((n) => n.isStart);
    return start?.key ?? nodes[0]?.key;
  }, [nodes]);

  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        background: "#0b1120",
        padding: 16,
      }}
    >
      <div style={{ marginBottom: 16, textAlign: "center" }}>
        <div style={{ fontSize: 13, fontWeight: 600, color: "#e2e8f0" }}>
          {flowName}
        </div>
        {clientName && (
          <div style={{ fontSize: 11, color: "#64748b", marginTop: 2 }}>
            {clientName}
          </div>
        )}
      </div>
      <ChatSimulator
        nodes={nodes}
        startKey={startKey}
        onClose={() => {}}
      />
      <div style={{ marginTop: 24, fontSize: 11, color: "#334155" }}>
        Powered by BotFlow Studio
      </div>
    </div>
  );
}
