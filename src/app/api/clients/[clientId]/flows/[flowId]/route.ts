// src/app/api/clients/[clientId]/flows/[flowId]/route.ts
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

type Params = { params: Promise<{ clientId: string; flowId: string }> };

export async function GET(_req: Request, { params }: Params) {
  const { flowId } = await params;
  const flow = await prisma.botFlow.findUnique({
    where: { id: flowId },
    include: { nodes: { orderBy: { createdAt: "asc" } } },
  });
  if (!flow) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(flow);
}

export async function PUT(req: Request, { params }: Params) {
  const { flowId } = await params;
  const { name, description } = await req.json();
  const flow = await prisma.botFlow.update({
    where: { id: flowId },
    data: { name, description },
    include: { nodes: { orderBy: { createdAt: "asc" } } },
  });
  return NextResponse.json(flow);
}

export async function DELETE(_req: Request, { params }: Params) {
  const { flowId } = await params;
  await prisma.botFlow.delete({ where: { id: flowId } });
  return NextResponse.json({ ok: true });
}
