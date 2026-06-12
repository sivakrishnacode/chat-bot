"use client";

import { useState, useRef, useEffect } from "react";
import { FlowNode, FormField } from "@/lib/types";

interface Props {
  nodes: FlowNode[];
  startKey?: string;
  onClose: () => void;
}

interface ChatMessage {
  id: string;
  role: "bot" | "user";
  text: string;
}

export default function ChatSimulator({ nodes, startKey, onClose }: Props) {
  const nodeMap = Object.fromEntries(nodes.map((n) => [n.key, n]));
  const firstKey = startKey ?? nodes[0]?.key;

  const [currentKey, setCurrentKey] = useState<string | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [typing, setTyping] = useState(false);
  const [formValues, setFormValues] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (firstKey) startAt(firstKey);
  }, [firstKey]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, typing]);

  function startAt(key: string) {
    const node = nodeMap[key];
    if (!node) return;
    setMessages([]);
    setCurrentKey(key);
    setFormValues({});
    appendBot(node.message, []);
  }

  function appendBot(text: string, prev: ChatMessage[]) {
    setTyping(true);
    setTimeout(() => {
      setTyping(false);
      setMessages([
        ...prev,
        { id: Math.random().toString(36), role: "bot", text },
      ]);
    }, 600 + Math.min(text.length * 4, 800));
  }

  function handleReply(reply: string, targetKey: string | undefined) {
    const userMsg: ChatMessage = {
      id: Math.random().toString(36),
      role: "user",
      text: reply,
    };
    const newMessages = [...messages, userMsg];
    setMessages(newMessages);

    if (!targetKey) return;
    navigateTo(targetKey, newMessages);
  }

  async function handleFormSubmit() {
    if (!currentNode || submitting) return;
    const fields = currentNode.formFields ?? [];
    // Validate required fields
    for (const f of fields) {
      if (f.required && !formValues[f.label]?.trim()) {
        return;
      }
    }
    setSubmitting(true);

    const formatted = fields
      .map((f) => `${f.label}: ${formValues[f.label] ?? ""}`)
      .join("\n");

    const userMsg: ChatMessage = {
      id: Math.random().toString(36),
      role: "user",
      text: formatted,
    };
    const newMessages = [...messages, userMsg];
    setMessages(newMessages);
    setFormValues({});

    const targetKey = currentNode?.targets[0];
    if (targetKey) {
      navigateTo(targetKey, newMessages);
    }
    setSubmitting(false);
  }

  function navigateTo(targetKey: string, currentMessages: ChatMessage[]) {
    const next = nodeMap[targetKey];
    if (!next) {
      setTimeout(() => {
        setMessages((m) => [
          ...m,
          { id: Math.random().toString(36), role: "bot", text: `⚠️ Node "${targetKey}" not found.` },
        ]);
      }, 400);
      return;
    }
    setCurrentKey(targetKey);
    appendBot(next.message, currentMessages);
  }

  function updateFormValue(label: string, value: string) {
    setFormValues((prev) => ({ ...prev, [label]: value }));
  }

  function isFormValid(fields: FormField[]) {
    for (const f of fields) {
      if (f.required && !formValues[f.label]?.trim()) return false;
    }
    return true;
  }

  const currentNode = currentKey ? nodeMap[currentKey] : null;
  const isForm = currentNode?.inputType === "form";
  const formFields: FormField[] = isForm ? (currentNode.formFields ?? []) : [];
  const hasQuickReplies = !typing && currentNode && currentNode.replies.length > 0 && !isForm;
  const showForm = !typing && currentNode && isForm;

  return (
    <div
      className="flex flex-col"
      style={{
        width: "min(360px, calc(100vw - 32px))",
        height: "min(620px, calc(100vh - 64px))",
        background: "#0b1120",
        borderRadius: 20,
        overflow: "hidden",
        border: "1px solid rgba(255,255,255,0.08)",
        boxShadow: "0 24px 60px rgba(0,0,0,0.7)",
        fontFamily: "Inter, system-ui, sans-serif",
      }}
    >
      {/* Phone header */}
      <div
        style={{
          background: "#111827",
          padding: "12px 16px",
          display: "flex",
          alignItems: "center",
          gap: 10,
          borderBottom: "1px solid rgba(255,255,255,0.06)",
        }}
      >
        <div
          style={{
            width: 38,
            height: 38,
            borderRadius: "50%",
            background: "#25d366",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: 18,
            flexShrink: 0,
          }}
        >
          🤖
        </div>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 13, fontWeight: 600, color: "#e2e8f0" }}>
            Bot Demo
          </div>
          <div style={{ fontSize: 11, color: "#25d366" }}>
            {typing ? "typing…" : "online"}
          </div>
        </div>
        <button
          onClick={onClose}
          style={{ color: "#64748b", fontSize: 20, lineHeight: 1 }}
        >
          ×
        </button>
      </div>

      {/* Chat area */}
      <div
        style={{
          flex: 1,
          overflowY: "auto",
          padding: "12px 12px 8px",
          display: "flex",
          flexDirection: "column",
          gap: 6,
          background: "rgba(0,0,0,0.2)",
        }}
      >
        {messages.map((m) => (
          <div
            key={m.id}
            style={{
              display: "flex",
              justifyContent: m.role === "user" ? "flex-end" : "flex-start",
            }}
          >
            <div
              style={{
                maxWidth: "78%",
                padding: "8px 12px",
                borderRadius:
                  m.role === "user"
                    ? "14px 14px 4px 14px"
                    : "14px 14px 14px 4px",
                background:
                  m.role === "user"
                    ? "#25d366"
                    : "rgba(255,255,255,0.07)",
                color: m.role === "user" ? "#000" : "#e2e8f0",
                fontSize: 13,
                lineHeight: 1.5,
                whiteSpace: "pre-wrap",
                wordBreak: "break-word",
              }}
            >
              {m.text}
            </div>
          </div>
        ))}

        {typing && (
          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <div
              style={{
                padding: "8px 14px",
                borderRadius: "14px 14px 14px 4px",
                background: "rgba(255,255,255,0.07)",
              }}
            >
              <TypingDots />
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      {/* Quick reply chips */}
      {hasQuickReplies && (
        <div
          style={{
            padding: "8px 10px 10px",
            background: "#111827",
            borderTop: "1px solid rgba(255,255,255,0.05)",
            display: "flex",
            flexWrap: "wrap",
            gap: 6,
            minHeight: 52,
          }}
        >
          {currentNode.replies.map((r, i) => (
            <button
              key={i}
              onClick={() =>
                handleReply(r, currentNode.targets[i] || undefined)
              }
              style={{
                fontSize: 12,
                padding: "6px 12px",
                borderRadius: 16,
                border: "1px solid rgba(37,211,102,0.35)",
                background: "rgba(37,211,102,0.07)",
                color: "#25d366",
                cursor: "pointer",
                transition: "background 0.12s",
              }}
              onMouseEnter={(e) =>
                ((e.target as HTMLElement).style.background =
                  "rgba(37,211,102,0.15)")
              }
              onMouseLeave={(e) =>
                ((e.target as HTMLElement).style.background =
                  "rgba(37,211,102,0.07)")
              }
            >
              {r}
            </button>
          ))}
        </div>
      )}

      {/* Multi-field form */}
      {showForm && formFields.length > 0 && (
        <div
          style={{
            padding: "10px 12px 10px",
            background: "#111827",
            borderTop: "1px solid rgba(255,255,255,0.05)",
            maxHeight: 260,
            overflowY: "auto",
          }}
        >
          <div className="flex flex-col gap-2">
            {formFields.map((field, i) => (
              <div key={i}>
                <label
                  style={{
                    display: "block",
                    fontSize: 11,
                    color: "#94a3b8",
                    marginBottom: 3,
                    fontWeight: 500,
                  }}
                >
                  {field.label}
                  {field.required && (
                    <span style={{ color: "#ef4444", marginLeft: 2 }}>*</span>
                  )}
                </label>
                {field.type === "textarea" ? (
                  <textarea
                    value={formValues[field.label] ?? ""}
                    onChange={(e) => updateFormValue(field.label, e.target.value)}
                    placeholder={field.placeholder || `Enter ${field.label.toLowerCase()}`}
                    rows={2}
                    style={{
                      width: "100%",
                      background: "rgba(255,255,255,0.06)",
                      border: field.required && !formValues[field.label]?.trim()
                        ? "1px solid rgba(239,68,68,0.3)"
                        : "1px solid rgba(255,255,255,0.08)",
                      borderRadius: 10,
                      padding: "8px 10px",
                      color: "#e2e8f0",
                      fontSize: 12,
                      outline: "none",
                      resize: "none",
                      fontFamily: "inherit",
                      lineHeight: 1.4,
                    }}
                  />
                ) : (
                  <input
                    type={field.type}
                    value={formValues[field.label] ?? ""}
                    onChange={(e) => updateFormValue(field.label, e.target.value)}
                    placeholder={field.placeholder || `Enter ${field.label.toLowerCase()}`}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && i === formFields.length - 1) {
                        e.preventDefault();
                        handleFormSubmit();
                      }
                    }}
                    style={{
                      width: "100%",
                      background: "rgba(255,255,255,0.06)",
                      border: field.required && !formValues[field.label]?.trim()
                        ? "1px solid rgba(239,68,68,0.3)"
                        : "1px solid rgba(255,255,255,0.08)",
                      borderRadius: 10,
                      padding: "8px 10px",
                      color: "#e2e8f0",
                      fontSize: 12,
                      outline: "none",
                      fontFamily: "inherit",
                    }}
                  />
                )}
              </div>
            ))}

            <button
              onClick={handleFormSubmit}
              disabled={!isFormValid(formFields) || submitting}
              style={{
                width: "100%",
                padding: "9px 0",
                borderRadius: 10,
                background:
                  isFormValid(formFields) && !submitting
                    ? "#25d366"
                    : "rgba(255,255,255,0.08)",
                border: "none",
                color:
                  isFormValid(formFields) && !submitting ? "#000" : "#64748b",
                fontSize: 12,
                fontWeight: 600,
                cursor:
                  isFormValid(formFields) && !submitting
                    ? "pointer"
                    : "default",
                marginTop: 2,
              }}
            >
              {submitting ? "Sending…" : "Submit"}
            </button>
          </div>
        </div>
      )}

      {/* End of flow / Restart bar */}
      {!hasQuickReplies && !showForm && (
        <div
          style={{
            display: "flex",
            justifyContent: "center",
            padding: "6px 12px 10px",
            background: "#111827",
            gap: 10,
          }}
        >
          {!typing && (
            <span style={{ fontSize: 12, color: "#475569", padding: "6px 0" }}>
              End of flow
            </span>
          )}
        </div>
      )}

      {/* Restart bar */}
      <div
        style={{
          display: "flex",
          justifyContent: "center",
          padding: "6px 12px 10px",
          background: "#111827",
          gap: 10,
          borderTop: hasQuickReplies || showForm ? "1px solid rgba(255,255,255,0.05)" : "none",
        }}
      >
        <button
          onClick={() => firstKey && startAt(firstKey)}
          style={{
            fontSize: 11,
            color: "#64748b",
            background: "transparent",
            border: "none",
            cursor: "pointer",
          }}
        >
          ↺ Restart
        </button>
        {currentKey && (
          <span style={{ fontSize: 11, color: "#334155" }}>
            node: <span style={{ color: "#475569", fontFamily: "monospace" }}>{currentKey}</span>
          </span>
        )}
      </div>
    </div>
  );
}

function TypingDots() {
  return (
    <div style={{ display: "flex", gap: 4, alignItems: "center" }}>
      {[0, 1, 2].map((i) => (
        <span
          key={i}
          style={{
            width: 6,
            height: 6,
            borderRadius: "50%",
            background: "#64748b",
            display: "inline-block",
            animation: `bounce 1.2s ${i * 0.2}s infinite`,
          }}
        />
      ))}
      <style>{`@keyframes bounce{0%,80%,100%{transform:translateY(0)}40%{transform:translateY(-5px)}}`}</style>
    </div>
  );
}
