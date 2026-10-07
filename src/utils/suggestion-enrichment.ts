/**
 * Suggestion Enrichment — Context-aware reasoning and classification
 *
 * Analyzes note content to produce:
 *  1. Contextual reason — WHY a suggestion is relevant
 *  2. Type classification — Related, Expands, Contradicts, Example
 *  3. Linked status — whether notes are already connected
 *  4. Key concepts — shared themes/keywords between notes
 *
 * All heuristic-based (no LLM needed). Runs fast for real-time suggestions.
 */

// ── Types ────────────────────────────────────────────────────────────────────

export type SuggestionType = "related" | "expands" | "contradicts" | "example";

export interface EnrichedSuggestion {
  path: string;
  title: string;
  similarity: number;
  type: SuggestionType;
  typeLabel: string;
  typeSymbol: string;
  reason: string;
  isLinked: boolean;
  group: "strong" | "broader";
  sharedConcepts: string[];
}

const TYPE_META: Record<SuggestionType, { label: string; symbol: string }> = {
  related: { label: "Related", symbol: "↔" },
  expands: { label: "Expands", symbol: "→" },
  contradicts: { label: "Contradicts", symbol: "⇄" },
  example: { label: "Example", symbol: "∈" },
};

// ── Concept extraction (simple, fast) ────────────────────────────────────────

// Common stop words to exclude from concept extraction
const STOP_WORDS = new Set([
  "the", "a", "an", "and", "or", "but", "in", "on", "at", "to", "for",
  "of", "with", "by", "from", "is", "are", "was", "were", "be", "been",
  "being", "have", "has", "had", "do", "does", "did", "will", "would",
  "could", "should", "may", "might", "can", "shall", "not", "no", "nor",
  "this", "that", "these", "those", "it", "its", "they", "them", "their",
  "you", "your", "we", "our", "he", "she", "him", "her", "my", "me",
  "what", "which", "who", "whom", "how", "when", "where", "why",
  "if", "then", "else", "so", "as", "than", "very", "just", "also",
  "about", "up", "out", "all", "some", "any", "each", "every", "both",
  "more", "most", "other", "into", "over", "after", "before", "between",
  "through", "during", "without", "within", "along", "around", "like",
  "here", "there", "now", "still", "already", "even", "much", "many",
  "well", "back", "only", "such", "make", "use", "using", "used",
  "one", "two", "three", "new", "old", "first", "last", "next", "same",
  "get", "got", "take", "know", "think", "see", "look", "come", "go",
  "note", "notes", "link", "page", "file", "markdown", "text",
]);

/**
 * Extract key concepts (2-4 word phrases + significant single words)
 * from note content. Returns top N concepts by frequency.
 */
