import { create } from 'zustand';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/components/ui/use-toast';

export interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  citations?: Citation[];
  timestamp: Date;
  pending?: boolean;
  status?: 'pending' | 'sent' | 'failed';
  error?: string;
}

export interface Citation {
  chapter_title: string;
  section_title?: string;
  page_number?: number;
  similarity: number;
}

export interface Conversation {
  id: string;
  title: string;
  mode: 'academic' | 'clinical';
  messages: Message[];
  createdAt: Date;
  isPinned: boolean;
  user_sub?: string;
}

export interface UserSettings {
  theme: 'light' | 'dark';
  fontSize: 'small' | 'medium' | 'large';
  aiStyle: 'concise' | 'balanced' | 'detailed';
  showDisclaimers: boolean;
  notifications: boolean;
  shareAnalytics: boolean;
}

interface ChatStore {
  currentView: 'splash' | 'welcome' | 'chat' | 'history' | 'settings' | 'profile';
  activeTab: 'chat' | 'history' | 'settings' | 'profile';
  currentConversation: Conversation | null;
  conversations: Conversation[];
  isStreaming: boolean;
  mode: 'academic' | 'clinical';
  isOnline: boolean;
  offlineQueue: { conversationId: string; content: string; mode: 'academic' | 'clinical' }[];
  settings: UserSettings;
  user: { id: string; email?: string | null } | null;
  setUser: (user: { id: string; email?: string | null } | null) => void;
  setCurrentView: (view: ChatStore['currentView']) => void;
  setActiveTab: (tab: ChatStore['activeTab']) => void;
  setMode: (mode: 'academic' | 'clinical') => void;
  startNewConversation: () => void;
  setCurrentConversation: (conversation: Conversation | null) => void;
  sendMessage: (content: string) => Promise<void>;
  retryMessage: (messageId: string) => Promise<void>;
  loadConversations: () => Promise<void>;
  deleteConversation: (id: string) => Promise<void>;
  updateSettings: (settings: Partial<UserSettings>) => void;
  setOnlineStatus: (online: boolean) => void;
  flushOfflineQueue: () => Promise<void>;
}

