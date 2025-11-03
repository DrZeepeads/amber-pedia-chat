import { AnimatePresence } from 'framer-motion';
import { useChatStore } from '@/store/chatStore';
import { SplashScreen } from '@/components/SplashScreen';
import { WelcomeScreen } from '@/components/WelcomeScreen';
import { ChatInterface } from '@/components/ChatInterface';
import { FooterMenuBar } from '@/components/FooterMenuBar';

const Index = () => {
  const currentView = useChatStore((state) => state.currentView);

  return (
    <div className="min-h-screen bg-background">
      <AnimatePresence mode="wait">
        {currentView === 'splash' && <SplashScreen key="splash" />}
        {currentView === 'welcome' && <WelcomeScreen key="welcome" />}
        {currentView === 'chat' && <ChatInterface key="chat" />}
        {currentView === 'history' && (
          <div key="history" className="p-8 pb-20">
            <h1 className="text-2xl font-bold mb-4">History</h1>
            <p className="text-muted-foreground">Your conversation history will appear here.</p>
          </div>
        )}
        {currentView === 'settings' && (
          <div key="settings" className="p-8 pb-20">
            <h1 className="text-2xl font-bold mb-4">Settings</h1>
            <p className="text-muted-foreground">Settings panel coming soon.</p>
          </div>
        )}
        {currentView === 'profile' && (
          <div key="profile" className="p-8 pb-20">
            <h1 className="text-2xl font-bold mb-4">Profile</h1>
            <p className="text-muted-foreground">Profile information coming soon.</p>
          </div>
        )}
      </AnimatePresence>

      {currentView !== 'splash' && currentView !== 'chat' && <FooterMenuBar />}
      {currentView === 'chat' && <FooterMenuBar />}
    </div>
  );
};

export default Index;
