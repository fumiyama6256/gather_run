import { createClient } from '@supabase/supabase-js';
import AsyncStorage from '@react-native-async-storage/async-storage';

// ローカル開発用の設定
// 本番環境では環境変数から読み込む
// 注意: スマホから接続する場合は、PCのIPアドレスを使用してください
// 例: http://YOUR_PC_IP:54321 または本番のSupabase URLを使用
const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL || 'http://10.68.209.116:54321';
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0';

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});

// 型定義
export type Run = {
  id: string;
  location: string; // PostGIS geography type
  location_name: string | null;
  datetime: string;
  description: string;
  note: string | null;
  thanks_count: number;
  created_at: string;
};

export type CreateRunInput = {
  location: string; // POINT(lng lat) format
  location_name?: string;
  datetime: string;
  description: string;
  note?: string;
};
