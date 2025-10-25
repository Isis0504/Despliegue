import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

// Lee las variables de entorno definidas en Netlify
const SUPABASE_URL = window.ENV?.SUPABASE_URL;
const SUPABASE_ANON_KEY = window.ENV?.SUPABASE_ANON_KEY;



export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
