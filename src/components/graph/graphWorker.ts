/**
 * Graph Physics Worker
 * Runs d3-force simulation in a Web Worker
 * Physics tuned to match Obsidian's graph behavior (from sim.js)
 *
 * Key Obsidian behaviors replicated:
 * - velocityDecay(0.6) for heavy damping
 * - alphaDecay = 1 - Math.pow(0.001, 1/300) for gradual cooldown
 * - forceX/forceY centering (NOT forceCenter, which shifts all nodes)
 * - forceManyBody with distanceMin(30) to prevent extreme repulsion at close range
 * - forceCollide with radius(60) and strength(0.5)
 * - On drag: alphaTarget(0.3); on release: alphaTarget(0) -- gentle reheat, not alpha(1)
 */

import * as d3 from "d3-force";

interface WorkerNode {
  id: string;
  x: number;
  y: number;
  vx?: number;
  vy?: number;
  fx?: number | null;
  fy?: number | null;
  connections: number;
}

interface WorkerEdge {
  source: string | WorkerNode;
  target: string | WorkerNode;
}

interface ForceParams {
  centerStrength: number;
  repelStrength: number;
  linkStrength: number;
  linkDistance: number;
  collisionRadius: number;
}

let simulation: d3.Simulation<WorkerNode, WorkerEdge> | null = null;
let nodes: WorkerNode[] = [];
let edges: WorkerEdge[] = [];
let isRunning = false;
let nodeMap = new Map<string, WorkerNode>();
let keepAlive = false;
const AI_IDLE_ALPHA_TARGET = 0.015;

// Default parameters matching Obsidian's sim.js defaults
let forceParams: ForceParams = {
  centerStrength: 0.1,   // c in sim.js, default 0.1
  repelStrength: 1000,   // x in sim.js, default -1000 (we store positive)
  linkStrength: 1,       // E in sim.js, default 1
  linkDistance: 250,      // v in sim.js, default 250
  collisionRadius: 60,   // collision radius in sim.js
};

// Store the default link strength function result for scaling
let defaultLinkStrengthFn: ((link: WorkerEdge, i: number, links: WorkerEdge[]) => number) | null = null;

function initSimulation() {
  if (nodes.length === 0) return;

  // Build node map
  nodeMap.clear();
  nodes.forEach((n) => nodeMap.set(n.id, n));

  // Create link force first so we can capture its default strength function
  const linkForce = d3
    .forceLink<WorkerNode, WorkerEdge>(edges)
    .id((d) => d.id)
    .distance(forceParams.linkDistance);

  // Create simulation matching Obsidian's sim.js exactly:
  // alphaDecay = 1 - Math.pow(0.001, 1/300) -- Obsidian's B constant
  // velocityDecay = 0.6 -- Obsidian applies `vx *= 0.6` and `vy *= 0.6` each tick
  simulation = d3
    .forceSimulation<WorkerNode>(nodes)
    .alphaDecay(1 - Math.pow(0.001, 1 / 300))
    .velocityDecay(0.6)
    // Obsidian uses forceX/forceY for centering (NOT forceCenter which shifts nodes each tick)
    .force("x", d3.forceX<WorkerNode>(0).strength(forceParams.centerStrength))
    .force("y", d3.forceY<WorkerNode>(0).strength(forceParams.centerStrength))
    // ManyBody with distanceMin(30) to prevent extreme forces at close range
    .force(
      "charge",
      d3
        .forceManyBody<WorkerNode>()
        .strength(-forceParams.repelStrength)
        .distanceMin(30)
    )
    // Link force
    .force("link", linkForce)
    // Collision force matching Obsidian's: radius(60), strength(0.5)
    .force(
      "collision",
      d3.forceCollide<WorkerNode>().radius(forceParams.collisionRadius).strength(0.5)
    )
    .alphaTarget(keepAlive ? AI_IDLE_ALPHA_TARGET : 0)
    .on("tick", onTick)
    .on("end", onEnd);

  // Capture the default link strength function for scaling later
  // d3's default link strength is 1/min(degree(source), degree(target))
  defaultLinkStrengthFn = linkForce.strength() as any;
}

function onTick() {
  if (!simulation) return;

  const ids = nodes.map((n) => n.id);
  const positions = new Float32Array(nodes.length * 2);

  for (let i = 0; i < nodes.length; i++) {
    positions[i * 2] = nodes[i].x;
    positions[i * 2 + 1] = nodes[i].y;
  }

  self.postMessage(
    {
      type: "tick",
      ids,
      positions: positions.buffer,
      alpha: simulation.alpha(),
    },
    { transfer: [positions.buffer] },
  );
}

function onEnd() {
  isRunning = false;
  self.postMessage({ type: "end" });
}

