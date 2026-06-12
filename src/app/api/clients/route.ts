// src/app/api/clients/route.ts
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const clients = await prisma.client.findMany({
    orderBy: { createdAt: "desc" },
    include: { _count: { select: { flows: true } } },
  });
  return NextResponse.json(clients);
}

export async function POST(req: Request) {
  const body = await req.json();
  const { name, industry, email, phone } = body;

  if (!name?.trim()) {
    return NextResponse.json({ error: "Name is required" }, { status: 400 });
  }

  const client = await prisma.client.create({
    data: { name: name.trim(), industry, email, phone },
    include: { _count: { select: { flows: true } } },
  });

  return NextResponse.json(client, { status: 201 });
}
