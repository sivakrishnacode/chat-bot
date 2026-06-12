export interface FormField {
  label: string;
  type: "text" | "email" | "tel" | "textarea";
  required: boolean;
  placeholder: string;
}

export interface FlowNode {
  id: string;
  key: string;
  title: string;
  message: string;
  replies: string[];
  targets: string[];
  inputType?: "quick_reply" | "form";
  formFields?: FormField[];
  isStart?: boolean;
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

export interface ClientSummary {
  id: string;
  name: string;
  industry: string | null;
  _count: { flows: number };
}
