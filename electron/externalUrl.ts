const ALLOWED_EXTERNAL_PROTOCOLS = new Set(["http:", "https:", "mailto:"]);

/** Validate and normalize a URL before handing it to the operating system. */
export function allowedExternalUrl(value: string): string {
  let url: URL;
  try {
    url = new URL(value);
  } catch {
    throw new Error("External URLs must be absolute HTTP, HTTPS, or mailto URLs.");
  }

  if (!ALLOWED_EXTERNAL_PROTOCOLS.has(url.protocol)) {
    throw new Error(`External URL protocol is not allowed: ${url.protocol}`);
  }

  return url.href;
}
