import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

// Lee las variables de entorno definidas en Netlify
const SUPABASE_URL = window.ENV?.SUPABASE_URL;
const SUPABASE_ANON_KEY = window.ENV?.SUPABASE_ANON_KEY;

// Verificación de variables de entorno
if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  console.error('Error: SUPABASE_URL o SUPABASE_ANON_KEY no están definidos. Verifica las variables de entorno en Netlify.');
} else {
  export const supabaseClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
}