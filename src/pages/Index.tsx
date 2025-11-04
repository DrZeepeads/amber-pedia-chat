import { AnimatePresence } from 'framer-motion';
import { useChatStore } from '@/store/chatStore';
import { SplashScreen } from '@/components/SplashScreen';
import { WelcomeScreen } from '@/components/WelcomeScreen';
import { ChatInterface } from '@/components/ChatInterface';
import { HistoryView } from '@/components/HistoryView';
import { SettingsView } from '@/components/SettingsView';
import { ProfileView } from '@/components/ProfileView';
import { FooterMenuBar } from '@/components/FooterMenuBar';

const Index = () => {
  const currentView = useChatStore((state) => state.currentView);

  return (
    <div className="min-h-screen bg-background">
      <AnimatePresence mode="wait">
        {currentView === 'splash' && <SplashScreen key="splash" />}
        {currentView === 'welcome' && <WelcomeScreen key="welcome" />}
        {currentView === 'chat' && <ChatInterface key="chat" />}
        {currentView === 'history' && <HistoryView key="history" />}
        {currentView === 'settings' && <SettingsView key="settings" />}
        {currentView === 'profile' && <ProfileView key="profile" />}
      </AnimatePresence>

      {currentView !== 'splash' && currentView !== 'chat' && <FooterMenuBar />}
      {currentView === 'chat' && <FooterMenuBar />}
    </div>
  );
};

export default Index;
