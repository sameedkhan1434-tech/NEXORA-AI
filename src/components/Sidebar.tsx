import React, { useMemo, useState } from 'react';
import {
  Check,
  MessageSquarePlus,
  PanelLeftClose,
  Pencil,
  Search,
  Settings,
  Trash2,
  X,
} from 'lucide-react';
import type { Conversation, UILanguage } from '../types/chat';
import { TRANSLATIONS } from '../i18n/translations';
import { getScriptClass, getTextDir } from '../utils/bidi';
import { NexoraLogo } from './NexoraLogo';

interface SidebarProps {
  conversations: Conversation[];
  activeId: string | null;
  uiLang: UILanguage;
  isOpenDesktop: boolean;
  isOpenMobile: boolean;
  onCloseMobile: () => void;
  onToggleDesktop: () => void;
  onNewChat: () => void;
  onSelectChat: (id: string) => void;
  onRenameChat: (id: string, newTitle: string) => void;
  onDeleteChat: (id: string) => void;
  onOpenSettings: () => void;
}

interface GroupedChats {
  label: string;
  items: Conversation[];
}

export const Sidebar: React.FC<SidebarProps> = ({
  conversations,
  activeId,
  uiLang,
  isOpenDesktop,
  isOpenMobile,
  onCloseMobile,
  onToggleDesktop,
  onNewChat,
  onSelectChat,
  onRenameChat,
  onDeleteChat,
  onOpenSettings,
}) => {
  const t = TRANSLATIONS[uiLang];
  const [searchQuery, setSearchQuery] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editValue, setEditValue] = useState('');

  const filteredConversations = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    const sorted = [...conversations].sort((a, b) => b.updatedAt - a.updatedAt);
    if (!q) return sorted;
    return sorted.filter(
      (c) =>
        c.title.toLowerCase().includes(q) ||
        c.messages.some((m) => m.content.toLowerCase().includes(q))
    );
  }, [conversations, searchQuery]);

  const groupedChats = useMemo<GroupedChats[]>(() => {
    const now = new Date();
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
    const startOfYesterday = startOfToday - 86400000;
    const startOf7Days = startOfToday - 7 * 86400000;

    const groups: Record<'today' | 'yesterday' | 'week' | 'older', Conversation[]> = {
      today: [],
      yesterday: [],
      week: [],
      older: [],
    };

    for (const conv of filteredConversations) {
      if (conv.updatedAt >= startOfToday) {
        groups.today.push(conv);
      } else if (conv.updatedAt >= startOfYesterday) {
        groups.yesterday.push(conv);
      } else if (conv.updatedAt >= startOf7Days) {
        groups.week.push(conv);
      } else {
        groups.older.push(conv);
      }
    }

    const result: GroupedChats[] = [];
    if (groups.today.length) result.push({ label: t.today, items: groups.today });
    if (groups.yesterday.length) result.push({ label: t.yesterday, items: groups.yesterday });
    if (groups.week.length) result.push({ label: t.previous7Days, items: groups.week });
    if (groups.older.length) result.push({ label: t.older, items: groups.older });
    return result;
  }, [filteredConversations, t]);

  const startEditing = (conv: Conversation) => {
    setEditingId(conv.id);
    setEditValue(conv.title);
  };

  const commitRename = (id: string) => {
    const trimmed = editValue.trim();
    if (trimmed) {
      onRenameChat(id, trimmed);
    }
    setEditingId(null);
  };

  const sidebarContent = (
    <div className="flex flex-col h-full w-[268px] bg-[#F7F8FA] dark:bg-[#17181C] border-e border-zinc-200/80 dark:border-zinc-800/90 select-none">
      {/* Top brand & collapse */}
      <div className="flex items-center justify-between px-3.5 h-14 shrink-0">
        <button
          type="button"
          onClick={() => {
            onNewChat();
            onCloseMobile();
          }}
          className="inline-flex items-center gap-2.5 text-zinc-900 dark:text-zinc-100 hover:opacity-85 transition-opacity cursor-pointer"
        >
          <NexoraLogo size={24} />
          <span className="font-semibold text-[15px] tracking-tight whitespace-nowrap">
            {t.brandName}
          </span>
        </button>

        <button
          type="button"
          onClick={() => {
            onToggleDesktop();
            onCloseMobile();
          }}
          aria-label="Toggle sidebar"
          className="h-9 w-9 inline-flex items-center justify-center rounded-lg text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 hover:bg-zinc-200/60 dark:hover:bg-zinc-800 transition-colors cursor-pointer"
        >
          <PanelLeftClose className="w-4 h-4 hidden md:block" />
          <X className="w-4 h-4 md:hidden" />
        </button>
      </div>

      {/* New Chat & Search */}
      <div className="px-3 pb-3 space-y-2 shrink-0">
        <button
          type="button"
          onClick={() => {
            onNewChat();
            onCloseMobile();
          }}
          className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl bg-white dark:bg-[#212329] border border-zinc-200 dark:border-zinc-700/80 text-sm font-medium text-zinc-900 dark:text-zinc-100 hover:border-zinc-300 dark:hover:border-zinc-600 hover:bg-zinc-50 dark:hover:bg-[#272A31] transition-colors cursor-pointer shadow-2xs"
        >
          <MessageSquarePlus className="w-4 h-4 text-zinc-700 dark:text-zinc-200 shrink-0" />
          <span className="truncate">{t.newChat}</span>
        </button>

        <div className="relative">
          <Search className="w-3.5 h-3.5 text-zinc-400 absolute start-3 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={t.searchPlaceholder}
            className="w-full ps-8 pe-7 py-2 text-xs rounded-lg bg-zinc-200/50 dark:bg-zinc-800/60 border border-transparent focus:border-zinc-300 dark:focus:border-zinc-700 focus:bg-white dark:focus:bg-[#202329] text-zinc-800 dark:text-zinc-200 placeholder:text-zinc-400 dark:placeholder:text-zinc-500 focus:outline-none transition-colors"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => setSearchQuery('')}
              aria-label="Clear search"
              className="absolute end-2 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 cursor-pointer"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* Chat History List */}
      <div className="flex-1 overflow-y-auto px-2.5 py-1 space-y-4">
        {groupedChats.length === 0 ? (
          <div className="px-3 py-8 text-center text-xs text-zinc-400 dark:text-zinc-500">
            {searchQuery.trim() ? t.noSearchResults : t.noChatsYet}
          </div>
        ) : (
          groupedChats.map((group) => (
            <div key={group.label}>
              <div className="px-2.5 pb-1.5 text-[11px] font-medium text-zinc-400 dark:text-zinc-500">
                {group.label}
              </div>
              <div className="space-y-0.5">
                {group.items.map((conv) => {
                  const isActive = conv.id === activeId;
                  const isEditing = editingId === conv.id;
                  const titleScript = getScriptClass(conv.title);
                  const titleDir = getTextDir(conv.title);

                  return (
                    <div
                      key={conv.id}
                      className={`group relative flex items-center rounded-lg transition-colors ${
                        isActive
                          ? 'bg-zinc-200/80 dark:bg-zinc-800 text-zinc-900 dark:text-white'
                          : 'text-zinc-700 dark:text-zinc-300 hover:bg-zinc-200/45 dark:hover:bg-zinc-800/50'
                      }`}
                    >
                      {isEditing ? (
                        <div className="flex items-center gap-1 w-full px-2 py-1.5">
                          <input
                            type="text"
                            dir="auto"
                            value={editValue}
                            onChange={(e) => setEditValue(e.target.value)}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') commitRename(conv.id);
                              if (e.key === 'Escape') setEditingId(null);
                            }}
                            onBlur={() => commitRename(conv.id)}
                            autoFocus
                            className="flex-1 min-w-0 bg-white dark:bg-zinc-900 px-2 py-1 rounded text-xs text-zinc-900 dark:text-zinc-100 border border-zinc-300 dark:border-zinc-700 focus:outline-none"
                          />
                          <button
                            type="button"
                            onMouseDown={(e) => {
                              e.preventDefault();
                              commitRename(conv.id);
                            }}
                            className="p-1 text-emerald-600 dark:text-emerald-400 cursor-pointer"
                          >
                            <Check className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      ) : (
                        <>
                          <button
                            type="button"
                            onClick={() => {
                              onSelectChat(conv.id);
                              onCloseMobile();
                            }}
                            dir={titleDir}
                            className={`flex-1 min-w-0 text-start px-2.5 py-2 text-[13px] truncate cursor-pointer ${
                              isActive ? 'font-medium' : 'font-normal'
                            } ${titleScript}`}
                          >
                            {conv.title || t.untitledChat}
                          </button>
                          <div className="flex items-center gap-0.5 pe-1.5 opacity-100 md:opacity-0 md:group-hover:opacity-100 focus-within:opacity-100 transition-opacity shrink-0">
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                startEditing(conv);
                              }}
                              title={t.rename}
                              aria-label={t.rename}
                              className="p-1.5 rounded-md text-zinc-400 hover:text-zinc-800 dark:hover:text-zinc-100 hover:bg-zinc-300/50 dark:hover:bg-zinc-700/60 cursor-pointer"
                            >
                              <Pencil className="w-3 h-3" />
                            </button>
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                onDeleteChat(conv.id);
                              }}
                              title={t.delete}
                              aria-label={t.delete}
                              className="p-1.5 rounded-md text-zinc-400 hover:text-red-600 dark:hover:text-red-400 hover:bg-zinc-300/50 dark:hover:bg-zinc-700/60 cursor-pointer"
                            >
                              <Trash2 className="w-3 h-3" />
                            </button>
                          </div>
                        </>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          ))
        )}
      </div>

      {/* Bottom Settings Button (ChatGPT-style clean footer) */}
      <div className="p-2.5 border-t border-zinc-200/80 dark:border-zinc-800 shrink-0">
        <button
          type="button"
          onClick={() => {
            onOpenSettings();
            onCloseMobile();
          }}
          className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-xs font-medium text-zinc-700 dark:text-zinc-200 hover:bg-zinc-200/60 dark:hover:bg-zinc-800 transition-colors cursor-pointer"
        >
          <Settings className="w-4 h-4 text-zinc-500 dark:text-zinc-400" />
          <span>{t.settings}</span>
        </button>
      </div>
    </div>
  );

  return (
    <>
      <aside
        className={`hidden md:block shrink-0 overflow-hidden transition-[width] duration-200 ease-out ${
          isOpenDesktop ? 'w-[268px]' : 'w-0'
        }`}
      >
        {sidebarContent}
      </aside>

      {isOpenMobile && (
        <div className="fixed inset-0 z-50 md:hidden flex">
          <div
            className="fixed inset-0 bg-black/45 backdrop-blur-[1px]"
            onClick={onCloseMobile}
            aria-hidden="true"
          />
          <aside className="relative z-10 h-full shadow-2xl">{sidebarContent}</aside>
        </div>
      )}
    </>
  );
};
