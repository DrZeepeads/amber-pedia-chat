import { Button } from '@/components/ui/button';
import { AlertCircle } from 'lucide-react';

export const ErrorBoundary = () => {
  const handleReload = () => {
    window.location.reload();
  };

  const handleReportIssue = () => {
    // Open Sentry user feedback dialog
    if (window.Sentry) {
      window.Sentry.showReportDialog();
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-6">
      <div className="max-w-md w-full space-y-6 text-center">
        <div className="flex justify-center">
          <AlertCircle className="h-16 w-16 text-destructive" />
        </div>
        
        <div className="space-y-2">
          <h1 className="text-2xl font-bold text-foreground">
            Something went wrong
          </h1>
          <p className="text-muted-foreground">
            We're sorry, but something unexpected happened. Our team has been notified.
          </p>
        </div>

        <div className="flex flex-col gap-3">
          <Button onClick={handleReload} size="lg">
            Reload Application
          </Button>
          <Button onClick={handleReportIssue} variant="outline" size="lg">
            Report Issue
          </Button>
        </div>

        <p className="text-xs text-muted-foreground">
          If this problem persists, please contact support at support@nelson-gpt.app
        </p>
      </div>
    </div>
  );
};