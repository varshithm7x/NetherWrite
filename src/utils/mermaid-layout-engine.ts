export interface ParsedNode {
  id: string;
  label: string;
  shape: string;
}

export interface ParsedEdge {
  id: string;
  source: string;
  target: string;
  label?: string;
  style?: string; // 'dashed', 'thick', 'normal'
}

export interface ParsedSubgraph {
  id: string;
  label: string;
  nodeIds: string[];
}

export interface ParsedGraph {
  direction: string;
  nodes: ParsedNode[];
  edges: ParsedEdge[];
  subgraphs: ParsedSubgraph[];
}

interface LayoutNode {
  id: string;
  x: number;
  y: number;
  initX: number;
  initY: number;
  width: number;
  height: number;
  level?: number;
  cluster?: string;
}

/**
 * Parses Mermaid flowchart and mindmap code and extracts nodes, edges, subgraphs, and layout direction.
 */
export const parseMermaid = (source: string): ParsedGraph => {
  const lines = source
    .split("\n")
    .map(line => line.trim())
    .filter(line => line && !line.startsWith("%%"));

  let direction = "TD";
  const dirMatch = source.match(/(?:graph|flowchart)\s+(TD|TB|LR|RL|BT)/i);
  if (dirMatch) {
    direction = dirMatch[1].toUpperCase();
  }

  const nodes: ParsedNode[] = [];
  const edges: ParsedEdge[] = [];
  const subgraphs: ParsedSubgraph[] = [];
  const nodeSet = new Set<string>();
  let currentSubgraph: string | null = null;

  const addNode = (id: string, label = id, shape = "rect") => {
    id = id.trim();
    if (!id) return;
    
    // Ignore reserved keywords
    if (["subgraph", "end", "graph", "flowchart", "mindmap", "direction", "TD", "TB", "LR", "RL", "BT"].includes(id)) {
      return;
    }

    if (!nodeSet.has(id)) {
      nodeSet.add(id);
      nodes.push({ id, label, shape });
    } else if (label !== id) {
      const existing = nodes.find(n => n.id === id);
      if (existing) {
        existing.label = label;
        existing.shape = shape;
      }
    }

    if (currentSubgraph) {
      const sg = subgraphs.find(s => s.id === currentSubgraph);
      if (sg && !sg.nodeIds.includes(id)) {
        sg.nodeIds.push(id);
      }
    }
  };

  const getRawNodeId = (text: string): string => {
    const match = text.trim().match(/^([a-zA-Z0-9_-]+)/);
    return match ? match[1] : text.trim();
  };

  const extractNodeFromText = (text: string) => {
    const nodeDefRegex = /^([a-zA-Z0-9_-]+)\s*(?:\["([^"]*)"\]|\[([^\]]*)\]|\("([^"]*)"\)|\(([^)]*)\)|\{\{"([^"]*)"\}\}|\{\{([^}]*)\}\}|\{"([^"]*)"\}|\{([^}]*)\}|>([^\]]*)]|\[\/([^/]*)\/\]|\\([^\]]*)\\)/;
    const match = text.trim().match(nodeDefRegex);
    if (match) {
      const id = match[1];
      const label = match.slice(2).find(val => val !== undefined) || id;
      
      let shape = "rect";
      const fullMatchText = match[0];
      if (fullMatchText.includes("([") || fullMatchText.includes("])")) shape = "stadium";
      else if (fullMatchText.includes("[[") || fullMatchText.includes("]]")) shape = "subroutine";
      else if (fullMatchText.includes("((") || fullMatchText.includes("))")) shape = "circle";
      else if (fullMatchText.includes("{{") || fullMatchText.includes("}}")) shape = "hexagon";
      else if (fullMatchText.includes("{") || fullMatchText.includes("}")) shape = "diamond";
      else if (fullMatchText.includes(">")) shape = "asymmetric";
      else if (fullMatchText.includes("[/") || fullMatchText.includes("\\]")) shape = "parallelogram";
      else if (fullMatchText.includes("[\\") || fullMatchText.includes("/]")) shape = "trapezoid";
      else if (fullMatchText.includes("(") || fullMatchText.includes(")")) shape = "round";

      addNode(id, label, shape);
    } else {
      const id = text.trim();
      if (id && !["subgraph", "end", "graph", "flowchart", "mindmap", "direction", "TD", "TB", "LR", "RL", "BT"].includes(id)) {
        addNode(id);
      }
    }
  };

  const lowerSource = source.toLowerCase().trim();
  const isMindmap = lowerSource.startsWith("mindmap");

  if (isMindmap) {
    const rawLines = source.split("\n");
    const stack: { depth: number; id: string }[] = [];
    
    rawLines.forEach(line => {
      if (!line.trim() || line.trim().startsWith("%%") || line.trim().startsWith("mindmap")) return;
      
      const leading = line.match(/^\s*/)?.[0] || "";
      const depth = leading.replace(/\t/g, "    ").length;
      const cleaned = line.trim();
      
      let id = "";
      let label = "";
      let shape = "rect";

      const shapeMatch = cleaned.match(/^([a-zA-Z0-9_-]+)\s*(?:\(\((.*?)\)\)|\[(.*?)\]|\((.*?)\)|\{(.*?)\})?/);
      if (shapeMatch && shapeMatch[1] && (shapeMatch[2] || shapeMatch[3] || shapeMatch[4] || shapeMatch[5])) {
        id = shapeMatch[1];
        label = shapeMatch.slice(2).find(v => v !== undefined) || id;
        const fullMatch = shapeMatch[0];
        if (fullMatch.includes("((")) shape = "circle";
        else if (fullMatch.includes("(")) shape = "round";
        else if (fullMatch.includes("{")) shape = "diamond";
      } else {
        label = cleaned;
        id = cleaned.toLowerCase().replace(/[^a-z0-9_-]/g, "_");
      }

      addNode(id, label, shape);

      while (stack.length > 0 && stack[stack.length - 1].depth >= depth) {
        stack.pop();
      }

      if (stack.length > 0) {
        const parent = stack[stack.length - 1];
        edges.push({
          id: `${parent.id}-${id}-${Math.random().toString(36).slice(2, 7)}`,
          source: parent.id,
          target: id,
          label: "",
          style: "normal"
        });
      }

      stack.push({ depth, id });
    });
  } else {
    // Flowchart / Graph parsing using segment boundaries
    lines.forEach(line => {
      const sgMatch = line.match(/^subgraph\s+([a-zA-Z0-9_-]+)(?:\s+\["([^"]*)"\]|\s+\[([^\]]*)\])?/i);
      if (sgMatch) {
        const id = sgMatch[1];
        const label = sgMatch[2] || sgMatch[3] || id;
        currentSubgraph = id;
        subgraphs.push({ id, label, nodeIds: [] });
        return;
      }

      if (line.toLowerCase() === "end") {
        currentSubgraph = null;
        return;
      }

      const connectorRegex = /(==+>|==+.*?==+>|--+>|--+.*?--+>|-\.-+>|-\.-+.*?-\.-+>|==+|--+|-\.-+)/g;
      const matches: { index: number; text: string }[] = [];
      let match;
      
      while ((match = connectorRegex.exec(line)) !== null) {
        matches.push({ index: match.index, text: match[0] });
      }

      if (matches.length === 0) {
        // Plain node definition line
        extractNodeFromText(line);
        return;
      }

      const segments: string[] = [];
      let lastIdx = 0;
      matches.forEach(m => {
        segments.push(line.substring(lastIdx, m.index));
        lastIdx = m.index + m.text.length;
      });
      segments.push(line.substring(lastIdx));

      for (let i = 0; i < matches.length; i++) {
        const connText = matches[i].text;
        let srcText = segments[i].trim();
        let tgtText = segments[i + 1].trim();

        let label = "";
        let style = "normal";

        if (connText.includes("-.-") || connText.includes(".-")) {
          style = "dashed";
        } else if (connText.includes("==")) {
          style = "thick";
        }

        const innerLabelMatch = connText.match(/(?:--|==|\.-)\s*(.*?)\s*(?:-->|==>|\.-)/);
        if (innerLabelMatch) {
          label = innerLabelMatch[1];
        }

        if (tgtText.startsWith("|")) {
          const endPipe = tgtText.indexOf("|", 1);
          if (endPipe !== -1) {
            label = tgtText.substring(1, endPipe);
            tgtText = tgtText.substring(endPipe + 1).trim();
            segments[i + 1] = tgtText; // Propagate stripped target text for next link chains
          }
        }

        const sources = srcText.split("&").map(s => s.trim()).filter(Boolean);
        const targets = tgtText.split("&").map(t => t.trim()).filter(Boolean);

        sources.forEach(srcDef => {
          const srcId = getRawNodeId(srcDef);
          extractNodeFromText(srcDef);
          
          targets.forEach(tgtDef => {
            const tgtId = getRawNodeId(tgtDef);
            extractNodeFromText(tgtDef);

            if (srcId && tgtId) {
              if (!["subgraph", "end", "graph", "flowchart", "direction", "TD", "TB", "LR", "RL", "BT"].includes(srcId) &&
                  !["subgraph", "end", "graph", "flowchart", "direction", "TD", "TB", "LR", "RL", "BT"].includes(tgtId)) {
                edges.push({
                  id: `${srcId}-${tgtId}-${Math.random().toString(36).slice(2, 7)}`,
                  source: srcId,
                  target: tgtId,
                  label,
                  style
                });
              }
            }
          });
        });
      }
    });
  }

  return { direction, nodes, edges, subgraphs };
};

