import { create } from 'zustand';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/components/ui/sonner';
import { addToQueue, getQueue, deleteFromQueue, type OfflineAction } from '@/utils/idb';
import { db } from '@/lib/db';

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
<<<<<<< HEAD
  user_sub?: string;
=======
  messageCount?: number;
>>>>>>> db2481c (Capy jam: Implement Supabase-backed persistence for conversations, messages, and settings with offline-first sync. Replace localStorage, add IndexedDB queue, online/offline listeners, SW background sync, and data migration from legacy localStorage.)
}

export interface UserSettings {
  theme: 'light' | 'dark';
  fontSize: 'small' | 'medium' | 'large';
  aiStyle: 'concise' | 'balanced' | 'detailed';
  showDisclaimers: boolean;
  notifications: boolean;
  shareAnalytics: boolean;
}

type AppUser = { id: string } | null;

interface ChatStore {
  currentView: 'splash' | 'welcome' | 'chat' | 'history' | 'settings' | 'profile';
  activeTab: 'chat' | 'history' | 'settings' | 'profile';
  currentConversation: Conversation | null;
  conversations: Conversation[];
  isStreaming: boolean;
  mode: 'academic' | 'clinical';
  isOnline: boolean;
  offlineQueueType: 'idle' | 'syncing';
  settings: UserSettings;
<<<<<<< HEAD
  user: { id: string; email?: string | null } | null;
  setUser: (user: { id: string; email?: string | null } | null) => void;
=======
  user: AppUser;
>>>>>>> db2481c (Capy jam: Implement Supabase-backed persistence for conversations, messages, and settings with offline-first sync. Replace localStorage, add IndexedDB queue, online/offline listeners, SW background sync, and data migration from legacy localStorage.)
  setCurrentView: (view: ChatStore['currentView']) => void;
  setActiveTab: (tab: ChatStore['activeTab']) => void;
  setMode: (mode: 'academic' | 'clinical') => void;
  setCurrentConversation: (conversation: Conversation | null) => void;
  setOnlineStatus: (online: boolean) => void;
  loadUser: () => Promise<void>;
  startNewConversation: () => Promise<void>;
  sendMessage: (content: string) => Promise<void>;
<<<<<<< HEAD
  retryMessage: (messageId: string) => Promise<void>;
=======
  saveMessage: (conversationId: string, message: Message) => Promise<void>;
>>>>>>> db2481c (Capy jam: Implement Supabase-backed persistence for conversations, messages, and settings with offline-first sync. Replace localStorage, add IndexedDB queue, online/offline listeners, SW background sync, and data migration from legacy localStorage.)
  loadConversations: () => Promise<void>;
  loadConversationMessages: (id: string) => Promise<void>;
  deleteConversation: (id: string) => Promise<void>;
  updateConversationTitle: (id: string, title: string) => Promise<void>;
  loadSettings: () => Promise<void>;
  updateSettings: (settings: Partial<UserSettings>) => Promise<void>;
  flushOfflineQueue: () => Promise<void>;
}

function generateTitle(text: string): string {
  const words = text.trim().split(/\s+/).slice(0, 8).join(' ');
  return words || 'New Conversation';
}

let pendingSettings: Partial<UserSettings> | null = null;
let settingsTimer: number | undefined;

