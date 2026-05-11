import { createClient } from '@supabase/supabase-js';

const supabaseUrl = "https://gdrojabvlkdqmxrxobkb.supabase.co";

const supabaseAnonKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imdkcm9qYWJ2bGtkcW14cnhvYmtiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzg0NzkyNjUsImV4cCI6MjA5NDA1NTI2NX0.loIlNuazEQirAjvrW0hR4badLMCQpOxu7-YS37kVoy0";

export const supabase = createClient(
  supabaseUrl,
  supabaseAnonKey
);
