import { create } from 'zustand';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/components/ui/use-toast';

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
  settings: UserSettings;
  notificationPermission?: NotificationPermission | 'unsupported';
  lastSettingsSaveFailed?: boolean;
  pendingSettingsUpsert?: Partial<UserSettings> | null;
  setCurrentView: (view: ChatStore['currentView']) => void;
  setActiveTab: (tab: ChatStore['activeTab']) => void;
  setMode: (mode: 'academic' | 'clinical') => void;
  startNewConversation: () => void;
  setCurrentConversation: (conversation: Conversation | null) => void;
  sendMessage: (content: string) => Promise<void>;
  loadConversations: () => Promise<void>;
  deleteConversation: (id: string) => Promise<void>;
  loadUserSettings: () => Promise<void>;
  updateSettings: (settings: Partial<UserSettings>) => Promise<void>;
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
    notifications: true,
    shareAnalytics: false,
  },
  notificationPermission: typeof window !== 'undefined' && 'Notification' in window ? Notification.permission : 'unsupported',
  lastSettingsSaveFailed: false,
  pendingSettingsUpsert: null,

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
  
  loadUserSettings: async () => {
    try {
      const { data: userData } = await supabase.auth.getUser();
      const user = userData?.user;
      if (!user) return;
      const { data, error } = await supabase
        .from('nelson_user_settings')
        .select('*')
        .eq('user_sub', user.id)
        .single();
      if (data) {
        set({
          settings: {
            theme: (data as any).theme || 'light',
            fontSize: (data as any).font_size || 'medium',
            aiStyle: (data as any).ai_style || 'balanced',
            showDisclaimers: (data as any).show_disclaimers ?? true,
            notifications: (data as any).notifications ?? true,
            shareAnalytics: (data as any).share_analytics ?? false,
          },
        });
      } else if (error && (error as any).code === 'PGRST116') {
        await supabase.from('nelson_user_settings').insert({
          user_sub: user.id,
          theme: 'light',
          font_size: 'medium',
          ai_style: 'balanced',
          show_disclaimers: true,
          notifications: true,
          share_analytics: false,
        } as any);
      }
    } catch (e) {
      toast({ title: 'Using default settings', description: 'Failed to load settings from cloud.' });
    }
  },
  
  updateSettings: async (newSettings) => {
    set((state) => ({
      settings: { ...state.settings, ...newSettings },
    }));
    if (newSettings.notifications && typeof window !== 'undefined' && 'Notification' in window) {
      try {
        const permission = await Notification.requestPermission();
        set({ notificationPermission: permission });
      } catch {}
    }
    try {
      const { data: userData } = await supabase.auth.getUser();
      const user = userData?.user;
      if (!user) return;
      const pending = get().pendingSettingsUpsert || {};
      const effective = { ...get().settings, ...pending };
      const merged = { ...effective, ...newSettings };
      const dbSettings: any = {
        user_sub: user.id,
        theme: merged.theme,
        font_size: merged.fontSize,
        ai_style: merged.aiStyle,
        show_disclaimers: merged.showDisclaimers,
        notifications: merged.notifications,
        share_analytics: merged.shareAnalytics,
      };
      await supabase
        .from('nelson_user_settings')
        .upsert(dbSettings, { onConflict: 'user_sub' });
      set({ lastSettingsSaveFailed: false, pendingSettingsUpsert: null });
    } catch (e) {
      set({ lastSettingsSaveFailed: true, pendingSettingsUpsert: newSettings });
      toast({ title: 'Settings saved locally', description: 'Cloud save failed. Will retry on next change.' });
    }
  },
}));
