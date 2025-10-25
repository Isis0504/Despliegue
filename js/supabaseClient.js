import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

// Lee las variables de entorno definidas en Netlify
const SUPABASE_URL = window.ENV?.SUPABASE_URL;
const SUPABASE_ANON_KEY = window.ENV?.SUPABASE_ANON_KEY;

// Verificación por si algo no está definido
if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  console.error("❌ Error: variables de entorno de Supabase no definidas.");
}

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
