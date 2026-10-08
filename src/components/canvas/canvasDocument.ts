import {
  CanvasData,
  CanvasEdge,
  CanvasNode,
  CanvasNodeType,
  EdgeEnd,
  EdgeSide,
  GroupBackgroundStyle,
  MIN_NODE_HEIGHT,
  MIN_NODE_WIDTH,
} from "../../types/canvas";
import { generateId } from "../../utils/helpers";

const NODE_TYPES = new Set<CanvasNodeType>(["text", "file", "link", "group"]);
const EDGE_SIDES = new Set<EdgeSide>(["top", "right", "bottom", "left"]);
const EDGE_ENDS = new Set<EdgeEnd>(["none", "arrow"]);
const GROUP_BG_STYLES = new Set<GroupBackgroundStyle>([
  "cover",
  "ratio",
  "repeat",
]);

export interface CanvasDiagnostics {
  warnings: string[];
  errors: string[];
  droppedNodes: number;
  droppedEdges: number;
  repaired: boolean;
  parseError?: string;
}

export interface ParsedCanvasDocument {
  data: CanvasData;
  metadata: Record<string, unknown>;
  diagnostics: CanvasDiagnostics;
}

function asRecord(value: unknown): Record<string, unknown> | null {
  if (value && typeof value === "object" && !Array.isArray(value)) {
    return value as Record<string, unknown>;
  }
  return null;
}

function toFiniteNumber(value: unknown, fallback: number): number {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string") {
    const parsed = Number(value);
    if (Number.isFinite(parsed)) return parsed;
  }
  return fallback;
}

function toOptionalString(value: unknown): string | undefined {
  return typeof value === "string" ? value : undefined;
}

function toOptionalBoolean(value: unknown): boolean | undefined {
  return typeof value === "boolean" ? value : undefined;
}

function toEdgeSide(value: unknown): EdgeSide | undefined {
  if (typeof value === "string" && EDGE_SIDES.has(value as EdgeSide)) {
    return value as EdgeSide;
  }
  return undefined;
}

function toEdgeEnd(value: unknown): EdgeEnd | undefined {
  if (typeof value === "string" && EDGE_ENDS.has(value as EdgeEnd)) {
    return value as EdgeEnd;
  }
  return undefined;
}

function toGroupBackgroundStyle(
  value: unknown,
): GroupBackgroundStyle | undefined {
  if (
    typeof value === "string" &&
    GROUP_BG_STYLES.has(value as GroupBackgroundStyle)
  ) {
    return value as GroupBackgroundStyle;
  }
  return undefined;
}

function sanitizeNode(
  rawNode: unknown,
  index: number,
  diagnostics: CanvasDiagnostics,
): CanvasNode | null {
  const record = asRecord(rawNode);
  if (!record) {
    diagnostics.droppedNodes += 1;
    diagnostics.errors.push(
      `Dropped node #${index + 1}: node is not an object.`,
    );
    return null;
  }

  const type = typeof record.type === "string" ? record.type : undefined;
  if (!type || !NODE_TYPES.has(type as CanvasNodeType)) {
    diagnostics.droppedNodes += 1;
    diagnostics.errors.push(`Dropped node #${index + 1}: invalid node type.`);
    return null;
  }

  const fallbackId = `node-${index + 1}-${generateId()}`;
  const id =
    typeof record.id === "string" && record.id.trim() ? record.id : fallbackId;
  if (id === fallbackId)
    diagnostics.warnings.push(`Repaired node #${index + 1}: missing id.`);

  const width = Math.max(MIN_NODE_WIDTH, toFiniteNumber(record.width, 260));
  const height = Math.max(MIN_NODE_HEIGHT, toFiniteNumber(record.height, 160));

  const base = {
    ...record,
    id,
    type: type as CanvasNodeType,
    x: toFiniteNumber(record.x, 0),
    y: toFiniteNumber(record.y, 0),
    width,
    height,
    locked: toOptionalBoolean(record.locked),
    color: toOptionalString(record.color),
    opacity: typeof record.opacity === "number" && Number.isFinite(record.opacity) ? record.opacity : undefined,
  } as Record<string, unknown>;

  if (type === "text") {
    return {
      ...base,
      type: "text",
      text: typeof record.text === "string" ? record.text : "",
    } as CanvasNode;
  }

  if (type === "file") {
    return {
      ...base,
      type: "file",
      file: typeof record.file === "string" ? record.file : "",
      subpath: toOptionalString(record.subpath),
    } as CanvasNode;
  }

  if (type === "link") {
    return {
      ...base,
      type: "link",
      url: typeof record.url === "string" ? record.url : "",
    } as CanvasNode;
  }

  return {
    ...base,
    type: "group",
    label: toOptionalString(record.label),
    background: toOptionalString(record.background),
    backgroundStyle: toGroupBackgroundStyle(record.backgroundStyle),
  } as CanvasNode;
}

