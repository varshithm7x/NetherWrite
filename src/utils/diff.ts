export interface DiffWord {
  type: "added" | "removed" | "unchanged";
  content: string;
}

export interface DiffLine {
  type: "added" | "removed" | "unchanged" | "modified";
  content: string;
  words?: DiffWord[];
  leftLineNum?: number;
  rightLineNum?: number;
}

/**
 * Splits a line into tokens (words, spaces, and punctuation).
 */
function tokenizeLine(line: string): string[] {
  return line.match(/(\w+|[^\w\s]|\s+)/g) || [];
}

/**
 * Computes token-level differences between two strings (words/symbols).
 */
export function computeTokenDiff(beforeText: string, afterText: string): DiffWord[] {
  const beforeTokens = tokenizeLine(beforeText);
  const afterTokens = tokenizeLine(afterText);

  const m = beforeTokens.length;
  const n = afterTokens.length;
  const dp: number[][] = Array.from({ length: m + 1 }, () => new Array(n + 1).fill(0));

  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      if (beforeTokens[i - 1] === afterTokens[j - 1]) {
        dp[i][j] = dp[i - 1][j - 1] + 1;
      } else {
        dp[i][j] = Math.max(dp[i - 1][j], dp[i][j - 1]);
      }
    }
  }

  const diff: DiffWord[] = [];
  let i = m;
  let j = n;

  while (i > 0 || j > 0) {
    if (i > 0 && j > 0 && beforeTokens[i - 1] === afterTokens[j - 1]) {
      diff.push({ type: "unchanged", content: beforeTokens[i - 1] });
      i--;
      j--;
    } else if (j > 0 && (i === 0 || dp[i][j - 1] >= dp[i - 1][j])) {
      diff.push({ type: "added", content: afterTokens[j - 1] });
      j--;
    } else {
      diff.push({ type: "removed", content: beforeTokens[i - 1] });
      i--;
    }
  }

  return diff.reverse();
}

/**
 * Computes word-level similarity between two lines as a ratio of common tokens.
 */
export function computeTokenSimilarity(beforeText: string, afterText: string): number {
  if (!beforeText && !afterText) return 1;
  if (!beforeText || !afterText) return 0;

  const beforeTokens = tokenizeLine(beforeText);
  const afterTokens = tokenizeLine(afterText);

  if (beforeTokens.length === 0 && afterTokens.length === 0) return 1;
  if (beforeTokens.length === 0 || afterTokens.length === 0) return 0;

  const m = beforeTokens.length;
  const n = afterTokens.length;
  const dp: number[][] = Array.from({ length: m + 1 }, () => new Array(n + 1).fill(0));

  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      if (beforeTokens[i - 1] === afterTokens[j - 1]) {
        dp[i][j] = dp[i - 1][j - 1] + 1;
      } else {
        dp[i][j] = Math.max(dp[i - 1][j], dp[i][j - 1]);
      }
    }
  }

  const lcsLength = dp[m][n];
  return (2 * lcsLength) / (m + n);
}

/**
 * Computes a line-by-line diff between two strings using the Longest Common Subsequence (LCS) algorithm.
 * Groups adjacent removals/additions into "modified" lines if similarity is high,
 * and calculates left/right line numbers.
 */
export function computeLineDiff(beforeText: string, afterText: string): DiffLine[] {
  const beforeLines = beforeText ? beforeText.split(/\r?\n/) : [];
  const afterLines = afterText ? afterText.split(/\r?\n/) : [];

  const m = beforeLines.length;
  const n = afterLines.length;
  const dp: number[][] = Array.from({ length: m + 1 }, () => new Array(n + 1).fill(0));

  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      if (beforeLines[i - 1] === afterLines[j - 1]) {
        dp[i][j] = dp[i - 1][j - 1] + 1;
      } else {
        dp[i][j] = Math.max(dp[i - 1][j], dp[i][j - 1]);
      }
    }
  }

  const rawDiff: DiffLine[] = [];
  let i = m;
  let j = n;

  while (i > 0 || j > 0) {
    if (i > 0 && j > 0 && beforeLines[i - 1] === afterLines[j - 1]) {
      rawDiff.push({ type: "unchanged", content: beforeLines[i - 1] });
      i--;
      j--;
    } else if (j > 0 && (i === 0 || dp[i][j - 1] >= dp[i - 1][j])) {
      rawDiff.push({ type: "added", content: afterLines[j - 1] });
      j--;
    } else {
      rawDiff.push({ type: "removed", content: beforeLines[i - 1] });
      i--;
    }
  }

  const diff = rawDiff.reverse();

  // Post-process to detect modified lines
  const finalDiff: DiffLine[] = [];
  let k = 0;
  while (k < diff.length) {
    if (k < diff.length - 1 && diff[k].type === "removed" && diff[k + 1].type === "added") {
      const beforeContent = diff[k].content;
      const afterContent = diff[k + 1].content;
      const similarity = computeTokenSimilarity(beforeContent, afterContent);

      if (similarity >= 0.35) {
        const words = computeTokenDiff(beforeContent, afterContent);
        finalDiff.push({
          type: "modified",
          content: afterContent,
          words
        });
        k += 2;
      } else {
        finalDiff.push(diff[k]);
        k++;
      }
    } else {
      finalDiff.push(diff[k]);
      k++;
    }
  }

  // Assign line numbers
  let leftLineNum = 0;
  let rightLineNum = 0;
  for (const line of finalDiff) {
    if (line.type === "unchanged") {
      leftLineNum++;
      rightLineNum++;
      line.leftLineNum = leftLineNum;
      line.rightLineNum = rightLineNum;
    } else if (line.type === "removed") {
      leftLineNum++;
      line.leftLineNum = leftLineNum;
    } else if (line.type === "added") {
      rightLineNum++;
      line.rightLineNum = rightLineNum;
    } else if (line.type === "modified") {
      leftLineNum++;
      rightLineNum++;
      line.leftLineNum = leftLineNum;
      line.rightLineNum = rightLineNum;
    }
  }

  return finalDiff;
}

