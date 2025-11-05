import { motion, AnimatePresence } from 'framer-motion';
import { useState, useRef, useEffect } from 'react';
import { Send, ArrowLeft, MoreVertical, AlertTriangle, RotateCcw } from 'lucide-react';
import { useChatStore } from '@/store/chatStore';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

export const ChatInterface = () => {
  const [input, setInput] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { currentConversation, isStreaming, mode, sendMessage, setCurrentView, retryMessage } = useChatStore();
  const { isOnline } = useChatStore();

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [currentConversation?.messages]);

  const handleSend = async () => {
    if (!input.trim() || isStreaming) return;
    
    await sendMessage(input.trim());
    setInput('');
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const showTyping = (() => {
    if (!isStreaming) return false;
    const msgs = currentConversation?.messages || [];
    const last = msgs[msgs.length - 1];
    return !!(last && last.role === 'assistant' && (!last.content || last.content.length === 0));
  })();

  return (
    <div className="fixed inset-0 bg-background flex flex-col">
      <motion.header
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className="border-b border-border bg-card/50 backdrop-blur-sm px-4 py-3 flex items-center gap-3"
      >
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setCurrentView('welcome')}
          className="rounded-full"
        >
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div className="flex-1">
          <h2 className="font-semibold truncate">
            {currentConversation?.title || 'Untitled'}
          </h2>
          <p className="text-xs text-muted-foreground capitalize">{mode} mode</p>
        </div>
        <Button variant="ghost" size="icon" className="rounded-full">
          <MoreVertical className="h-5 w-5" />
        </Button>
      </motion.header>

      {!isOnline && (
        <div className="bg-amber-500 text-white text-center text-xs py-2">You're offline. Messages will be queued and sent when reconnected.</div>
      )}

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto px-4 py-6 space-y-6 pb-32">
        <AnimatePresence>
          {currentConversation?.messages.map((message, i) => (
            <motion.div
              key={message.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
              className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div
                title={message.status === 'failed' ? (message.error || 'Message failed') : undefined}
                className={`max-w-[85%] md:max-w-[70%] rounded-2xl px-4 py-3 ${
                  message.role === 'user'
                    ? 'bg-[hsl(var(--message-user))] text-foreground'
                    : 'bg-[hsl(var(--message-assistant))] border border-border'
                }`}
              >
                {message.role === 'assistant' && (
                  <div className="flex items-center gap-2 mb-2">
                    <div className="w-6 h-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-xs font-bold">
                      N
                    </div>
                    <span className="text-xs font-medium text-muted-foreground">
                      Nelson-GPT
                    </span>
                  </div>
                )}
                
                <div className="prose prose-sm max-w-none dark:prose-invert">
                  <ReactMarkdown remarkPlugins={[remarkGfm]}>
                    {message.content}
                  </ReactMarkdown>
                </div>

                {message.status === 'failed' && (
                  <div className="mt-2 flex items-center gap-2 text-xs text-destructive">
                    <AlertTriangle className="h-3.5 w-3.5" />
                    <span>{message.error || 'Something went wrong'}</span>
                    <Button variant="outline" size="sm" className="ml-2 h-6 px-2 text-xs" onClick={() => retryMessage(message.id)}>
                      <RotateCcw className="h-3 w-3 mr-1" /> Retry
                    </Button>
                  </div>
                )}

                {message.citations && message.citations.length > 0 && (
                  <div className="mt-3 pt-3 border-t border-border/50 text-xs text-muted-foreground space-y-1">
                    <div className="font-medium mb-1">References:</div>
                    {[...message.citations]
                      .sort((a, b) => (b.similarity ?? 0) - (a.similarity ?? 0))
                      .slice(0, 3)
                      .map((citation, idx) => (
                        <div key={idx} className="flex items-center gap-2">
                          <span className="text-primary">•</span>
                          <button className="text-left hover:underline" title="Clickable in future updates">
                            {citation.chapter_title}
                            {citation.section_title && `, ${citation.section_title}`}
                            {citation.page_number && ` (p. ${citation.page_number})`}
                          </button>
                          <span className="ml-auto text-[10px] text-foreground/60">{Math.round((citation.similarity ?? 0) * 100)}%</span>
                        </div>
                      ))}
                  </div>
                )}
              </div>
            </motion.div>
          ))}
        </AnimatePresence>

        {showTyping && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex justify-start"
          >
            <div className="max-w-[85%] md:max-w-[70%] bg-[hsl(var(--message-assistant))] border border-border rounded-2xl px-4 py-3">
              <div className="flex items-center gap-2">
                <div className="flex gap-1">
                  {[0, 1, 2].map((i) => (
                    <div
                      key={i}
                      className="w-2 h-2 rounded-full bg-primary animate-typing-pulse"
                      style={{ animationDelay: `${i * 0.2}s` }}
                    />
                  ))}
                </div>
                <span className="text-xs text-muted-foreground">
                  Nelson-GPT is thinking...
                </span>
              </div>
            </div>
          </motion.div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input Dock */}
      <div className="fixed bottom-16 left-0 right-0 border-t border-border bg-card/80 backdrop-blur-sm px-4 py-3">
        <div className="max-w-4xl mx-auto">
          <div className="flex gap-2 mb-2">
            <Button
              variant={mode === 'academic' ? 'default' : 'outline'}
              size="sm"
              onClick={() => useChatStore.getState().setMode('academic')}
              className="rounded-full text-xs"
            >
              Academic
            </Button>
            <Button
              variant={mode === 'clinical' ? 'default' : 'outline'}
              size="sm"
              onClick={() => useChatStore.getState().setMode('clinical')}
              className="rounded-full text-xs"
              style={mode === 'clinical' ? { backgroundColor: 'hsl(152, 70%, 50%)' } : {}}
            >
              Clinical
            </Button>
          </div>
          
          <div className="relative bg-background rounded-2xl border border-border shadow-lg">
            <Textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Ask a follow-up question..."
              disabled={isStreaming}
              className="min-h-[60px] resize-none border-0 focus-visible:ring-0 pr-14"
            />
            <Button
              onClick={handleSend}
              disabled={!input.trim() || isStreaming}
              size="icon"
              className="absolute bottom-2 right-2 rounded-full h-10 w-10"
            >
              <Send className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};
