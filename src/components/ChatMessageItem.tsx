import React, { useEffect, useRef, useState } from 'react';
import {
  AlertCircle,
  Check,
  Copy,
  ExternalLink,
  FileText,
  Pencil,
  RotateCcw,
  Square,
  ThumbsDown,
  ThumbsUp,
  Volume2,
} from 'lucide-react';
import type { ChatMessage, FeedbackState, UILanguage } from '../types/chat';
import { TRANSLATIONS } from '../i18n/translations';
import { getScriptClass, getTextDir } from '../utils/bidi';
import { NexoraLogo } from './NexoraLogo';
import { MarkdownRenderer } from './MarkdownRenderer';

interface ChatMessageItemProps {
  message: ChatMessage;
  uiLang: UILanguage;
  isStreaming: boolean;
  isLastAssistant: boolean;
  onRegenerate: () => void;
  onEditUserMessage: (messageId: string, newContent: string) => void;
  onFeedback: (messageId: string, feedback: FeedbackState) => void;
}

export const ChatMessageItem: React.FC<ChatMessageItemProps> = ({
  message,
  uiLang,
  isStreaming,
  isLastAssistant,
  onRegenerate,
  onEditUserMessage,
  onFeedback,
}) => {
  const t = TRANSLATIONS[uiLang];
  const [copied, setCopied] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [draft, setDraft] = useState(message.content);
  const [audioState, setAudioState] = useState<'idle' | 'loading' | 'playing'>('idle');
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
    };
  }, []);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(message.content);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch {
      // ignore
    }
  };

  const handleToggleReadAloud = async () => {
    if (audioState === 'playing' && audioRef.current) {
      audioRef.current.pause();
      audioRef.current = null;
      setAudioState('idle');
      return;
    }
    if (audioState === 'loading') return;

    setAudioState('loading');
    try {
      const response = await fetch('/api/tts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: message.content }),
      });
      const data = (await response.json()) as { audioBase64?: string; mimeType?: string };
      if (!response.ok || !data.audioBase64) {
        setAudioState('idle');
        return;
      }
      const audio = new Audio(`data:${data.mimeType || 'audio/wav'};base64,${data.audioBase64}`);
      audioRef.current = audio;
      audio.onended = () => {
        setAudioState('idle');
        audioRef.current = null;
      };
      audio.onerror = () => {
        setAudioState('idle');
        audioRef.current = null;
      };
      await audio.play();
      setAudioState('playing');
    } catch {
      setAudioState('idle');
    }
  };

  const handleSaveEdit = () => {
    const trimmed = draft.trim();
    if (!trimmed) return;
    setIsEditing(false);
    if (trimmed !== message.content) {
      onEditUserMessage(message.id, trimmed);
    }
  };

  if (message.role === 'user') {
    const msgDir = getTextDir(message.content);
    const scriptCls = getScriptClass(message.content);

    return (
      <div className="group py-3 px-4 w-full max-w-3xl mx-auto flex flex-col items-end">
        {message.attachments && message.attachments.length > 0 && (
          <div className="flex flex-wrap justify-end gap-2 mb-2 max-w-[85%]">
            {message.attachments.map((att) =>
              att.kind === 'image' && att.previewUrl ? (
                <img
                  key={att.id}
                  src={att.previewUrl}
                  alt={att.name}
                  referrerPolicy="no-referrer"
                  className="max-h-48 max-w-[240px] rounded-xl object-cover border border-zinc-200 dark:border-zinc-800"
                />
              ) : att.kind === 'pdf' ? (
                <div
                  key={att.id}
                  className="inline-flex items-center gap-2 px-3 py-2 rounded-xl border border-red-200/80 dark:border-red-900/50 bg-red-50/70 dark:bg-red-950/30 text-xs text-zinc-800 dark:text-zinc-200"
                >
                  <FileText className="w-4 h-4 shrink-0 text-red-600 dark:text-red-400" />
                  <span className="text-[10px] font-bold uppercase text-red-600 dark:text-red-400">
                    PDF
                  </span>
                  <span className="truncate max-w-[180px] font-medium">{att.name}</span>
                  <span className="text-[11px] text-zinc-500 dark:text-zinc-400 shrink-0">
                    {att.size < 1024 * 1024
                      ? `${Math.max(1, Math.round(att.size / 1024))} KB`
                      : `${(att.size / (1024 * 1024)).toFixed(1)} MB`}
                  </span>
                </div>
              ) : (
                <div
                  key={att.id}
                  className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900 text-xs text-zinc-700 dark:text-zinc-300"
                >
                  <FileText className="w-3.5 h-3.5 shrink-0 text-zinc-500" />
                  <span className="truncate max-w-[180px]">{att.name}</span>
                </div>
              )
            )}
          </div>
        )}

        {isEditing ? (
          <div className="w-full max-w-xl rounded-2xl border border-zinc-300 dark:border-zinc-700 bg-zinc-50 dark:bg-[#1E2025] p-3">
            <textarea
              dir="auto"
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              rows={3}
              className={`w-full resize-none bg-transparent text-[15px] text-zinc-900 dark:text-zinc-100 focus:outline-none ${getScriptClass(draft)}`}
              autoFocus
            />
            <div className="flex items-center justify-end gap-2 mt-2">
              <button
                type="button"
                onClick={() => {
                  setDraft(message.content);
                  setIsEditing(false);
                }}
                className="px-3 py-1.5 text-xs font-medium rounded-lg text-zinc-600 dark:text-zinc-300 hover:bg-zinc-200/70 dark:hover:bg-zinc-800 transition-colors cursor-pointer whitespace-nowrap shrink-0"
              >
                {t.cancel}
              </button>
              <button
                type="button"
                onClick={handleSaveEdit}
                disabled={!draft.trim()}
                className="px-3.5 py-1.5 text-xs font-medium rounded-lg bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 hover:opacity-90 disabled:opacity-40 transition-opacity cursor-pointer whitespace-nowrap shrink-0"
              >
                {t.saveAndSend}
              </button>
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-end max-w-[88%] sm:max-w-[78%]">
            {message.content.trim().length > 0 && (
              <div
                dir={msgDir}
                className={`px-4 py-3 rounded-2xl bg-zinc-100 dark:bg-[#22242A] text-zinc-900 dark:text-zinc-100 text-[15px] leading-relaxed whitespace-pre-wrap break-words ${scriptCls}`}
              >
                {message.content}
              </div>
            )}
            <div className="flex items-center gap-1 mt-1 opacity-0 group-hover:opacity-100 focus-within:opacity-100 transition-opacity duration-150">
              <button
                type="button"
                onClick={() => {
                  setDraft(message.content);
                  setIsEditing(true);
                }}
                title={t.edit}
                aria-label={t.edit}
                className="inline-flex items-center gap-1 px-2 py-1 rounded-md text-xs text-zinc-500 dark:text-zinc-400 hover:text-zinc-800 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors cursor-pointer"
              >
                <Pencil className="w-3.5 h-3.5" />
                <span>{t.edit}</span>
              </button>
              <button
                type="button"
                onClick={handleCopy}
                title={t.copy}
                aria-label={t.copy}
                className="inline-flex items-center gap-1 px-2 py-1 rounded-md text-xs text-zinc-500 dark:text-zinc-400 hover:text-zinc-800 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors cursor-pointer"
              >
                {copied ? (
                  <Check className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                ) : (
                  <Copy className="w-3.5 h-3.5" />
                )}
                <span>{copied ? t.copied : t.copy}</span>
              </button>
            </div>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="group py-4 px-4 w-full max-w-3xl mx-auto">
      <div className="flex items-start gap-3.5">
        <div className="shrink-0 mt-1">
          <NexoraLogo size={24} />
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2 mb-1.5">
            <span className="text-xs font-semibold text-zinc-700 dark:text-zinc-300 tracking-tight">
              {t.assistantName}
            </span>
          </div>

          {message.isError ? (
            <div className="rounded-xl border border-red-200 dark:border-red-900/60 bg-red-50/70 dark:bg-red-950/30 p-3.5 text-sm text-red-800 dark:text-red-200 flex items-start justify-between gap-3">
              <div className="flex items-start gap-2.5">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-red-600 dark:text-red-400" />
                <span>{message.content}</span>
              </div>
              <button
                type="button"
                onClick={onRegenerate}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-white dark:bg-zinc-900 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-300 hover:bg-red-50 dark:hover:bg-red-900/40 transition-colors cursor-pointer shrink-0 whitespace-nowrap"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>{t.retry}</span>
              </button>
            </div>
          ) : isStreaming && message.content.length === 0 ? (
            <div className="inline-flex items-center gap-2 py-1 text-sm text-zinc-500 dark:text-zinc-400">
              <span className="inline-flex items-center gap-1" aria-hidden="true">
                <span className="w-1.5 h-1.5 rounded-full bg-zinc-400 dark:bg-zinc-500 animate-bounce [animation-delay:-0.2s]" />
                <span className="w-1.5 h-1.5 rounded-full bg-zinc-400 dark:bg-zinc-500 animate-bounce [animation-delay:-0.1s]" />
                <span className="w-1.5 h-1.5 rounded-full bg-zinc-400 dark:bg-zinc-500 animate-bounce" />
              </span>
              <span className={uiLang === 'ur' ? 'font-urdu' : uiLang === 'hi' ? 'font-hindi' : ''}>
                {t.thinking}
              </span>
            </div>
          ) : (
            <MarkdownRenderer
              content={message.content}
              isStreaming={isStreaming}
              copyLabel={t.copy}
              copiedLabel={t.copied}
              previewLabel={t.preview}
              codeLabel={t.code}
            />
          )}

          {/* Web Search Grounding Sources */}
          {!isStreaming && message.sources && message.sources.length > 0 && (
            <div className="mt-3 pt-2.5 border-t border-zinc-200/70 dark:border-zinc-800/80">
              <div className="text-[11px] font-medium text-zinc-500 dark:text-zinc-400 mb-1.5">
                {t.sources}
              </div>
              <div className="flex flex-wrap gap-2">
                {message.sources.slice(0, 6).map((src) => (
                  <a
                    key={src.uri}
                    href={src.uri}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900/60 text-xs text-zinc-700 dark:text-zinc-300 hover:border-zinc-300 dark:hover:border-zinc-700 hover:text-blue-600 dark:hover:text-blue-400 transition-colors max-w-[230px]"
                  >
                    <ExternalLink className="w-3 h-3 shrink-0" />
                    <span className="truncate">{src.title}</span>
                  </a>
                ))}
              </div>
            </div>
          )}

          {/* ChatGPT-style Action Row: Copy, Good/Bad response, Read aloud, Regenerate */}
          {!isStreaming && !message.isError && message.content.length > 0 && (
            <div className="flex items-center gap-1 mt-2.5 opacity-90 sm:opacity-0 sm:group-hover:opacity-100 focus-within:opacity-100 transition-opacity duration-150">
              <button
                type="button"
                onClick={handleCopy}
                title={t.copy}
                aria-label={t.copy}
                className="inline-flex items-center gap-1 px-2 py-1.5 rounded-md text-xs text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors cursor-pointer"
              >
                {copied ? (
                  <Check className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                ) : (
                  <Copy className="w-3.5 h-3.5" />
                )}
              </button>

              <button
                type="button"
                onClick={() => void handleToggleReadAloud()}
                title={audioState === 'playing' ? t.stopReading : t.readAloud}
                aria-label={audioState === 'playing' ? t.stopReading : t.readAloud}
                className={`inline-flex items-center gap-1 px-2 py-1.5 rounded-md text-xs transition-colors cursor-pointer ${
                  audioState === 'playing'
                    ? 'text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/40'
                    : 'text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 hover:bg-zinc-100 dark:hover:bg-zinc-800'
                }`}
              >
                {audioState === 'playing' ? (
                  <Square className="w-3.5 h-3.5 fill-current" />
                ) : (
                  <Volume2 className={`w-3.5 h-3.5 ${audioState === 'loading' ? 'animate-pulse' : ''}`} />
                )}
              </button>

              <button
                type="button"
                onClick={() => onFeedback(message.id, message.feedback === 'up' ? null : 'up')}
                title={t.goodResponse}
                aria-label={t.goodResponse}
                className={`inline-flex items-center px-2 py-1.5 rounded-md text-xs transition-colors cursor-pointer ${
                  message.feedback === 'up'
                    ? 'text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40'
                    : 'text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 hover:bg-zinc-100 dark:hover:bg-zinc-800'
                }`}
              >
                <ThumbsUp className="w-3.5 h-3.5" />
              </button>

              <button
                type="button"
                onClick={() => onFeedback(message.id, message.feedback === 'down' ? null : 'down')}
                title={t.badResponse}
                aria-label={t.badResponse}
                className={`inline-flex items-center px-2 py-1.5 rounded-md text-xs transition-colors cursor-pointer ${
                  message.feedback === 'down'
                    ? 'text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-950/40'
                    : 'text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 hover:bg-zinc-100 dark:hover:bg-zinc-800'
                }`}
              >
                <ThumbsDown className="w-3.5 h-3.5" />
              </button>

              {isLastAssistant && (
                <button
                  type="button"
                  onClick={onRegenerate}
                  title={t.regenerate}
                  aria-label={t.regenerate}
                  className="inline-flex items-center gap-1 px-2 py-1.5 rounded-md text-xs text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors cursor-pointer"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
