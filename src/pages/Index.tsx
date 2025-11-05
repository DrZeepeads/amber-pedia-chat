import { AnimatePresence } from 'framer-motion';
import { useChatStore } from '@/store/chatStore';
import { SplashScreen } from '@/components/SplashScreen';
import { WelcomeScreen } from '@/components/WelcomeScreen';
import { ChatInterface } from '@/components/ChatInterface';
import { HistoryView } from '@/components/HistoryView';
import { SettingsView } from '@/components/SettingsView';
import { ProfileView } from '@/components/ProfileView';
import { FooterMenuBar } from '@/components/FooterMenuBar';
import LoginScreen from '@/components/auth/LoginScreen';
import { useAuth } from '@/components/auth/AuthProvider';

const Index = () => {
  const currentView = useChatStore((state) => state.currentView);
  const setUser = useChatStore((state) => state.setUser);
  const { user, loading } = useAuth();

  if (typeof window !== 'undefined') {
    queueMicrotask(() => {
      if (user) setUser({ id: user.id, email: user.email });
    });
  }

  if (loading) return <div className="min-h-screen grid place-items-center text-muted-foreground">Loading…</div>;
  if (!user) return <LoginScreen />;

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
