import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  Check,
  ChevronDown,
  Menu,
  MessageSquareDashed,
  Moon,
  PanelLeft,
  Share2,
  SquarePen,
  Sun,
} from 'lucide-react';
import {
  loadActiveChatId,
  loadConversations,
  loadCustomInstructions,
  loadModelTier,
  loadTheme,
  loadUILanguage,
  saveActiveChatId,
  saveConversations,
  saveCustomInstructions,
  saveModelTier,
  saveTheme,
  saveUILanguage,
} from './utils/storage';
import { TRANSLATIONS } from './i18n/translations';
import { parseShareHash } from './utils/shareChat';
import type {
  Attachment,
  ChatMessage,
  Conversation,
  CustomInstructionsData,
  FeedbackState,
  ModelTier,
  SourceLink,
  ThemeMode,
  UILanguage,
} from './types/chat';
import { Sidebar } from './components/Sidebar';
import { WelcomeScreen } from './components/WelcomeScreen';
import { ChatMessageItem } from './components/ChatMessageItem';
import { Composer } from './components/Composer';
import { SettingsModal } from './components/SettingsModal';
import { ShareModal } from './components/ShareModal';
import { VoiceChatModal } from './components/VoiceChatModal';

function makeId(prefix: string): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return `${prefix}-${crypto.randomUUID()}`;
  }
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