/**
 * Update force parameters without destroying and recreating the simulation.
 * This matches Obsidian's approach: just update the existing force objects.
 */
function updateForces() {
  if (!simulation) return;

  // Update centering forces
  const xForce = simulation.force("x") as d3.ForceX<WorkerNode> | undefined;
  const yForce = simulation.force("y") as d3.ForceY<WorkerNode> | undefined;
  if (xForce) xForce.strength(forceParams.centerStrength);
  if (yForce) yForce.strength(forceParams.centerStrength);

  // Update charge force
  const chargeForce = simulation.force("charge") as d3.ForceManyBody<WorkerNode> | undefined;
  if (chargeForce) {
    chargeForce.strength(-forceParams.repelStrength);
    // Keep distanceMin(30) as Obsidian does
  }

  // Update link force distance and strength multiplier
  const linkForce = simulation.force("link") as d3.ForceLink<WorkerNode, WorkerEdge> | undefined;
  if (linkForce) {
    linkForce.distance(forceParams.linkDistance);
    // Obsidian scales the default strength by E (linkStrength multiplier)
    // In sim.js: q.strength(function(A, t, n) { return E * J(A, t, n) })
    // where J is the original default strength function
    if (defaultLinkStrengthFn && forceParams.linkStrength !== 1) {
      const baseFn = defaultLinkStrengthFn;
      const mult = forceParams.linkStrength;
      linkForce.strength((link, i, links) => mult * baseFn(link, i, links));
    }
  }

  // Update collision force
  const collisionForce = simulation.force("collision") as d3.ForceCollide<WorkerNode> | undefined;
  if (collisionForce) {
    collisionForce.radius(forceParams.collisionRadius);
  }
}

self.onmessage = (e: MessageEvent) => {
  const { type, data } = e.data;

  switch (type) {
    case "init": {
      nodes = data.nodes.map((n: any) => {
        const angle = Math.random() * Math.PI * 2;
        const radius = 100 + Math.random() * 900;
        return {
          ...n,
          x: n.x ?? Math.cos(angle) * radius,
          y: n.y ?? Math.sin(angle) * radius,
          vx: 0,
          vy: 0,
        };
      });
      keepAlive = Boolean(data.keepAlive);
      edges = data.edges.map((e: any) => ({ ...e }));
      if (data.forces) {
        forceParams = { ...forceParams, ...data.forces };
      }
      initSimulation();
      break;
    }

    case "start": {
      if (simulation && !isRunning) {
        isRunning = true;
        simulation.alphaTarget(keepAlive ? AI_IDLE_ALPHA_TARGET : 0);
        simulation.alpha(1.0).restart();
      }
      break;
    }

    case "stop": {
      if (simulation) {
        simulation.stop();
        isRunning = false;
      }
      break;
    }

    case "forces": {
      forceParams = { ...forceParams, ...data };
      // Update forces in-place instead of recreating (prevents jitter/scatter)
      updateForces();
      break;
    }

    case "reheat": {
      if (simulation) {
        isRunning = true;
        simulation.alphaTarget(keepAlive ? AI_IDLE_ALPHA_TARGET : 0);
        simulation.alpha(1.0).restart();
      }
      break;
    }

    case "drag": {
      const { id, x, y, active } = data;
      const node = nodeMap.get(id);
      if (node) {
        if (active) {
          // Pin node to cursor
          node.fx = x;
          node.fy = y;
          if (simulation) {
            // Obsidian uses alphaTarget(0.3) during drag -- gentle continuous heat
            // This prevents the simulation from cooling to a halt while dragging
            if (!isRunning) {
              isRunning = true;
            }
            simulation.alphaTarget(0.3).restart();
          }
        } else {
          // Release node
          node.fx = null;
          node.fy = null;
          if (simulation) {
            // AI graphs return to a gentle idle target; regular graphs cool naturally.
            simulation.alphaTarget(keepAlive ? AI_IDLE_ALPHA_TARGET : 0);
          }
        }
      }
      break;
    }

    case "pin": {
      const { id, pinned, x, y } = data;
      const node = nodeMap.get(id);
      if (node) {
        if (pinned) {
          node.fx = x;
          node.fy = y;
        } else {
          node.fx = null;
          node.fy = null;
        }
      }
      break;
    }

    case "setPositions": {
      const { positions } = data;
      for (const [id, pos] of Object.entries(positions)) {
        const node = nodeMap.get(id);
        if (node) {
          node.x = (pos as any).x;
          node.y = (pos as any).y;
        }
      }
      // Send updated positions back
      onTick();
      break;
    }

    case "getPositions": {
      const positions: Record<string, { x: number; y: number }> = {};
      nodes.forEach((n) => {
        positions[n.id] = { x: n.x, y: n.y };
      });
      self.postMessage({ type: "positions", positions });
      break;
    }
  }
};
