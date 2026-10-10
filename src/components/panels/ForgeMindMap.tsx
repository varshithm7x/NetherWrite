import { useEffect, useMemo, useRef, useState } from "react";
import { Download, Maximize2, Minus, Plus, ChevronsUpDown } from "lucide-react";
import { initiallyCollapsed, layoutMindMap } from "../../utils/forge-mind-map";
import type { MindMapCreation, MindMapNode } from "../../utils/forge-mind-map";
import { useAnimatedMindMapLayout } from "../../hooks/useAnimatedMindMapLayout";

export const forgeButtonClass = "inline-flex items-center justify-center gap-2 rounded-lg border border-(--border-subtle) px-3 py-2 text-xs hover:bg-(--bg-active) focus-visible:outline-2 focus-visible:outline-(--interactive-accent) disabled:opacity-50";

export function ForgeMindMap({ creation, onOpenSource }: { creation: MindMapCreation; onOpenSource: (path: string) => void }) {
  const [collapsed, setCollapsed] = useState(() => initiallyCollapsed(creation.root));
  const [camera, setCamera] = useState({ x: 0, y: 0, scale: 1 });
  const [showSources, setShowSources] = useState(false);
  const [topicSources, setTopicSources] = useState<MindMapNode | null>(null);
  const [animateCamera, setAnimateCamera] = useState(false);
  const svgRef = useRef<SVGSVGElement>(null);
  const viewportRef = useRef<HTMLDivElement>(null);
  const drag = useRef<{ x: number; y: number; cameraX: number; cameraY: number } | null>(null);
  const layout = useMemo(() => layoutMindMap(creation.root, collapsed), [creation, collapsed]);
  const display = useAnimatedMindMapLayout(layout);
  const fit = () => {
    const rect = viewportRef.current?.getBoundingClientRect();
    if (!rect?.width || !rect.height) return;
    const scale = Math.min(1.4, (rect.width - 32) / layout.width, (rect.height - 32) / layout.height);
    const safeScale = Math.max(0.05, scale);
    setAnimateCamera(true);
    setCamera({ x: (rect.width - layout.width * safeScale) / 2, y: (rect.height - layout.height * safeScale) / 2, scale: safeScale });
  };
  useEffect(() => { fit(); }, [layout]);
  useEffect(() => {
    if (!viewportRef.current || typeof ResizeObserver === "undefined") return;
    const observer = new ResizeObserver(() => fit());
    observer.observe(viewportRef.current);
    return () => observer.disconnect();
  }, [layout]);
  function zoom(factor: number, x?: number, y?: number) {
    setAnimateCamera(false);
    const rect = viewportRef.current?.getBoundingClientRect();
    const px = x ?? (rect?.width || 800) / 2;
    const py = y ?? (rect?.height || 600) / 2;
    setCamera(old => {
      const scale = Math.max(0.05, Math.min(3, old.scale * factor));
      return { scale, x: px - (px - old.x) * scale / old.scale, y: py - (py - old.y) * scale / old.scale };
    });
  }
  function download() {
    const original = svgRef.current;
    if (!original) return;
    const copy = original.cloneNode(true) as SVGSVGElement;
    copy.setAttribute("xmlns", "http://www.w3.org/2000/svg");
    copy.setAttribute("viewBox", `0 0 ${layout.width} ${layout.height}`);
    copy.setAttribute("width", String(layout.width));
    copy.setAttribute("height", String(layout.height));
    copy.querySelector("g[data-camera]")?.removeAttribute("transform");
    copy.querySelector("g[data-camera]")?.removeAttribute("style");
    const sourceNodes = [original, ...original.querySelectorAll("*")];
    [copy, ...copy.querySelectorAll("*")].forEach((element, index) => {
      const style = getComputedStyle(sourceNodes[index]);
      for (const property of ["fill", "stroke", "color", "font-family", "font-size"]) element.setAttribute(property, style.getPropertyValue(property));
    });
    const url = URL.createObjectURL(new Blob([new XMLSerializer().serializeToString(copy)], { type: "image/svg+xml" }));
    const link = document.createElement("a");
    link.href = url;
    link.download = `${creation.root.label.replace(/[^\p{L}\p{N} _-]/gu, "").slice(0, 80) || "mind-map"}.svg`;
    link.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }
  function sourcesFor(node: MindMapNode) {
    return creation.sources.filter(source => node.sourcePaths?.includes(source.path));
  }
  function openTopic(node: MindMapNode) {
    const sources = sourcesFor(node);
    if (sources.length === 1 || creation.sources.length === 1) {
      setTopicSources(null);
      onOpenSource((sources[0] || creation.sources[0]).path);
    } else {
      setTopicSources(node);
    }
  }
  return <>
    <div className="px-4 pb-2">
      <button className={forgeButtonClass} onClick={() => setShowSources(value => !value)} aria-expanded={showSources}>View {creation.sources.length} {creation.sources.length === 1 ? "source" : "sources"}</button>
      {showSources && <div className="mt-2 flex flex-wrap gap-2">{creation.sources.map(source => <button key={source.path} className={forgeButtonClass} onClick={() => onOpenSource(source.path)} title={source.path}>{source.name}</button>)}</div>}
      {topicSources && <div aria-label={`Sources for ${topicSources.label}`} className="mt-2 max-h-36 overflow-y-auto rounded-lg border border-(--border-subtle) p-2">
        <p className="m-0 mb-2 text-xs text-(--text-muted)">Choose a note for {topicSources.label}</p>
        {(sourcesFor(topicSources).length ? sourcesFor(topicSources) : creation.sources).map(source => <button key={source.path} className={`${forgeButtonClass} mb-1 w-full justify-start text-left`} onClick={() => { setTopicSources(null); onOpenSource(source.path); }}>{source.name}</button>)}
      </div>}
    </div>
    <div aria-label="Mind map controls" className="flex shrink-0 flex-wrap gap-1 px-3 pb-2 [&>button]:px-2">
        <button className={forgeButtonClass} aria-label="Fit mind map" onClick={fit}><Maximize2 size={18} /></button>
        <button className={forgeButtonClass} aria-label="Zoom in" onClick={() => zoom(1.25)}><Plus size={18} /></button>
        <button className={forgeButtonClass} aria-label="Zoom out" onClick={() => zoom(0.8)}><Minus size={18} /></button>
        <button className={forgeButtonClass} aria-label={collapsed.size ? "Expand all branches" : "Collapse branches"} onClick={() => setCollapsed(collapsed.size ? new Set() : initiallyCollapsed(creation.root))}><ChevronsUpDown size={18} /></button>
        <button className={forgeButtonClass} aria-label="Download mind map as SVG" onClick={download}><Download size={18} /></button>
    </div>
    <div ref={viewportRef} className="relative mx-3 mb-2 min-h-0 flex-1 overflow-hidden rounded-lg bg-(--bg-secondary)">
      <svg ref={svgRef} className="h-full w-full touch-none" aria-label="Interactive mind map" onWheel={event => {
        const rect = event.currentTarget.getBoundingClientRect();
        zoom(event.deltaY < 0 ? 1.1 : 1 / 1.1, event.clientX - rect.left, event.clientY - rect.top);
      }} onPointerDown={event => {
        if (event.button !== 0 || (event.target as Element).closest('[role="button"]')) return;
        setAnimateCamera(false);
        drag.current = { x: event.clientX, y: event.clientY, cameraX: camera.x, cameraY: camera.y };
        event.currentTarget.setPointerCapture(event.pointerId);
      }} onPointerMove={event => {
        const start = drag.current;
        if (start) setCamera(old => ({ ...old, x: start.cameraX + event.clientX - start.x, y: start.cameraY + event.clientY - start.y }));
      }} onPointerUp={() => { drag.current = null; }} onPointerCancel={() => { drag.current = null; }}>
        <rect width="100%" height="100%" fill="var(--bg-secondary)" />
        <g data-camera style={{ transform: `translate(${camera.x}px, ${camera.y}px) scale(${camera.scale})` }} className={animateCamera ? "motion-safe:transition-transform motion-safe:duration-300 motion-safe:ease-out" : undefined}>
          {display.edges.map(({ from, to }) => {
            const x = from.x + from.width + 14;
            const middle = (x + to.x) / 2;
            return <path key={to.node.id} d={`M ${x} ${from.y} C ${middle} ${from.y}, ${middle} ${to.y}, ${to.x} ${to.y}`} fill="none" stroke="var(--interactive-accent)" strokeOpacity={0.65 * Math.min(from.opacity, to.opacity)} strokeWidth={1.3} />;
          })}
          {display.nodes.map(({ node, x, y, width, height, depth, opacity }) => {
            const toggle = () => setCollapsed(old => { const next = new Set(old); if (next.has(node.id)) next.delete(node.id); else next.add(node.id); return next; });
            const lineLength = Math.max(1, Math.floor((width - 24) / 7));
            const lines = node.label.match(new RegExp(`.{1,${lineLength}}`, "gu")) || [node.label];
            const visible = layout.nodes.some(position => position.node.id === node.id);
            return <g key={node.id} transform={`translate(${x} ${y - height / 2})`} opacity={opacity} aria-hidden={!visible} style={{ pointerEvents: visible ? "auto" : "none" }}>
              <g role="button" tabIndex={visible ? 0 : -1} aria-label={node.label} onClick={() => openTopic(node)} onKeyDown={event => { if (event.key === "Enter" || event.key === " ") { event.preventDefault(); openTopic(node); } }} style={{ cursor: "pointer" }}>
                <title>{`Open source note for ${node.label}`}</title>
                <rect width={width} height={height} rx={5} fill={`color-mix(in srgb, var(--interactive-accent) ${depth === 0 ? 30 : depth === 1 ? 18 : 9}%, var(--bg-active))`} />
                <text x={12} y={(height - lines.length * 18) / 2 + 13} fill="var(--text-primary)" fontSize={12} fontFamily="sans-serif">{lines.map((line, i) => <tspan key={i} x={12} dy={i ? 18 : 0}>{line}</tspan>)}</text>
              </g>
              {node.children.length > 0 && <g role="button" tabIndex={visible ? 0 : -1} aria-label={`${collapsed.has(node.id) ? "Expand" : "Collapse"} ${node.label} branch`} aria-expanded={!collapsed.has(node.id)} onClick={toggle} onKeyDown={event => { if (event.key === "Enter" || event.key === " ") { event.preventDefault(); toggle(); } }} style={{ cursor: "pointer" }}><circle cx={width + 14} cy={height / 2} r={10} fill="var(--bg-active)" /><text x={width + 14} y={height / 2 + 4} textAnchor="middle" fill="var(--text-primary)" fontSize={13}>{collapsed.has(node.id) ? "›" : "‹"}</text></g>}
            </g>;
          })}
        </g>
      </svg>
    </div>
    <p className="m-0 shrink-0 px-4 pb-3 text-[10px] leading-relaxed text-(--text-muted)">Drag to pan · Scroll to zoom<br />Click a topic to open its note · Use chevrons to expand</p>
  </>;
}
