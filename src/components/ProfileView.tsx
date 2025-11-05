import { useEffect, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { User as UserIcon, Mail, Calendar, Award, LogOut, Download, Trash2 } from 'lucide-react';
import { Button } from './ui/button';
import { ScrollArea } from './ui/scroll-area';
import { Separator } from './ui/separator';
import { Avatar, AvatarFallback } from './ui/avatar';
import { useAuth } from '@/components/auth/AuthProvider';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/components/ui/sonner';

export const ProfileView = () => {
  const { user, signOut } = useAuth();
  const [stats, setStats] = useState<{ totalChats: number; questions: number }>({ totalChats: 0, questions: 0 });
  const initials = useMemo(() => {
    const name = (user?.user_metadata?.full_name as string) || user?.email || '';
    const parts = name.split(/[\s@.]+/).filter(Boolean);
    return (parts[0]?.[0] || 'U').toUpperCase() + (parts[1]?.[0] || '').toUpperCase();
  }, [user]);

  useEffect(() => {
    const loadStats = async () => {
      if (!user) return;
      const user_sub = user.id;
      const { data: convs, error: convErr } = await supabase
        .from('nelson_conversations')
        .select('id')
        .eq('user_sub', user_sub);
      if (convErr) {
        console.error('Load conversations stats error', convErr);
        return;
      }
      const convIds = (convs || []).map((c) => c.id);
      let questions = 0;
      if (convIds.length > 0) {
        const { count, error } = await supabase
          .from('nelson_messages')
          .select('*', { count: 'exact', head: true })
          .in('conversation_id', convIds)
          .eq('role', 'user');
        if (error) {
          console.error('Load messages stats error', error);
        } else {
          questions = count || 0;
        }
      }
      setStats({ totalChats: convIds.length, questions });
    };
    loadStats();
  }, [user]);

  const handleExportData = async () => {
    try {
      if (!user) return;
      const user_sub = user.id;
      const { data: conversations, error: cErr } = await supabase
        .from('nelson_conversations')
        .select('id, title, mode, is_pinned, created_at, updated_at')
        .eq('user_sub', user_sub)
        .order('created_at', { ascending: true });
      if (cErr) throw cErr;

      const convIds = (conversations || []).map((c) => c.id);
      let messages: any[] = [];
      if (convIds.length) {
        const { data: msgs, error: mErr } = await supabase
          .from('nelson_messages')
          .select('conversation_id, role, content, citations, created_at')
          .in('conversation_id', convIds)
          .order('created_at', { ascending: true });
        if (mErr) throw mErr;
        messages = msgs || [];
      }

      const payload = { user: { id: user.id, email: user.email, metadata: user.user_metadata }, conversations, messages };
      const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'nelson-gpt-data.json';
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
      toast('Your data export has started');
    } catch (err) {
      console.error('Export data error', err);
      toast('Failed to export data');
    }
  };

  const handleDeleteAccount = async () => {
    try {
      if (!user) return;
      const user_sub = user.id;
      await supabase.from('nelson_messages').delete().in('conversation_id', (
        await supabase.from('nelson_conversations').select('id').eq('user_sub', user_sub)
      ).data?.map((c: any) => c.id) || []);
      await supabase.from('nelson_conversations').delete().eq('user_sub', user_sub);
      await supabase.from('nelson_user_settings').delete().eq('user_sub', user_sub);
      await signOut();
      toast('Your account data has been removed. For full account deletion, contact support.');
    } catch (err) {
      console.error('Delete account error', err);
      toast('Failed to delete account');
    }
  };

  const handleSignOut = async () => {
    await signOut();
  };

  const fullName = (user?.user_metadata?.full_name as string) || undefined;
  const roleLabel = user?.user_metadata?.is_healthcare_professional ? 'Healthcare Professional' : 'Member';

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="h-screen flex flex-col pb-20"
    >
      <div className="border-b border-border bg-card p-6">
        <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
          <UserIcon className="h-6 w-6 text-primary" />
          Profile
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          Manage your account and preferences
        </p>
      </div>

      <ScrollArea className="flex-1">
        <div className="p-6 space-y-6">
          <div className="flex flex-col items-center text-center space-y-4">
            <Avatar className="h-24 w-24 border-4 border-primary/20">
              <AvatarFallback className="text-2xl bg-primary/10 text-primary">
                {initials}
              </AvatarFallback>
            </Avatar>
            <div>
              <h2 className="text-xl font-semibold text-foreground">{fullName || user?.email}</h2>
              <p className="text-sm text-muted-foreground">{roleLabel}</p>
            </div>
          </div>

          <Separator />

          <div className="space-y-4">
            <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
              <Mail className="h-4 w-4 text-primary" />
              Account Information
            </h3>
            <div className="space-y-3 pl-6">
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Email</span>
                <span className="text-sm text-foreground">{user?.email}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground flex items-center gap-1">
                  <Calendar className="h-3 w-3" />
                  Member since
                </span>
                <span className="text-sm text-foreground">{user?.created_at ? new Date(user.created_at).toLocaleDateString() : '-'}</span>
              </div>
            </div>
          </div>

          <Separator />

          <div className="space-y-4">
            <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
              <Award className="h-4 w-4 text-primary" />
              Usage Statistics
            </h3>
            <div className="grid grid-cols-2 gap-4 pl-6">
              <div className="bg-muted/30 rounded-lg p-4 text-center">
                <p className="text-2xl font-bold text-primary">{stats.totalChats}</p>
                <p className="text-xs text-muted-foreground mt-1">Total Chats</p>
              </div>
              <div className="bg-muted/30 rounded-lg p-4 text-center">
                <p className="text-2xl font-bold text-primary">{stats.questions}</p>
                <p className="text-xs text-muted-foreground mt-1">Questions Asked</p>
              </div>
            </div>
          </div>

          <Separator />

          <div className="space-y-3">
            <h3 className="text-sm font-semibold text-foreground">Account Actions</h3>
            <div className="space-y-2">
              <Button
                variant="outline"
                className="w-full justify-start"
                onClick={handleExportData}
              >
                <Download className="h-4 w-4 mr-2" />
                Export My Data
              </Button>
              <Button
                variant="outline"
                className="w-full justify-start text-destructive hover:text-destructive"
                onClick={handleDeleteAccount}
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Delete Account
              </Button>
              <Button
                variant="default"
                className="w-full justify-start"
                onClick={handleSignOut}
              >
                <LogOut className="h-4 w-4 mr-2" />
                Sign Out
              </Button>
            </div>
          </div>

          <div className="text-xs text-muted-foreground/70 text-center p-4 bg-muted/30 rounded-lg">
            <p>Your data is secure and encrypted.</p>
            <p className="mt-1">We respect your privacy and comply with HIPAA regulations.</p>
          </div>
        </div>
      </ScrollArea>
    </motion.div>
  );
};
