import { createClient } from '@supabase/supabase-js';

const supabaseUrl = "https://gdrojabvlkdqmxrxobkb.supabase.co";

const supabaseAnonKey =
  "YOUR_ANON_KEY";

const supabase = createClient(
  supabaseUrl,
  supabaseAnonKey
);

export default supabase;
