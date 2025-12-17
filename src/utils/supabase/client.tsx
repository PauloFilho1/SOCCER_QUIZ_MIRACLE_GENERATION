import { createClient as createSupabaseClient } from '@supabase/supabase-js';
import { projectId, publicAnonKey } from './info.tsx';

let supabaseInstance: ReturnType<typeof createSupabaseClient> | null = null;

export function createClient() {
  if (!supabaseInstance) {
    const supabaseUrl = `https://${projectId}.supabase.co`;
    
    const siteUrl = window.location.hostname === 'localhost' 
      ? 'http://localhost:3000'
      : 'https://soccer-quiz-miracle-generation.vercel.app';
    
    supabaseInstance = createSupabaseClient(supabaseUrl, publicAnonKey, {
      auth: {
        redirectTo: siteUrl,
        autoRefreshToken: true,
        persistSession: true,
        detectSessionInUrl: true
      }
    });
  }
  return supabaseInstance;
}
