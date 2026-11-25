import React, { useState } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Check, Code2, Copy, Eye } from 'lucide-react';
import { getScriptClass, getTextDir } from '../utils/bidi';

interface MarkdownRendererProps {
  content: string;
  isStreaming?: boolean;
  copyLabel?: string;
  copiedLabel?: string;
  previewLabel?: string;
  codeLabel?: string;
}

interface CodeBlockProps {
  language?: string;
  code: string;
  copyLabel: string;
  copiedLabel: string;
  previewLabel: string;
  codeLabel: string;
  isStreaming: boolean;
}

const CodeBlock: React.FC<CodeBlockProps> = ({
  language,
  code,
  copyLabel,
  copiedLabel,
  previewLabel,
  codeLabel,
  isStreaming,
}) => {
  const [copied, setCopied] = useState(false);
  const [showPreview, setShowPreview] = useState(false);

  const normalizedLang = (language || '').toLowerCase();
  const canPreview =
    !isStreaming && (normalizedLang === 'html' || normalizedLang === 'svg') && code.trim().length > 0;

  const previewSrcDoc =
    normalizedLang === 'svg'
      ? `<!doctype html><html><head><style>body{margin:0;display:flex;align-items:center;justify-content:center;min-height:100vh;background:#ffffff;padding:16px;box-sizing:border-box;font-family:system-ui,sans-serif;}svg{max-width:100%;height:auto;}</style></head><body>${code}</body></html>`
      : code;

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch {
      // ignore clipboard errors
    }
  };

  return (
    <div
      dir="ltr"
      className="my-4 overflow-hidden rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-[#191B1F]"
    >
      <div className="flex items-center justify-between gap-2 px-4 py-2 border-b border-zinc-200 dark:border-zinc-800 bg-zinc-100/80 dark:bg-[#1E2025]">
        <span className="text-xs font-mono-code text-zinc-600 dark:text-zinc-400 select-none">
          {language || 'code'}
        </span>
        <div className="flex items-center gap-1.5">
          {canPreview && (
            <button
              type="button"
              onClick={() => setShowPreview((prev) => !prev)}
              className="inline-flex items-center gap-1.5 text-xs font-medium text-zinc-700 dark:text-zinc-200 hover:text-zinc-900 dark:hover:text-white transition-colors px-2 py-1 rounded-md bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 cursor-pointer whitespace-nowrap shrink-0"
            >
              {showPreview ? (
                <>
                  <Code2 className="w-3.5 h-3.5" />
                  <span>{codeLabel}</span>
                </>
              ) : (
                <>
                  <Eye className="w-3.5 h-3.5" />
                  <span>{previewLabel}</span>
                </>
              )}
            </button>
          )}
          <button
            type="button"
            onClick={handleCopy}
            className="inline-flex items-center gap-1.5 text-xs font-medium text-zinc-600 dark:text-zinc-300 hover:text-zinc-900 dark:hover:text-white transition-colors px-2 py-1 rounded-md hover:bg-zinc-200/70 dark:hover:bg-zinc-700/60 cursor-pointer whitespace-nowrap shrink-0"
          >
            {copied ? (
              <>
                <Check className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                <span>{copiedLabel}</span>
              </>
            ) : (
              <>
                <Copy className="w-3.5 h-3.5" />
                <span>{copyLabel}</span>
              </>
            )}
          </button>
        </div>
      </div>

      {showPreview && canPreview ? (
        <div className="bg-white">
          <iframe
            title="Live code preview"
            sandbox="allow-scripts"
            srcDoc={previewSrcDoc}
            className="w-full h-[340px] border-0"
          />
        </div>
      ) : (
        <pre className="p-4 overflow-x-auto text-[13.5px] leading-relaxed font-mono-code text-zinc-800 dark:text-zinc-200">
          <code>{code}</code>
        </pre>
      )}
    </div>
  );
};

function extractPlainText(children: React.ReactNode): string {
  if (typeof children === 'string') return children;
  if (typeof children === 'number') return String(children);
  if (Array.isArray(children)) return children.map(extractPlainText).join('');
  if (React.isValidElement<{ children?: React.ReactNode }>(children)) {
    return extractPlainText(children.props.children);
  }
  return '';
}

