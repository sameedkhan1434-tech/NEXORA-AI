import React from 'react';
import { ArrowUpRight } from 'lucide-react';
import { NexoraLogo } from './NexoraLogo';
import { TRANSLATIONS, getTimeGreeting } from '../i18n/translations';
import type { UILanguage } from '../types/chat';

interface WelcomeScreenProps {
  uiLang: UILanguage;
  onSelectPrompt: (prompt: string) => void;
}

export const WelcomeScreen: React.FC<WelcomeScreenProps> = ({ uiLang, onSelectPrompt }) => {
  const t = TRANSLATIONS[uiLang];
  const greeting = getTimeGreeting(uiLang);
  const scriptClass = uiLang === 'ur' ? 'font-urdu' : uiLang === 'hi' ? 'font-hindi' : '';

  return (
    <div className="flex flex-col items-center justify-center w-full max-w-3xl mx-auto px-4 pt-8 pb-6 md:pt-14 md:pb-8">
      <div className="mb-5">
        <NexoraLogo size={38} />
      </div>

      <h1
        className={`text-center text-2xl sm:text-3xl md:text-[34px] font-medium tracking-tight text-zinc-900 dark:text-zinc-100 [text-wrap:balance] ${
          uiLang === 'en' ? 'font-display' : scriptClass
        }`}
      >
        {greeting}
      </h1>

      <p
        className={`mt-2.5 text-center text-sm sm:text-[15px] text-zinc-500 dark:text-zinc-400 max-w-xl [text-wrap:balance] ${scriptClass}`}
      >
        {t.welcomeSubtitle}
      </p>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 w-full mt-8">
        {t.starterPrompts.map((item) => (
          <button
            key={item.title}
            type="button"
            onClick={() => onSelectPrompt(item.prompt)}
            className="group text-start p-4 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-[#191B1F] hover:border-zinc-300 dark:hover:border-zinc-700 hover:bg-zinc-50/80 dark:hover:bg-[#1F2227] transition-all duration-150 cursor-pointer flex flex-col justify-between gap-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600"
          >
            <div className="flex items-start justify-between gap-2">
              <span
                className={`text-sm font-semibold text-zinc-900 dark:text-zinc-100 ${scriptClass}`}
              >
                {item.title}
              </span>
              <ArrowUpRight className="w-4 h-4 text-zinc-400 group-hover:text-zinc-700 dark:group-hover:text-zinc-200 transition-colors shrink-0 mt-0.5" />
            </div>
            <p
              className={`text-[13px] text-zinc-500 dark:text-zinc-400 leading-relaxed ${scriptClass}`}
            >
              {item.description}
            </p>
          </button>
        ))}
      </div>
    </div>
  );
};
