import { prisma } from "@/lib/prisma";
import { FlowNode } from "@/lib/types";
import DemoPageClient from "./DemoPageClient";

export default async function Page({
  params,
}: {
  params: Promise<{ flowId: string }>;
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

  const client = await prisma.client.findUnique({
    where: { id: flow.clientId },
  });

  return (
    <DemoPageClient
      nodes={JSON.parse(JSON.stringify(flow.nodes)) as FlowNode[]}
      flowName={flow.name}
      clientName={client?.name ?? null}
    />
  );
}
