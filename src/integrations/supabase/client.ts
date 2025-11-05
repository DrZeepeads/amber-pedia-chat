import { createClient } from '@supabase/supabase-js';
import type { Database } from './types';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;

if (!supabaseUrl) {
  throw new Error('Missing environment variable: VITE_SUPABASE_URL');
}

if (!supabaseKey) {
  throw new Error('Missing environment variable: VITE_SUPABASE_PUBLISHABLE_KEY');
}

export const supabase = createClient<Database>(supabaseUrl, supabaseKey, {
  auth: {
    storage: localStorage,
    persistSession: true,
    autoRefreshToken: true,
  },
});

export const config = {
  env: import.meta.env.VITE_APP_ENV || 'development',
  version: import.meta.env.VITE_APP_VERSION || '0.0.0',
  isDevelopment: import.meta.env.DEV,
  isProduction: import.meta.env.PROD,
};