/**
 * Post-layout validation to ensure 100% correctness of node/edge rendering.
 */
export const validateGraph = (svg: SVGElement, parsed: ParsedGraph): boolean => {
  for (const n of parsed.nodes) {
    if (!findNodeElement(svg, n.id)) {
      console.warn(`[MermaidValidation] Node ${n.id} not found in SVG`);
      return false;
    }
  }

  for (const e of parsed.edges) {
    if (!findNodeElement(svg, e.source) || !findNodeElement(svg, e.target)) {
      console.warn(`[MermaidValidation] Edge ${e.source} -> ${e.target} has missing nodes in SVG`);
      return false;
    }
  }

  return true;
};

/**
 * Maps parsed node definitions to their rendered SVG group elements.
 */
export const findNodeElement = (svg: SVGElement, nodeId: string): SVGElement | null => {
  try {
    const escaped = CSS.escape(nodeId);
    let el = svg.querySelector(`[id^="flowchart-${escaped}-"], [id$="-${escaped}"]`);
    if (el) return el as SVGElement;
    
    el = svg.querySelector(`#${escaped}`);
    if (el) return el as SVGElement;
    
    el = svg.querySelector(`.node.${escaped}, .node.id-${escaped}`);
    if (el) return el as SVGElement;
  } catch (err) {
    // Fall back to manual iterations if selector is invalid
  }

  const nodes = svg.querySelectorAll(".node");
  for (let i = 0; i < nodes.length; i++) {
    const idAttr = nodes[i].getAttribute("id") || "";
    if (idAttr.includes(`-${nodeId}-`) || idAttr.endsWith(`-${nodeId}`)) {
      return nodes[i] as SVGElement;
    }
    const classAttr = nodes[i].getAttribute("class") || "";
    if (classAttr.split(/\s+/).includes(nodeId)) {
      return nodes[i] as SVGElement;
    }
  }
  
  return null;
};

