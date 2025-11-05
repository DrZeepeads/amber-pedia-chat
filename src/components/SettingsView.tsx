import { motion } from 'framer-motion';
import { Settings, Moon, Sun, Type, Palette, Bell, Shield, Info, FileText } from 'lucide-react';
import { useChatStore } from '@/store/chatStore';
import { Label } from './ui/label';
import { Switch } from './ui/switch';
import { RadioGroup, RadioGroupItem } from './ui/radio-group';
import { ScrollArea } from './ui/scroll-area';
import { Separator } from './ui/separator';
import { config } from '@/lib/config';

export const SettingsView = () => {
  const { settings, updateSettings } = useChatStore();

  const SettingSection = ({ 
    icon: Icon, 
    title, 
    description, 
    children 
  }: { 
    icon: any; 
    title: string; 
    description?: string; 
    children: React.ReactNode;
  }) => (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <Icon className="h-5 w-5 text-primary" />
        <div>
          <h3 className="font-semibold text-foreground">{title}</h3>
          {description && (
            <p className="text-sm text-muted-foreground">{description}</p>
          )}
        </div>
      </div>
      <div className="space-y-3 pl-7">{children}</div>
    </div>
  );

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="h-screen flex flex-col pb-20"
    >
      <div className="border-b border-border bg-card p-6">
        <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
          <Settings className="h-6 w-6 text-primary" />
          Settings
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          Customize your Nelson-GPT experience
        </p>
      </div>

      <ScrollArea className="flex-1">
        <div className="p-6 space-y-6">
          {/* Theme */}
          <SettingSection 
            icon={settings.theme === 'dark' ? Moon : Sun}
            title="Theme" 
            description="Choose your preferred color scheme"
          >
            <RadioGroup
              value={settings.theme}
              onValueChange={(value: 'light' | 'dark') => updateSettings({ theme: value })}
              className="flex gap-4"
            >
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="light" id="light" />
                <Label htmlFor="light" className="cursor-pointer">Light</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="dark" id="dark" />
                <Label htmlFor="dark" className="cursor-pointer">Dark</Label>
              </div>
            </RadioGroup>
          </SettingSection>

          <Separator />

          {/* Font Size */}
          <SettingSection 
            icon={Type}
            title="Font Size" 
            description="Adjust text size for better readability"
          >
            <RadioGroup
              value={settings.fontSize}
              onValueChange={(value: 'small' | 'medium' | 'large') => updateSettings({ fontSize: value })}
              className="space-y-2"
            >
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="small" id="small" />
                <Label htmlFor="small" className="cursor-pointer">Small</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="medium" id="medium" />
                <Label htmlFor="medium" className="cursor-pointer">Medium</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="large" id="large" />
                <Label htmlFor="large" className="cursor-pointer">Large</Label>
              </div>
            </RadioGroup>
          </SettingSection>

          <Separator />

          {/* AI Style */}
          <SettingSection 
            icon={Palette}
            title="AI Response Style" 
            description="Control how detailed Nelson-GPT responses should be"
          >
            <RadioGroup
              value={settings.aiStyle}
              onValueChange={(value: 'concise' | 'balanced' | 'detailed') => updateSettings({ aiStyle: value })}
              className="space-y-2"
            >
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="concise" id="concise" />
                <Label htmlFor="concise" className="cursor-pointer">
                  Concise - Brief answers
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="balanced" id="balanced" />
                <Label htmlFor="balanced" className="cursor-pointer">
                  Balanced - Moderate detail
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="detailed" id="detailed" />
                <Label htmlFor="detailed" className="cursor-pointer">
                  Detailed - Comprehensive explanations
                </Label>
              </div>
            </RadioGroup>
          </SettingSection>

          <Separator />

          {/* Notifications */}
          <SettingSection 
            icon={Bell}
            title="Notifications" 
            description="Manage notification preferences"
          >
            <div className="flex items-center justify-between">
              <Label htmlFor="notifications" className="cursor-pointer">
                Enable notifications
              </Label>
              <Switch
                id="notifications"
                checked={settings.notifications}
                onCheckedChange={(checked) => updateSettings({ notifications: checked })}
              />
            </div>
          </SettingSection>

          <Separator />

          {/* Privacy */}
          <SettingSection 
            icon={Shield}
            title="Privacy & Safety" 
            description="Control your data and safety preferences"
          >
            <div className="flex items-center justify-between">
              <Label htmlFor="disclaimers" className="cursor-pointer">
                Show medical disclaimers
              </Label>
              <Switch
                id="disclaimers"
                checked={settings.showDisclaimers}
                onCheckedChange={(checked) => updateSettings({ showDisclaimers: checked })}
              />
            </div>
            <div className="flex items-center justify-between">
              <Label htmlFor="analytics" className="cursor-pointer">
                Share usage analytics
              </Label>
              <Switch
                id="analytics"
                checked={settings.shareAnalytics}
                onCheckedChange={(checked) => updateSettings({ shareAnalytics: checked })}
              />
            </div>
          </SettingSection>

          <Separator />

          {/* About */}
          <SettingSection 
            icon={Info}
            title="About Nelson-GPT" 
          >
            <div className="space-y-2 text-sm text-muted-foreground">
              <p className="flex items-center gap-2">
                <FileText className="h-4 w-4" />
                <span>
                  Version {config.app.version}
                  {config.app.env !== 'production' ? ` (${config.app.env})` : ''}
                </span>
              </p>
              <p className="leading-relaxed">
                Nelson-GPT provides evidence-based pediatric knowledge assistance, 
                inspired by the Nelson Textbook of Pediatrics. This tool is designed 
                for healthcare professionals and medical students.
              </p>
              <p className="text-xs text-muted-foreground/70 mt-4 p-3 bg-muted/50 rounded-lg">
                ⚠️ Medical Disclaimer: This AI assistant is for educational purposes 
                only and should not replace professional medical judgment. Always verify 
                information and consult appropriate clinical guidelines.
              </p>
            </div>
          </SettingSection>
        </div>
      </ScrollArea>
    </motion.div>
  );
};