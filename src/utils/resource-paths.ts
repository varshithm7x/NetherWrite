/** Stable companion path shared by import, document tabs, and AI source selection. */
export function resourceContentPath(originalPath: string): string {
  return originalPath.replace(/\.[^/.]+$/, "") + ".content.md";
}

export function isPowerPointResource(name: string): boolean {
  return /\.(ppt|pptx|pps|ppsx|pot|potx|pptm|ppsm|potm)$/i.test(name);
}
