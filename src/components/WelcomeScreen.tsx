import { motion } from 'framer-motion';
import { useState } from 'react';
import { Send } from 'lucide-react';
import { useChatStore } from '@/store/chatStore';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';

export const WelcomeScreen = () => {
  const [input, setInput] = useState('');
  const { mode, setMode, sendMessage, setCurrentView } = useChatStore();

  const handleSend = async () => {
    if (!input.trim()) return;
    
    setCurrentView('chat');
    await sendMessage(input.trim());
    setInput('');
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0, y: -20 }}
      className="fixed inset-0 bg-background flex flex-col items-center justify-center p-4"
    >
      <div className="w-full max-w-4xl space-y-8">
        {/* Header */}
        <motion.div
          initial={{ y: -20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.1 }}
          className="text-center space-y-2"
        >
          <h1 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-primary via-accent to-primary bg-clip-text text-transparent">
            Nelson-GPT
          </h1>
          <p className="text-muted-foreground">
            Pediatric Knowledge at Your Fingertips
          </p>
        </motion.div>

        {/* Hero Input Container */}
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ delay: 0.2, type: 'spring', stiffness: 200 }}
          className="relative"
        >
          <div 
            className="bg-card rounded-3xl p-6 shadow-lg border border-border"
            style={{
              boxShadow: '0 10px 40px -10px hsl(var(--shadow-warm) / 0.2)',
            }}
          >
            {/* Mode Toggle */}
            <div className="flex gap-2 mb-4">
              <Button
                variant={mode === 'academic' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setMode('academic')}
                className="rounded-full"
              >
                Academic
              </Button>
              <Button
                variant={mode === 'clinical' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setMode('clinical')}
                className="rounded-full bg-emerald-500 hover:bg-emerald-600 text-white"
                style={mode === 'clinical' ? { backgroundColor: 'hsl(152, 70%, 50%)' } : {}}
              >
                Clinical
              </Button>
            </div>

            {/* Input Area */}
            <div className="relative">
              <Textarea
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Ask Nelson-GPT anything about pediatrics..."
                className="min-h-[120px] resize-none border-0 focus-visible:ring-0 text-base"
              />
              
              {/* Send Button */}
              <Button
                onClick={handleSend}
                disabled={!input.trim()}
                size="icon"
                className="absolute bottom-2 right-2 rounded-full h-11 w-11 shadow-md hover:shadow-lg transition-shadow"
              >
                <Send className="h-5 w-5" />
              </Button>
            </div>
          </div>
        </motion.div>

        {/* Suggested Topics */}
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="grid grid-cols-1 md:grid-cols-2 gap-3 max-w-2xl mx-auto"
        >
          {[
            'Fever management in infants under 3 months',
            'Developmental milestones at 12 months',
            'Management of acute gastroenteritis',
            'Neonatal jaundice guidelines',
          ].map((suggestion, i) => (
            <motion.button
              key={i}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 + i * 0.1 }}
              onClick={() => setInput(suggestion)}
              className="text-left p-3 rounded-xl border border-border bg-card hover:bg-accent/5 hover:border-accent transition-colors text-sm"
            >
              {suggestion}
            </motion.button>
          ))}
        </motion.div>
      </div>
    </motion.div>
  );
};
