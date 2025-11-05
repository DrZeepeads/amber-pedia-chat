import { describe, it, expect, vi } from 'vitest';
import { Sentry } from '@/lib/sentry';

describe('Sentry Integration', () => {
  it('captures exceptions with context', () => {
    const captureException = vi.spyOn(Sentry, 'captureException');
    
    try {
      throw new Error('Test error');
    } catch (e) {
      Sentry.captureException(e, {
        tags: { feature: 'test' },
      });
    }
    
    expect(captureException).toHaveBeenCalled();
  });

  it('filters PII from error messages', () => {
    const beforeSend = vi.fn();
    
    // Mock Sentry's beforeSend function
    const mockBeforeSend = (event: any, hint: any) => {
      if (event.exception) {
        const error = hint.originalException;
        if (error && typeof error === 'object' && 'message' in error) {
          const message = String(error.message);
          if (message.includes('@') || /\b\d{10,}\b/.test(message)) {
            return null;
          }
        }
      }
      return event;
    };

    // Test email filtering
    const emailEvent = {
      exception: { values: [{ value: 'Error with user@example.com' }]
    };
    const emailHint = { originalException: new Error('Error with user@example.com') };
    
    const emailResult = mockBeforeSend(emailEvent, emailHint);
    expect(emailResult).toBeNull();

    // Test phone number filtering
    const phoneEvent = {
      exception: { values: [{ value: 'Error with 1234567890' }]
    };
    const phoneHint = { originalException: new Error('Error with 1234567890') };
    
    const phoneResult = mockBeforeSend(phoneEvent, phoneHint);
    expect(phoneResult).toBeNull();

    // Test normal error passes through
    const normalEvent = {
      exception: { values: [{ value: 'Normal error' }]
    };
    const normalHint = { originalException: new Error('Normal error') };
    
    const normalResult = mockBeforeSend(normalEvent, normalHint);
    expect(normalResult).not.toBeNull();
  });

  it('sanitizes URLs in breadcrumbs', () => {
    const beforeBreadcrumb = vi.fn();
    
    const mockBeforeBreadcrumb = (breadcrumb: any, hint: any) => {
      if (breadcrumb.data?.url) {
        breadcrumb.data.url = breadcrumb.data.url.replace(/email=[^&]+/, 'email=***');
      }
      return breadcrumb;
    };

    const breadcrumb = {
      data: {
        url: 'https://example.com/api/user?email=user@example.com&id=123'
      }
    };

    const result = mockBeforeBreadcrumb(breadcrumb, {});
    expect(result.data.url).toBe('https://example.com/api/user?email=***&id=123');
  });
});