/**
 * Computes box boundary intersection point for custom link arrows.
 */
export const getBoxIntersection = (
  x1: number,
  y1: number,
  x2: number,
  y2: number,
  w: number,
  h: number
) => {
  const dx = x2 - x1;
  const dy = y2 - y1;
  if (dx === 0 && dy === 0) return { x: x2, y: y2 };

  const halfW = w / 2;
  const halfH = h / 2;

  const rX = dx !== 0 ? Math.abs(halfW / dx) : Infinity;
  const rY = dy !== 0 ? Math.abs(halfH / dy) : Infinity;

  const r = Math.min(rX, rY);
  
  if (r <= 1) {
    return {
      x: x2 - dx * r,
      y: y2 - dy * r
    };
  }
  return { x: x2, y: y2 };
};

/**
 * Executes a force-directed layout simulation.
 */
export const runForceDirectedLayout = (
  nodes: LayoutNode[],
  edges: { source: string; target: string }[],
  width: number,
  height: number
) => {
  nodes.forEach((n, idx) => {
    if (n.x === 0 && n.y === 0) {
      const angle = (idx / nodes.length) * 2 * Math.PI;
      n.x = width / 2 + Math.cos(angle) * 180;
      n.y = height / 2 + Math.sin(angle) * 180;
    }
  });

  const nodeMap = new Map(nodes.map(n => [n.id, n]));
  const velocities = new Map(nodes.map(n => [n.id, { vx: 0, vy: 0 }]));

  const iterations = nodes.length > 25 ? 180 : 120;

  for (let step = 0; step < iterations; step++) {
    // 1. Repulsion
    for (let i = 0; i < nodes.length; i++) {
      const n1 = nodes[i];
      const v1 = velocities.get(n1.id)!;
      for (let j = i + 1; j < nodes.length; j++) {
        const n2 = nodes[j];
        const v2 = velocities.get(n2.id)!;
        const dx = n1.x - n2.x;
        const dy = n1.y - n2.y;
        const distSq = dx * dx + dy * dy || 1;
        const dist = Math.sqrt(distSq);

        const minSpace = (n1.width + n2.width) / 2 + 75;
        if (dist < minSpace) {
          const force = (minSpace - dist) * 0.4;
          const fx = (dx / dist) * force;
          const fy = (dy / dist) * force;
          v1.vx += fx;
          v1.vy += fy;
          v2.vx -= fx;
          v2.vy -= fy;
        } else {
          const force = 3500 / distSq;
          const fx = (dx / dist) * force;
          const fy = (dy / dist) * force;
          v1.vx += fx;
          v1.vy += fy;
          v2.vx -= fx;
          v2.vy -= fy;
        }
      }
    }

    // 2. Attraction along edges
    edges.forEach(e => {
      const n1 = nodeMap.get(e.source);
      const n2 = nodeMap.get(e.target);
      if (n1 && n2) {
        const v1 = velocities.get(n1.id)!;
        const v2 = velocities.get(n2.id)!;
        const dx = n1.x - n2.x;
        const dy = n1.y - n2.y;
        const dist = Math.sqrt(dx * dx + dy * dy) || 1;
        
        const restLength = 130;
        const k = 0.06;
        const force = (dist - restLength) * k;
        const fx = (dx / dist) * force;
        const fy = (dy / dist) * force;
        v1.vx -= fx;
        v1.vy -= fy;
        v2.vx += fx;
        v2.vy += fy;
      }
    });

    // 3. Subgraph Clustering Force
    nodes.forEach(n => {
      if (n.cluster) {
        let cx = 0;
        let cy = 0;
        let count = 0;
        nodes.forEach(other => {
          if (other.cluster === n.cluster) {
            cx += other.x;
            cy += other.y;
            count++;
          }
        });
        if (count > 0) {
          cx /= count;
          cy /= count;
          const vel = velocities.get(n.id)!;
          vel.vx += (cx - n.x) * 0.03;
          vel.vy += (cy - n.y) * 0.03;
        }
      }
    });

    // 4. Gravity pull to center
    nodes.forEach(n => {
      const vel = velocities.get(n.id)!;
      vel.vx += (width / 2 - n.x) * 0.015;
      vel.vy += (height / 2 - n.y) * 0.015;
    });

    // 5. Update positions
    nodes.forEach(n => {
      const vel = velocities.get(n.id)!;
      n.x += vel.vx;
      n.y += vel.vy;
      vel.vx *= 0.55;
      vel.vy *= 0.55;
    });
  }
};

/**
 * Computes a Sugiyama-style layered hierarchical layout.
 */