export default function App() {
  const [conversations, setConversations] = useState<Conversation[]>(() => loadConversations());
  const [activeChatId, setActiveChatId] = useState<string | null>(() => loadActiveChatId());
  const [uiLang, setUiLang] = useState<UILanguage>(() => loadUILanguage());
  const [theme, setTheme] = useState<ThemeMode>(() => loadTheme());
  const [modelTier, setModelTier] = useState<ModelTier>(() => loadModelTier());
  const [customInstructions, setCustomInstructions] = useState<CustomInstructionsData>(() =>
    loadCustomInstructions()
  );
  const [webSearch, setWebSearch] = useState(false);

  // Temporary chat state (incognito, not persisted to history)
  const [isTemporaryMode, setIsTemporaryMode] = useState(false);
  const [tempMessages, setTempMessages] = useState<ChatMessage[]>([]);

  // Shared conversation snapshot loaded from URL #share=
  const [sharedConversation, setSharedConversation] = useState<Conversation | null>(() =>
    parseShareHash(window.location.hash)
  );

  const [isSidebarOpenDesktop, setIsSidebarOpenDesktop] = useState(true);
  const [isSidebarOpenMobile, setIsSidebarOpenMobile] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isShareOpen, setIsShareOpen] = useState(false);
  const [isVoiceChatOpen, setIsVoiceChatOpen] = useState(false);
  const [isModelMenuOpen, setIsModelMenuOpen] = useState(false);
  const [streamingKey, setStreamingKey] = useState<string | null>(null);

  const abortControllerRef = useRef<AbortController | null>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const shouldAutoScrollRef = useRef(true);
  const modelMenuRef = useRef<HTMLDivElement>(null);

  const t = TRANSLATIONS[uiLang];

  useEffect(() => {
    saveTheme(theme);
  }, [theme]);

  useEffect(() => {
    saveUILanguage(uiLang);
    document.documentElement.dir = t.dir;
    document.documentElement.lang = uiLang;
  }, [uiLang, t.dir]);

  useEffect(() => {
    saveConversations(conversations);
  }, [conversations]);

  useEffect(() => {
    saveActiveChatId(activeChatId);
  }, [activeChatId]);

  const activeConversation = useMemo(() => {
    if (isTemporaryMode) return null;
    return conversations.find((c) => c.id === activeChatId) || null;
  }, [conversations, activeChatId, isTemporaryMode]);

  useEffect(() => {
    if (activeConversation) {
      setModelTier(activeConversation.modelTier);
    }
  }, [activeConversation?.id]);

  const handleStopGenerating = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
    setStreamingKey(null);
  }, []);

  const clearShareHash = useCallback(() => {
    setSharedConversation(null);
    if (window.location.hash.startsWith('#share=')) {
      window.history.replaceState(null, '', `${window.location.pathname}${window.location.search}`);
    }
  }, []);

  useEffect(() => {
    const onHashChange = () => {
      const parsed = parseShareHash(window.location.hash);
      if (parsed) {
        setSharedConversation(parsed);
      }
    };
    window.addEventListener('hashchange', onHashChange);
    return () => window.removeEventListener('hashchange', onHashChange);
  }, []);

  const handleNewChat = useCallback(() => {
    handleStopGenerating();
    clearShareHash();
    setIsTemporaryMode(false);
    setTempMessages([]);
    setActiveChatId(null);
    shouldAutoScrollRef.current = true;
  }, [handleStopGenerating, clearShareHash]);

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (isSidebarOpenMobile) setIsSidebarOpenMobile(false);
        if (isModelMenuOpen) setIsModelMenuOpen(false);
      }
      if ((e.metaKey || e.ctrlKey) && e.shiftKey && e.key.toLowerCase() === 'o') {
        e.preventDefault();
        handleNewChat();
      }
    };
    const onMouseDown = (e: MouseEvent) => {
      if (
        isModelMenuOpen &&
        modelMenuRef.current &&
        !modelMenuRef.current.contains(e.target as Node)
      ) {
        setIsModelMenuOpen(false);
      }
    };
    window.addEventListener('keydown', onKeyDown);
    window.addEventListener('mousedown', onMouseDown);
    return () => {
      window.removeEventListener('keydown', onKeyDown);
      window.removeEventListener('mousedown', onMouseDown);
    };
  }, [isSidebarOpenMobile, isModelMenuOpen, handleNewChat]);

  const messages = sharedConversation
    ? sharedConversation.messages
    : isTemporaryMode
      ? tempMessages
      : activeConversation?.messages || [];

  const scrollToBottom = useCallback(() => {
    const el = scrollContainerRef.current;
    if (!el || !shouldAutoScrollRef.current) return;
    el.scrollTop = el.scrollHeight;
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages, scrollToBottom]);

  const handleScroll = () => {
    const el = scrollContainerRef.current;
    if (!el) return;
    const distanceFromBottom = el.scrollHeight - el.scrollTop - el.clientHeight;
    shouldAutoScrollRef.current = distanceFromBottom < 110;
  };

  const handleSelectChat = useCallback(
    (id: string) => {
      if (!isTemporaryMode && !sharedConversation && id === activeChatId) return;
      handleStopGenerating();
      clearShareHash();
      setIsTemporaryMode(false);
      setTempMessages([]);
      setActiveChatId(id);
      shouldAutoScrollRef.current = true;
    },
    [activeChatId, isTemporaryMode, sharedConversation, handleStopGenerating, clearShareHash]
  );

  const handleToggleTemporaryChat = () => {
    handleStopGenerating();
    clearShareHash();
    if (isTemporaryMode) {
      setIsTemporaryMode(false);
      setTempMessages([]);
    } else {
      setIsTemporaryMode(true);
      setTempMessages([]);
      setActiveChatId(null);
    }
    shouldAutoScrollRef.current = true;
  };

  const handleContinueSharedChat = useCallback(() => {
    if (!sharedConversation) return;
    const newId = makeId('chat');
    const now = Date.now();
    const cloned: Conversation = {
      ...sharedConversation,
      id: newId,
      updatedAt: now,
      modelTier,
    };
    setConversations((prev) => [cloned, ...prev]);
    setActiveChatId(newId);
    setIsTemporaryMode(false);
    clearShareHash();
    shouldAutoScrollRef.current = true;
  }, [sharedConversation, modelTier, clearShareHash]);

  const handleRenameChat = useCallback((id: string, newTitle: string) => {
    setConversations((prev) =>
      prev.map((c) => (c.id === id ? { ...c, title: newTitle, updatedAt: Date.now() } : c))
    );
  }, []);

  const handleDeleteChat = useCallback(
    (id: string) => {
      if (streamingKey === id) {
        handleStopGenerating();
      }
      setConversations((prev) => prev.filter((c) => c.id !== id));
      if (activeChatId === id) {
        setActiveChatId(null);
      }
    },
    [activeChatId, streamingKey, handleStopGenerating]
  );

  const handleClearAll = useCallback(() => {
    handleStopGenerating();
    setConversations([]);
    setActiveChatId(null);
  }, [handleStopGenerating]);

  const handleSelectModelTier = (tier: ModelTier) => {
    setModelTier(tier);
    saveModelTier(tier);
    setIsModelMenuOpen(false);
    if (!isTemporaryMode && activeChatId) {
      setConversations((prev) =>
        prev.map((c) => (c.id === activeChatId ? { ...c, modelTier: tier } : c))
      );
    }
  };

  const handleSaveCustomInstructions = (data: CustomInstructionsData) => {
    setCustomInstructions(data);
    saveCustomInstructions(data);
  };

  const handleFeedback = (messageId: string, feedback: FeedbackState) => {
    if (isTemporaryMode) {
      setTempMessages((prev) =>
        prev.map((m) => (m.id === messageId ? { ...m, feedback } : m))
      );
    } else if (activeChatId) {
      setConversations((prev) =>
        prev.map((c) =>
          c.id === activeChatId
            ? {
                ...c,
                messages: c.messages.map((m) => (m.id === messageId ? { ...m, feedback } : m)),
              }
            : c
        )
      );
    }
  };

  const fetchAutoTitle = async (chatId: string, prompt: string) => {
    try {
      const res = await fetch('/api/title', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt }),
      });
      if (!res.ok) return;
      const data = (await res.json()) as { title?: string };
      if (data.title) {
        setConversations((prev) =>
          prev.map((c) => (c.id === chatId ? { ...c, title: data.title! } : c))
        );
      }
    } catch {
      // ignore title failures
    }
  };

  const streamAssistantReply = async (
    targetKey: string,
    isTemp: boolean,
    historyForApi: ChatMessage[],
    assistantMessageId: string,
    tier: ModelTier,
    useSearch: boolean
  ) => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    const controller = new AbortController();
    abortControllerRef.current = controller;
    setStreamingKey(targetKey);
    shouldAutoScrollRef.current = true;

    const payloadMessages = historyForApi
      .filter((m) => !m.isError)
      .map((m) => ({
        role: m.role,
        content: m.content,
        attachments: m.attachments?.map((att) => ({
          name: att.name,
          mimeType: att.mimeType,
          data: att.data,
          kind: att.kind,
        })),
      }));

    const updateAssistantMessage = (updater: (msg: ChatMessage) => ChatMessage) => {
      if (isTemp) {
        setTempMessages((prev) =>
          prev.map((m) => (m.id === assistantMessageId ? updater(m) : m))
        );
      } else {
        setConversations((prev) =>
          prev.map((conv) =>
            conv.id === targetKey
              ? {
                  ...conv,
                  updatedAt: Date.now(),
                  messages: conv.messages.map((m) =>
                    m.id === assistantMessageId ? updater(m) : m
                  ),
                }
              : conv
          )
        );
      }
    };

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: payloadMessages,
          modelTier: tier,
          webSearch: useSearch,
          customInstructions,
        }),
        signal: controller.signal,
      });

      if (!response.ok) {
        let errMessage = `Request failed (${response.status})`;
        try {
          const errBody = (await response.json()) as { error?: string };
          if (errBody.error) errMessage = errBody.error;
        } catch {
          // ignore
        }
        updateAssistantMessage((m) => ({ ...m, content: errMessage, isError: true }));
        return;
      }

      if (!response.body) {
        updateAssistantMessage((m) => ({
          ...m,
          content: 'Empty response stream from server.',
          isError: true,
        }));
        return;
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';
      let receivedAnyEvent = false;

      while (true) {
        const { value, done } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const events = buffer.split('\n\n');
        buffer = events.pop() || '';

        for (const evt of events) {
          const lines = evt.split('\n');
          for (const line of lines) {
            if (!line.startsWith('data: ')) continue;
            const rawJson = line.slice(6).trim();
            if (!rawJson) continue;
            try {
              const parsed = JSON.parse(rawJson) as {
                type: 'delta' | 'sources' | 'done' | 'error';
                text?: string;
                sources?: SourceLink[];
                message?: string;
              };
              if (parsed.type === 'delta' && parsed.text) {
                receivedAnyEvent = true;
                updateAssistantMessage((m) => ({
                  ...m,
                  content: m.content + parsed.text,
                }));
              } else if (parsed.type === 'sources' && Array.isArray(parsed.sources)) {
                updateAssistantMessage((m) => ({
                  ...m,
                  sources: parsed.sources,
                }));
              } else if (parsed.type === 'error') {
                receivedAnyEvent = true;
                updateAssistantMessage((m) => ({
                  ...m,
                  content: parsed.message || 'An error occurred while generating a response.',
                  isError: true,
                }));
              }
            } catch {
              // ignore malformed SSE chunk
            }
          }
        }
      }

      if (!receivedAnyEvent) {
        updateAssistantMessage((m) =>
          m.content
            ? m
            : {
                ...m,
                content: 'No response was received from the server. Please try again.',
                isError: true,
              }
        );
      }
    } catch (err) {
      if (err instanceof DOMException && err.name === 'AbortError') {
        return;
      }
      const msg = err instanceof Error ? err.message : 'Network connection failed.';
      updateAssistantMessage((m) => ({
        ...m,
        content: m.content ? m.content : msg,
        isError: !m.content,
      }));
    } finally {
      if (abortControllerRef.current === controller) {
        abortControllerRef.current = null;
      }
      setStreamingKey((prev) => (prev === targetKey ? null : prev));
    }
  };

  const handleSend = async (text: string, attachments: Attachment[]) => {
    const now = Date.now();
    const userMsg: ChatMessage = {
      id: makeId('user'),
      role: 'user',
      content: text,
      attachments: attachments.length > 0 ? attachments : undefined,
      createdAt: now,
    };
    const assistantMsg: ChatMessage = {
      id: makeId('asst'),
      role: 'assistant',
      content: '',
      createdAt: now + 1,
    };

    if (sharedConversation) {
      const chatId = makeId('chat');
      const updatedHistory = [...sharedConversation.messages, userMsg];
      const continuedConv: Conversation = {
        ...sharedConversation,
        id: chatId,
        messages: [...updatedHistory, assistantMsg],
        updatedAt: now,
        modelTier,
      };
      setConversations((prev) => [continuedConv, ...prev]);
      setActiveChatId(chatId);
      setIsTemporaryMode(false);
      clearShareHash();
      await streamAssistantReply(
        chatId,
        false,
        updatedHistory,
        assistantMsg.id,
        modelTier,
        webSearch
      );
      return;
    }

    if (isTemporaryMode) {
      const updated = [...tempMessages, userMsg];
      setTempMessages([...updated, assistantMsg]);
      await streamAssistantReply('temp', true, updated, assistantMsg.id, modelTier, webSearch);
      return;
    }

    if (!activeConversation) {
      const chatId = makeId('chat');
      const fallbackTitle =
        text.split(/\s+/).slice(0, 6).join(' ').slice(0, 48) ||
        attachments[0]?.name ||
        t.untitledChat;

      const newConv: Conversation = {
        id: chatId,
        title: fallbackTitle,
        messages: [userMsg, assistantMsg],
        createdAt: now,
        updatedAt: now,
        modelTier,
      };

      setConversations((prev) => [newConv, ...prev]);
      setActiveChatId(chatId);

      await streamAssistantReply(chatId, false, [userMsg], assistantMsg.id, modelTier, webSearch);

      if (text.trim()) {
        void fetchAutoTitle(chatId, text);
      }
    } else {
      const chatId = activeConversation.id;
      const updatedHistory = [...activeConversation.messages, userMsg];

      setConversations((prev) =>
        prev.map((c) =>
          c.id === chatId
            ? {
                ...c,
                updatedAt: now,
                modelTier,
                messages: [...updatedHistory, assistantMsg],
              }
            : c
        )
      );

      await streamAssistantReply(
        chatId,
        false,
        updatedHistory,
        assistantMsg.id,
        modelTier,
        webSearch
      );
    }
  };

  const handleRegenerate = async () => {
    if (streamingKey) return;
    const msgs = [...messages];
    if (msgs.length === 0) return;

    if (msgs[msgs.length - 1].role === 'assistant') {
      msgs.pop();
    }
    if (msgs.length === 0) return;

    const assistantMsg: ChatMessage = {
      id: makeId('asst'),
      role: 'assistant',
      content: '',
      createdAt: Date.now(),
    };

    if (isTemporaryMode) {
      setTempMessages([...msgs, assistantMsg]);
      await streamAssistantReply('temp', true, msgs, assistantMsg.id, modelTier, webSearch);
      return;
    }

    if (!activeConversation) return;
    const chatId = activeConversation.id;
    setConversations((prev) =>
      prev.map((c) =>
        c.id === chatId ? { ...c, updatedAt: Date.now(), messages: [...msgs, assistantMsg] } : c
      )
    );

    await streamAssistantReply(chatId, false, msgs, assistantMsg.id, modelTier, webSearch);
  };

  const handleEditUserMessage = async (messageId: string, newContent: string) => {
    if (streamingKey) return;
    const idx = messages.findIndex((m) => m.id === messageId);
    if (idx === -1) return;

    const updatedUserMsg: ChatMessage = {
      ...messages[idx],
      content: newContent,
      createdAt: Date.now(),
    };
    const truncatedHistory = [...messages.slice(0, idx), updatedUserMsg];
    const assistantMsg: ChatMessage = {
      id: makeId('asst'),
      role: 'assistant',
      content: '',
      createdAt: Date.now() + 1,
    };

    if (isTemporaryMode) {
      setTempMessages([...truncatedHistory, assistantMsg]);
      await streamAssistantReply(
        'temp',
        true,
        truncatedHistory,
        assistantMsg.id,
        modelTier,
        webSearch
      );
      return;
    }

    if (!activeConversation) return;
    const chatId = activeConversation.id;
    setConversations((prev) =>
      prev.map((c) =>
        c.id === chatId
          ? {
              ...c,
              updatedAt: Date.now(),
              messages: [...truncatedHistory, assistantMsg],
            }
          : c
      )
    );

    await streamAssistantReply(
      chatId,
      false,
      truncatedHistory,
      assistantMsg.id,
      modelTier,
      webSearch
    );
  };

  const handleAppendVoiceTurn = useCallback(
    (userText: string, assistantText: string) => {
      const now = Date.now();
      const newEntries: ChatMessage[] = [];
      if (userText.trim()) {
        newEntries.push({
          id: makeId('user'),
          role: 'user',
          content: userText.trim(),
          createdAt: now,
        });
      }
      if (assistantText.trim()) {
        newEntries.push({
          id: makeId('asst'),
          role: 'assistant',
          content: assistantText.trim(),
          createdAt: now + 1,
        });
      }
      if (newEntries.length === 0) return;

      if (isTemporaryMode) {
        setTempMessages((prev) => [...prev, ...newEntries]);
        return;
      }

      if (activeChatId) {
        setConversations((prev) =>
          prev.map((c) =>
            c.id === activeChatId
              ? { ...c, updatedAt: now, messages: [...c.messages, ...newEntries] }
              : c
          )
        );
      } else {
        const chatId = makeId('chat');
        const fallbackTitle =
          userText.trim().split(/\s+/).slice(0, 6).join(' ').slice(0, 48) || t.voiceChat;
        const newConv: Conversation = {
          id: chatId,
          title: fallbackTitle,
          messages: newEntries,
          createdAt: now,
          updatedAt: now,
          modelTier,
        };
        setConversations((prev) => [newConv, ...prev]);
        setActiveChatId(chatId);
      }
    },
    [isTemporaryMode, activeChatId, modelTier, t.voiceChat]
  );

  const currentTargetKey = isTemporaryMode ? 'temp' : activeChatId;
  const isGenerating = streamingKey !== null && streamingKey === currentTargetKey;

  const lastAssistantId = useMemo(() => {
    for (let i = messages.length - 1; i >= 0; i--) {
      if (messages[i].role === 'assistant') return messages[i].id;
    }
    return null;
  }, [messages]);

  const exportableConversation: Conversation | null = useMemo(() => {
    if (sharedConversation) return sharedConversation;
    if (messages.length === 0) return null;
    if (isTemporaryMode) {
      return {
        id: 'temp',
        title: t.temporaryChat,
        messages,
        createdAt: messages[0].createdAt,
        updatedAt: messages[messages.length - 1].createdAt,
        modelTier,
      };
    }
    return activeConversation;
  }, [sharedConversation, messages, isTemporaryMode, t.temporaryChat, modelTier, activeConversation]);

  return (
    <div className="flex h-dvh w-full overflow-hidden bg-white dark:bg-[#141517] text-zinc-900 dark:text-zinc-100">
      <Sidebar
        conversations={conversations}
        activeId={isTemporaryMode ? null : activeChatId}
        uiLang={uiLang}
        isOpenDesktop={isSidebarOpenDesktop}
        isOpenMobile={isSidebarOpenMobile}
        onCloseMobile={() => setIsSidebarOpenMobile(false)}
        onToggleDesktop={() => setIsSidebarOpenDesktop((prev) => !prev)}
        onNewChat={handleNewChat}
        onSelectChat={handleSelectChat}
        onRenameChat={handleRenameChat}
        onDeleteChat={handleDeleteChat}
        onOpenSettings={() => setIsSettingsOpen(true)}
      />

      <main className="flex-1 flex flex-col min-w-0 h-full relative">
        {/* ChatGPT-style Clean Header */}
        <header className="h-13 shrink-0 flex items-center justify-between gap-4 px-3 sm:px-5 border-b border-zinc-200/70 dark:border-zinc-800/80 bg-white/90 dark:bg-[#141517]/90 backdrop-blur-sm">
          <div className="flex items-center gap-1.5 min-w-0">
            <button
              type="button"
              onClick={() => setIsSidebarOpenMobile(true)}
              aria-label="Open menu"
              className="md:hidden h-10 w-10 inline-flex items-center justify-center rounded-lg text-zinc-600 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors cursor-pointer shrink-0"
            >
              <Menu className="w-5 h-5" />
            </button>

            {!isSidebarOpenDesktop && (
              <button
                type="button"
                onClick={() => setIsSidebarOpenDesktop(true)}
                aria-label="Open sidebar"
                className="hidden md:inline-flex h-9 w-9 items-center justify-center rounded-lg text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors cursor-pointer shrink-0"
              >
                <PanelLeft className="w-4 h-4" />
              </button>
            )}

            {/* ChatGPT-style Model Switcher Dropdown */}
            <div ref={modelMenuRef} className="relative">
              <button
                type="button"
                onClick={() => setIsModelMenuOpen((prev) => !prev)}
                aria-expanded={isModelMenuOpen}
                aria-haspopup="menu"
                className="h-9 px-2.5 inline-flex items-center gap-1.5 rounded-lg text-sm font-semibold text-zinc-900 dark:text-zinc-100 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors cursor-pointer whitespace-nowrap shrink-0"
              >
                <span>
                  {modelTier === 'thinking'
                    ? t.modelThinking
                    : modelTier === 'code'
                      ? t.modelCode
                      : t.modelFast}
                </span>
                <ChevronDown className="w-4 h-4 text-zinc-400" />
              </button>

              {isModelMenuOpen && (
                <div
                  role="menu"
                  className="absolute start-0 mt-1.5 w-68 rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-[#1C1E23] shadow-xl p-1.5 z-30"
                >
                  {(
                    [
                      {
                        tier: 'fast' as const,
                        title: t.modelFast,
                        desc: t.modelFastDesc,
                      },
                      {
                        tier: 'thinking' as const,
                        title: t.modelThinking,
                        desc: t.modelThinkingDesc,
                      },
                      {
                        tier: 'code' as const,
                        title: t.modelCode,
                        desc: t.modelCodeDesc,
                      },
                    ]
                  ).map((item) => (
                    <button
                      key={item.tier}
                      type="button"
                      role="menuitem"
                      onClick={() => handleSelectModelTier(item.tier)}
                      className="w-full flex items-start justify-between gap-3 px-3 py-2.5 rounded-xl text-start hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors cursor-pointer"
                    >
                      <div className="min-w-0">
                        <div className="text-xs font-semibold text-zinc-900 dark:text-zinc-100">
                          {item.title}
                        </div>
                        <div className="text-[11.5px] text-zinc-500 dark:text-zinc-400 mt-0.5 leading-snug">
                          {item.desc}
                        </div>
                      </div>
                      {modelTier === item.tier && (
                        <Check className="w-4 h-4 text-zinc-900 dark:text-zinc-100 shrink-0 mt-0.5" />
                      )}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div className="flex items-center gap-1 shrink-0">
            {/* Temporary Chat Toggle */}
            <button
              type="button"
              onClick={handleToggleTemporaryChat}
              aria-pressed={isTemporaryMode}
              title={t.temporaryChat}
              aria-label={t.temporaryChat}
              className={`h-9 px-2.5 inline-flex items-center gap-1.5 rounded-lg text-xs font-medium transition-colors cursor-pointer whitespace-nowrap shrink-0 ${
                isTemporaryMode
                  ? 'bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900'
                  : 'text-zinc-600 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800'
              }`}
            >
              <MessageSquareDashed className="w-4 h-4" />
              <span className="hidden lg:inline">{t.temporaryChat}</span>
            </button>

            {/* Share & Export Chat */}
            {exportableConversation && (
              <button
                type="button"
                onClick={() => setIsShareOpen(true)}
                aria-label={t.shareChat}
                title={t.shareChat}
                className="h-9 px-2.5 inline-flex items-center gap-1.5 rounded-lg text-xs font-medium text-zinc-700 dark:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors cursor-pointer whitespace-nowrap shrink-0"
              >
                <Share2 className="w-4 h-4" />
                <span className="hidden sm:inline">{t.shareChat}</span>
              </button>
            )}

            {/* Quick Theme Switch */}
            <button
              type="button"
              onClick={() => setTheme((prev) => (prev === 'dark' ? 'light' : 'dark'))}
              aria-label={theme === 'dark' ? t.themeLight : t.themeDark}
              title={theme === 'dark' ? t.themeLight : t.themeDark}
              className="h-9 w-9 inline-flex items-center justify-center rounded-lg text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors cursor-pointer"
            >
              {theme === 'dark' ? (
                <Sun className="w-4 h-4 text-amber-400" />
              ) : (
                <Moon className="w-4 h-4" />
              )}
            </button>

            <button
              type="button"
              onClick={handleNewChat}
              aria-label={t.newChat}
              title={t.newChat}
              className="h-9 w-9 inline-flex items-center justify-center rounded-lg text-zinc-600 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors cursor-pointer shrink-0"
            >
              <SquarePen className="w-4 h-4" />
            </button>
          </div>
        </header>

        {/* Shared or Temporary Chat Banner */}
        {sharedConversation ? (
          <div className="px-4 py-2 flex items-center justify-center gap-3 text-xs text-zinc-700 dark:text-zinc-200 bg-zinc-100/90 dark:bg-zinc-800/70 border-b border-zinc-200/70 dark:border-zinc-800">
            <span>{t.sharedChatBanner}</span>
            <button
              type="button"
              onClick={handleContinueSharedChat}
              className="px-2.5 py-1 rounded-md bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 font-medium hover:opacity-90 transition-opacity cursor-pointer whitespace-nowrap shrink-0"
            >
              {t.continueChat}
            </button>
          </div>
        ) : (
          isTemporaryMode && (
            <div className="px-4 py-2 text-center text-xs text-zinc-600 dark:text-zinc-300 bg-zinc-100/80 dark:bg-zinc-800/50 border-b border-zinc-200/70 dark:border-zinc-800">
              {t.temporaryChatBanner}
            </div>
          )
        )}

        {/* Scrollable Thread or Welcome Viewport */}
        <div
          ref={scrollContainerRef}
          onScroll={handleScroll}
          className="flex-1 overflow-y-auto scroll-smooth"
        >
          {messages.length === 0 ? (
            <div className="min-h-full flex flex-col justify-center">
              <WelcomeScreen
                uiLang={uiLang}
                onSelectPrompt={(prompt) => void handleSend(prompt, [])}
              />
            </div>
          ) : (
            <div className="py-6 space-y-2">
              {messages.map((msg) => (
                <ChatMessageItem
                  key={msg.id}
                  message={msg}
                  uiLang={uiLang}
                  isStreaming={isGenerating && msg.id === lastAssistantId}
                  isLastAssistant={msg.id === lastAssistantId}
                  onRegenerate={() => void handleRegenerate()}
                  onEditUserMessage={(id, content) => void handleEditUserMessage(id, content)}
                  onFeedback={handleFeedback}
                />
              ))}
            </div>
          )}
        </div>

        {/* Sticky Bottom Composer */}
        <div className="shrink-0 bg-gradient-to-t from-white via-white to-white/80 dark:from-[#141517] dark:via-[#141517] dark:to-[#141517]/80">
          <Composer
            uiLang={uiLang}
            webSearch={webSearch}
            isGenerating={isGenerating}
            onToggleWebSearch={() => setWebSearch((prev) => !prev)}
            onOpenVoiceChat={() => setIsVoiceChatOpen(true)}
            onSend={(text, attachments) => void handleSend(text, attachments)}
            onStop={handleStopGenerating}
          />
        </div>
      </main>

      <SettingsModal
        isOpen={isSettingsOpen}
        uiLang={uiLang}
        theme={theme}
        customInstructions={customInstructions}
        hasConversations={conversations.length > 0}
        onClose={() => setIsSettingsOpen(false)}
        onChangeUILanguage={setUiLang}
        onToggleTheme={() => setTheme((prev) => (prev === 'dark' ? 'light' : 'dark'))}
        onSaveCustomInstructions={handleSaveCustomInstructions}
        onClearAll={handleClearAll}
      />

      <ShareModal
        isOpen={isShareOpen}
        conversation={exportableConversation}
        uiLang={uiLang}
        onClose={() => setIsShareOpen(false)}
      />

      <VoiceChatModal
        isOpen={isVoiceChatOpen}
        uiLang={uiLang}
        customInstructions={customInstructions}
        modelTier={modelTier}
        webSearch={webSearch}
        onClose={() => setIsVoiceChatOpen(false)}
        onAppendVoiceTurn={handleAppendVoiceTurn}
      />
    </div>
  );
}
