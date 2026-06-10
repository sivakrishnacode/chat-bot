import { prisma } from "@/lib/prisma";
import { ClientSummary } from "@/lib/types";
import ClientsPageClient from "./ClientsPageClient";

export const dynamic = "force-dynamic";

export default async function ClientsPage() {
  const clients = await prisma.client.findMany({
    orderBy: { createdAt: "desc" },
    include: { _count: { select: { flows: true } } },
  });

  return (
    <ClientsPageClient
      initialClients={JSON.parse(JSON.stringify(clients)) as ClientSummary[]}
    />
  );
}