export const runHierarchyLayout = (
  nodes: LayoutNode[],
  edges: { source: string; target: string }[],
  direction: string,
  width: number,
  height: number,
  spacingY = 160,
  spacingX = 140
) => {
  const inDegree = new Map<string, number>(nodes.map(n => [n.id, 0]));
  const adjList = new Map<string, string[]>(nodes.map(n => [n.id, []]));
  const parentMap = new Map<string, string[]>(nodes.map(n => [n.id, []]));

  edges.forEach(e => {
    if (adjList.has(e.source) && adjList.has(e.target)) {
      adjList.get(e.source)!.push(e.target);
      parentMap.get(e.target)!.push(e.source);
      inDegree.set(e.target, inDegree.get(e.target)! + 1);
    }
  });

  const levels = new Map<string, number>();
  const queue: string[] = [];

  nodes.forEach(n => {
    if (inDegree.get(n.id) === 0) {
      levels.set(n.id, 0);
      queue.push(n.id);
    }
  });

  if (queue.length === 0 && nodes.length > 0) {
    levels.set(nodes[0].id, 0);
    queue.push(nodes[0].id);
  }

  while (queue.length > 0) {
    const curr = queue.shift()!;
    const currLevel = levels.get(curr)!;
    const neighbors = adjList.get(curr) || [];

    neighbors.forEach(next => {
      const nextLevel = Math.max(levels.get(next) || 0, currLevel + 1);
      levels.set(next, nextLevel);
      if (!queue.includes(next)) {
        queue.push(next);
      }
    });
  }

  const levelGroups: Map<number, LayoutNode[]> = new Map();
  nodes.forEach(n => {
    const lvl = levels.get(n.id) || 0;
    n.level = lvl;
    if (!levelGroups.has(lvl)) {
      levelGroups.set(lvl, []);
    }
    levelGroups.get(lvl)!.push(n);
  });

  const sortedLevels = Array.from(levelGroups.keys()).sort((a, b) => a - b);

  sortedLevels.forEach((lvl, step) => {
    if (step === 0) return;
    const currentNodes = levelGroups.get(lvl)!;
    
    currentNodes.forEach(node => {
      const parents = parentMap.get(node.id) || [];
      if (parents.length > 0) {
        let sum = 0;
        parents.forEach(p => {
          const parentNode = nodes.find(n => n.id === p);
          sum += parentNode ? parentNode.x : 0;
        });
        (node as any).barycenter = sum / parents.length;
      } else {
        (node as any).barycenter = 0;
      }
    });

    currentNodes.sort((a, b) => ((a as any).barycenter || 0) - ((b as any).barycenter || 0));
  });

  const isHorizontal = direction === "LR" || direction === "RL";

  sortedLevels.forEach(lvl => {
    const group = levelGroups.get(lvl)!;
    const count = group.length;

    group.forEach((node, idx) => {
      const offset = (idx - (count - 1) / 2) * spacingX;
      const rankPos = lvl * spacingY;

      if (isHorizontal) {
        node.x = direction === "LR" ? 80 + rankPos : width - 80 - rankPos;
        node.y = height / 2 + offset;
      } else {
        node.x = width / 2 + offset;
        node.y = direction === "TD" ? 80 + rankPos : height - 80 - rankPos;
      }
    });
  });
};

/**
 * Computes a radial node placement.
 */
export const runRadialLayout = (
  nodes: LayoutNode[],
  edges: { source: string; target: string }[],
  width: number,
  height: number
) => {
  const inDegree = new Map<string, number>(nodes.map(n => [n.id, 0]));
  const adjList = new Map<string, string[]>(nodes.map(n => [n.id, []]));

  edges.forEach(e => {
    if (adjList.has(e.source) && adjList.has(e.target)) {
      adjList.get(e.source)!.push(e.target);
      inDegree.set(e.target, inDegree.get(e.target)! + 1);
    }
  });

  const levels = new Map<string, number>();
  const queue: string[] = [];

  nodes.forEach(n => {
    if (inDegree.get(n.id) === 0) {
      levels.set(n.id, 0);
      queue.push(n.id);
    }
  });

  if (queue.length === 0 && nodes.length > 0) {
    levels.set(nodes[0].id, 0);
    queue.push(nodes[0].id);
  }

  while (queue.length > 0) {
    const curr = queue.shift()!;
    const currLevel = levels.get(curr)!;
    
    (adjList.get(curr) || []).forEach(next => {
      if (!levels.has(next)) {
        levels.set(next, currLevel + 1);
        queue.push(next);
      }
    });
  }

  const levelGroups = new Map<number, LayoutNode[]>();
  nodes.forEach(n => {
    const lvl = levels.get(n.id) || 0;
    n.level = lvl;
    if (!levelGroups.has(lvl)) levelGroups.set(lvl, []);
    levelGroups.get(lvl)!.push(n);
  });

  const cx = width / 2;
  const cy = height / 2;

  levelGroups.forEach((group, lvl) => {
    if (lvl === 0) {
      group.forEach(n => {
        n.x = cx;
        n.y = cy;
      });
      return;
    }

    const radius = lvl * 150;
    const count = group.length;

    group.forEach((node, idx) => {
      const angle = (idx / count) * 2 * Math.PI;
      node.x = cx + Math.cos(angle) * radius;
      node.y = cy + Math.sin(angle) * radius;
    });
  });
};

/**
 * Computes a compact hierarchical layout.
 */
export const runCompactLayout = (
  nodes: LayoutNode[],
  edges: { source: string; target: string }[],
  direction: string,
  width: number,
  height: number
) => {
  runHierarchyLayout(nodes, edges, direction, width, height, 110, 90);
};

/**
 * Computes a Mind Map center-out branch layout.
 */
