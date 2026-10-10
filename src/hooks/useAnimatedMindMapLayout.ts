import { useEffect, useRef, useState } from "react";
import type { layoutMindMap, PositionedMindMapNode } from "../utils/forge-mind-map";

type Layout = ReturnType<typeof layoutMindMap>;
type AnimatedNode = PositionedMindMapNode & { opacity: number };
interface AnimatedLayout { nodes: AnimatedNode[]; edges: { from: AnimatedNode; to: AnimatedNode }[] }

function snapshot(layout: Layout): AnimatedLayout {
  return { nodes: layout.nodes.map(node => ({ ...node, opacity: 1 })), edges: layout.edges.map(edge => ({ from: { ...edge.from, opacity: 1 }, to: { ...edge.to, opacity: 1 } })) };
}

/** Move entering/exiting nodes from/to their closest visible ancestor. */
export function interpolateMindMapLayout(previous: AnimatedLayout, target: Layout, progress: number): AnimatedLayout {
  const oldNodes = new Map(previous.nodes.map(node => [node.node.id, node]));
  const nextNodes = new Map(target.nodes.map(node => [node.node.id, { ...node, opacity: 1 }]));
  function ancestor(id: string, nodes: Map<string, AnimatedNode>, fallback: AnimatedNode) {
    let parent = id;
    while (parent.includes(".")) {
      parent = parent.slice(0, parent.lastIndexOf("."));
      const found = nodes.get(parent);
      if (found) return found;
    }
    return fallback;
  }
  const nodes = [...new Set([...oldNodes.keys(), ...nextNodes.keys()])].map(id => {
    const old = oldNodes.get(id);
    const next = nextNodes.get(id);
    const info = next || old!;
    const from = old || { ...ancestor(id, oldNodes, info), opacity: 0 };
    const to = next || { ...ancestor(id, nextNodes, info), opacity: 0 };
    return { ...info, x: from.x + (to.x - from.x) * progress, y: from.y + (to.y - from.y) * progress, opacity: from.opacity + (to.opacity - from.opacity) * progress };
  });
  const positions = new Map(nodes.map(node => [node.node.id, node]));
  const edges = new Map([...previous.edges, ...target.edges].map(edge => [edge.to.node.id, edge]));
  return { nodes, edges: [...edges.values()].map(edge => ({ from: positions.get(edge.from.node.id)!, to: positions.get(edge.to.node.id)! })) };
}

export function useAnimatedMindMapLayout(layout: Layout) {
  const [display, setDisplay] = useState(() => snapshot(layout));
  const current = useRef(display);
  const lastTarget = useRef(layout);
  useEffect(() => {
    if (lastTarget.current === layout) return;
    lastTarget.current = layout;
    const finish = () => { current.current = snapshot(layout); setDisplay(current.current); };
    if (typeof requestAnimationFrame === "undefined" || window.matchMedia?.("(prefers-reduced-motion: reduce)").matches) {
      finish();
      return;
    }
    const start = current.current;
    let frame = 0;
    let started: number | undefined;
    function tick(now: number) {
      started ??= now;
      const progress = Math.min(1, (now - started) / 280);
      if (progress === 1) { finish(); return; }
      const eased = 1 - Math.pow(1 - progress, 3);
      current.current = interpolateMindMapLayout(start, layout, eased);
      setDisplay(current.current);
      frame = requestAnimationFrame(tick);
    }
    // Include newly revealed topics immediately, at their parent's position.
    current.current = interpolateMindMapLayout(start, layout, 0);
    setDisplay(current.current);
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [layout]);
  return display;
}
