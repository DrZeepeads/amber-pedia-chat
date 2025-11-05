/// <reference types="vite/client" />

interface ImportMetaEnv {
  // Supabase
  readonly VITE_SUPABASE_URL: string
  readonly VITE_SUPABASE_PUBLISHABLE_KEY: string
  readonly VITE_SUPABASE_PROJECT_ID: string
  
  // App
  readonly VITE_APP_NAME: string
  readonly VITE_APP_VERSION: string
  readonly VITE_APP_ENV: 'development' | 'staging' | 'production'
  
  // Features
  readonly VITE_ENABLE_ANALYTICS: string
  readonly VITE_ENABLE_ERROR_TRACKING: string
  
  // API
  readonly VITE_API_TIMEOUT: string
  readonly VITE_MAX_MESSAGE_LENGTH: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
