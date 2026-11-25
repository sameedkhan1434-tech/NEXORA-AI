import type {
  Conversation,
  CustomInstructionsData,
  ModelTier,
  ThemeMode,
  UILanguage,
} from '../types/chat';

const CONVERSATIONS_KEY = 'nexora_conversations_v1';
const ACTIVE_ID_KEY = 'nexora_active_chat_id';
const THEME_KEY = 'nexora_theme';
const UI_LANG_KEY = 'nexora_ui_lang';
const MODEL_TIER_KEY = 'nexora_model_tier';
const CUSTOM_INSTRUCTIONS_KEY = 'nexora_custom_instructions_v2';
const LEGACY_CUSTOM_INSTRUCTIONS_KEY = 'nexora_custom_instructions';

export function loadConversations(): Conversation[] {
  try {
    const raw = localStorage.getItem(CONVERSATIONS_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed
      .filter(
        (item): item is Conversation =>
          Boolean(item && typeof item.id === 'string' && Array.isArray(item.messages))
      )
      .map((item) => ({
        ...item,
        modelTier:
          item.modelTier === 'thinking' || item.modelTier === 'code' ? item.modelTier : 'fast',
        messages: item.messages.filter(
          (m) => !(m.role === 'assistant' && !m.content?.trim() && !m.isError)
        ),
      }));
  } catch {
    return [];
  }
}

export function saveConversations(conversations: Conversation[]): void {
  try {
    localStorage.setItem(CONVERSATIONS_KEY, JSON.stringify(conversations));
  } catch {
    try {
      const trimmed = conversations.slice(0, 20).map((conv) => ({
        ...conv,
        messages: conv.messages.map((m) => ({
          ...m,
          attachments: m.attachments?.map((att) =>
            att.kind === 'image' || att.kind === 'pdf'
              ? { ...att, data: '', previewUrl: undefined }
              : att
          ),
        })),
      }));
      localStorage.setItem(CONVERSATIONS_KEY, JSON.stringify(trimmed));
    } catch {
      // Ignore storage quota overflow silently
    }
  }
}

export function loadActiveChatId(): string | null {
  try {
    return localStorage.getItem(ACTIVE_ID_KEY);
  } catch {
    return null;
  }
}

export function saveActiveChatId(id: string | null): void {
  try {
    if (id) {
      localStorage.setItem(ACTIVE_ID_KEY, id);
    } else {
      localStorage.removeItem(ACTIVE_ID_KEY);
    }
  } catch {
    // ignore
  }
}

export function loadTheme(): ThemeMode {
  try {
    const saved = localStorage.getItem(THEME_KEY);
    if (saved === 'dark' || saved === 'light') return saved;
    if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
      return 'dark';
    }
  } catch {
    // ignore
  }
  return 'light';
}

export function saveTheme(theme: ThemeMode): void {
  try {
    localStorage.setItem(THEME_KEY, theme);
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  } catch {
    // ignore
  }
}

export function loadUILanguage(): UILanguage {
  try {
    const saved = localStorage.getItem(UI_LANG_KEY);
    if (saved === 'en' || saved === 'ur' || saved === 'hi') return saved;
  } catch {
    // ignore
  }
  return 'en';
}

export function saveUILanguage(lang: UILanguage): void {
  try {
    localStorage.setItem(UI_LANG_KEY, lang);
  } catch {
    // ignore
  }
}

export function loadModelTier(): ModelTier {
  try {
    const saved = localStorage.getItem(MODEL_TIER_KEY);
    if (saved === 'fast' || saved === 'thinking' || saved === 'code') return saved;
  } catch {
    // ignore
  }
  return 'fast';
}

export function saveModelTier(tier: ModelTier): void {
  try {
    localStorage.setItem(MODEL_TIER_KEY, tier);
  } catch {
    // ignore
  }
}

export function loadCustomInstructions(): CustomInstructionsData {
  try {
    const raw = localStorage.getItem(CUSTOM_INSTRUCTIONS_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as Partial<CustomInstructionsData>;
      return {
        aboutUser: typeof parsed.aboutUser === 'string' ? parsed.aboutUser : '',
        responseStyle: typeof parsed.responseStyle === 'string' ? parsed.responseStyle : '',
        enabled: typeof parsed.enabled === 'boolean' ? parsed.enabled : true,
      };
    }
    const legacy = localStorage.getItem(LEGACY_CUSTOM_INSTRUCTIONS_KEY);
    if (legacy) {
      return { aboutUser: '', responseStyle: legacy, enabled: true };
    }
  } catch {
    // ignore
  }
  return { aboutUser: '', responseStyle: '', enabled: true };
}

export function saveCustomInstructions(data: CustomInstructionsData): void {
  try {
    localStorage.setItem(CUSTOM_INSTRUCTIONS_KEY, JSON.stringify(data));
  } catch {
    // ignore
  }
}
