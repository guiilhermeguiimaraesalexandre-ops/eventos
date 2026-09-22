import { createClient } from '@supabase/supabase-js';

const url = import.meta.env.VITE_SUPABASE_URL as string;
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string;

if (!url || !anonKey) {
  // eslint-disable-next-line no-console
  console.warn(
    '[supabase] VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY não configuradas. ' +
    'Copie .env.example para .env e preencha com os dados do seu projeto.'
  );
}

export const supabase = createClient(url, anonKey);

export const APP_URL = (import.meta.env.VITE_APP_URL as string) || window.location.origin;