/**
 * Extracts the Markdown prefix (headings, lists, tasks) from a line.
 */
function extractPrefix(text: string): string {
  const m = text.match(/^(\s*#{1,6}\s+|\s*[-*+]\s+(?:\[[ xX]\]\s+)?)/);
  return m ? m[1] : "";
}

/**
 * Generates a single Markdown string representing the diff between two texts,
 * with additions/deletions wrapped in HTML <ins>/<del> tags so it renders
 * as a readable Markdown document.
 */
export function generateDiffMarkdown(beforeText: string, afterText: string): string {
  const beforeLines = beforeText ? beforeText.split(/\r?\n/) : [];
  const afterLines = afterText ? afterText.split(/\r?\n/) : [];

  const m = beforeLines.length;
  const n = afterLines.length;
  const dp: number[][] = Array.from({ length: m + 1 }, () => new Array(n + 1).fill(0));

  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      if (beforeLines[i - 1] === afterLines[j - 1]) {
        dp[i][j] = dp[i - 1][j - 1] + 1;
      } else {
        dp[i][j] = Math.max(dp[i - 1][j], dp[i][j - 1]);
      }
    }
  }

  interface TempLine {
    type: "added" | "removed" | "unchanged" | "modified";
    beforeContent?: string;
    afterContent?: string;
  }

  const rawDiff: TempLine[] = [];
  let i = m;
  let j = n;

  while (i > 0 || j > 0) {
    if (i > 0 && j > 0 && beforeLines[i - 1] === afterLines[j - 1]) {
      rawDiff.push({ type: "unchanged", afterContent: beforeLines[i - 1] });
      i--;
      j--;
    } else if (j > 0 && (i === 0 || dp[i][j - 1] >= dp[i - 1][j])) {
      rawDiff.push({ type: "added", afterContent: afterLines[j - 1] });
      j--;
    } else {
      rawDiff.push({ type: "removed", beforeContent: beforeLines[i - 1] });
      i--;
    }
  }

  const diff = rawDiff.reverse();

  // Post-process to group modifications
  const mergedDiff: TempLine[] = [];
  let k = 0;
  while (k < diff.length) {
    if (k < diff.length - 1 && diff[k].type === "removed" && diff[k + 1].type === "added") {
      const beforeVal = diff[k].beforeContent || "";
      const afterVal = diff[k + 1].afterContent || "";
      const similarity = computeTokenSimilarity(beforeVal, afterVal);

      if (similarity >= 0.35) {
        mergedDiff.push({
          type: "modified",
          beforeContent: beforeVal,
          afterContent: afterVal
        });
        k += 2;
      } else {
        mergedDiff.push(diff[k]);
        k++;
      }
    } else {
      mergedDiff.push(diff[k]);
      k++;
    }
  }

  const markdownLines: string[] = [];

  for (const line of mergedDiff) {
    if (line.type === "unchanged") {
      markdownLines.push(line.afterContent || "");
    } else if (line.type === "added") {
      const content = line.afterContent || "";
      const prefix = extractPrefix(content);
      const body = content.slice(prefix.length);
      markdownLines.push(`${prefix}<ins class="diff-md-added" style="background-color: rgba(72, 199, 142, 0.15); color: rgb(72, 199, 142); text-decoration: none; padding: 0 4px; border-radius: 4px; display: inline;">${body}</ins>`);
    } else if (line.type === "removed") {
      const content = line.beforeContent || "";
      const prefix = extractPrefix(content);
      const body = content.slice(prefix.length);
      markdownLines.push(`${prefix}<del class="diff-md-removed" style="background-color: rgba(255, 82, 82, 0.15); color: rgb(255, 82, 82); text-decoration: line-through; padding: 0 4px; border-radius: 4px; display: inline;">${body}</del>`);
    } else if (line.type === "modified") {
      const beforeContent = line.beforeContent || "";
      const afterContent = line.afterContent || "";

      const beforePrefix = extractPrefix(beforeContent);
      const afterPrefix = extractPrefix(afterContent);

      const beforeBody = beforeContent.slice(beforePrefix.length);
      const afterBody = afterContent.slice(afterPrefix.length);

      const words = computeTokenDiff(beforeBody, afterBody);
      let bodyDiffHtml = "";
      for (const word of words) {
        if (word.type === "added") {
          bodyDiffHtml += `<ins class="diff-word-added" style="background-color: rgba(72, 199, 142, 0.25); color: rgb(72, 199, 142); text-decoration: none; padding: 0 2px; border-radius: 2px; display: inline;">${word.content}</ins>`;
        } else if (word.type === "removed") {
          bodyDiffHtml += `<del class="diff-word-removed" style="background-color: rgba(255, 82, 82, 0.25); color: rgb(255, 82, 82); text-decoration: line-through; padding: 0 2px; border-radius: 2px; display: inline;">${word.content}</del>`;
        } else {
          bodyDiffHtml += word.content;
        }
      }

      markdownLines.push(`${afterPrefix}${bodyDiffHtml}`);
    }
  }

  return markdownLines.join("\n");
}
