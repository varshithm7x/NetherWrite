import { useEffect, useRef } from "react";
import type { ReactNode } from "react";
import { createElectricBorderPoints, drawElectricBorder } from "../../utils/electric-border";
import "../../styles/electricBorderBeam.css";

export interface ElectricBorderBeamProps {
  active: boolean;
  fadeOut?: boolean;
  intensity?: number;
  color?: string;
  borderRadius?: number;
  speed?: number;
  reducedMotion?: boolean;
  className?: string;
  outset?: number;
  children: ReactNode;
}

export function ElectricBorderBeam({ active, fadeOut = true, intensity = 1, color = "#FFB347", borderRadius = 12, speed = 1, reducedMotion, className = "", outset = 0, children }: ElectricBorderBeamProps) {
  const host = useRef<HTMLDivElement>(null);
  const canvas = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    if (!active || !host.current || !canvas.current) return;
    const element = host.current;
    const surface = canvas.current;
    // No renderer work for idle/saved views. Draw directly, without React frame updates.
    let ctx: CanvasRenderingContext2D | null = null;
    const media = window.matchMedia?.("(prefers-reduced-motion: reduce)");
    let reduce = reducedMotion ?? media?.matches ?? false;
    let visible = true;
    let disposed = false;
    let frame = 0;
    let lastDraw = -Infinity;
    let width = 0;
    let height = 0;
    let ratio = 1;
    let points = createElectricBorderPoints(0, 0, borderRadius);
    let coordinates = new Float32Array(points.length * 2);
    const strength = Math.max(0.1, Math.min(1.5, intensity));
    const pace = Math.max(0.1, Math.min(3, speed));
    function drawable() { return !disposed && visible && !document.hidden && width > 14 && height > 14; }
    function draw(now: number) {
      if (!ctx) return;
      ctx!.clearRect(0, 0, width, height);
      drawElectricBorder(ctx!, points, now / 1000 * pace, strength, color, reduce, coordinates);
    }
    function tick(now: number) {
      if (!drawable() || reduce) { frame = 0; return; }
      // 30 draws per second is enough for fine electric movement; rAF stays synced to display.
      if (now - lastDraw >= 1000 / 30) { draw(now); lastDraw = now; }
      frame = requestAnimationFrame(tick);
    }
    function resume() {
      cancelAnimationFrame(frame);
      frame = 0;
      if (!drawable() || !element.getClientRects().length) return;
      if (!ctx) {
        ctx = surface.getContext("2d");
        if (!ctx) return;
        ctx.setTransform(ratio, 0, 0, ratio, 0, 0);
      }
      draw(performance.now());
      if (!reduce) frame = requestAnimationFrame(tick);
    }
    function resize() {
      const nextWidth = element.clientWidth + outset * 2;
      const nextHeight = element.clientHeight + outset * 2;
      if (nextWidth !== width || nextHeight !== height) {
        width = nextWidth; height = nextHeight;
        ratio = Math.min(window.devicePixelRatio || 1, 1.5);
        surface.width = Math.ceil(width * ratio);
        surface.height = Math.ceil(height * ratio);
        ctx?.setTransform(ratio, 0, 0, ratio, 0, 0);
        points = createElectricBorderPoints(width, height, borderRadius);
        coordinates = new Float32Array(points.length * 2);
      }
      resume();
    }
    function preferenceChanged() { reduce = reducedMotion ?? media?.matches ?? false; resume(); }
    const resizeObserver = typeof ResizeObserver !== "undefined" ? new ResizeObserver(resize) : null;
    resizeObserver?.observe(element);
    const intersectionObserver = typeof IntersectionObserver !== "undefined" ? new IntersectionObserver(entries => { visible = entries[0]?.isIntersecting ?? false; resume(); }) : null;
    intersectionObserver?.observe(element);
    document.addEventListener("visibilitychange", resume);
    media?.addEventListener("change", preferenceChanged);
    if (!resizeObserver) window.addEventListener("resize", resize);
    resize();
    return () => {
      disposed = true;
      cancelAnimationFrame(frame);
      resizeObserver?.disconnect();
      intersectionObserver?.disconnect();
      document.removeEventListener("visibilitychange", resume);
      media?.removeEventListener("change", preferenceChanged);
      window.removeEventListener("resize", resize);
    };
  }, [active, intensity, color, borderRadius, speed, reducedMotion, outset]);

  return <div ref={host} className={`electric-border-beam ${className}`} data-electric-active={active} data-electric-fade={fadeOut} data-electric-reduced={reducedMotion}>
    {children}
    <canvas ref={canvas} aria-hidden="true" className="electric-border-beam__surface" style={outset ? { inset: -outset, width: `calc(100% + ${outset * 2}px)`, height: `calc(100% + ${outset * 2}px)` } : undefined} />
  </div>;
}
