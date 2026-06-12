// src/app/api/clients/[clientId]/flows/route.ts
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ clientId: string }> }
) {
  const { clientId } = await params;
  const flows = await prisma.botFlow.findMany({
    where: { clientId },
    include: { nodes: { orderBy: { createdAt: "asc" } } },
    orderBy: { createdAt: "desc" },
  });
  const parsed = flows.map((f) => ({
    ...f,
    nodes: f.nodes.map((n: Record<string, unknown>) => ({
      ...n,
      formFields: typeof n.formFields === "string" ? JSON.parse(n.formFields) : n.formFields ?? null,
    })),
  }));
  return NextResponse.json(parsed);
}

export async function POST(
  req: Request,
  { params }: { params: Promise<{ clientId: string }> }
) {
  const { clientId } = await params;
  const body = await req.json();
  const { name, description } = body;

  if (!name?.trim()) {
    return NextResponse.json({ error: "Flow name is required" }, { status: 400 });
  }

  const flow = await prisma.botFlow.create({
    data: {
      name: name.trim(),
      description,
      clientId,
      // Bootstrap with a single welcome node
      nodes: {
        create: {
          key: "welcome",
          title: "Welcome",
          message: "👋 Hi! How can I help you today?",
          replies: ["Option 1", "Option 2"],
          targets: [],
        },
      },
    },
    include: { nodes: true },
  });

  return NextResponse.json(flow, { status: 201 });
}