export const MarkdownRenderer: React.FC<MarkdownRendererProps> = ({
  content,
  isStreaming = false,
  copyLabel = 'Copy',
  copiedLabel = 'Copied',
  previewLabel = 'Preview',
  codeLabel = 'Code',
}) => {
  const rootScript = getScriptClass(content);
  const rootDir = getTextDir(content);

  return (
    <div
      dir={rootDir}
      className={`text-[15.5px] leading-[1.72] text-zinc-800 dark:text-zinc-100 dark:tracking-[0.005em] break-words ${rootScript}`}
    >
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          p({ children }) {
            const text = extractPlainText(children);
            const scriptCls = getScriptClass(text);
            const dir = getTextDir(text);
            return (
              <p dir={dir} className={`my-3 first:mt-0 last:mb-0 ${scriptCls}`}>
                {children}
              </p>
            );
          },
          h1({ children }) {
            const text = extractPlainText(children);
            return (
              <h1
                dir={getTextDir(text)}
                className={`text-xl font-semibold text-zinc-900 dark:text-white mt-6 mb-3 first:mt-0 ${getScriptClass(text)}`}
              >
                {children}
              </h1>
            );
          },
          h2({ children }) {
            const text = extractPlainText(children);
            return (
              <h2
                dir={getTextDir(text)}
                className={`text-lg font-semibold text-zinc-900 dark:text-white mt-5 mb-2.5 first:mt-0 ${getScriptClass(text)}`}
              >
                {children}
              </h2>
            );
          },
          h3({ children }) {
            const text = extractPlainText(children);
            return (
              <h3
                dir={getTextDir(text)}
                className={`text-base font-semibold text-zinc-900 dark:text-white mt-4 mb-2 first:mt-0 ${getScriptClass(text)}`}
              >
                {children}
              </h3>
            );
          },
          ul({ children }) {
            return <ul className="my-3 ps-5 list-disc space-y-1.5">{children}</ul>;
          },
          ol({ children }) {
            return <ol className="my-3 ps-5 list-decimal space-y-1.5">{children}</ol>;
          },
          li({ children }) {
            const text = extractPlainText(children);
            return (
              <li dir={getTextDir(text)} className={`leading-[1.7] ${getScriptClass(text)}`}>
                {children}
              </li>
            );
          },
          blockquote({ children }) {
            return (
              <blockquote className="my-4 px-4 py-3 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50/70 dark:bg-zinc-900/50 text-zinc-700 dark:text-zinc-300">
                {children}
              </blockquote>
            );
          },
          a({ href, children }) {
            return (
              <a
                href={href}
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-600 dark:text-blue-400 underline underline-offset-2 hover:text-blue-700 dark:hover:text-blue-300 transition-colors"
              >
                {children}
              </a>
            );
          },
          hr() {
            return <hr className="my-5 border-zinc-200 dark:border-zinc-800" />;
          },
          table({ children }) {
            return (
              <div className="my-4 overflow-x-auto rounded-xl border border-zinc-200 dark:border-zinc-800">
                <table className="w-full text-sm text-start border-collapse">{children}</table>
              </div>
            );
          },
          thead({ children }) {
            return (
              <thead className="bg-zinc-100/80 dark:bg-zinc-800/70 text-zinc-800 dark:text-zinc-200 border-b border-zinc-200 dark:border-zinc-800">
                {children}
              </thead>
            );
          },
          th({ children }) {
            return <th className="px-3.5 py-2.5 font-semibold text-start">{children}</th>;
          },
          td({ children }) {
            return (
              <td className="px-3.5 py-2.5 border-t border-zinc-200/80 dark:border-zinc-800/80 tabular-nums">
                {children}
              </td>
            );
          },
          code({ className, children, ...props }) {
            const match = /language-(\w+)/.exec(className || '');
            const codeString = String(children).replace(/\n$/, '');
            const isBlock = Boolean(match) || codeString.includes('\n');

            if (isBlock) {
              return (
                <CodeBlock
                  language={match?.[1]}
                  code={codeString}
                  copyLabel={copyLabel}
                  copiedLabel={copiedLabel}
                  previewLabel={previewLabel}
                  codeLabel={codeLabel}
                  isStreaming={isStreaming}
                />
              );
            }

            return (
              <code
                dir="ltr"
                className="px-1.5 py-0.5 mx-0.5 rounded-md bg-zinc-100 dark:bg-zinc-800 border border-zinc-200/80 dark:border-zinc-700/70 font-mono-code text-[13px] text-zinc-900 dark:text-zinc-100"
                {...props}
              >
                {children}
              </code>
            );
          },
          pre({ children }) {
            return <>{children}</>;
          },
        }}
      >
        {content}
      </ReactMarkdown>
      {isStreaming && <span className="nexora-caret" aria-hidden="true" />}
    </div>
  );
};