export const useChatStore = create<ChatStore>((set, get) => ({
  currentView: 'splash',
  activeTab: 'chat',
  currentConversation: null,
  conversations: [],
  isStreaming: false,
  mode: 'academic',
  isOnline: typeof window !== 'undefined' ? navigator.onLine : true,
  offlineQueueType: 'idle',
  settings: {
    theme: 'light',
    fontSize: 'medium',
    aiStyle: 'balanced',
    showDisclaimers: true,
    notifications: true,
    shareAnalytics: false,
  },
  user: null,

  setCurrentView: (view) => set({ currentView: view }),
  setActiveTab: (tab) => set({ activeTab: tab }),
  setMode: (mode) => set({ mode }),
  setCurrentConversation: (conversation) => set({ currentConversation: conversation }),
  setOnlineStatus: (online) => set({ isOnline: online }),

  loadUser: async () => {
    const { data } = await supabase.auth.getUser();
    const user = data.user ? { id: data.user.id } : null;
    set({ user });
  },

  startNewConversation: async () => {
    const user = get().user;
    if (!user) {
      await get().loadUser();
    }
    const freshUser = get().user;
    if (!freshUser) throw new Error('User not authenticated');
    const newConversation = {
      id: crypto.randomUUID(),
      user_sub: freshUser.id,
      title: 'New Conversation',
      mode: get().mode,
      messages: [],
      createdAt: new Date(),
      isPinned: false,
      user_sub: get().user?.id,
    };
    try {
      const { data, error } = await supabase
        .from('nelson_conversations')
        .insert(newConversation)
        .select()
        .single();
      if (error) throw error;
      set({ currentConversation: { id: data.id, title: data.title || 'New Conversation', mode: (data.mode as 'academic' | 'clinical') || 'academic', isPinned: !!data.is_pinned, createdAt: data.created_at ? new Date(data.created_at) : new Date(), messages: [], messageCount: 0 }, currentView: 'chat' });
    } catch (_) {
      set({ currentConversation: { id: newConversation.id, title: newConversation.title, mode: newConversation.mode as 'academic' | 'clinical', isPinned: !!newConversation.is_pinned, createdAt: new Date(), messages: [], messageCount: 0 }, currentView: 'chat' });
    }
  },

  sendMessage: async (content: string) => {
    let { currentConversation, mode, isOnline } = get();
    if (!currentConversation) {
      await get().startNewConversation();
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
      currentConversation: state.currentConversation ? { ...state.currentConversation, messages: [...state.currentConversation.messages, userMessage] } : null,
    }));

    set((state) => {
      if (!state.currentConversation) return {} as any;
      const exists = state.conversations.some((c) => c.id === state.currentConversation!.id);
      const updated = exists ? state.conversations.map((c) => (c.id === state.currentConversation!.id ? state.currentConversation! : c)) : [...state.conversations, state.currentConversation!];
      return { conversations: updated } as any;
    });

    if (!isOnline) {
      // Queue for later using new IndexedDB
      await db.addToQueue('send_message', {
        conversationId: currentConversation.id,
        content,
        mode: get().mode,
      });
      
      // Show queued message in UI
      const queuedMessage: Message = {
        id: userMessage.id,
        role: 'user',
        content,
        timestamp: new Date(),
        status: 'pending',
      };
      
      // Add to local conversation
      set((state) => ({
        currentConversation: {
          ...state.currentConversation!,
          messages: [...state.currentConversation!.messages, queuedMessage],
        },
      }));
      
      // Register background sync
      if ('serviceWorker' in navigator && 'sync' in ServiceWorkerRegistration.prototype) {
        const registration = await navigator.serviceWorker.ready;
        await registration.sync.register('sync-conversations');
      }
      
      toast.info('Message queued for sending when online');
      return;
    }

    try {
      await get().saveMessage(currentConversation.id, userMessage);
    } catch (_) {}
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
      currentConversation: state.currentConversation ? { ...state.currentConversation, messages: [...state.currentConversation.messages, assistantMessage] } : null,
    }));
<<<<<<< HEAD

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
=======
    const response = "Thank you for your query. I'm Nelson-GPT, your pediatric knowledge assistant. I can help with evidence-based pediatric information from Nelson Textbook of Pediatrics.";
    for (let i = 0; i <= response.length; i += 3) {
      await new Promise((resolve) => setTimeout(resolve, 30));
      const chunk = response.slice(0, i);
      set((state) => ({
        currentConversation: state.currentConversation
          ? { ...state.currentConversation, messages: state.currentConversation.messages.map((m) => (m.id === assistantMessage.id ? { ...m, content: chunk } : m)) }
          : null,
      }));
    }
    set({ isStreaming: false });

    const updatedAssistant = get().currentConversation?.messages.find((m) => m.id === assistantMessage.id);
    if (updatedAssistant) {
      try {
        await get().saveMessage(currentConversation.id, { ...updatedAssistant, citations: updatedAssistant.citations || [] });
      } catch (_) {}
    }

    try {
      await supabase.from('nelson_conversations').update({ updated_at: new Date().toISOString() }).eq('id', currentConversation.id);
    } catch (_) {}

    if (currentConversation.title === 'New Conversation' || currentConversation.title === 'Untitled') {
      const title = generateTitle(content);
      await get().updateConversationTitle(currentConversation.id, title);
    }