export const useChatStore = create<ChatStore>((set, get) => ({
  currentView: 'splash',
  activeTab: 'chat',
  currentConversation: null,
  conversations: [],
  isStreaming: false,
  mode: 'academic',
  isOnline: typeof window !== 'undefined' ? navigator.onLine : true,
  offlineQueue: [],
  settings: {
    theme: 'light',
    fontSize: 'medium',
    aiStyle: 'balanced',
    showDisclaimers: true,
    notifications: true,
    shareAnalytics: false,
  },
  user: null,

  setUser: (user) => set({ user }),

  setCurrentView: (view) => set({ currentView: view }),
  
  setActiveTab: (tab) => set({ activeTab: tab }),
  
  setMode: (mode) => set({ mode }),
  
  setCurrentConversation: (conversation) => set({ currentConversation: conversation }),
  
  startNewConversation: () => {
    const newConv: Conversation = {
      id: crypto.randomUUID(),
      title: 'Untitled',
      mode: get().mode,
      messages: [],
      createdAt: new Date(),
      isPinned: false,
      user_sub: get().user?.id,
    };
    set((state) => ({
      currentConversation: newConv,
      conversations: [...state.conversations, newConv],
      currentView: 'chat',
    }));
  },
  
  sendMessage: async (content: string) => {
    let { currentConversation, mode, isOnline } = get();
    if (!currentConversation) {
      get().startNewConversation();
      currentConversation = get().currentConversation;
    }
    if (!currentConversation) return;

    const userMessage: Message = {
      id: crypto.randomUUID(),
      role: 'user',
      content,
      timestamp: new Date(),
      pending: !isOnline,
      status: isOnline ? 'sent' : 'pending',
    };

    set((state) => ({
      currentConversation: state.currentConversation
        ? { ...state.currentConversation, messages: [...state.currentConversation.messages, userMessage] }
        : null,
    }));

    set((state) => {
      if (!state.currentConversation) return {} as any;
      const updated = state.conversations.some((c) => c.id === state.currentConversation!.id)
        ? state.conversations.map((c) => (c.id === state.currentConversation!.id ? state.currentConversation! : c))
        : [...state.conversations, state.currentConversation!];
      if (typeof window !== 'undefined' && !get().isOnline) localStorage.setItem('conversations', JSON.stringify(updated));
      return { conversations: updated } as any;
    });

    if (!isOnline) {
      set((state) => ({
        offlineQueue: [...state.offlineQueue, { conversationId: state.currentConversation!.id, content, mode }],
      }));
      if (navigator.serviceWorker && 'ready' in navigator.serviceWorker) {
        navigator.serviceWorker.ready.then((reg) => {
          if (reg.sync && 'register' in reg.sync) {
            try { reg.sync.register('sync-messages'); } catch {}
          }
        });
      }
      return;
    }

    set({ isStreaming: true });

    const assistantMessage: Message = {
      id: crypto.randomUUID(),
      role: 'assistant',
      content: '',
      citations: [],
      timestamp: new Date(),
      status: 'pending',
    };

    set((state) => ({
      currentConversation: state.currentConversation
        ? { ...state.currentConversation, messages: [...state.currentConversation.messages, assistantMessage] }
        : null,
    }));

    set((state) => {
      if (!state.currentConversation) return {} as any;
      const updated = state.conversations.map((c) => (c.id === state.currentConversation!.id ? state.currentConversation! : c));
      if (typeof window !== 'undefined' && !get().isOnline) localStorage.setItem('conversations', JSON.stringify(updated));
      return { conversations: updated } as any;
    });

    try {
      const convId = currentConversation.id;

      const { error: convErr } = await supabase
        .from('nelson_conversations')
        .insert({ id: convId, title: currentConversation.title, mode, is_pinned: currentConversation.isPinned })
        .select()
        .single();
      if (convErr && convErr.code !== '23505') {
        console.error('Conversation create error', convErr);
      }

      const { data, error } = await supabase.functions.invoke('nelson-chat', {
        body: {
          message: content,
          mode: get().mode,
          conversationId: convId,
        },
        headers: { Accept: 'text/event-stream' },
      } as any);

      if (error) {
        const status = (error as any)?.status || 500;
        if (status === 429) {
          throw new Error('Too many requests. Please wait a moment and try again.');
        }
        throw new Error((error as any)?.message || 'Failed to call assistant');
      }

      let receivedFirstChunk = false;
      let bufferedText = '';
      let citations: Citation[] = [];
      let cancelled = false;

      const timeoutId = setTimeout(() => {
        cancelled = true;
        set({ isStreaming: false });
        set((state) => ({
          currentConversation: state.currentConversation
            ? {
                ...state.currentConversation,
                messages: state.currentConversation.messages.map((m) =>
                  m.id === assistantMessage.id ? { ...m, status: 'failed', error: 'Request timed out. Please try again.' } : m
                ),
              }
            : null,
        }));
        toast({ title: 'Request timed out', description: 'No response after 30 seconds. Try again.' });
      }, 30000);

      const processEvent = (line: string) => {
        if (!line.startsWith('data: ')) return;
        const payload = line.slice(6).trim();
        if (payload === '[DONE]') return;
        try {
          const json = JSON.parse(payload);
          const chunk = json.content as string | undefined;
          const cits = json.citations as Citation[] | undefined;
          if (cits && cits.length) {
            citations = cits;
          }
          if (chunk && !cancelled) {
            bufferedText += chunk;
            if (!receivedFirstChunk) {
              receivedFirstChunk = true;
              set({ isStreaming: true });
            }
            set((state) => ({
              currentConversation: state.currentConversation
                ? {
                    ...state.currentConversation,
                    messages: state.currentConversation.messages.map((m) =>
                      m.id === assistantMessage.id ? { ...m, content: bufferedText, citations } : m
                    ),
                  }
                : null,
            }));
          }
        } catch (e) {
          console.error('Parse error', e);
        }
      };

      if (data && typeof (data as any).getReader === 'function') {
        const reader = (data as ReadableStream<Uint8Array>).getReader();
        const decoder = new TextDecoder();
        while (true) {
          const { done, value } = await reader.read();
          if (done || cancelled) break;
          const text = decoder.decode(value, { stream: true });
          const lines = text.split('\n').filter((l) => l.trim() !== '');
          for (const line of lines) processEvent(line);
        }
      } else if (typeof data === 'string') {
        const lines = (data as string).split('\n').filter((l) => l.trim() !== '');
        for (const line of lines) processEvent(line);
      } else if ((data as any)?.data) {
        const resText = String((data as any).data);
        const lines = resText.split('\n').filter((l) => l.trim() !== '');
        for (const line of lines) processEvent(line);
      }

      clearTimeout(timeoutId);

      if (!bufferedText && !cancelled) {
        set((state) => ({
          currentConversation: state.currentConversation
            ? {
                ...state.currentConversation,
                messages: state.currentConversation.messages.map((m) =>
                  m.id === assistantMessage.id ? { ...m, status: 'failed', error: 'No response received.' } : m
                ),
              }
            : null,
        }));
        set({ isStreaming: false });
        toast({ title: 'No response', description: 'No response received. Try rephrasing your question.' });
        return;
      }

      const topCitations = (citations || [])
        .sort((a, b) => (b.similarity ?? 0) - (a.similarity ?? 0))
        .slice(0, 3);

      set((state) => ({
        currentConversation: state.currentConversation
          ? {
              ...state.currentConversation,
              messages: state.currentConversation.messages.map((m) =>
                m.id === assistantMessage.id ? { ...m, content: bufferedText, citations: topCitations, status: 'sent' } : m
              ),
            }
          : null,
      }));

      await supabase
        .from('nelson_conversations')
        .update({ updated_at: new Date().toISOString() })
        .eq('id', convId);

      set({ isStreaming: false });
    } catch (err: any) {
      const message = err?.message || 'Something went wrong.';
      set((state) => ({
        currentConversation: state.currentConversation
          ? {
              ...state.currentConversation,
              messages: state.currentConversation.messages.map((m) =>
                m.role === 'assistant' && m.status === 'pending' ? { ...m, status: 'failed', error: message } : m
              ),
            }
          : null,
      }));
      set({ isStreaming: false });
      toast({ title: 'Error', description: message });
    }
  },
  
  loadConversations: async () => {
    const raw = typeof window !== 'undefined' ? localStorage.getItem('conversations') : null;
    if (raw) {
      const parsed = JSON.parse(raw) as Conversation[];
      set({ conversations: parsed.map((c) => ({ ...c, createdAt: new Date(c.createdAt), messages: c.messages.map((m) => ({ ...m, timestamp: new Date(m.timestamp) })) })) });
    } else {
      set({ conversations: [] });
    }
  },
  
  deleteConversation: async (id: string) => {
    set((state) => ({
      conversations: state.conversations.filter((c) => c.id !== id),
      currentConversation:
        state.currentConversation?.id === id ? null : state.currentConversation,
    }));
  },
  
  updateSettings: (newSettings) => {
    set((state) => ({
      settings: { ...state.settings, ...newSettings },
    }));
  },
  setOnlineStatus: (online) => set({ isOnline: online }),
  flushOfflineQueue: async () => {
    const queue = [...get().offlineQueue];
    set({ offlineQueue: [] });
    for (const item of queue) {
      if (!navigator.onLine) break;
      const prev = get().currentConversation;
      const target = get().conversations.find((c) => c.id === item.conversationId) || prev || null;
      if (target) set({ currentConversation: target });
      await get().sendMessage(item.content);
    }
  },

  retryMessage: async (messageId: string) => {
    const state = get();
    const conv = state.currentConversation;
    if (!conv) return;
    const idx = conv.messages.findIndex((m) => m.id === messageId);
    if (idx === -1) return;
    const failed = conv.messages[idx];
    if (failed.status !== 'failed') return;

    set((s) => ({
      currentConversation: s.currentConversation
        ? {
            ...s.currentConversation,
            messages: s.currentConversation.messages.filter((m) => m.id !== messageId),
          }
        : null,
    }));

    await get().sendMessage(failed.role === 'user' ? failed.content : conv.messages[idx - 1]?.content || '');
  }
}));
