import 'react-native-url-polyfill/auto';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://rdqpxixsbqcsyfewcmbz.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJkcXB4aXhzYnFjc3lmZXdjbWJ6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjAxMjI3NTMsImV4cCI6MjA3NTY5ODc1M30.rTbYZNKNv1szvzjA2D828OVt7qUZVSXgi4G_tUqm3mA';

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});

