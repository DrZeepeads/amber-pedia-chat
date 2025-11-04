import { motion } from 'framer-motion';
import { User, Mail, Calendar, Award, LogOut, Download, Trash2 } from 'lucide-react';
import { Button } from './ui/button';
import { ScrollArea } from './ui/scroll-area';
import { Separator } from './ui/separator';
import { Avatar, AvatarFallback } from './ui/avatar';

export const ProfileView = () => {
  const handleExportData = () => {
    // TODO: Implement data export
    console.log('Exporting user data...');
  };

  const handleDeleteAccount = () => {
    // TODO: Implement account deletion
    console.log('Deleting account...');
  };

  const handleSignOut = () => {
    // TODO: Implement sign out
    console.log('Signing out...');
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
          <User className="h-6 w-6 text-primary" />
          Profile
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          Manage your account and preferences
        </p>
      </div>

      <ScrollArea className="flex-1">
        <div className="p-6 space-y-6">
          {/* Profile Header */}
          <div className="flex flex-col items-center text-center space-y-4">
            <Avatar className="h-24 w-24 border-4 border-primary/20">
              <AvatarFallback className="text-2xl bg-primary/10 text-primary">
                DR
              </AvatarFallback>
            </Avatar>
            <div>
              <h2 className="text-xl font-semibold text-foreground">Dr. User</h2>
              <p className="text-sm text-muted-foreground">Healthcare Professional</p>
            </div>
          </div>

          <Separator />

          {/* Account Info */}
          <div className="space-y-4">
            <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
              <Mail className="h-4 w-4 text-primary" />
              Account Information
            </h3>
            <div className="space-y-3 pl-6">
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Email</span>
                <span className="text-sm text-foreground">user@example.com</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground flex items-center gap-1">
                  <Calendar className="h-3 w-3" />
                  Member since
                </span>
                <span className="text-sm text-foreground">January 2025</span>
              </div>
            </div>
          </div>

          <Separator />

          {/* Usage Stats */}
          <div className="space-y-4">
            <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
              <Award className="h-4 w-4 text-primary" />
              Usage Statistics
            </h3>
            <div className="grid grid-cols-2 gap-4 pl-6">
              <div className="bg-muted/30 rounded-lg p-4 text-center">
                <p className="text-2xl font-bold text-primary">0</p>
                <p className="text-xs text-muted-foreground mt-1">Total Chats</p>
              </div>
              <div className="bg-muted/30 rounded-lg p-4 text-center">
                <p className="text-2xl font-bold text-primary">0</p>
                <p className="text-xs text-muted-foreground mt-1">Questions Asked</p>
              </div>
            </div>
          </div>

          <Separator />

          {/* Actions */}
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
