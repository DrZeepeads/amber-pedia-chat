// Centralized configuration management
interface AppConfig {
  app: {
    name: string;
    version: string;
    env: 'development' | 'staging' | 'production';
  };
  supabase: {
    url: string;
    key: string;
    projectId: string;
  };
  features: {
    analytics: boolean;
    errorTracking: boolean;
  };
  api: {
    timeout: number;
    maxMessageLength: number;
  };
}

export const getConfig = (): AppConfig => {
  const required = [
    'VITE_SUPABASE_URL',
    'VITE_SUPABASE_PUBLISHABLE_KEY',
  ];
  
  const missing = required.filter(key => !(import.meta as any).env[key]);
  if (missing.length > 0) {
    throw new Error(`Missing required environment variables: ${missing.join(', ')}`);
  }
  
  return {
    app: {
      name: (import.meta as any).env.VITE_APP_NAME || 'Nelson-GPT',
      version: (import.meta as any).env.VITE_APP_VERSION || '1.0.0',
      env: (import.meta as any).env.VITE_APP_ENV || 'development',
    },
    supabase: {
      url: (import.meta as any).env.VITE_SUPABASE_URL,
      key: (import.meta as any).env.VITE_SUPABASE_PUBLISHABLE_KEY,
      projectId: (import.meta as any).env.VITE_SUPABASE_PROJECT_ID,
    },
    features: {
      analytics: (import.meta as any).env.VITE_ENABLE_ANALYTICS === 'true',
      errorTracking: (import.meta as any).env.VITE_ENABLE_ERROR_TRACKING === 'true',
    },
    api: {
      timeout: parseInt((import.meta as any).env.VITE_API_TIMEOUT) || 30000,
      maxMessageLength: parseInt((import.meta as any).env.VITE_MAX_MESSAGE_LENGTH) || 2000,
    },
  };
};

export const config = getConfig();