import { createClient } from '@supabase/supabase-js';

// Konfigurasi Supabase Client
const supabaseUrl = "https://wmqhgqxotjwotqaarjcx.supabase.co";
const supabaseAnonKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndtcWhncXhvdGp3b3RxYWFyamN4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjIzOTY2NTksImV4cCI6MjA3Nzk3MjY1OX0.KvgJKVr-st2dSJqUw_7hFdfn5o_ZdNLqPVKZ_NTstaQ";

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error("Supabase URL and Anon Key must be provided.");
}

// Buat dan ekspor Supabase client
export const supabase = createClient(supabaseUrl, supabaseAnonKey);