export const runMindMapLayout = (
  nodes: LayoutNode[],
  edges: { source: string; target: string }[],
  width: number,
  height: number
) => {
  if (nodes.length === 0) return;

  const cx = width / 2;
  const cy = height / 2;

  const root = nodes[0];
  root.x = cx;
  root.y = cy;
  root.level = 0;

  const children = edges.filter(e => e.source === root.id).map(e => e.target);
  const leftBranch = children.slice(0, Math.ceil(children.length / 2));
  const rightBranch = children.slice(Math.ceil(children.length / 2));

  const layoutSubtree = (nodeId: string, isLeft: boolean, level: number, offsetAngle: number) => {
    const node = nodes.find(n => n.id === nodeId);
    if (!node) return;

    node.level = level;
    const distance = level * 140;
    const angle = isLeft 
      ? Math.PI - 0.5 + offsetAngle 
      : -0.5 + offsetAngle;

    node.x = cx + Math.cos(angle) * distance;
    node.y = cy + Math.sin(angle) * distance;

    const nodeChildren = edges.filter(e => e.source === nodeId).map(e => e.target);
    nodeChildren.forEach((childId, idx) => {
      const childOffset = nodeChildren.length > 1 
        ? ((idx - (nodeChildren.length - 1) / 2) * 0.4) 
        : 0;
      layoutSubtree(childId, isLeft, level + 1, offsetAngle + childOffset);
    });
  };

  leftBranch.forEach((childId, idx) => {
    const angleOffset = leftBranch.length > 1
      ? (idx - (leftBranch.length - 1) / 2) * 0.6
      : 0;
    layoutSubtree(childId, true, 1, angleOffset);
  });

  rightBranch.forEach((childId, idx) => {
    const angleOffset = rightBranch.length > 1
      ? (idx - (rightBranch.length - 1) / 2) * 0.6
      : 0;
    layoutSubtree(childId, false, 1, angleOffset);
  });

  nodes.forEach((n, idx) => {
    if (n.id !== root.id && n.x === 0 && n.y === 0) {
      n.level = 1;
      const angle = (idx / nodes.length) * 2 * Math.PI;
      n.x = cx + Math.cos(angle) * 160;
      n.y = cy + Math.sin(angle) * 160;
    }
  });
};

/**
 * Renders custom visual connection lines and overlay shapes directly on the SVG element.
 */
