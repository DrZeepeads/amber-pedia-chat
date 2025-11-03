import { motion } from 'framer-motion';
import { MessageSquare, Clock, Settings, User } from 'lucide-react';
import { useChatStore } from '@/store/chatStore';

const tabs = [
  { id: 'chat' as const, label: 'Chat', icon: MessageSquare },
  { id: 'history' as const, label: 'History', icon: Clock },
  { id: 'settings' as const, label: 'Settings', icon: Settings },
  { id: 'profile' as const, label: 'Profile', icon: User },
];

export const FooterMenuBar = () => {
  const { activeTab, setActiveTab, setCurrentView } = useChatStore();

  const handleTabClick = (tabId: typeof tabs[number]['id']) => {
    setActiveTab(tabId);
    if (tabId === 'chat') {
      setCurrentView('welcome');
    } else {
      setCurrentView(tabId);
    }
  };

  return (
    <motion.div
      initial={{ y: 100 }}
      animate={{ y: 0 }}
      className="fixed bottom-0 left-0 right-0 bg-card border-t border-border"
    >
      <div className="flex items-center justify-around px-2 py-2 max-w-lg mx-auto">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;

          return (
            <button
              key={tab.id}
              onClick={() => handleTabClick(tab.id)}
              className="relative flex flex-col items-center justify-center w-full py-2 px-3 rounded-xl transition-colors hover:bg-accent/10"
            >
              <Icon
                className={`h-5 w-5 mb-1 transition-colors ${
                  isActive ? 'text-primary' : 'text-muted-foreground'
                }`}
              />
              <span
                className={`text-xs transition-colors ${
                  isActive ? 'text-primary font-medium' : 'text-muted-foreground'
                }`}
              >
                {tab.label}
              </span>
              
              {/* Active Indicator */}
              {isActive && (
                <motion.div
                  layoutId="activeTab"
                  className="absolute bottom-0 left-1/2 -translate-x-1/2 w-12 h-1 bg-primary rounded-full"
                  transition={{ type: 'spring', stiffness: 380, damping: 30 }}
                />
              )}
            </button>
          );
        })}
      </div>
    </motion.div>
  );
};
