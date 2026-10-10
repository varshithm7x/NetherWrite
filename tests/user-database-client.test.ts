import { afterEach, expect, it, vi } from "vitest";
const mocks = vi.hoisted(() => ({ create: vi.fn(() => ({ auth: {} })), load: vi.fn() }));
vi.mock("@supabase/supabase-js", () => ({ createClient: mocks.create }));
vi.mock("../src/lib/supabase", () => ({ isSupabaseConfigured: false, supabase: {} }));
vi.mock("../src/lib/supabaseConfig", () => ({ loadLocalSupabaseConfig: mocks.load, saveLocalSupabaseConfig: vi.fn(), clearLocalSupabaseConfig: vi.fn() }));
import { connectUserDatabase, disconnectUserDatabase, initializePersistedUserDatabase } from "../src/lib/userDatabase";
const config = { supabaseUrl: "https://example.supabase.co", anonKey: "test-key" };
afterEach(() => { disconnectUserDatabase(); vi.clearAllMocks(); });
it("reuses the same client during repeated initialization and Strict Mode mounts", () => {
  mocks.load.mockReturnValue(config);
  initializePersistedUserDatabase();
  const first = connectUserDatabase(config);
  initializePersistedUserDatabase();
  expect(connectUserDatabase({ ...config })).toBe(first);
  expect(mocks.create).toHaveBeenCalledOnce();
});
it("creates a new client when the database configuration changes", () => {
  const first = connectUserDatabase(config);
  const next = connectUserDatabase({ ...config, anonKey: "changed-key" });
  expect(next).not.toBe(first);
  expect(mocks.create).toHaveBeenCalledTimes(2);
});