export const updateCustomOverlay = (
  svg: SVGElement,
  nodes: LayoutNode[],
  edges: ParsedEdge[],
  subgraphs: ParsedSubgraph[],
  zoom = 1.0
) => {
  const originalEdges = svg.querySelector(".edgePaths, .edgeLabels, .clusters");
  if (originalEdges) {
    (originalEdges as HTMLElement).style.display = "none";
  }

  let customGroup = svg.querySelector(".custom-layout-group") as SVGElement | null;
  if (customGroup) {
    customGroup.innerHTML = "";
  } else {
    customGroup = document.createElementNS("http://www.w3.org/2000/svg", "g");
    customGroup.setAttribute("class", "custom-layout-group");
    svg.prepend(customGroup);
  }

  const defs = svg.querySelector("defs") || document.createElementNS("http://www.w3.org/2000/svg", "defs");
  if (!svg.querySelector("defs")) svg.prepend(defs);

  if (!defs.querySelector("#custom-arrow")) {
    const marker = document.createElementNS("http://www.w3.org/2000/svg", "marker");
    marker.setAttribute("id", "custom-arrow");
    marker.setAttribute("viewBox", "0 0 10 10");
    marker.setAttribute("refX", "6");
    marker.setAttribute("refY", "5");
    marker.setAttribute("markerWidth", "6");
    marker.setAttribute("markerHeight", "6");
    marker.setAttribute("orient", "auto-start-reverse");

    const path = document.createElementNS("http://www.w3.org/2000/svg", "path");
    path.setAttribute("d", "M 0 1.5 L 8 5 L 0 8.5 z");
    path.setAttribute("fill", "var(--text-muted, #8a8a8f)");

    marker.appendChild(path);
    defs.appendChild(marker);
  }

  const nodeMap = new Map(nodes.map(n => [n.id, n]));

  // Draw clusters
  const clustersGroup = document.createElementNS("http://www.w3.org/2000/svg", "g");
  clustersGroup.setAttribute("class", "custom-clusters-group");
  customGroup.appendChild(clustersGroup);

  subgraphs.forEach((sg) => {
    const sgNodes = sg.nodeIds.map(id => nodeMap.get(id)).filter(Boolean) as LayoutNode[];
    if (sgNodes.length === 0) return;

    let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;
    sgNodes.forEach(n => {
      minX = Math.min(minX, n.x - n.width / 2);
      maxX = Math.max(maxX, n.x + n.width / 2);
      minY = Math.min(minY, n.y - n.height / 2);
      maxY = Math.max(maxY, n.y + n.height / 2);
    });

    const pad = 24;
    const rect = document.createElementNS("http://www.w3.org/2000/svg", "rect");
    rect.setAttribute("x", String(minX - pad));
    rect.setAttribute("y", String(minY - pad - 12));
    rect.setAttribute("width", String((maxX - minX) + pad * 2));
    rect.setAttribute("height", String((maxY - minY) + pad * 2 + 12));
    rect.setAttribute("rx", "10");
    rect.setAttribute("fill", "var(--bg-tertiary, rgba(255, 255, 255, 0.015))");
    rect.setAttribute("stroke", "var(--border-subtle, rgba(255, 255, 255, 0.08))");
    rect.setAttribute("stroke-dasharray", "4, 4");
    clustersGroup.appendChild(rect);

    const text = document.createElementNS("http://www.w3.org/2000/svg", "text");
    text.setAttribute("x", String(minX - pad + 8));
    text.setAttribute("y", String(minY - pad));
    text.setAttribute("fill", "var(--text-muted, #8a8a8f)");
    text.setAttribute("font-size", "11px");
    text.setAttribute("font-weight", "bold");
    text.textContent = sg.label;
    clustersGroup.appendChild(text);
  });

  // Draw paths
  const pathsGroup = document.createElementNS("http://www.w3.org/2000/svg", "g");
  pathsGroup.setAttribute("class", "custom-paths-group");
  customGroup.appendChild(pathsGroup);

  let mode = "Default";
  const select = svg.ownerDocument.querySelector(".mermaid-layout-toolbar select") as HTMLSelectElement | null;
  if (select) {
    mode = select.value;
  }

  edges.forEach(edge => {
    const src = nodeMap.get(edge.source);
    const tgt = nodeMap.get(edge.target);
    if (!src || !tgt) return;

    const start = getBoxIntersection(tgt.x, tgt.y, src.x, src.y, src.width, src.height);
    const end = getBoxIntersection(src.x, src.y, tgt.x, tgt.y, tgt.width, tgt.height);

    const dx = end.x - start.x;
    const dy = end.y - start.y;
    const dist = Math.sqrt(dx * dx + dy * dy) || 1;

    const path = document.createElementNS("http://www.w3.org/2000/svg", "path");
    
    // Zoom-level LOD straight routing check
    if (zoom < 0.6) {
      path.setAttribute("d", `M ${start.x} ${start.y} L ${end.x} ${end.y}`);
    } else {
      if (mode === "Hierarchy" || mode === "Compact" || mode === "Default") {
        const isHorizontal = Math.abs(dx) > Math.abs(dy);
        if (isHorizontal) {
          const cp1x = start.x + dx * 0.4;
          const cp1y = start.y;
          const cp2x = end.x - dx * 0.4;
          const cp2y = end.y;
          path.setAttribute("d", `M ${start.x} ${start.y} C ${cp1x} ${cp1y}, ${cp2x} ${cp2y}, ${end.x} ${end.y}`);
        } else {
          const cp1x = start.x;
          const cp1y = start.y + dy * 0.4;
          const cp2x = end.x;
          const cp2y = end.y - dy * 0.4;
          path.setAttribute("d", `M ${start.x} ${start.y} C ${cp1x} ${cp1y}, ${cp2x} ${cp2y}, ${end.x} ${end.y}`);
        }
      } else {
        const mx = (start.x + end.x) / 2;
        const my = (start.y + end.y) / 2;
        const px = -dy / dist;
        const py = dx / dist;
        const offset = Math.min(30, dist * 0.15);
        const cx = mx + px * offset;
        const cy = my + py * offset;
        path.setAttribute("d", `M ${start.x} ${start.y} Q ${cx} ${cy} ${end.x} ${end.y}`);
      }
    }

    path.setAttribute("fill", "none");
    path.setAttribute("stroke", "var(--border-medium, rgba(255, 255, 255, 0.16))");
    path.setAttribute("marker-end", "url(#custom-arrow)");
    
    const isPrimary = mode === "MindMap" || Math.abs((src.level || 0) - (tgt.level || 0)) <= 1 || edges.length < 8;
    
    path.setAttribute("class", `custom-edge-path src-${edge.source} tgt-${edge.target} ${isPrimary ? "primary" : "secondary"}`);

    if (isPrimary) {
      path.setAttribute("stroke-width", "2.0");
      path.style.opacity = "0.9";
    } else {
      path.setAttribute("stroke-width", "1.2");
      path.style.opacity = "0.4";
    }

    if (edge.style === "dashed") {
      path.setAttribute("stroke-dasharray", "4, 4");
    } else if (edge.style === "thick") {
      path.setAttribute("stroke-width", "2.8");
    }

    pathsGroup.appendChild(path);

    if (edge.label && zoom >= 0.6) {
      const mx = (start.x + end.x) / 2;
      const my = (start.y + end.y) / 2;

      const labelGroup = document.createElementNS("http://www.w3.org/2000/svg", "g");
      labelGroup.setAttribute("class", "custom-edge-label");

      const charWidth = 6.2;
      const textWidth = edge.label.length * charWidth;

      const rect = document.createElementNS("http://www.w3.org/2000/svg", "rect");
      rect.setAttribute("x", String(mx - textWidth / 2 - 4));
      rect.setAttribute("y", String(my - 9));
      rect.setAttribute("width", String(textWidth + 8));
      rect.setAttribute("height", "18");
      rect.setAttribute("rx", "4");
      rect.setAttribute("fill", "var(--bg-secondary, #18181c)");
      rect.setAttribute("stroke", "var(--border-subtle, rgba(255, 255, 255, 0.08))");

      const text = document.createElementNS("http://www.w3.org/2000/svg", "text");
      text.setAttribute("x", String(mx));
      text.setAttribute("y", String(my + 4));
      text.setAttribute("text-anchor", "middle");
      text.setAttribute("fill", "var(--text-muted, #a1a1aa)");
      text.setAttribute("font-size", "10px");
      text.textContent = edge.label;

      labelGroup.appendChild(rect);
      labelGroup.appendChild(text);
      pathsGroup.appendChild(labelGroup);
    }
  });
};

/**
 * Initializes interactive drag & layout control toolbar for graph-based Mermaid blocks.
 */
