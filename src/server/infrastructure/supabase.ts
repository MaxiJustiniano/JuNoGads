import { createClient } from '@supabase/supabase-js';

const getEnvVars = () => {
  let url = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL || '';
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY || '';

  if (!url || !url.startsWith('http')) {
    console.warn(`[Supabase Config] URL missing or malformed. Fallback to placeholder: ${url}`);
    url = 'https://placeholder.supabase.co';
  }
  return { url, key: key || 'placeholder-key' };
};

const { url, key } = getEnvVars();

export const supabase = createClient(url, key);
export const getSupabase = () => supabase;

