import React, { useEffect, useState } from 'react';
import { Check, Moon, Sun, Trash2, X } from 'lucide-react';
import { TRANSLATIONS } from '../i18n/translations';
import type { CustomInstructionsData, ThemeMode, UILanguage } from '../types/chat';

interface SettingsModalProps {
  isOpen: boolean;
  uiLang: UILanguage;
  theme: ThemeMode;
  customInstructions: CustomInstructionsData;
  hasConversations: boolean;
  onClose: () => void;
  onChangeUILanguage: (lang: UILanguage) => void;
  onToggleTheme: () => void;
  onSaveCustomInstructions: (data: CustomInstructionsData) => void;
  onClearAll: () => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  uiLang,
  theme,
  customInstructions,
  hasConversations,
  onClose,
  onChangeUILanguage,
  onToggleTheme,
  onSaveCustomInstructions,
  onClearAll,
}) => {
  const t = TRANSLATIONS[uiLang];
  const [aboutUser, setAboutUser] = useState(customInstructions.aboutUser);
  const [responseStyle, setResponseStyle] = useState(customInstructions.responseStyle);
  const [enabled, setEnabled] = useState(customInstructions.enabled);
  const [savedNotice, setSavedNotice] = useState(false);
  const [confirmClear, setConfirmClear] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setAboutUser(customInstructions.aboutUser);
      setResponseStyle(customInstructions.responseStyle);
      setEnabled(customInstructions.enabled);
      setSavedNotice(false);
      setConfirmClear(false);
    }
  }, [isOpen, customInstructions]);

  useEffect(() => {
    if (!isOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const handleSaveInstructions = () => {
    onSaveCustomInstructions({
      aboutUser: aboutUser.trim(),
      responseStyle: responseStyle.trim(),
      enabled,
    });
    setSavedNotice(true);
    setTimeout(() => setSavedNotice(false), 1800);
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-[1px]"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="settings-modal-title"
    >
      <div
        className="w-full max-w-lg rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-[#1A1C21] shadow-2xl overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-5 py-4 border-b border-zinc-200 dark:border-zinc-800">
          <h2
            id="settings-modal-title"
            className="text-base font-semibold text-zinc-900 dark:text-zinc-100"
          >
            {t.settings}
          </h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close settings"
            className="h-8 w-8 inline-flex items-center justify-center rounded-lg text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-5 space-y-5 max-h-[78vh] overflow-y-auto">
          {/* General */}
          <section className="space-y-3">
            <h3 className="text-xs font-semibold text-zinc-500 dark:text-zinc-400">
              {t.settingsGeneral}
            </h3>

            <div className="flex items-center justify-between gap-4 py-1">
              <span className="text-sm text-zinc-800 dark:text-zinc-200">{t.themeLabel}</span>
              <button
                type="button"
                onClick={onToggleTheme}
                className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 text-xs font-medium text-zinc-800 dark:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-700 transition-colors cursor-pointer"
              >
                {theme === 'dark' ? (
                  <>
                    <Sun className="w-3.5 h-3.5 text-amber-400" />
                    <span>{t.themeDark}</span>
                  </>
                ) : (
                  <>
                    <Moon className="w-3.5 h-3.5 text-zinc-600" />
                    <span>{t.themeLight}</span>
                  </>
                )}
              </button>
            </div>

            <div className="flex items-center justify-between gap-4 py-1">
              <span className="text-sm text-zinc-800 dark:text-zinc-200">
                {t.interfaceLanguage}
              </span>
              <div className="inline-flex items-center rounded-lg bg-zinc-100 dark:bg-zinc-800 p-0.5 border border-zinc-200/70 dark:border-zinc-700/70">
                {(
                  [
                    { code: 'en', label: 'English' },
                    { code: 'ur', label: 'اردو' },
                    { code: 'hi', label: 'हिन्दी' },
                  ] as const
                ).map((opt) => (
                  <button
                    key={opt.code}
                    type="button"
                    onClick={() => onChangeUILanguage(opt.code)}
                    className={`px-2.5 py-1 text-xs font-medium rounded-md transition-colors cursor-pointer whitespace-nowrap shrink-0 ${
                      uiLang === opt.code
                        ? 'bg-white dark:bg-zinc-700 text-zinc-900 dark:text-white shadow-2xs'
                        : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-200'
                    }`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>
          </section>

          <hr className="border-zinc-200 dark:border-zinc-800" />

          {/* Two-part Custom Instructions */}
          <section className="space-y-3">
            <div className="flex items-center justify-between gap-3">
              <div>
                <h3 className="text-xs font-semibold text-zinc-500 dark:text-zinc-400">
                  {t.settingsPersonalization}
                </h3>
                <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
                  {t.customInstructionsHint}
                </p>
              </div>
              <label className="inline-flex items-center gap-2 text-xs text-zinc-700 dark:text-zinc-300 cursor-pointer shrink-0">
                <input
                  type="checkbox"
                  checked={enabled}
                  onChange={(e) => setEnabled(e.target.checked)}
                  className="rounded border-zinc-300 dark:border-zinc-700 accent-zinc-900 dark:accent-zinc-100"
                />
                <span>{t.enableCustomInstructions}</span>
              </label>
            </div>

            <div className="space-y-1.5">
              <label className="block text-xs font-medium text-zinc-800 dark:text-zinc-200">
                {t.aboutUserLabel}
              </label>
              <textarea
                dir="auto"
                rows={2}
                value={aboutUser}
                onChange={(e) => setAboutUser(e.target.value)}
                placeholder={t.aboutUserPlaceholder}
                className="w-full rounded-xl border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-900/60 px-3.5 py-2 text-sm text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400 dark:placeholder:text-zinc-500 focus:outline-none focus:border-zinc-400 dark:focus:border-zinc-600 resize-none"
              />
            </div>

            <div className="space-y-1.5">
              <label className="block text-xs font-medium text-zinc-800 dark:text-zinc-200">
                {t.customInstructionsLabel}
              </label>
              <textarea
                dir="auto"
                rows={2}
                value={responseStyle}
                onChange={(e) => setResponseStyle(e.target.value)}
                placeholder={t.customInstructionsPlaceholder}
                className="w-full rounded-xl border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-900/60 px-3.5 py-2 text-sm text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400 dark:placeholder:text-zinc-500 focus:outline-none focus:border-zinc-400 dark:focus:border-zinc-600 resize-none"
              />
            </div>

            <div className="flex justify-end">
              <button
                type="button"
                onClick={handleSaveInstructions}
                className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 text-xs font-medium hover:opacity-90 transition-opacity cursor-pointer"
              >
                {savedNotice ? (
                  <>
                    <Check className="w-3.5 h-3.5" />
                    <span>{t.saved}</span>
                  </>
                ) : (
                  <span>{t.save}</span>
                )}
              </button>
            </div>
          </section>

          {hasConversations && (
            <>
              <hr className="border-zinc-200 dark:border-zinc-800" />

              <div className="flex items-center justify-between gap-4">
                <span className="text-sm text-zinc-800 dark:text-zinc-200">{t.clearAll}</span>
                {confirmClear ? (
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setConfirmClear(false)}
                      className="px-2.5 py-1.5 text-xs rounded-lg text-zinc-600 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 cursor-pointer"
                    >
                      {t.cancel}
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        onClearAll();
                        setConfirmClear(false);
                        onClose();
                      }}
                      className="px-3 py-1.5 text-xs font-medium rounded-lg bg-red-600 text-white hover:bg-red-700 cursor-pointer"
                    >
                      {t.confirm}
                    </button>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => setConfirmClear(true)}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-red-200 dark:border-red-900/60 text-xs font-medium text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/30 transition-colors cursor-pointer"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>{t.clearAll}</span>
                  </button>
                )}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};
