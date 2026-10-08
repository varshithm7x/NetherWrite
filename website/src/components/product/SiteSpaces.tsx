import { useEffect, useMemo, useState } from "react";
import { embedText, loadStoreAsync } from "../../../../src/utils/embeddings";
import vault from "../../data/real-vault.json";

const FILES = vault as Record<string, string>;

type Hit = { path: string; title: string; score: number; excerpt: string };

function titleOf(path: string) {
  return path.split("/").pop()?.replace(/\.md$/i, "") || path;
}

function excerptOf(path: string) {
  return (FILES[path] || "")
    .replace(/^#+\s+/gm, "")
    .replace(/\[\[([^\]|]+)(?:\|[^\]]+)?\]\]/g, "$1")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 280);
}

function cosine(a: number[], b: number[]) {
  if (a.length !== b.length || a.length === 0) return 0;
  let dot = 0;
  for (let i = 0; i < a.length; i++) dot += a[i] * b[i];
  return dot;
}

export function SiteSpaces({ onOpenNote }: { onOpenNote: (path: string) => void }) {
  const notes = useMemo(
    () => Object.keys(FILES).filter((path) => path.toLowerCase().endsWith(".md")),
    [],
  );
  const [query, setQuery] = useState("");
  const [hits, setHits] = useState<Hit[]>([]);
  const [busy, setBusy] = useState(false);
  const [asked, setAsked] = useState("");

  useEffect(() => {
    void loadStoreAsync();
  }, []);

  const ask = async (text?: string) => {
    const q = (text ?? query).trim();
    if (!q) return;
    setBusy(true);
    setAsked(q);
    try {
      const store = await loadStoreAsync();
      const qv = await embedText(q);
      const ranked = [...store.entries.values()]
        .map((entry) => ({
          path: entry.path,
          title: titleOf(entry.path),
          score: cosine(qv, entry.vector),
          excerpt: excerptOf(entry.path),
        }))
        .filter((hit) => hit.score > 0.08)
        .sort((a, b) => b.score - a.score)
        .slice(0, 6);
      setHits(ranked);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="site-spaces">
      <header className="site-spaces-head">
        <div>
          <p className="oo-ask-kicker">spaces · OO-Test-Vault · {notes.length} notes</p>
          <h2>Ask the vault.</h2>
          <p>Local retrieval over the real notes. No account. Sources open in the editor.</p>
        </div>
        <button type="button" className="site-spaces-new" onClick={() => { setQuery("What is Zettelkasten?"); void ask("What is Zettelkasten?"); }}>
          Try a question
        </button>
      </header>

      <form
        className="site-spaces-form"
        onSubmit={(event) => {
          event.preventDefault();
          void ask();
        }}
      >
        <input
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Ask this vault…"
          aria-label="Ask this vault"
        />
        <button type="submit" disabled={busy || !query.trim()}>
          {busy ? "Searching…" : "Ask"}
        </button>
      </form>

      {asked && (
        <div className="site-spaces-answer">
          <p className="site-spaces-q">{asked}</p>
          {hits.length === 0 && !busy && <p>No close notes. Try a vault term like Zettelkasten, transformers, or daily note.</p>}
          {hits.length > 0 && (
            <p>
              Closest notes in this vault, ranked by the same local embedding path the desktop app uses:
            </p>
          )}
          <ul>
            {hits.map((hit) => (
              <li key={hit.path}>
                <button type="button" onClick={() => onOpenNote(hit.path)}>
                  <b>{hit.title}</b>
                  <span>{Math.round(hit.score * 100)}% · {hit.path}</span>
                  <em>{hit.excerpt}</em>
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
