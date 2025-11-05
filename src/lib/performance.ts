import { Sentry } from '@/lib/sentry';

export const trackPerformance = (name: string, operation: () => Promise<any>) => {
  const transaction = Sentry.startTransaction({
    op: 'function',
    name,
  });

  return operation()
    .then((result) => {
      transaction.setStatus('ok');
      return result;
    })
    .catch((error) => {
      transaction.setStatus('internal_error');
      throw error;
    })
    .finally(() => {
      transaction.finish();
    });
};

// Helper function to track async operations with additional context
export const trackPerformanceWithContext = (
  name: string, 
  context: Record<string, any>, 
  operation: () => Promise<any>
) => {
  const transaction = Sentry.startTransaction({
    op: 'function',
    name,
    tags: context,
  });

  return operation()
    .then((result) => {
      transaction.setStatus('ok');
      return result;
    })
    .catch((error) => {
      transaction.setStatus('internal_error');
      throw error;
    })
    .finally(() => {
      transaction.finish();
    });
};

// Helper to measure execution time
export const measureExecutionTime = <T>(
  name: string, 
  fn: () => T
): T => {
  const start = performance.now();
  try {
    return fn();
  } finally {
    const duration = performance.now() - start;
    if (duration > 1000) { // Only log if takes more than 1 second
      console.warn(`Performance warning: ${name} took ${duration.toFixed(2)}ms`);
    }
  }
};