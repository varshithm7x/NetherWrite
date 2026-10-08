import { describe, expect, it } from "vitest";
import { allowedExternalUrl } from "../electron/externalUrl";

describe("external URL policy", () => {
  it.each([
    "https://example.com/docs",
    "http://localhost:3000/help",
    "mailto:support@example.com",
  ])("allows %s", (url) => {
    expect(allowedExternalUrl(url)).toBe(url);
  });

  it.each([
    "file:///tmp/private.txt",
    "vault://local/Note.md",
    "javascript:alert(1)",
    "/tmp/private.txt",
    String.raw`C:\\Users\\me\\private.txt`,
  ])("rejects %s", (url) => {
    expect(() => allowedExternalUrl(url)).toThrow();
  });
});
