// src/app/api/clients/[clientId]/flows/[flowId]/nodes/route.ts
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

type Params = { params: Promise<{ clientId: string; flowId: string }> };

export async function GET(_req: Request, { params }: Params) {
  const { flowId } = await params;
  const nodes = await prisma.flowNode.findMany({
    where: { flowId },
    orderBy: { createdAt: "asc" },
  });
  return NextResponse.json(nodes);
}

export async function POST(req: Request, { params }: Params) {
  const { flowId } = await params;
  const body = await req.json();
  const { key, title, message, replies, targets, isStart } = body;

  if (!key?.trim()) {
    return NextResponse.json({ error: "Node key is required" }, { status: 400 });
  }

  // Check uniqueness within flow
  const existing = await prisma.flowNode.findUnique({
    where: { flowId_key: { flowId, key } },
  });
  if (existing) {
    return NextResponse.json({ error: `Key "${key}" already exists in this flow` }, { status: 409 });
  }

  const node = await prisma.flowNode.create({
    data: {
      flowId,
      key: key.trim(),
      title: title?.trim() || key,
      message: message || "",
      replies: replies || [],
      targets: targets || [],
      isStart: isStart ?? false,
    },
  });

  return NextResponse.json(node, { status: 201 });
}

/**
 * PUT /api/clients/:clientId/flows/:flowId/nodes
 * Bulk-replace all nodes (used when saving the flow builder state).
 * Body: { nodes: Array<{ key, title, message, replies, targets }> }
 */
export async function PUT(req: Request, { params }: Params) {
  const { flowId } = await params;
  const { nodes } = await req.json();

  if (!Array.isArray(nodes)) {
    return NextResponse.json({ error: "nodes must be an array" }, { status: 400 });
  }

  // Validate unique keys in payload
  const keys = nodes.map((n: { key: string }) => n.key);
  if (new Set(keys).size !== keys.length) {
    return NextResponse.json({ error: "Duplicate node keys in payload" }, { status: 400 });
  }

  // Transaction: delete all existing nodes for this flow then recreate
  const result = await prisma.$transaction([
    prisma.flowNode.deleteMany({ where: { flowId } }),
    prisma.flowNode.createMany({
      data: nodes.map((n: {
        key: string;
        title: string;
        message: string;
        replies: string[];
        targets: string[];
        isStart?: boolean;
        posX?: number;
        posY?: number;
      }) => ({
        flowId,
        key: n.key,
        title: n.title || n.key,
        message: n.message || "",
        replies: n.replies || [],
        targets: n.targets || [],
        isStart: n.isStart ?? false,
        posX: n.posX ?? 0,
        posY: n.posY ?? 0,
      })),
    }),
  ]);

  return NextResponse.json({ deleted: result[0].count, created: result[1].count });
}
