// src/lib/types.ts

export interface FlowNode {
  id: string;
  key: string;
  title: string;
  message: string;
  replies: string[];
  targets: string[];
  posX: number;
  posY: number;
  flowId: string;
  createdAt: string;
  updatedAt: string;
}

export interface BotFlow {
  id: string;
  name: string;
  description: string | null;
  isActive: boolean;
  clientId: string;
  nodes: FlowNode[];
  createdAt: string;
  updatedAt: string;
}

export interface Client {
  id: string;
  name: string;
  industry: string | null;
  phone: string | null;
  email: string | null;
  logoUrl: string | null;
  flows: BotFlow[];
  createdAt: string;
  updatedAt: string;
}

// Lightweight version for lists (no nodes loaded)
export interface ClientSummary {
  id: string;
  name: string;
  industry: string | null;
  _count: { flows: number };
}
