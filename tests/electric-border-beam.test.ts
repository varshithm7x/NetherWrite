// @vitest-environment jsdom
import React, { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, beforeEach, expect, it, vi } from "vitest";
import { ElectricBorderBeam } from "../src/components/ui/ElectricBorderBeam";
import { ForgeGenerationBoundary, ForgeGenerationButton, useForgeGenerationFeedback } from "../src/components/panels/ForgeGenerationBoundary";
import { createElectricBorderPoints } from "../src/utils/electric-border";

(globalThis as typeof globalThis & { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;
let root: Root;
let container: HTMLDivElement;
let width: number;
let height: number;
let hidden: boolean;
let frames: Map<number, FrameRequestCallback>;
let resize: () => void;
let intersection: (entries: { isIntersecting: boolean }[]) => void;
let preference: () => void;
let media: { matches: boolean; addEventListener: ReturnType<typeof vi.fn>; removeEventListener: ReturnType<typeof vi.fn> };
let disconnectResize: ReturnType<typeof vi.fn>;
let disconnectIntersection: ReturnType<typeof vi.fn>;
let context: Record<string, ReturnType<typeof vi.fn>>;
let getContext: ReturnType<typeof vi.spyOn>;

beforeEach(() => {
  width = 300; height = 500; hidden = false;
  frames = new Map();
  let id = 0;
  vi.stubGlobal("requestAnimationFrame", (callback: FrameRequestCallback) => { frames.set(++id, callback); return id; });
  vi.stubGlobal("cancelAnimationFrame", (frame: number) => frames.delete(frame));
  vi.spyOn(HTMLElement.prototype, "clientWidth", "get").mockImplementation(() => width);
  vi.spyOn(HTMLElement.prototype, "clientHeight", "get").mockImplementation(() => height);
  vi.spyOn(HTMLElement.prototype, "getClientRects").mockImplementation(() => width ? [{ width, height }] as unknown as DOMRectList : [] as unknown as DOMRectList);
  vi.spyOn(document, "hidden", "get").mockImplementation(() => hidden);
  media = { matches: false, addEventListener: vi.fn((_type, listener) => { preference = listener; }), removeEventListener: vi.fn() };
  vi.stubGlobal("matchMedia", () => media);
  disconnectResize = vi.fn(); disconnectIntersection = vi.fn();
  vi.stubGlobal("ResizeObserver", class {
    constructor(callback: () => void) { resize = callback; }
    observe() {} disconnect() { disconnectResize(); }
  });
  vi.stubGlobal("IntersectionObserver", class {
    constructor(callback: typeof intersection) { intersection = callback; }
    observe() {} disconnect() { disconnectIntersection(); }
  });
  context = Object.fromEntries(["setTransform", "clearRect", "beginPath", "moveTo", "lineTo", "closePath", "stroke", "fillRect"].map(method => [method, vi.fn()]));
  getContext = vi.spyOn(HTMLCanvasElement.prototype, "getContext").mockReturnValue(context as unknown as CanvasRenderingContext2D);
  container = document.createElement("div"); document.body.append(container);
  root = createRoot(container);
});
afterEach(() => { act(() => root.unmount()); document.body.replaceChildren(); vi.restoreAllMocks(); vi.unstubAllGlobals(); });

function render(active: boolean, patch: Partial<React.ComponentProps<typeof ElectricBorderBeam>> = {}) {
  act(() => root.render(React.createElement(ElectricBorderBeam, { active, ...patch }, React.createElement("button", null, "Content"))));
}
function step(time: number) { const pending = [...frames.values()]; frames.clear(); pending.forEach(callback => callback(time)); }

it("does no canvas or animation work while idle", () => {
  render(false);
  expect(getContext).not.toHaveBeenCalled();
  expect(frames.size).toBe(0);
  expect(container.querySelector("canvas")?.getAttribute("aria-hidden")).toBe("true");
});

it("draws immediately, caps drawing frequency, and stops frames while fading the final image", () => {
  render(true);
  expect(context.clearRect).toHaveBeenCalledOnce();
  expect(frames.size).toBe(1);
  step(10);
  const count = context.clearRect.mock.calls.length;
  step(20); step(30);
  expect(context.clearRect).toHaveBeenCalledTimes(count);
  step(44);
  expect(context.clearRect).toHaveBeenCalledTimes(count + 1);
  render(false);
  expect(frames.size).toBe(0);
  expect(container.firstElementChild?.getAttribute("data-electric-fade")).toBe("true");
});

it("stops immediately on errors/cancellation and preserves interactive children", () => {
  const click = vi.fn();
  act(() => root.render(React.createElement(ElectricBorderBeam, { active: true }, React.createElement("button", { onClick: click }, "Cancel"))));
  act(() => container.querySelector("button")!.click());
  expect(click).toHaveBeenCalledOnce();
  render(false, { fadeOut: false });
  expect(frames.size).toBe(0);
  expect(container.firstElementChild?.getAttribute("data-electric-fade")).toBe("false");
});

it("uses static energy for reduced motion and responds to preference changes", () => {
  media.matches = true;
  render(true);
  expect(context.stroke).toHaveBeenCalledTimes(2);
  expect(frames.size).toBe(0);
  media.matches = false;
  act(() => preference());
  expect(frames.size).toBe(1);
  media.matches = true;
  act(() => preference());
  expect(frames.size).toBe(0);
  render(true, { reducedMotion: true });
  expect(container.firstElementChild?.getAttribute("data-electric-reduced")).toBe("true");
});

it.each(["light", "dark"])("tracks resizing under the %s theme with a capped backing resolution", theme => {
  container.dataset.theme = theme;
  vi.stubGlobal("devicePixelRatio", 3);
  render(true, { borderRadius: 22 });
  const canvas = container.querySelector("canvas")!;
  expect(canvas.width).toBe(450);
  expect(canvas.height).toBe(750);
  width = 520; height = 360;
  act(() => resize());
  expect(canvas.width).toBe(780);
  expect(canvas.height).toBe(540);
});

it("pauses hidden/offscreen views and resumes without accumulating loops", () => {
  render(true);
  hidden = true; document.dispatchEvent(new Event("visibilitychange"));
  expect(frames.size).toBe(0);
  hidden = false; document.dispatchEvent(new Event("visibilitychange"));
  expect(frames.size).toBe(1);
  intersection([{ isIntersecting: false }]);
  expect(frames.size).toBe(0);
  intersection([{ isIntersecting: true }]);
  resize(); resize();
  expect(frames.size).toBe(1);
  render(false);
  resize(); intersection([{ isIntersecting: true }]);
  expect(frames.size).toBe(0);
  expect(disconnectResize).toHaveBeenCalled();
  expect(disconnectIntersection).toHaveBeenCalled();
  expect(media.removeEventListener).toHaveBeenCalledWith("change", expect.any(Function));
});

it("defers creating the drawing context for a hidden or zero-sized active panel", () => {
  width = 0; height = 0;
  render(true);
  expect(getContext).not.toHaveBeenCalled();
  width = 300; height = 500;
  resize();
  expect(getContext).toHaveBeenCalledOnce();
  expect(frames.size).toBe(1);
});

it.each([[200, 300, 8], [320, 500, 30], [50, 40, 100], [1600, 1400, 12], [300, 400, 0]])("follows rounded corners at %ix%i with radius %i and bounded sample count", (w, h, radius) => {
  const points = createElectricBorderPoints(w, h, radius);
  expect(points.length).toBeGreaterThanOrEqual(32);
  expect(points.length).toBeLessThanOrEqual(800);
  for (const point of points) {
    expect(point.x).toBeGreaterThanOrEqual(7 - 0.001);
    expect(point.x).toBeLessThanOrEqual(w - 7 + 0.001);
    expect(point.y).toBeGreaterThanOrEqual(7 - 0.001);
    expect(point.y).toBeLessThanOrEqual(h - 7 + 0.001);
    expect(Math.hypot(point.nx, point.ny)).toBeCloseTo(1);
  }
});

it("keeps independent jobs active and ignores stale completions", () => {
  function Generator({ label }: { label: string }) {
    const begin = useForgeGenerationFeedback();
    const finish = React.useRef<ReturnType<typeof begin> | null>(null);
    return React.createElement("div", null,
      React.createElement(ForgeGenerationButton, null, React.createElement("button", { onClick: () => { finish.current = begin(); } }, `Start ${label}`)),
      React.createElement("button", { onClick: () => finish.current?.("success") }, `Finish ${label}`));
  }
  act(() => root.render(React.createElement(ForgeGenerationBoundary, null, React.createElement(Generator, { label: "A" }), React.createElement(Generator, { label: "B" }))));
  function click(label: string) { act(() => [...container.querySelectorAll("button")].find(button => button.textContent === label)!.click()); }
  click("Start A"); click("Start B"); click("Finish A");
  expect(container.querySelector('[data-electric-active="true"]')).not.toBeNull();
  click("Finish A");
  expect(container.querySelector('[data-electric-active="true"]')).not.toBeNull();
  click("Finish B");
  expect(container.querySelector('[data-electric-active="false"][data-electric-fade="true"]')).not.toBeNull();
});