export const initializeInteractiveMermaid = (node: HTMLElement, source: string) => {
  const svg = node.querySelector("svg");
  if (!svg) return;

  const lowerSource = source.toLowerCase().trim();
  const isGraph = lowerSource.startsWith("graph") || lowerSource.startsWith("flowchart") || lowerSource.startsWith("mindmap");
  if (!isGraph) return;

  const parsed = parseMermaid(source);
  if (parsed.nodes.length === 0) return;

  // Post-Layout Graph Validation checking
  const isValid = validateGraph(svg, parsed);
  if (!isValid) {
    console.warn("[MermaidLayout] Validation failed! Aborting interactive layout optimizations and falling back to default Mermaid renderer.");
    const originalEdges = svg.querySelector(".edgePaths, .edgeLabels, .clusters");
    if (originalEdges) {
      (originalEdges as HTMLElement).style.display = "";
    }
    const customGroup = svg.querySelector(".custom-layout-group");
    if (customGroup) {
      customGroup.remove();
    }
    const toolbar = node.querySelector(".mermaid-layout-toolbar");
    if (toolbar) {
      toolbar.remove();
    }
    return;
  }

  let hash = 0;
  for (let i = 0; i < source.length; i++) {
    hash = (hash << 5) - hash + source.charCodeAt(i);
    hash |= 0;
  }
  const diagramKey = `mermaid-layout-positions-${hash}`;
  const modeKey = `mermaid-layout-mode-${hash}`;

  const viewBoxAttr = svg.getAttribute("viewBox") || "";
  const viewBoxParts = viewBoxAttr.split(/\s+/).map(parseFloat);
  const width = viewBoxParts[2] || 800;
  const height = viewBoxParts[3] || 600;

  const layoutNodes: LayoutNode[] = parsed.nodes.map((pn, idx) => {
    const el = findNodeElement(svg, pn.id);
    let initX = width / 2;
    let initY = height / 2;
    let w = 120;
    let h = 50;

    if (el) {
      const bbox = (el as any).getBBox();
      if (bbox.width > 0) {
        w = bbox.width;
        h = bbox.height;
      }
      
      const transformAttr = el.getAttribute("transform") || "";
      const translateMatch = transformAttr.match(/translate\(\s*([0-9.-]+)\s*,\s*([0-9.-]+)\s*\)/);
      if (translateMatch) {
        initX = parseFloat(translateMatch[1]);
        initY = parseFloat(translateMatch[2]);
      } else {
        const cols = Math.ceil(Math.sqrt(parsed.nodes.length));
        initX = 100 + (idx % cols) * 160;
        initY = 100 + Math.floor(idx / cols) * 120;
      }
    }

    return {
      id: pn.id,
      x: initX,
      y: initY,
      initX,
      initY,
      width: w,
      height: h,
      cluster: parsed.subgraphs.find(s => s.nodeIds.includes(pn.id))?.id
    };
  });

  let currentZoom = 1.0;
  
  (svg as any).drawCustomLayout = (z: number) => {
    currentZoom = z;
    updateCustomOverlay(svg, layoutNodes, parsed.edges, parsed.subgraphs, z);
  };

  let toolbar = node.querySelector(".mermaid-layout-toolbar") as HTMLElement | null;
  if (!toolbar) {
    toolbar = document.createElement("div");
    toolbar.className = "mermaid-layout-toolbar";
    toolbar.style.position = "absolute";
    toolbar.style.top = "10px";
    toolbar.style.left = "10px";
    toolbar.style.zIndex = "10";
    toolbar.style.background = "var(--bg-secondary, #18181c)";
    toolbar.style.border = "1px solid var(--border-subtle, rgba(255, 255, 255, 0.08))";
    toolbar.style.borderRadius = "6px";
    toolbar.style.padding = "2px 6px";
    toolbar.style.display = "flex";
    toolbar.style.alignItems = "center";
    toolbar.style.gap = "6px";
    toolbar.style.fontSize = "11px";
    toolbar.style.color = "var(--text-muted, #a1a1aa)";
    toolbar.style.boxShadow = "0 2px 8px rgba(0, 0, 0, 0.25)";
    
    const label = document.createElement("span");
    label.textContent = "Layout:";
    label.style.fontWeight = "bold";
    toolbar.appendChild(label);

    const select = document.createElement("select");
    select.style.background = "transparent";
    select.style.border = "none";
    select.style.color = "var(--text-primary, #ffffff)";
    select.style.fontSize = "11px";
    select.style.cursor = "pointer";
    select.style.outline = "none";
    select.style.paddingRight = "4px";

    const modes = [
      { name: "Default", val: "Default" },
      { name: "Force Directed", val: "ForceDirected" },
      { name: "Hierarchy", val: "Hierarchy" },
      { name: "Radial", val: "Radial" },
      { name: "Compact", val: "Compact" },
      { name: "Mind Map", val: "MindMap" }
    ];

    modes.forEach(m => {
      const opt = document.createElement("option");
      opt.value = m.val;
      opt.textContent = m.name;
      opt.style.background = "var(--bg-secondary, #18181c)";
      opt.style.color = "var(--text-primary, #ffffff)";
      select.appendChild(opt);
    });

    const activeMode = localStorage.getItem(modeKey) || "Default";
    select.value = activeMode;

    toolbar.appendChild(select);
    node.appendChild(toolbar);
    node.style.position = "relative";

    select.addEventListener("change", (e) => {
      const newMode = (e.target as HTMLSelectElement).value;
      localStorage.setItem(modeKey, newMode);
      
      layoutNodes.forEach(n => {
        const el = findNodeElement(svg, n.id);
        if (el) {
          el.style.transition = "transform 0.4s cubic-bezier(0.16, 1, 0.3, 1)";
        }
      });
      const pathsGroup = svg.querySelector(".custom-paths-group") as HTMLElement | null;
      if (pathsGroup) {
        pathsGroup.style.transition = "all 0.4s cubic-bezier(0.16, 1, 0.3, 1)";
      }

      applyLayout(newMode);

      setTimeout(() => {
        layoutNodes.forEach(n => {
          const el = findNodeElement(svg, n.id);
          if (el) el.style.transition = "none";
        });
        if (pathsGroup) pathsGroup.style.transition = "none";
      }, 400);
    });
  }

  const applyLayout = (mode: string) => {
    layoutNodes.forEach(n => {
      n.x = n.initX;
      n.y = n.initY;
    });

    let savedPositions: Record<string, { x: number; y: number }> = {};
    try {
      savedPositions = JSON.parse(localStorage.getItem(diagramKey) || "{}");
    } catch {}

    if (mode === "ForceDirected") {
      runForceDirectedLayout(layoutNodes, parsed.edges, width, height);
    } else if (mode === "Hierarchy") {
      let dir = parsed.direction;
      if (!source.match(/(?:graph|flowchart)\s+(TD|TB|LR|RL|BT)/i)) {
        const leavesCount = layoutNodes.filter(n => !parsed.edges.some(e => e.source === n.id)).length;
        dir = leavesCount > 4 ? "LR" : "TD";
      }
      runHierarchyLayout(layoutNodes, parsed.edges, dir, width, height);
    } else if (mode === "Radial") {
      runRadialLayout(layoutNodes, parsed.edges, width, height);
    } else if (mode === "Compact") {
      let dir = parsed.direction;
      if (!source.match(/(?:graph|flowchart)\s+(TD|TB|LR|RL|BT)/i)) {
        dir = "TD";
      }
      runCompactLayout(layoutNodes, parsed.edges, dir, width, height);
    } else if (mode === "MindMap") {
      runMindMapLayout(layoutNodes, parsed.edges, width, height);
    }

    // Apply manual positions overrides
    layoutNodes.forEach(n => {
      if (savedPositions[n.id]) {
        n.x = savedPositions[n.id].x;
        n.y = savedPositions[n.id].y;
      }
    });

    layoutNodes.forEach(n => {
      const el = findNodeElement(svg, n.id);
      if (el) {
        el.setAttribute("transform", `translate(${n.x}, ${n.y})`);
      }
    });

    (svg as any).drawCustomLayout(currentZoom);
  };

  const adjMap = new Map<string, Set<string>>();
  layoutNodes.forEach(n => adjMap.set(n.id, new Set()));
  parsed.edges.forEach(e => {
    if (adjMap.has(e.source)) adjMap.get(e.source)!.add(e.target);
    if (adjMap.has(e.target)) adjMap.get(e.target)!.add(e.source);
  });

  layoutNodes.forEach(n => {
    const el = findNodeElement(svg, n.id);
    if (!el) return;

    el.style.cursor = "grab";

    let startX = 0;
    let startY = 0;
    let isDragging = false;

    const onPointerDown = (e: PointerEvent) => {
      e.preventDefault();
      e.stopPropagation();
      isDragging = true;
      startX = e.clientX;
      startY = e.clientY;
      el.style.cursor = "grabbing";
      el.style.transition = "none";
      el.setPointerCapture(e.pointerId);
    };

    const onPointerMove = (e: PointerEvent) => {
      if (!isDragging) return;
      e.preventDefault();
      e.stopPropagation();

      const dx = e.clientX - startX;
      const dy = e.clientY - startY;

      startX = e.clientX;
      startY = e.clientY;

      n.x += dx;
      n.y += dy;

      el.setAttribute("transform", `translate(${n.x}, ${n.y})`);
      (svg as any).drawCustomLayout(currentZoom);
    };

    const onPointerUp = (e: PointerEvent) => {
      if (!isDragging) return;
      isDragging = false;
      el.style.cursor = "grab";
      el.releasePointerCapture(e.pointerId);

      let savedPositions: Record<string, { x: number; y: number }> = {};
      try {
        savedPositions = JSON.parse(localStorage.getItem(diagramKey) || "{}");
      } catch {}

      savedPositions[n.id] = { x: n.x, y: n.y };
      localStorage.setItem(diagramKey, JSON.stringify(savedPositions));
    };

    const onMouseEnter = () => {
      layoutNodes.forEach(other => {
        const otherEl = findNodeElement(svg, other.id);
        if (otherEl) {
          const isConnected = other.id === n.id || adjMap.get(n.id)?.has(other.id);
          otherEl.style.opacity = isConnected ? "1.0" : "0.15";
          if (other.id === n.id) {
            otherEl.style.filter = "drop-shadow(0 0 8px var(--accent-primary, #6366f1))";
          }
        }
      });

      const paths = svg.querySelectorAll(".custom-edge-path") as NodeListOf<SVGPathElement>;
      paths.forEach(p => {
        const isConnected = p.classList.contains(`src-${n.id}`) || p.classList.contains(`tgt-${n.id}`);
        if (isConnected) {
          p.style.opacity = "1.0";
          p.setAttribute("stroke", "var(--accent-primary, #6366f1)");
          p.setAttribute("stroke-width", "2.5");
        } else {
          p.style.opacity = "0.05";
        }
      });
    };

    const onMouseLeave = () => {
      layoutNodes.forEach(other => {
        const otherEl = findNodeElement(svg, other.id);
        if (otherEl) {
          otherEl.style.opacity = "1.0";
          otherEl.style.filter = "none";
        }
      });

      const paths = svg.querySelectorAll(".custom-edge-path") as NodeListOf<SVGPathElement>;
      paths.forEach(p => {
        p.style.opacity = "";
        p.setAttribute("stroke", "var(--border-medium, rgba(255, 255, 255, 0.16))");
        p.setAttribute("stroke-width", p.classList.contains("primary") ? "2.0" : "1.2");
      });
      
      const activeMode = localStorage.getItem(modeKey) || "Default";
      applyLayout(activeMode);
    };

    el.addEventListener("pointerdown", onPointerDown as any);
    el.addEventListener("pointermove", onPointerMove as any);
    el.addEventListener("pointerup", onPointerUp as any);
    el.addEventListener("pointercancel", onPointerUp as any);
    
    el.addEventListener("mouseenter", onMouseEnter);
    el.addEventListener("mouseleave", onMouseLeave);
  });

  const initialMode = localStorage.getItem(modeKey) || "Default";
  applyLayout(initialMode);
};
