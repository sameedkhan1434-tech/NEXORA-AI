import { TRANSLATIONS } from '../i18n/translations';
import type { Conversation, UILanguage } from '../types/chat';

function formatTimestamp(ts: number, uiLang: UILanguage): string {
  const locale = uiLang === 'ur' ? 'ur-PK' : uiLang === 'hi' ? 'hi-IN' : 'en-US';
  try {
    return new Date(ts).toLocaleString(locale, {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch {
    return new Date(ts).toISOString();
  }
}

function sanitizeFilename(title: string): string {
  const cleaned = title
    .trim()
    .replace(/[\\/:*?"<>|\x00-\x1F]/g, '')
    .replace(/\s+/g, '-')
    .slice(0, 60);
  return cleaned || 'nexora-chat';
}

export function formatConversationAsMarkdown(
  conversation: Conversation,
  uiLang: UILanguage
): string {
  const t = TRANSLATIONS[uiLang];
  const title = conversation.title || t.untitledChat;
  const exportedAt = formatTimestamp(Date.now(), uiLang);

  const header = [
    `# ${title}`,
    '',
    `${t.exportedOn}: ${exportedAt}`,
    '',
    '---',
    '',
  ];

  const body = conversation.messages
    .filter((m) => !m.isError)
    .map((msg) => {
      const speaker = msg.role === 'user' ? t.you : t.assistantName;
      const time = formatTimestamp(msg.createdAt, uiLang);
      const attachmentLines =
        msg.attachments && msg.attachments.length > 0
          ? msg.attachments.map((att) => `> Attachment: \`${att.name}\``).join('\n') + '\n\n'
          : '';

      return `### ${speaker} (${time})\n\n${attachmentLines}${msg.content.trim()}`;
    })
    .join('\n\n---\n\n');

  return `${header.join('\n')}${body}\n`;
}

export function formatConversationAsText(
  conversation: Conversation,
  uiLang: UILanguage
): string {
  const t = TRANSLATIONS[uiLang];
  const title = conversation.title || t.untitledChat;
  const exportedAt = formatTimestamp(Date.now(), uiLang);

  const divider = '='.repeat(60);
  const msgDivider = '-'.repeat(60);

  const header = [
    title,
    `${t.exportedOn}: ${exportedAt}`,
    divider,
    '',
  ];

  const body = conversation.messages
    .filter((m) => !m.isError)
    .map((msg) => {
      const speaker = msg.role === 'user' ? t.you : t.assistantName;
      const time = formatTimestamp(msg.createdAt, uiLang);
      const attachmentLines =
        msg.attachments && msg.attachments.length > 0
          ? msg.attachments.map((att) => `[Attachment: ${att.name}]`).join('\n') + '\n'
          : '';

      return `${speaker} (${time}):\n${attachmentLines}${msg.content.trim()}`;
    })
    .join(`\n\n${msgDivider}\n\n`);

  return `${header.join('\n')}${body}\n`;
}

export function downloadConversation(
  conversation: Conversation,
  format: 'md' | 'txt',
  uiLang: UILanguage
): void {
  const content =
    format === 'md'
      ? formatConversationAsMarkdown(conversation, uiLang)
      : formatConversationAsText(conversation, uiLang);

  const mimeType =
    format === 'md' ? 'text/markdown;charset=utf-8' : 'text/plain;charset=utf-8';
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);

  const safeBase = sanitizeFilename(conversation.title || TRANSLATIONS[uiLang].untitledChat);
  const filename = `${safeBase}.${format}`;

  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = filename;
  anchor.style.display = 'none';
  document.body.appendChild(anchor);
  anchor.click();
  document.body.removeChild(anchor);

  setTimeout(() => {
    URL.revokeObjectURL(url);
  }, 1000);
}
