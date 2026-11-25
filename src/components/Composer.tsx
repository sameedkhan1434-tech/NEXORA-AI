import React, { useEffect, useRef, useState } from 'react';
import { ArrowUp, AudioLines, FileText, Globe, Mic, Paperclip, Square, X } from 'lucide-react';
import type { Attachment, UILanguage } from '../types/chat';
import { TRANSLATIONS } from '../i18n/translations';
import { getScriptClass } from '../utils/bidi';

interface ComposerProps {
  uiLang: UILanguage;
  webSearch: boolean;
  isGenerating: boolean;
  onToggleWebSearch: () => void;
  onOpenVoiceChat: () => void;
  onSend: (text: string, attachments: Attachment[]) => void;
  onStop: () => void;
}

const MAX_FILE_SIZE = 10 * 1024 * 1024;

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function isTextLikeFile(file: File): boolean {
  if (file.type.startsWith('text/')) return true;
  const textExts = ['.md', '.txt', '.csv', '.json', '.ts', '.tsx', '.js', '.jsx', '.py', '.html', '.css', '.sql', '.yaml', '.yml', '.xml'];
  return textExts.some((ext) => file.name.toLowerCase().endsWith(ext));
}

export const Composer: React.FC<ComposerProps> = ({
  uiLang,
  webSearch,
  isGenerating,
  onToggleWebSearch,
  onOpenVoiceChat,
  onSend,
  onStop,
}) => {
  const t = TRANSLATIONS[uiLang];
  const [text, setText] = useState('');
  const [attachments, setAttachments] = useState<Attachment[]>([]);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [isTranscribing, setIsTranscribing] = useState(false);

  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);

  useEffect(() => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = 'auto';
    el.style.height = `${Math.min(el.scrollHeight, 200)}px`;
  }, [text]);

  useEffect(() => {
    return () => {
      if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
        mediaRecorderRef.current.stop();
      }
    };
  }, []);

  const processFiles = async (files: FileList | File[]) => {
    setErrorMsg(null);
    const list = Array.from(files).slice(0, 4);

    for (const file of list) {
      if (file.size > MAX_FILE_SIZE) {
        setErrorMsg(t.attachmentErrorSize);
        continue;
      }

      if (file.type.startsWith('image/')) {
        const dataUrl = await new Promise<string>((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = () => resolve(String(reader.result || ''));
          reader.onerror = () => reject(new Error('Failed to read file'));
          reader.readAsDataURL(file);
        });
        const base64 = dataUrl.split(',')[1] || '';
        setAttachments((prev) => [
          ...prev,
          {
            id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
            name: file.name,
            mimeType: file.type,
            size: file.size,
            data: base64,
            previewUrl: dataUrl,
            kind: 'image',
          },
        ]);
      } else if (
        file.type === 'application/pdf' ||
        file.name.toLowerCase().endsWith('.pdf')
      ) {
        const dataUrl = await new Promise<string>((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = () => resolve(String(reader.result || ''));
          reader.onerror = () => reject(new Error('Failed to read PDF'));
          reader.readAsDataURL(file);
        });
        const base64 = dataUrl.split(',')[1] || '';
        setAttachments((prev) => [
          ...prev,
          {
            id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
            name: file.name,
            mimeType: 'application/pdf',
            size: file.size,
            data: base64,
            kind: 'pdf',
          },
        ]);
      } else if (isTextLikeFile(file)) {
        const content = await file.text();
        setAttachments((prev) => [
          ...prev,
          {
            id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
            name: file.name,
            mimeType: file.type || 'text/plain',
            size: file.size,
            data: content,
            kind: 'text',
          },
        ]);
      } else {
        setErrorMsg(t.attachmentErrorType);
      }
    }
  };

  const handleToggleVoiceInput = async () => {
    setErrorMsg(null);
    if (isRecording && mediaRecorderRef.current) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      return;
    }

    if (!navigator.mediaDevices?.getUserMedia || typeof MediaRecorder === 'undefined') {
      setErrorMsg(t.micError);
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mimeType = MediaRecorder.isTypeSupported('audio/webm') ? 'audio/webm' : 'audio/mp4';
      const recorder = new MediaRecorder(stream, { mimeType });
      chunksRef.current = [];

      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data);
      };

      recorder.onstop = async () => {
        stream.getTracks().forEach((track) => track.stop());
        const blob = new Blob(chunksRef.current, { type: mimeType });
        if (blob.size === 0) return;

        setIsTranscribing(true);
        try {
          const base64 = await new Promise<string>((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () => {
              const res = String(reader.result || '');
              resolve(res.split(',')[1] || '');
            };
            reader.onerror = () => reject(new Error('Failed to encode audio'));
            reader.readAsDataURL(blob);
          });

          const response = await fetch('/api/transcribe', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ audioBase64: base64, mimeType }),
          });

          const data = (await response.json()) as { text?: string; error?: string };
          if (!response.ok) {
            setErrorMsg(data.error || t.micError);
            return;
          }
          if (data.text) {
            setText((prev) => (prev.trim() ? `${prev.trim()} ${data.text}` : data.text!));
            textareaRef.current?.focus();
          }
        } catch {
          setErrorMsg(t.micError);
        } finally {
          setIsTranscribing(false);
        }
      };

      mediaRecorderRef.current = recorder;
      recorder.start();
      setIsRecording(true);
    } catch {
      setErrorMsg(t.micError);
    }
  };

  const handleSubmit = () => {
    if (isGenerating || isTranscribing) return;
    const trimmed = text.trim();
    if (!trimmed && attachments.length === 0) return;
    onSend(trimmed, attachments);
    setText('');
    setAttachments([]);
    setErrorMsg(null);
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      void processFiles(e.dataTransfer.files);
    }
  };

  const canSend =
    (text.trim().length > 0 || attachments.length > 0) && !isGenerating && !isTranscribing;
  const inputScriptClass = text.trim()
    ? getScriptClass(text)
    : uiLang === 'ur'
      ? 'font-urdu'
      : uiLang === 'hi'
        ? 'font-hindi'
        : '';

  return (
    <div className="w-full max-w-3xl mx-auto px-3 sm:px-4 pb-3 pt-1">
      <div
        onDragOver={(e) => {
          e.preventDefault();
          setIsDragging(true);
        }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={handleDrop}
        className={`relative rounded-3xl border transition-colors duration-150 bg-white dark:bg-[#1E2025] shadow-[0_2px_14px_rgba(0,0,0,0.05)] dark:shadow-[0_2px_16px_rgba(0,0,0,0.3)] ${
          isDragging
            ? 'border-blue-500 ring-2 ring-blue-500/20'
            : 'border-zinc-200 dark:border-zinc-800 focus-within:border-zinc-300 dark:focus-within:border-zinc-700'
        }`}
      >
        {attachments.length > 0 && (
          <div className="flex flex-wrap gap-2 px-4 pt-3.5">
            {attachments.map((att) => (
              <div
                key={att.id}
                className="relative group inline-flex items-center gap-2 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800/80 p-1.5 pe-2.5 text-xs text-zinc-700 dark:text-zinc-200"
              >
                {att.kind === 'image' && att.previewUrl ? (
                  <img
                    src={att.previewUrl}
                    alt={att.name}
                    referrerPolicy="no-referrer"
                    className="w-9 h-9 rounded-lg object-cover"
                  />
                ) : att.kind === 'pdf' ? (
                  <div className="w-9 h-9 rounded-lg bg-red-50 dark:bg-red-950/50 border border-red-200/70 dark:border-red-900/50 flex flex-col items-center justify-center shrink-0">
                    <FileText className="w-3.5 h-3.5 text-red-600 dark:text-red-400" />
                    <span className="text-[8px] font-bold leading-none text-red-600 dark:text-red-400 mt-0.5">
                      PDF
                    </span>
                  </div>
                ) : (
                  <div className="w-9 h-9 rounded-lg bg-zinc-200/70 dark:bg-zinc-700 flex items-center justify-center shrink-0">
                    <FileText className="w-4 h-4 text-zinc-600 dark:text-zinc-300" />
                  </div>
                )}
                <div className="min-w-0 flex flex-col">
                  <span className="max-w-[140px] truncate font-medium">{att.name}</span>
                  {att.kind === 'pdf' && (
                    <span className="text-[10px] text-zinc-500 dark:text-zinc-400">
                      {formatFileSize(att.size)}
                    </span>
                  )}
                </div>
                <button
                  type="button"
                  onClick={() => setAttachments((prev) => prev.filter((item) => item.id !== att.id))}
                  aria-label="Remove attachment"
                  className="p-0.5 rounded-full text-zinc-400 hover:text-zinc-800 dark:hover:text-zinc-100 hover:bg-zinc-200 dark:hover:bg-zinc-700 transition-colors cursor-pointer"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            ))}
          </div>
        )}

        {errorMsg && (
          <div className="px-4 pt-2.5 text-xs text-red-600 dark:text-red-400">{errorMsg}</div>
        )}

        <textarea
          ref={textareaRef}
          dir="auto"
          rows={1}
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={isTranscribing ? t.transcribing : t.composerPlaceholder}
          aria-label={t.composerPlaceholder}
          className={`w-full resize-none bg-transparent px-4 pt-3.5 pb-2 text-[15px] text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400 dark:placeholder:text-zinc-500 focus:outline-none max-h-[200px] ${inputScriptClass}`}
        />

        <div className="flex items-center justify-between gap-2 px-3 pb-2.5 pt-1">
          <div className="flex items-center gap-1.5">
            <input
              ref={fileInputRef}
              type="file"
              multiple
              accept="image/*,.pdf,application/pdf,.txt,.md,.csv,.json,.ts,.tsx,.js,.jsx,.py,.html,.css,.sql,.yaml,.yml,.xml"
              className="hidden"
              onChange={(e) => {
                if (e.target.files) {
                  void processFiles(e.target.files);
                }
                e.target.value = '';
              }}
            />

            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              title={t.attachFile}
              aria-label={t.attachFile}
              className="h-9 w-9 inline-flex items-center justify-center rounded-full text-zinc-600 dark:text-zinc-300 hover:text-zinc-900 dark:hover:text-white hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors cursor-pointer shrink-0"
            >
              <Paperclip className="w-4 h-4" />
            </button>

            <button
              type="button"
              onClick={onToggleWebSearch}
              aria-pressed={webSearch}
              className={`h-9 px-3 inline-flex items-center gap-1.5 rounded-full text-xs font-medium border transition-colors cursor-pointer whitespace-nowrap shrink-0 ${
                webSearch
                  ? 'border-blue-500/40 bg-blue-50 dark:bg-blue-950/50 text-blue-700 dark:text-blue-300'
                  : 'border-zinc-200 dark:border-zinc-700/80 text-zinc-600 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800'
              }`}
            >
              <Globe className="w-3.5 h-3.5" />
              <span>{t.webSearch}</span>
            </button>
          </div>

          <div className="flex items-center gap-1.5 shrink-0">
            <button
              type="button"
              onClick={() => void handleToggleVoiceInput()}
              disabled={isTranscribing || isGenerating}
              title={isRecording ? t.stopRecording : t.voiceInput}
              aria-label={isRecording ? t.stopRecording : t.voiceInput}
              className={`h-9 w-9 inline-flex items-center justify-center rounded-full transition-colors cursor-pointer shrink-0 disabled:opacity-40 ${
                isRecording
                  ? 'bg-red-600 text-white hover:bg-red-700'
                  : 'text-zinc-600 dark:text-zinc-300 hover:text-zinc-900 dark:hover:text-white hover:bg-zinc-100 dark:hover:bg-zinc-800'
              }`}
            >
              {isRecording ? <Square className="w-3.5 h-3.5 fill-current" /> : <Mic className="w-4 h-4" />}
            </button>

            <button
              type="button"
              onClick={onOpenVoiceChat}
              disabled={isGenerating || isTranscribing || isRecording}
              title={t.voiceChat}
              aria-label={t.voiceChat}
              className="h-9 w-9 inline-flex items-center justify-center rounded-full text-zinc-600 dark:text-zinc-300 hover:text-zinc-900 dark:hover:text-white hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors cursor-pointer shrink-0 disabled:opacity-40"
            >
              <AudioLines className="w-4 h-4" />
            </button>

            {isGenerating ? (
              <button
                type="button"
                onClick={onStop}
                title={t.stop}
                aria-label={t.stop}
                className="h-9 w-9 inline-flex items-center justify-center rounded-full bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 hover:opacity-90 transition-opacity cursor-pointer shrink-0"
              >
                <Square className="w-3.5 h-3.5 fill-current" />
              </button>
            ) : (
              <button
                type="button"
                onClick={handleSubmit}
                disabled={!canSend}
                title={t.send}
                aria-label={t.send}
                className="h-9 w-9 inline-flex items-center justify-center rounded-full bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 hover:opacity-90 disabled:bg-zinc-200 disabled:text-zinc-400 dark:disabled:bg-zinc-800 dark:disabled:text-zinc-600 transition-colors cursor-pointer disabled:cursor-not-allowed shrink-0"
              >
                <ArrowUp className="w-4 h-4 stroke-[2.25]" />
              </button>
            )}
          </div>
        </div>
      </div>

      <p className="mt-2 text-center text-[11.5px] text-zinc-400 dark:text-zinc-500">
        {t.disclaimer}
      </p>
    </div>
  );
};