>>>>>>> db2481c (Capy jam: Implement Supabase-backed persistence for conversations, messages, and settings with offline-first sync. Replace localStorage, add IndexedDB queue, online/offline listeners, SW background sync, and data migration from legacy localStorage.)
  },

  saveMessage: async (conversationId: string, message: Message) => {
    const { error } = await supabase
      .from('nelson_messages')
      .insert({
        conversation_id: conversationId,
        role: message.role,
        content: message.content,
        citations: message.citations || [],
        metadata: { timestamp: message.timestamp.toISOString() },
      });
    if (error) throw error as any;
  },

  loadConversations: async () => {
    const user = get().user;
    if (!user) {
      await get().loadUser();
    }
    const u = get().user;
    if (!u) return;

    const legacy = typeof window !== 'undefined' ? localStorage.getItem('conversations') : null;
    if (legacy) {
      try {
        const parsed = JSON.parse(legacy) as Conversation[];
        for (const conv of parsed) {
          const { data: existing } = await supabase.from('nelson_conversations').select('id').eq('id', conv.id).maybeSingle();
          if (!existing) {
            await supabase.from('nelson_conversations').insert({ id: conv.id, user_sub: u.id, title: conv.title, mode: conv.mode, is_pinned: conv.isPinned, created_at: conv.createdAt?.toString ? conv.createdAt.toString() : new Date().toISOString() });
          }
          if (conv.messages?.length) {
            const rows = conv.messages.map((m) => ({ conversation_id: conv.id, role: m.role, content: m.content, citations: m.citations || [], metadata: { timestamp: (m.timestamp as any)?.toString ? (m.timestamp as any).toString() : new Date().toISOString() } }));
            await supabase.from('nelson_messages').insert(rows);
          }
        }
        localStorage.removeItem('conversations');
        toast('Migrated your local conversations');
      } catch (_) {}
    }

    const { data, error } = await supabase
      .from('nelson_conversations')
      .select('id, title, mode, is_pinned, created_at, updated_at, messages:nelson_messages(id)')
      .eq('user_sub', u.id)
      .order('updated_at', { ascending: false })
      .range(0, 49);
    if (error) {
      set({ conversations: [] });
      return;
    }
    const conversations: Conversation[] = (data || []).map((row: any) => ({
      id: row.id,
      title: row.title || 'New Conversation',
      mode: (row.mode as 'academic' | 'clinical') || 'academic',
      isPinned: !!row.is_pinned,
      createdAt: row.created_at ? new Date(row.created_at) : new Date(),
      messages: [],
      messageCount: Array.isArray(row.messages) ? row.messages.length : 0,
    }));
    set({ conversations });
  },

  loadConversationMessages: async (id: string) => {
    const { data, error } = await supabase
      .from('nelson_messages')
      .select('*')
      .eq('conversation_id', id)
      .order('created_at', { ascending: true });
    if (error) return;
    const messages: Message[] = (data || []).map((m: any) => ({
      id: m.id,
      role: (m.role as 'user' | 'assistant'),
      content: m.content,
      citations: (m.citations as any[]) || [],
      timestamp: m.created_at ? new Date(m.created_at) : new Date(),
    }));
    set((state) => ({
      currentConversation: state.currentConversation && state.currentConversation.id === id ? { ...state.currentConversation, messages } : state.conversations.find((c) => c.id === id) ? { ...(state.conversations.find((c) => c.id === id) as Conversation), messages } : state.currentConversation,
    }));
  },

  deleteConversation: async (id: string) => {
    const prev = get().conversations;
    set((state) => ({
      conversations: state.conversations.filter((c) => c.id !== id),
      currentConversation: state.currentConversation?.id === id ? null : state.currentConversation,
    }));
    try {
      const { error } = await supabase.from('nelson_conversations').delete().eq('id', id);
      if (error) throw error;
      toast('Conversation deleted');
    } catch (e) {
      set({ conversations: prev });
      toast('Failed to delete conversation');
      if (!get().isOnline) {
        await addToQueue({ type: 'delete_conversation', conversationId: id });
      }
    }
  },

  updateConversationTitle: async (id: string, title: string) => {
    set((state) => ({
      conversations: state.conversations.map((c) => (c.id === id ? { ...c, title } : c)),
      currentConversation: state.currentConversation?.id === id ? { ...(state.currentConversation as Conversation), title } : state.currentConversation,
    }));
    try {
      await supabase.from('nelson_conversations').update({ title }).eq('id', id);
    } catch (_) {}
  },

  loadSettings: async () => {
    if (!get().user) await get().loadUser();
    const u = get().user;
    if (!u) return;
    const { data, error } = await supabase
      .from('nelson_user_settings')
      .select('*')
      .eq('user_sub', u.id)
      .single();
    if (error || !data) {
      const defaults = get().settings;
      await supabase.from('nelson_user_settings').insert({
        user_sub: u.id,
        theme: defaults.theme,
        font_size: defaults.fontSize,
        ai_style: defaults.aiStyle,
        show_disclaimers: defaults.showDisclaimers,
      });
      return;
    }
    const merged: UserSettings = {
      theme: (data.theme as 'light' | 'dark') || 'light',
      fontSize: (data.font_size as 'small' | 'medium' | 'large') || 'medium',
      aiStyle: (data.ai_style as 'concise' | 'balanced' | 'detailed') || 'balanced',
      showDisclaimers: !!data.show_disclaimers,
      notifications: get().settings.notifications,
      shareAnalytics: get().settings.shareAnalytics,
    };
    set({ settings: merged });
  },

  updateSettings: async (newSettings: Partial<UserSettings>) => {
    const user = get().user;
    const merged = { ...get().settings, ...newSettings };
    set({ settings: merged });
    if (settingsTimer) window.clearTimeout(settingsTimer);
    pendingSettings = merged;
    settingsTimer = window.setTimeout(async () => {
      if (!pendingSettings) return;
      try {
        const u = user || (await supabase.auth.getUser()).data.user ? { id: (await supabase.auth.getUser()).data.user!.id } : null;
        if (!u) return;
        const { error } = await supabase
          .from('nelson_user_settings')
          .upsert(
            {
              user_sub: u.id,
              theme: pendingSettings.theme,
              font_size: pendingSettings.fontSize,
              ai_style: pendingSettings.aiStyle,
              show_disclaimers: pendingSettings.showDisclaimers,
            },
            { onConflict: 'user_sub' }
          );
        if (error) throw error;
      } catch (e) {
        if (!get().isOnline) {
          await addToQueue({ type: 'update_settings', settings: pendingSettings });
        }
      } finally {
        pendingSettings = null;
      }
    }, 500);
  },

  flushOfflineQueue: async () => {
    if (get().offlineQueueType === 'syncing') return;
    set({ offlineQueueType: 'syncing' });
    
    try {
      const queue = await db.getQueue();
      
      if (queue.length === 0) return;
      
      toast.info(`Syncing ${queue.length} queued action(s)...`);
      
      for (const item of queue) {
        try {
          if (item.action === 'send_message') {
            await get().sendMessage(item.payload.content);
          } else if (item.action === 'delete_conversation') {
            await get().deleteConversation(item.payload.id);
          } else if (item.action === 'update_settings') {
            await get().updateSettings(item.payload);
          }
          
          // Remove from queue on success
          if (item.id) {
            await db.removeFromQueue(item.id);
          }
        } catch (error) {
          console.error('Failed to process queued action:', error);
          
          // Increment retry count
          if (item.retryCount >= 3) {
            // Give up after 3 retries
            if (item.id) {
              await db.removeFromQueue(item.id);
            }
            toast.error('Failed to sync some actions');
          }
        }
      }
      
      toast.success('All actions synced');
    } catch (error) {
      console.error('Queue flush error:', error);
      toast.error('Failed to sync offline actions');
    } finally {
      set({ offlineQueueType: 'idle' });
    }
  },

  syncConversations: async () => {
    const localConvs = await db.getConversations();
    const user = get().user;
    
    if (!user) return;
    
    // Get server conversations
    const { data: serverConvs, error } = await supabase
      .from('nelson_conversations')
      .select('*, messages:nelson_messages(*)')
      .eq('user_sub', user.id);
    
    if (error) throw error;
    
    // Merge logic (server wins for conflicts)
    const merged = new Map();
    
    // Add server conversations
    serverConvs?.forEach((conv) => {
      merged.set(conv.id, { ...conv, syncStatus: 'synced' });
    });
    
    // Add local-only conversations
    localConvs.forEach((conv) => {
      if (!merged.has(conv.id) && conv.syncStatus !== 'synced') {
        merged.set(conv.id, conv);
      }
    });
    
    // Save merged to IndexedDB
    for (const conv of merged.values()) {
      await db.saveConversation(conv);
    }
    
    // Update state
    set({ conversations: Array.from(merged.values()) });
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
