// @vitest-environment jsdom

import { describe, expect, it } from "vitest";
import { toVaultRelative } from "../src/lib/obsidian-api/vault";

describe("toVaultRelative", () => {
  it("strips a Unix vault prefix from an absolute path", () => {
    expect(toVaultRelative("/Users/me/vault/Note.md", "/Users/me/vault")).toBe("Note.md");
    expect(toVaultRelative("/Users/me/vault/folder/A.md", "/Users/me/vault")).toBe("folder/A.md");
  });

  it("strips a Windows vault prefix from an absolute path", () => {
    expect(toVaultRelative("C:\\Users\\me\\vault\\Note.md", "C:\\Users\\me\\vault")).toBe("Note.md");
  });

  it("leaves already-relative paths alone", () => {
    expect(toVaultRelative("Note.md", "/Users/me/vault")).toBe("Note.md");
    expect(toVaultRelative(".obsidian/snippets/wide.css", "/Users/me/vault")).toBe(
      ".obsidian/snippets/wide.css",
    );
  });
});
