import { prisma } from "@/lib/prisma";
import { BotFlow } from "@/lib/types";
import FlowBuilderClient from "./FlowBuilderClient";

export default async function Page({
  params,
}: {
  params: Promise<{ clientId: string; flowId: string }>;
}) {
  const { flowId } = await params;

  const flow = await prisma.botFlow.findUnique({
    where: { id: flowId },
    include: { nodes: { orderBy: { createdAt: "asc" } } },
  });

  if (!flow) {
    return (
      <div
        className="flex items-center justify-center h-screen text-sm"
        style={{ color: "#ef4444" }}
      >
        Flow not found.
      </div>
    );
  }

  const parsed = JSON.parse(JSON.stringify(flow));
  parsed.nodes = parsed.nodes.map((n: Record<string, unknown>) => ({
    ...n,
    formFields: typeof n.formFields === "string" ? JSON.parse(n.formFields) : n.formFields ?? null,
  }));

  return (
    <FlowBuilderClient
      key={flow.id}
      flow={parsed as BotFlow}
    />
  );
}
