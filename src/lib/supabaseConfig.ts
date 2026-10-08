export interface LocalSupabaseConfig {
  supabaseUrl: string;
  anonKey: string;
}

export const LOCAL_SUPABASE_CONFIG_KEY = "netherwrite-local-supabase-config-v1";
export const SUPABASE_CONFIG_CHANGED_EVENT = "netherwrite-supabase-config-changed";

function normalizeConfig(config: Partial<LocalSupabaseConfig> | null | undefined): LocalSupabaseConfig | null {
  const supabaseUrl = config?.supabaseUrl?.trim() || "";
  const anonKey = config?.anonKey?.trim() || "";
  if (!supabaseUrl || !anonKey) return null;
  return { supabaseUrl, anonKey };
}

export function loadLocalSupabaseConfig(): LocalSupabaseConfig | null {
  if (typeof window === "undefined") return null;

  try {
    const raw = window.localStorage.getItem(LOCAL_SUPABASE_CONFIG_KEY);
    if (!raw) return null;
    return normalizeConfig(JSON.parse(raw));
  } catch {
    return null;
  }
}

export function saveLocalSupabaseConfig(config: LocalSupabaseConfig): LocalSupabaseConfig {
  const normalized = normalizeConfig(config);
  if (!normalized) {
    throw new Error("Supabase URL and anon key are required.");
  }

  window.localStorage.setItem(LOCAL_SUPABASE_CONFIG_KEY, JSON.stringify(normalized));
  window.dispatchEvent(new CustomEvent(SUPABASE_CONFIG_CHANGED_EVENT, { detail: normalized }));
  return normalized;
}

export function clearLocalSupabaseConfig(): void {
  if (typeof window === "undefined") return;
  window.localStorage.removeItem(LOCAL_SUPABASE_CONFIG_KEY);
  window.dispatchEvent(new CustomEvent(SUPABASE_CONFIG_CHANGED_EVENT, { detail: null }));
}

export function parseSupabaseEnv(text: string): Partial<LocalSupabaseConfig> {
  const values = new Map<string, string>();

  for (const rawLine of text.split(/\r?\n/)) {
    const line = rawLine.trim();
    if (!line || line.startsWith("#")) continue;

    const match = line.match(/^(?:export\s+)?([A-Z0-9_]+)\s*=\s*(.*)$/);
    if (!match) continue;

    const key = match[1];
    let value = match[2].trim();
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }
    values.set(key, value);
  }

  return {
    supabaseUrl:
      values.get("VITE_SUPABASE_URL") ||
      values.get("SUPABASE_URL") ||
      values.get("NEXT_PUBLIC_SUPABASE_URL") ||
      "",
    anonKey:
      values.get("VITE_SUPABASE_ANON_KEY") ||
      values.get("SUPABASE_ANON_KEY") ||
      values.get("NEXT_PUBLIC_SUPABASE_ANON_KEY") ||
      "",
  };
}

export function getEnvSupabaseConfig(): LocalSupabaseConfig | null {
  const supabaseUrl = (import.meta.env.VITE_SUPABASE_URL as string | undefined)?.trim();
  const anonKey = (import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined)?.trim();
  return normalizeConfig({ supabaseUrl, anonKey });
}

export function getInitialSupabaseConfig(): LocalSupabaseConfig | null {
  return loadLocalSupabaseConfig() || getEnvSupabaseConfig();
}
