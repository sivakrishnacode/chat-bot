import { prisma } from "@/lib/prisma";
import ClientDetailClient from "./ClientDetailClient";

interface FlowSummary {
  id: string;
  name: string;
  description: string | null;
  isActive: boolean;
  _count: { nodes: number };
  createdAt: string;
}

interface ClientDetail {
  id: string;
  name: string;
  industry: string | null;
  email: string | null;
  phone: string | null;
  flows: FlowSummary[];
}

export default async function ClientDetailPage({
  params,
}: {
  params: Promise<{ clientId: string }>;
}) {
  const { clientId } = await params;

  const client = await prisma.client.findUnique({
    where: { id: clientId },
    include: {
      flows: {
        orderBy: { createdAt: "desc" },
        include: { _count: { select: { nodes: true } } },
      },
    },
  });

  if (!client) {
    return (
      <div
        className="flex items-center justify-center h-64 text-sm"
        style={{ color: "#ef4444" }}
      >
        Client not found.
      </div>
    );
  }

  return (
    <ClientDetailClient
      initialClient={JSON.parse(JSON.stringify(client)) as ClientDetail}
      clientId={clientId}
    />
  );
}
