import { create } from 'zustand';

export interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  citations?: Citation[];
  timestamp: Date;
  pending?: boolean;
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
  setCurrentView: (view: ChatStore['currentView']) => void;
  setActiveTab: (tab: ChatStore['activeTab']) => void;
  setMode: (mode: 'academic' | 'clinical') => void;
  startNewConversation: () => void;
  setCurrentConversation: (conversation: Conversation | null) => void;
  sendMessage: (content: string) => Promise<void>;
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
    const userMessage: Message = {
      id: crypto.randomUUID(),
      role: 'user',
      content,
      timestamp: new Date(),
      pending: !isOnline,
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
      if (typeof window !== 'undefined') localStorage.setItem('conversations', JSON.stringify(updated));
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
    };
    set((state) => ({
      currentConversation: state.currentConversation
        ? { ...state.currentConversation, messages: [...state.currentConversation.messages, assistantMessage] }
        : null,
    }));
    set((state) => {
      if (!state.currentConversation) return {} as any;
      const updated = state.conversations.map((c) => (c.id === state.currentConversation!.id ? state.currentConversation! : c));
      if (typeof window !== 'undefined') localStorage.setItem('conversations', JSON.stringify(updated));
      return { conversations: updated } as any;
    });
    const response = "Thank you for your query. I'm Nelson-GPT, your pediatric knowledge assistant. I can help with evidence-based pediatric information from Nelson Textbook of Pediatrics.";
    for (let i = 0; i <= response.length; i += 3) {
      await new Promise((resolve) => setTimeout(resolve, 30));
      const chunk = response.slice(0, i);
      set((state) => ({
        currentConversation: state.currentConversation
          ? {
              ...state.currentConversation,
              messages: state.currentConversation.messages.map((msg) =>
                msg.id === assistantMessage.id ? { ...msg, content: chunk } : msg
              ),
            }
          : null,
      }));
      set((state) => {
        if (!state.currentConversation) return {} as any;
        const updated = state.conversations.map((c) => (c.id === state.currentConversation!.id ? state.currentConversation! : c));
        if (typeof window !== 'undefined') localStorage.setItem('conversations', JSON.stringify(updated));
        return { conversations: updated } as any;
      });
    }
    set({ isStreaming: false });
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
}));
