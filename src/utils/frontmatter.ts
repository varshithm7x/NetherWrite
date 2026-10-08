import { getAPI } from '../utils/api';
import { FileEntry } from '../types';

export interface Property {
  key: string;
  value: string | string[];
  type: "text" | "list" | "date" | "tags" | "number";
}

export function parseFrontmatter(content: string): {
  properties: Property[];
  bodyStart: number;
} {
  const match = content.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n?/);
  if (!match) {
    return { properties: [], bodyStart: 0 };
  }

  const yaml = match[1];
  const bodyStart = match[0].length;
  const properties: Property[] = [];

  const lines = yaml.split("\n");
  let currentKey = "";
  let currentList: string[] = [];
  let inList = false;

  for (const line of lines) {
    if (inList && line.match(/^\s+-\s*(.*)/)) {
      const itemMatch = line.match(/^\s+-\s*(.*)/);
      if (itemMatch) {
        currentList.push(itemMatch[1].trim());
      }
      continue;
    }

    if (inList && currentKey) {
      properties.push({
        key: currentKey,
        value: currentList,
        type: currentKey === "tags" ? "tags" : "list",
      });
      inList = false;
      currentList = [];
    }

    const kvMatch = line.match(/^([a-zA-Z_][a-zA-Z0-9_-]*):\s*(.*)/);
    if (kvMatch) {
      currentKey = kvMatch[1];
      const value = kvMatch[2].trim();

      if (!value) {
        inList = true;
        currentList = [];
      } else if (value.startsWith("[") && value.endsWith("]")) {
        const items = value
          .slice(1, -1)
          .split(",")
          .map((s) => s.trim().replace(/^["']|["']$/g, ""));
        properties.push({
          key: currentKey,
          value: items,
          type: currentKey === "tags" ? "tags" : "list",
        });
      } else {
        let type: Property["type"] = "text";
        if (/^\d{4}-\d{2}-\d{2}(T|\s)/.test(value) || /^\d{4}-\d{2}-\d{2}$/.test(value)) {
          type = "date";
        } else if (/^-?\d+(\.\d+)?$/.test(value)) {
          type = "number";
        }
        properties.push({
          key: currentKey,
          value: value.replace(/^["']|["']$/g, ""),
          type,
        });
      }
    }
  }

  if (inList && currentKey && currentList.length > 0) {
    properties.push({
      key: currentKey,
      value: currentList,
      type: currentKey === "tags" ? "tags" : "list",
    });
  }

  return { properties, bodyStart };
}

export function updateFrontmatter(content: string, updates: Record<string, string | number | string[]>): string {
  const { properties, bodyStart } = parseFrontmatter(content);
  const body = bodyStart > 0 ? content.slice(bodyStart) : content;

  // Merge updates
  const propMap = new Map<string, Property>();
  for (const p of properties) {
    propMap.set(p.key, p);
  }

  for (const [k, v] of Object.entries(updates)) {
    let type: Property["type"] = "text";
    if (Array.isArray(v)) type = "list";
    else if (typeof v === "number") type = "number";
    else if (typeof v === "string" && /^\d{4}-\d{2}-\d{2}/.test(v)) type = "date";
    propMap.set(k, { key: k, value: v as string | string[], type });
  }

  if (propMap.size === 0) return body;

  let newYaml = "---\n";
  for (const [k, p] of propMap.entries()) {
    if (Array.isArray(p.value)) {
      newYaml += `${k}:\n`;
      for (const item of p.value) {
        newYaml += `  - ${item}\n`;
      }
    } else {
      newYaml += `${k}: ${p.value}\n`;
    }
  }
  newYaml += "---\n";

  // Prevent double newlines if body has leading newlines
  const trimmedBody = body.replace(/^\s*\n/, "");
  return newYaml + trimmedBody;
}

// Recursively find all markdown files in a given file node 
export function getAllMarkdownFiles(node: FileEntry): FileEntry[] {
  let files: FileEntry[] = [];
  if (!node.isDirectory && node.name.endsWith(".md")) {
    files.push(node);
  } else if (node.children) {
    for (const child of node.children) {
      files = files.concat(getAllMarkdownFiles(child));
    }
  }
  return files;
}
