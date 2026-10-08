/** Normalize app-owned canvas metadata while keeping user text untouched. */
export function normalizeCanvasBranding<T extends Record<string, any>>(canvas: T): T {
  const normalized = { ...canvas } as Record<string, any>;
  for (const suffix of ['ScribblesV1', 'CanvasCustomizationV1', 'CanvasViewportV1']) {
    const legacyKey = `openonyx${suffix}`;
    const key = `netherwrite${suffix}`;
    if (normalized[key] === undefined && normalized[legacyKey] !== undefined) {
      normalized[key] = normalized[legacyKey];
    }
    delete normalized[legacyKey];
  }
  return normalized as T;
}
