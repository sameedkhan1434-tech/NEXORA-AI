import React, { useEffect, useState } from 'react';
import { Check, Copy, FileCode2, FileText, Link2, Share2, X } from 'lucide-react';
import { TRANSLATIONS } from '../i18n/translations';
import type { Conversation, UILanguage } from '../types/chat';
import { downloadConversation, formatConversationAsText } from '../utils/exportChat';
import { buildShareUrl } from '../utils/shareChat';

interface ShareModalProps {
  isOpen: boolean;
  conversation: Conversation | null;
  uiLang: UILanguage;
  onClose: () => void;
}

export const ShareModal: React.FC<ShareModalProps> = ({
  isOpen,
  conversation,
  uiLang,
  onClose,
}) => {
  const t = TRANSLATIONS[uiLang];
  const [copiedLink, setCopiedLink] = useState(false);
  const [copiedTranscript, setCopiedTranscript] = useState(false);

  useEffect(() => {
    if (!isOpen) return;
    setCopiedLink(false);
    setCopiedTranscript(false);
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [isOpen, onClose]);

  if (!isOpen || !conversation) return null;

  const shareUrl = buildShareUrl(conversation);
  const canNativeShare = typeof navigator !== 'undefined' && typeof navigator.share === 'function';

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2000);
    } catch {
      // ignore
    }
  };

  const handleCopyTranscript = async () => {
    try {
      const text = formatConversationAsText(conversation, uiLang);
      await navigator.clipboard.writeText(text);
      setCopiedTranscript(true);
      setTimeout(() => setCopiedTranscript(false), 2000);
    } catch {
      // ignore
    }
  };

  const handleNativeShare = async () => {
    if (!canNativeShare) return;
    try {
      await navigator.share({
        title: conversation.title || t.brandName,
        text: formatConversationAsText(conversation, uiLang).slice(0, 600),
        url: shareUrl,
      });
    } catch {
      // user cancelled or unsupported
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-[1px]"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="share-modal-title"
    >
      <div
        className="w-full max-w-md rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-[#1A1C21] shadow-2xl overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-5 py-4 border-b border-zinc-200 dark:border-zinc-800">
          <h2
            id="share-modal-title"
            className="text-base font-semibold text-zinc-900 dark:text-zinc-100"
          >
            {t.shareTitle}
          </h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close share dialog"
            className="h-8 w-8 inline-flex items-center justify-center rounded-lg text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-5 space-y-3">
          <p className="text-xs text-zinc-500 dark:text-zinc-400 leading-relaxed">
            {t.shareDescription}
          </p>

          {/* Shareable Link Preview + Copy */}
          <div className="flex items-center gap-2 p-1.5 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-900/60">
            <input
              type="text"
              readOnly
              value={shareUrl}
              dir="ltr"
              className="flex-1 min-w-0 bg-transparent px-2 text-xs text-zinc-600 dark:text-zinc-300 focus:outline-none truncate"
              onClick={(e) => (e.target as HTMLInputElement).select()}
            />
            <button
              type="button"
              onClick={() => void handleCopyLink()}
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 text-xs font-medium hover:opacity-90 transition-opacity cursor-pointer whitespace-nowrap shrink-0"
            >
              {copiedLink ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-400 dark:text-emerald-600" />
                  <span>{t.linkCopied}</span>
                </>
              ) : (
                <>
                  <Link2 className="w-3.5 h-3.5" />
                  <span>{t.copyLink}</span>
                </>
              )}
            </button>
          </div>

          <div className="pt-2 space-y-1.5">
            {canNativeShare && (
              <button
                type="button"
                onClick={() => void handleNativeShare()}
                className="w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl border border-zinc-200 dark:border-zinc-800 text-xs font-medium text-zinc-800 dark:text-zinc-200 hover:bg-zinc-50 dark:hover:bg-zinc-800/70 transition-colors cursor-pointer text-start"
              >
                <Share2 className="w-4 h-4 text-zinc-500 shrink-0" />
                <span>{t.shareNative}</span>
              </button>
            )}

            <button
              type="button"
              onClick={() => void handleCopyTranscript()}
              className="w-full flex items-center justify-between gap-3 px-3.5 py-2.5 rounded-xl border border-zinc-200 dark:border-zinc-800 text-xs font-medium text-zinc-800 dark:text-zinc-200 hover:bg-zinc-50 dark:hover:bg-zinc-800/70 transition-colors cursor-pointer text-start"
            >
              <span className="inline-flex items-center gap-3">
                <Copy className="w-4 h-4 text-zinc-500 shrink-0" />
                <span>{t.copyTranscript}</span>
              </span>
              {copiedTranscript && (
                <Check className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
              )}
            </button>

            <button
              type="button"
              onClick={() => {
                downloadConversation(conversation, 'md', uiLang);
                onClose();
              }}
              className="w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl border border-zinc-200 dark:border-zinc-800 text-xs font-medium text-zinc-800 dark:text-zinc-200 hover:bg-zinc-50 dark:hover:bg-zinc-800/70 transition-colors cursor-pointer text-start"
            >
              <FileCode2 className="w-4 h-4 text-blue-600 dark:text-blue-400 shrink-0" />
              <span>{t.exportMarkdown}</span>
            </button>

            <button
              type="button"
              onClick={() => {
                downloadConversation(conversation, 'txt', uiLang);
                onClose();
              }}
              className="w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl border border-zinc-200 dark:border-zinc-800 text-xs font-medium text-zinc-800 dark:text-zinc-200 hover:bg-zinc-50 dark:hover:bg-zinc-800/70 transition-colors cursor-pointer text-start"
            >
              <FileText className="w-4 h-4 text-zinc-500 dark:text-zinc-400 shrink-0" />
              <span>{t.exportText}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
