import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

// Fail with a clear message rather than a cryptic "supabaseUrl is required"
// white screen when the deploy platform's env vars aren't configured.
if (!supabaseUrl || !supabaseAnonKey) {
  // eslint-disable-next-line no-console
  console.error(
    '[DiligenceAI] Missing Supabase env vars. Set VITE_SUPABASE_URL and ' +
    'VITE_SUPABASE_ANON_KEY in your deployment environment (and rebuild).',
  );
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
