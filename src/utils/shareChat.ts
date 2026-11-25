import type { ChatMessage, Conversation } from '../types/chat';

interface SharedSnapshot {
  title: string;
  createdAt: number;
  messages: Array<{
    role: 'user' | 'assistant';
    content: string;
    createdAt: number;
  }>;
}

function toBase64Utf8(str: string): string {
  const bytes = new TextEncoder().encode(str);
  let binary = '';
  for (let i = 0; i < bytes.length; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

function fromBase64Utf8(b64: string): string {
  const normalized = b64.replace(/-/g, '+').replace(/_/g, '/');
  const pad = normalized.length % 4 === 0 ? '' : '='.repeat(4 - (normalized.length % 4));
  const binary = atob(normalized + pad);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return new TextDecoder().decode(bytes);
}

export function buildShareUrl(conversation: Conversation): string {
  const snapshot: SharedSnapshot = {
    title: conversation.title || 'NEXORA Chat',
    createdAt: conversation.createdAt,
    messages: conversation.messages
      .filter((m) => !m.isError && m.content.trim().length > 0)
      .slice(-24)
      .map((m) => ({
        role: m.role,
        content: m.content.slice(0, 6000),
        createdAt: m.createdAt,
      })),
  };

  const encoded = toBase64Utf8(JSON.stringify(snapshot));
  const base = `${window.location.origin}${window.location.pathname}`;
  return `${base}#share=${encoded}`;
}

export function parseShareHash(hash: string): Conversation | null {
  try {
    if (!hash.startsWith('#share=')) return null;
    const encoded = hash.slice('#share='.length);
    if (!encoded) return null;
    const parsed = JSON.parse(fromBase64Utf8(encoded)) as Partial<SharedSnapshot>;
    if (!parsed || !Array.isArray(parsed.messages)) return null;

    const messages: ChatMessage[] = parsed.messages
      .filter((m) => m && (m.role === 'user' || m.role === 'assistant') && typeof m.content === 'string')
      .map((m, idx) => ({
        id: `shared-${idx}-${m.createdAt || Date.now()}`,
        role: m.role,
        content: m.content,
        createdAt: typeof m.createdAt === 'number' ? m.createdAt : Date.now(),
      }));

    if (messages.length === 0) return null;

    return {
      id: `shared-${Date.now()}`,
      title: typeof parsed.title === 'string' && parsed.title ? parsed.title : 'Shared conversation',
      messages,
      createdAt: typeof parsed.createdAt === 'number' ? parsed.createdAt : Date.now(),
      updatedAt: Date.now(),
      modelTier: 'fast',
    };
  } catch {
    return null;
  }
}
