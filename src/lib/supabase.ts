import { createClient } from '@supabase/supabase-js';
import type { Database } from './database.types';
import { getInitialSupabaseConfig, type LocalSupabaseConfig } from './supabaseConfig';

function createSupabaseClient(config: LocalSupabaseConfig | null) {
  // createClient requires non-empty values even when cloud features are disabled.
  // These loopback placeholders prevent import-time crashes and are never contacted:
  // every cloud/auth entry point checks isSupabaseConfigured first.
  const clientUrl = config?.supabaseUrl || "http://127.0.0.1:54321";
  const clientAnonKey = config?.anonKey || "netherwrite-local-only";

  return createClient<Database>(
    clientUrl,
    clientAnonKey,
    {
      auth: {
        storageKey: 'netherwrite-app-auth-v1',
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
        flowType: 'pkce',
        // Custom no-op lock function to bypass GoTrue/Supabase Web Locks API contention.
        // In React Strict Mode (dev), components mount/unmount rapidly, causing locks to hang.
        lock: async (name, acquireTimeout, fn) => {
          return await fn();
        },
      },
    }
  );
}

let activeConfig = getInitialSupabaseConfig();

export let isSupabaseConfigured = Boolean(activeConfig);

if (!isSupabaseConfigured) {
  console.info("[NetherWrite] Supabase is not configured; running in local-only mode.");
}

export let supabase = createSupabaseClient(activeConfig);

export function configureSupabaseClient(config: LocalSupabaseConfig | null = getInitialSupabaseConfig()): void {
  activeConfig = config;
  isSupabaseConfigured = Boolean(activeConfig);
  supabase = createSupabaseClient(activeConfig);

  if (!isSupabaseConfigured) {
    console.info("[NetherWrite] Supabase is not configured; running in local-only mode.");
  }
}
