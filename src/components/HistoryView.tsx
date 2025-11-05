import { motion } from 'framer-motion';
import { MessageSquare, Pin, Trash2, Calendar, Clock } from 'lucide-react';
import { useChatStore } from '@/store/chatStore';
import { Button } from './ui/button';
import { ScrollArea } from './ui/scroll-area';
import { formatDistanceToNow } from 'date-fns';

export const HistoryView = () => {
  const { conversations, deleteConversation, setCurrentView, setCurrentConversation, loadConversationMessages } = useChatStore();

  const handleConversationClick = async (conv: typeof conversations[0]) => {
    setCurrentConversation(conv);
    await loadConversationMessages(conv.id);
    setCurrentView('chat');
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="h-screen flex flex-col pb-20"
    >
      <div className="border-b border-border bg-card p-6">
        <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
          <Clock className="h-6 w-6 text-primary" />
          Chat History
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          View and manage your past conversations
        </p>
      </div>

      <ScrollArea className="flex-1">
        <div className="p-4 space-y-3">
          {conversations.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <MessageSquare className="h-16 w-16 text-muted-foreground/30 mb-4" />
              <p className="text-muted-foreground">No conversations yet</p>
              <p className="text-sm text-muted-foreground/70 mt-1">
                Start a new chat to begin
              </p>
            </div>
          ) : (
            conversations.map((conv) => (
              <motion.div
                key={conv.id}
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="bg-card border border-border rounded-xl p-4 hover:bg-accent/10 transition-colors cursor-pointer group"
                onClick={() => handleConversationClick(conv)}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      {conv.isPinned && (
                        <Pin className="h-3.5 w-3.5 text-primary fill-primary" />
                      )}
                      <h3 className="font-medium text-foreground truncate">
                        {conv.title}
                      </h3>
                      <span className={`text-xs px-2 py-0.5 rounded-full ${
                        conv.mode === 'academic' 
                          ? 'bg-primary/10 text-primary' 
                          : 'bg-green-500/10 text-green-600'
                      }`}>
                        {conv.mode}
                      </span>
                    </div>
                    <div className="flex items-center gap-3 text-xs text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        {formatDistanceToNow(conv.createdAt, { addSuffix: true })}
                      </span>
                      <span>{(conv.messages?.length || (conv as any).messageCount || 0)} messages</span>
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="opacity-0 group-hover:opacity-100 transition-opacity h-8 w-8"
                    onClick={(e) => {
                      e.stopPropagation();
                      deleteConversation(conv.id);
                    }}
                  >
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                </div>
              </motion.div>
            ))
          )}
        </div>
      </ScrollArea>
    </motion.div>
  );
};
