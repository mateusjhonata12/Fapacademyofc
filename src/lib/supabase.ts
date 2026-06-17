import { createClient } from '@supabase/supabase-js';

const supabaseUrl = (import.meta as any).env.VITE_SUPABASE_URL;
const supabaseAnonKey = (import.meta as any).env.VITE_SUPABASE_ANON_KEY;

const client = supabaseUrl && supabaseAnonKey && !supabaseUrl.includes('your-supabase-project')
  ? createClient(supabaseUrl, supabaseAnonKey)
  : null;

// Proxy-based mock to prevent runtime crashes if accessed when keys are missing
export const supabase = client || new Proxy({} as any, {
  get(target, prop) {
    if (prop === 'storage') {
      return {
        from: (bucket: string) => ({
          upload: async (path: string, file: File) => {
            throw new Error(`Supabase não configurado. Adicione VITE_SUPABASE_URL e VITE_SUPABASE_ANON_KEY no painel de Configurações.`);
          },
          getPublicUrl: (path: string) => ({ data: { publicUrl: "" } })
        })
      };
    }
    return () => {
      console.warn("Supabase não configurado.");
      return { error: { message: "Supabase não configurado." } };
    };
  }
});

export const isConfigured = !!client;


