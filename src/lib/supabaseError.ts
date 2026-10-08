export function formatSupabaseError(error: unknown, fallback = "Supabase request failed"): string {
  if (error instanceof Error && error.message) {
    return error.message;
  }

  if (error && typeof error === "object") {
    const record = error as Record<string, unknown>;
    const parts = [
      typeof record.message === "string" ? record.message : null,
      typeof record.code === "string" ? `code: ${record.code}` : null,
      typeof record.details === "string" ? record.details : null,
      typeof record.hint === "string" ? `hint: ${record.hint}` : null,
    ].filter(Boolean);

    if (parts.length > 0) {
      return parts.join(" ");
    }

    try {
      const serialized = JSON.stringify(error);
      if (serialized && serialized !== "{}") return serialized;
    } catch {
      // Fall through to the fallback below.
    }
  }

  return typeof error === "string" && error ? error : fallback;
}
