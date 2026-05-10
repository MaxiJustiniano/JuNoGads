import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  const missing = [];
  if (!supabaseUrl) missing.push('SUPABASE_URL');
  if (!supabaseServiceKey) missing.push('SUPABASE_SERVICE_ROLE_KEY');
  console.warn(`[Supabase Config] Missing credentials: ${missing.join(', ')}. Using placeholders.`);
} else {
  console.log(`[Supabase Config] Credentials detected. URL: ${supabaseUrl.substring(0, 15)}...`);
}

let sbClient: any = null;

export const getSupabase = () => {
  if (sbClient) return sbClient;

  let url = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL || '';
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY || '';

  if (!url || !url.startsWith('http')) {
    console.warn(`[Supabase] URL malformed or missing, fallback to placeholder: ${url}`);
    url = 'https://placeholder.supabase.co';
  }

  sbClient = createClient(url, key || 'placeholder-key');
  return sbClient;
};

// Also export a proxy for backward compatibility if we want, but better to use getSupabase().
export const supabase = new Proxy({}, {
  get: (target, prop) => {
    return Reflect.get(getSupabase(), prop);
  }
}) as ReturnType<typeof createClient>;

