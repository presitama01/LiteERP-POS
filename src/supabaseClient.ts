import { createClient } from '@supabase/supabase-js';

// Access variables via Vite environment or fallback to user credentials immediately
const SUPABASE_URL = (import.meta as any).env.VITE_SUPABASE_URL || 'https://tjnzihnnkalrwwbuxfxa.supabase.co';
const SUPABASE_ANON_KEY = (import.meta as any).env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRqbnppaG5ua2Fscnd3YnV4ZnhhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzkyMTcyNjYsImV4cCI6MjA5NDc5MzI2Nn0.vm7vD2FTYvmIqLbsnTydfcpKMjHU5x9w1kkY8G5mgJk';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// Helper helper to check connection to Supabase
export async function checkSupabaseConnection(): Promise<{ connected: boolean; message: string }> {
  try {
    const { data, error } = await supabase.from('categories').select('count', { count: 'exact', head: true });
    if (error) {
      return { 
        connected: false, 
        message: `Tersambung ke API Supabase, tetapi tabel 'categories' tidak ditemukan atau belum dibuat di database Anda. Silakan jalankan DDL SQL di tab Schema terlebih dahulu. Detail error: ${error.message}` 
      };
    }
    return { connected: true, message: 'Sukses tersambung ke Database Supabase LITE-ERP!' };
  } catch (err: any) {
    return { connected: false, message: `Gagal tersambung ke database: ${err?.message || err}` };
  }
}
