import { create } from 'zustand';

export interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  citations?: Citation[];
  timestamp: Date;
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
}

interface ChatStore {
  // UI State
  currentView: 'splash' | 'welcome' | 'chat' | 'history' | 'settings' | 'profile';
  activeTab: 'chat' | 'history' | 'settings' | 'profile';
  
  // Chat State
  currentConversation: Conversation | null;
  conversations: Conversation[];
  isStreaming: boolean;
  mode: 'academic' | 'clinical';
  
  // User Settings
  settings: UserSettings;
  
  // Actions
  setCurrentView: (view: ChatStore['currentView']) => void;
  setActiveTab: (tab: ChatStore['activeTab']) => void;
  setMode: (mode: 'academic' | 'clinical') => void;
  startNewConversation: () => void;
  sendMessage: (content: string) => Promise<void>;
  loadConversations: () => Promise<void>;
  deleteConversation: (id: string) => Promise<void>;
  updateSettings: (settings: Partial<UserSettings>) => void;
}

export const useChatStore = create<ChatStore>((set, get) => ({
  currentView: 'splash',
  activeTab: 'chat',
  currentConversation: null,
  conversations: [],
  isStreaming: false,
  mode: 'academic',
  settings: {
    theme: 'light',
    fontSize: 'medium',
    aiStyle: 'balanced',
    showDisclaimers: true,
  },

  setCurrentView: (view) => set({ currentView: view }),
  
  setActiveTab: (tab) => set({ activeTab: tab }),
  
  setMode: (mode) => set({ mode }),
  
  startNewConversation: () => {
    const newConv: Conversation = {
      id: crypto.randomUUID(),
      title: 'Untitled',
      mode: get().mode,
      messages: [],
      createdAt: new Date(),
      isPinned: false,
    };
    set({ 
      currentConversation: newConv,
      currentView: 'chat',
    });
  },
  
  sendMessage: async (content: string) => {
    const { currentConversation, mode } = get();
    
    // Create conversation if none exists
    if (!currentConversation) {
      get().startNewConversation();
    }
    
    const userMessage: Message = {
      id: crypto.randomUUID(),
      role: 'user',
      content,
      timestamp: new Date(),
    };
    
    // Add user message
    set((state) => ({
      currentConversation: state.currentConversation
        ? {
            ...state.currentConversation,
            messages: [...state.currentConversation.messages, userMessage],
          }
        : null,
    }));
    
    // Start streaming
    set({ isStreaming: true });
    
    // Create assistant message placeholder
    const assistantMessage: Message = {
      id: crypto.randomUUID(),
      role: 'assistant',
      content: '',
      citations: [],
      timestamp: new Date(),
    };
    
    set((state) => ({
      currentConversation: state.currentConversation
        ? {
            ...state.currentConversation,
            messages: [...state.currentConversation.messages, assistantMessage],
          }
        : null,
    }));
    
    // TODO: Implement actual streaming from edge function
    // For now, simulate streaming
    const response = "Thank you for your query. I'm Nelson-GPT, your pediatric knowledge assistant. I can help with evidence-based pediatric information from Nelson Textbook of Pediatrics.";
    
    for (let i = 0; i <= response.length; i += 3) {
      await new Promise(resolve => setTimeout(resolve, 30));
      const chunk = response.slice(0, i);
      
      set((state) => ({
        currentConversation: state.currentConversation
          ? {
              ...state.currentConversation,
              messages: state.currentConversation.messages.map((msg) =>
                msg.id === assistantMessage.id
                  ? { ...msg, content: chunk }
                  : msg
              ),
            }
          : null,
      }));
    }
    
    set({ isStreaming: false });
  },
  
  loadConversations: async () => {
    // TODO: Load from Supabase
    set({ conversations: [] });
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
}));