function sanitizeEdge(
  rawEdge: unknown,
  index: number,
  nodeIds: Set<string>,
  diagnostics: CanvasDiagnostics,
): CanvasEdge | null {
  const record = asRecord(rawEdge);
  if (!record) {
    diagnostics.droppedEdges += 1;
    diagnostics.errors.push(
      `Dropped edge #${index + 1}: edge is not an object.`,
    );
    return null;
  }

  const fromNode = typeof record.fromNode === "string" ? record.fromNode : "";
  const toNode = typeof record.toNode === "string" ? record.toNode : "";
  if (!fromNode || !toNode) {
    diagnostics.droppedEdges += 1;
    diagnostics.errors.push(
      `Dropped edge #${index + 1}: missing fromNode/toNode.`,
    );
    return null;
  }

  if (!nodeIds.has(fromNode) || !nodeIds.has(toNode)) {
    diagnostics.droppedEdges += 1;
    diagnostics.errors.push(
      `Dropped edge #${index + 1}: references unknown node(s).`,
    );
    return null;
  }

  const fallbackId = `edge-${index + 1}-${generateId()}`;
  const id =
    typeof record.id === "string" && record.id.trim() ? record.id : fallbackId;
  if (id === fallbackId)
    diagnostics.warnings.push(`Repaired edge #${index + 1}: missing id.`);

  return {
    ...record,
    id,
    fromNode,
    toNode,
    fromSide: toEdgeSide(record.fromSide),
    toSide: toEdgeSide(record.toSide),
    fromEnd: toEdgeEnd(record.fromEnd),
    toEnd: toEdgeEnd(record.toEnd),
    label: toOptionalString(record.label),
    color: toOptionalString(record.color),
    width: Math.max(1, Math.min(14, toFiniteNumber(record.width, 2))),
    stretch: Math.max(0.1, Math.min(5, toFiniteNumber(record.stretch, 1))),
    fromStretch: Math.max(
      0.1,
      Math.min(5, toFiniteNumber(record.fromStretch, toFiniteNumber(record.stretch, 1))),
    ),
    toStretch: Math.max(
      0.1,
      Math.min(5, toFiniteNumber(record.toStretch, toFiniteNumber(record.stretch, 1))),
    ),
    fromControlDx:
      typeof record.fromControlDx === "number" && Number.isFinite(record.fromControlDx)
        ? record.fromControlDx
        : undefined,
    fromControlDy:
      typeof record.fromControlDy === "number" && Number.isFinite(record.fromControlDy)
        ? record.fromControlDy
        : undefined,
    toControlDx:
      typeof record.toControlDx === "number" && Number.isFinite(record.toControlDx)
        ? record.toControlDx
        : undefined,
    toControlDy:
      typeof record.toControlDy === "number" && Number.isFinite(record.toControlDy)
        ? record.toControlDy
        : undefined,
    locked: toOptionalBoolean(record.locked),
  } as CanvasEdge;
}

export function parseCanvasDocument(raw: string): ParsedCanvasDocument {
  const diagnostics: CanvasDiagnostics = {
    warnings: [],
    errors: [],
    droppedNodes: 0,
    droppedEdges: 0,
    repaired: false,
  };

  let parsedRoot: Record<string, unknown> = {};
  if (raw?.trim()) {
    try {
      const parsed = JSON.parse(raw);
      const record = asRecord(parsed);
      if (record) {
        parsedRoot = record;
      } else {
        diagnostics.parseError = "Root document is not an object.";
      }
    } catch (error) {
      diagnostics.parseError =
        error instanceof Error ? error.message : "Invalid JSON.";
    }
  }

  const metadata: Record<string, unknown> = { ...parsedRoot };
  delete metadata.nodes;
  delete metadata.edges;

  const rawNodes = Array.isArray(parsedRoot.nodes) ? parsedRoot.nodes : [];
  const nodes = rawNodes
    .map((rawNode, index) => sanitizeNode(rawNode, index, diagnostics))
    .filter((node): node is CanvasNode => node !== null);
  const nodeIds = new Set(nodes.map((node) => node.id));

  const rawEdges = Array.isArray(parsedRoot.edges) ? parsedRoot.edges : [];
  const edges = rawEdges
    .map((rawEdge, index) => sanitizeEdge(rawEdge, index, nodeIds, diagnostics))
    .filter((edge): edge is CanvasEdge => edge !== null);

  diagnostics.repaired =
    !!diagnostics.parseError ||
    diagnostics.warnings.length > 0 ||
    diagnostics.errors.length > 0 ||
    diagnostics.droppedNodes > 0 ||
    diagnostics.droppedEdges > 0;

  return {
    data: { nodes, edges },
    metadata,
    diagnostics,
  };
}

export function serializeCanvasDocument(
  data: CanvasData,
  metadata?: Record<string, unknown>,
): string {
  const payload: CanvasData = {
    ...(metadata || {}),
    nodes: Array.isArray(data.nodes) ? data.nodes : [],
    edges: Array.isArray(data.edges) ? data.edges : [],
  };
  return JSON.stringify(payload, null, 2);
}