function extractConcepts(text: string, maxConcepts = 15): string[] {
  // Strip markdown/frontmatter
  const clean = text
    .replace(/^---[\s\S]*?---\s*/m, "")
    .replace(/\[\[([^\]|]+)(?:\|[^\]]+)?\]\]/g, "$1")
    .replace(/\[([^\]]*)\]\([^)]*\)/g, "$1")
    .replace(/```[\s\S]*?```/g, "")
    .replace(/`[^`]+`/g, "")
    .replace(/^#{1,6}\s+/gm, "")
    .replace(/<[^>]+>/g, "")
    .replace(/[^a-zA-Z\s-]/g, " ")
    .toLowerCase();

  const words = clean.split(/\s+/).filter((w) => w.length > 2 && !STOP_WORDS.has(w));

  // Count word frequencies
  const freq = new Map<string, number>();
  for (const word of words) {
    freq.set(word, (freq.get(word) || 0) + 1);
  }

  // Extract bigrams from headings (more meaningful)
  const headings = text.match(/^#{1,6}\s+(.+)$/gm) || [];
  const headingPhrases: string[] = [];
  for (const h of headings) {
    const cleaned = h.replace(/^#{1,6}\s+/, "").toLowerCase().trim();
    if (cleaned.length > 3) headingPhrases.push(cleaned);
  }

  // Combine: heading phrases first, then top-frequency single words
  const concepts: string[] = [...headingPhrases];

  const sortedWords = [...freq.entries()]
    .sort((a, b) => b[1] - a[1])
    .map(([word]) => word);

  for (const word of sortedWords) {
    if (concepts.length >= maxConcepts) break;
    if (!concepts.some((c) => c.includes(word))) {
      concepts.push(word);
    }
  }

  return concepts.slice(0, maxConcepts);
}

/**
 * Find shared concepts between two sets of concepts.
 */
function findSharedConcepts(conceptsA: string[], conceptsB: string[]): string[] {
  const setB = new Set(conceptsB.flatMap((c) => c.split(/\s+/)));
  const shared: string[] = [];

  for (const concept of conceptsA) {
    const words = concept.split(/\s+/);
    const overlap = words.filter((w) => setB.has(w));
    if (overlap.length > 0) {
      shared.push(concept);
    }
  }

  return [...new Set(shared)].slice(0, 4);
}

// ── Type classification (heuristic) ──────────────────────────────────────────

/**
 * Classify the relationship type between two notes.
 */
function classifySuggestionType(
  sourceContent: string,
  targetContent: string,
  targetTitle: string,
  similarity: number,
): SuggestionType {
  const srcLower = sourceContent.toLowerCase();
  const tgtLower = targetContent.toLowerCase();

  // Check for contradiction signals
  const contradictionSignals = [
    "however", "but", "on the other hand", "in contrast",
    "alternatively", "disagree", "opposite", "versus", "vs",
    "contrary", "unlike", "whereas",
  ];
  const srcHasContradiction = contradictionSignals.some((s) => srcLower.includes(s));
  const tgtHasContradiction = contradictionSignals.some((s) => tgtLower.includes(s));
  if (srcHasContradiction && tgtHasContradiction && similarity > 0.35 && similarity < 0.65) {
    return "contradicts";
  }

  // Check for example signals
  const exampleSignals = [
    "for example", "e.g.", "such as", "like", "case study",
    "instance", "demonstration", "sample", "tutorial", "how to",
    "guide", "walkthrough", "step by step",
  ];
  const tgtHasExample = exampleSignals.some((s) => tgtLower.includes(s));
  if (tgtHasExample && similarity > 0.3 && similarity < 0.7) {
    return "example";
  }

  // Check for expansion signals (target is longer/more detailed on same topic)
  const srcLen = sourceContent.length;
  const tgtLen = targetContent.length;
  if (similarity > 0.5 && tgtLen > srcLen * 1.5) {
    return "expands";
  }

  // Check if target title appears as a concept in source
  const titleWords = targetTitle.toLowerCase().split(/\s+/);
  const titleInSource = titleWords.length > 1 &&
    titleWords.every((w) => w.length > 2 ? srcLower.includes(w) : true);
  if (titleInSource && similarity > 0.4) {
    return "expands";
  }

  return "related";
}

// ── Reason generation ────────────────────────────────────────────────────────

/**
 * Generate a human-readable reason for why this suggestion is relevant.
 */
function generateReason(
  type: SuggestionType,
  sharedConcepts: string[],
  targetTitle: string,
  similarity: number,
): string {
  const conceptStr = sharedConcepts.slice(0, 3).join(", ");

  switch (type) {
    case "contradicts":
      return conceptStr
        ? `Offers contrasting perspective on ${conceptStr}`
        : `May present an alternative viewpoint`;

    case "example":
      return conceptStr
        ? `Provides practical examples of ${conceptStr}`
        : `Contains examples related to this topic`;

    case "expands":
      return conceptStr
        ? `Expands on ${conceptStr} mentioned here`
        : `Goes deeper into themes from this note`;

    case "related":
      if (similarity > 0.7) {
        return conceptStr
          ? `Closely connected through ${conceptStr}`
          : `Very strong thematic overlap`;
      }
      if (similarity > 0.5) {
        return conceptStr
          ? `Shares themes around ${conceptStr}`
          : `Shares similar themes and ideas`;
      }
      return conceptStr
        ? `Loosely connected through ${conceptStr}`
        : `Touches on similar topics`;
  }
}

// ── Is-linked check ──────────────────────────────────────────────────────────

function checkIsLinked(sourceContent: string, targetTitle: string): boolean {
  return sourceContent.includes(`[[${targetTitle}]]`);
}

// ── Public API ───────────────────────────────────────────────────────────────

/**
 * Enrich a list of raw similarity results with contextual reasoning,
 * type classification, grouping, and linked status.
 *
 * @param sourceContent - Content of the active note
 * @param results - Raw similarity results (path, title, similarity)
 * @param noteContents - Map of path → content for target notes
 */
export function enrichSuggestions(
  sourceContent: string,
  results: { path: string; title: string; similarity: number }[],
  noteContents: Map<string, string>,
): EnrichedSuggestion[] {
  if (results.length === 0) return [];

  const sourceConcepts = extractConcepts(sourceContent);

  return results
    .filter((result) => result.similarity >= 0.35)
    .map((result) => {
      const targetContent = noteContents.get(result.path) || "";
      const targetConcepts = extractConcepts(targetContent);
      const sharedConcepts = findSharedConcepts(sourceConcepts, targetConcepts);

      const type = classifySuggestionType(
        sourceContent, targetContent, result.title, result.similarity,
      );

      const reason = generateReason(type, sharedConcepts, result.title, result.similarity);
      const isLinked = checkIsLinked(sourceContent, result.title);
      const group: "strong" | "broader" = result.similarity >= 0.55 ? "strong" : "broader";

      return {
        ...result,
        type,
        typeLabel: TYPE_META[type].label,
        typeSymbol: TYPE_META[type].symbol,
        reason,
        isLinked,
        group,
        sharedConcepts,
      };
    })
    .filter((suggestion) => suggestion.similarity >= 0.5 || suggestion.sharedConcepts.length > 0);
}
