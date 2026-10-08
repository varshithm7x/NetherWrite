import { useEffect, useLayoutEffect, useRef, type RefObject } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.config({ nullTargetWarn: false });
if (typeof window !== "undefined") gsap.registerPlugin(ScrollTrigger);

const ease = "power2.out";
const LINE_CAP = 32;

export function prefersReducedMotion() {
  return typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

function hasFinePointer() {
  return typeof window !== "undefined" && window.matchMedia("(pointer: fine)").matches;
}

export function usePointerDepth(
  root: RefObject<HTMLElement | null>,
  { move = 7, tilt = 1.1 }: { move?: number; tilt?: number } = {},
) {
  useEffect(() => {
    const el = root.current;
    if (!el || prefersReducedMotion() || !hasFinePointer()) return;
    const inner = el.querySelector<HTMLElement>("[data-depth-inner]") ?? el;
    const reset = () => {
      gsap.to(inner, { x: 0, y: 0, rotateX: 0, rotateY: 0, duration: 0.75, ease, overwrite: "auto" });
    };
    const onMove = (event: PointerEvent) => {
      const box = el.getBoundingClientRect();
      if (!box.width || !box.height) return;
      const x = ((event.clientX - box.left) / box.width) * 2 - 1;
      const y = ((event.clientY - box.top) / box.height) * 2 - 1;
      gsap.to(inner, {
        x: x * move,
        y: y * move * 0.65,
        rotateY: x * tilt,
        rotateX: -y * tilt,
        transformPerspective: 1100,
        duration: 0.7,
        ease,
        overwrite: "auto",
      });
    };
    el.addEventListener("pointermove", onMove);
    el.addEventListener("pointerleave", reset);
    return () => {
      el.removeEventListener("pointermove", onMove);
      el.removeEventListener("pointerleave", reset);
      gsap.set(inner, { clearProps: "transform" });
    };
  }, [root, move, tilt]);
}

export function useScrollParallax(
  root: RefObject<HTMLElement | null>,
  { y = 16, scale = 0.03 }: { y?: number; scale?: number } = {},
) {
  useLayoutEffect(() => {
    const el = root.current;
    if (!el || prefersReducedMotion()) return;
    const layer = el.querySelector<HTMLElement>("[data-parallax], img") ?? el;
    const ctx = gsap.context(() => {
      gsap.fromTo(
        layer,
        { y, scale: 1 + scale },
        {
          y: -y,
          scale: 1,
          ease: "none",
          scrollTrigger: {
            trigger: el,
            start: "top bottom",
            end: "bottom top",
            scrub: 0.55,
          },
        },
      );
    }, el);
    return () => ctx.revert();
  }, [root, y, scale]);
}

export function useScrollFade(root: RefObject<HTMLElement | null>, { y = 12 }: { y?: number } = {}) {
  useLayoutEffect(() => {
    const el = root.current;
    if (!el || prefersReducedMotion()) return;
    const ctx = gsap.context(() => {
      gsap.fromTo(
        el,
        { autoAlpha: 0.78, y },
        {
          autoAlpha: 1,
          y: 0,
          ease: "none",
          scrollTrigger: {
            trigger: el,
            start: "top 92%",
            end: "top 64%",
            scrub: 0.5,
          },
        },
      );
    }, el);
    return () => ctx.revert();
  }, [root, y]);
}

export function useStaggerIn(root: RefObject<HTMLElement | null>, selector: string) {
  useLayoutEffect(() => {
    const el = root.current;
    if (!el || prefersReducedMotion()) return;
    const items = el.querySelectorAll(selector);
    if (!items.length) return;
    const ctx = gsap.context(() => {
      gsap.from(items, {
        y: 10,
        autoAlpha: 0,
        duration: 0.45,
        stagger: 0.04,
        ease,
        scrollTrigger: {
          trigger: el,
          start: "top 84%",
          once: true,
        },
      });
    }, el);
    return () => ctx.revert();
  }, [root, selector]);
}

export function useStoryChapters(
  root: RefObject<HTMLElement | null>,
  setActive: (index: number) => void,
) {
  useLayoutEffect(() => {
    const el = root.current;
    if (!el) return;
    const chapters = Array.from(el.querySelectorAll<HTMLElement>("[data-chapter]"));
    if (!chapters.length) return;

    const count = chapters.length;
    let last = -1;
    const apply = (progress: number) => {
      const exact = progress * count;
      let next = Math.min(count - 1, Math.max(0, Math.floor(exact)));
      if (last >= 0 && next !== last) {
        if (next > last && exact < last + 1.08) next = last;
        if (next < last && exact > last - 0.08) next = last;
      }
      if (next !== last) {
        last = next;
        setActive(next);
      }
    };

    const ctx = gsap.context(() => {
      ScrollTrigger.create({
        trigger: el,
        start: "top top+=56",
        end: "bottom bottom",
        onUpdate: (self) => apply(self.progress),
        onLeaveBack: () => apply(0),
        onRefresh: (self) => apply(self.progress),
      });
    }, el);
    apply(0);
    const refresh = () => ScrollTrigger.refresh();
    window.addEventListener("load", refresh);
    const timer = window.setTimeout(refresh, 80);
    return () => {
      window.removeEventListener("load", refresh);
      window.clearTimeout(timer);
      ctx.revert();
    };
  }, [root, setActive]);
}



function frames(count = 1) {
  return new Promise<void>((resolve) => {
    const step = (left: number) => {
      if (left <= 0) resolve();
      else requestAnimationFrame(() => step(left - 1));
    };
    step(count);
  });
}

function visible(el: HTMLElement) {
  const box = el.getBoundingClientRect();
  if (box.width < 2 || box.height < 2) return false;
  let node: HTMLElement | null = el;
  while (node && node !== document.body) {
    if (getComputedStyle(node).display === "none") return false;
    node = node.parentElement;
  }
  return true;
}

function noteHint(path: string) {
  return path.split("/").pop()?.replace(/\.md$/i, "") ?? "";
}

function collectLines(root: HTMLElement) {
  const cm = Array.from(root.querySelectorAll<HTMLElement>(".oo-real-editor .cm-line"))
    .filter(visible)
    .slice(0, LINE_CAP);
  const gutters = Array.from(root.querySelectorAll<HTMLElement>(".oo-real-editor .cm-gutterElement"))
    .filter(visible)
    .slice(0, LINE_CAP);
  const preview = Array.from(
    root.querySelectorAll<HTMLElement>(
      ".oo-real-editor .markdown-preview > *, .oo-real-editor .markdown-preview h1, .oo-real-editor .markdown-preview h2, .oo-real-editor .markdown-preview h3, .oo-real-editor .markdown-preview p, .oo-real-editor .markdown-preview ul, .oo-real-editor .markdown-preview blockquote",
    ),
  )
    .filter(visible)
    .slice(0, 18);
  return { cm, gutters, preview, blocks: [...cm, ...preview] };
}

async function whenEditorReady(root: HTMLElement, alive: { current: boolean }, hint = "") {
  const deadline = performance.now() + 1100;
  let last = "";
  let stable = 0;
  while (alive.current && performance.now() < deadline) {
    const first =
      root.querySelector<HTMLElement>(".oo-real-editor .cm-line") ??
      root.querySelector<HTMLElement>(".oo-real-editor .markdown-preview > *");
    const text = first?.textContent ?? "";
    const tab = root.querySelector(".oo-tab.is-on")?.textContent ?? "";
    const ready = Boolean(root.querySelector(".oo-real-editor .cm-content, .oo-real-editor .markdown-preview"));
    const matches = !hint || text.includes(hint) || tab.includes(hint);
    if (ready && matches && text && text === last) {
      stable += 1;
      if (stable >= 2) {
        await frames(1);
        return collectLines(root);
      }
    } else {
      stable = 0;
    }
    last = text;
    await frames(1);
  }
  return collectLines(root);
}

function sweepVeil(root: HTMLElement) {
  const veil = root.querySelector<HTMLElement>(".oo-editor-veil");
  if (!veil) return;
  gsap.killTweensOf(veil);
  gsap.fromTo(
    veil,
    { autoAlpha: 0.72, yPercent: -48 },
    { autoAlpha: 0, yPercent: 88, duration: 0.56, ease: "power2.out", clearProps: "transform" },
  );
}

function releaseEditor(root: HTMLElement) {
  const { blocks, gutters } = collectLines(root);
  const nodes = [...blocks, ...gutters];
  if (nodes.length) gsap.set(nodes, { clearProps: "transform,opacity,visibility" });
}

function revealEditor(root: HTMLElement) {
  const { blocks, gutters } = collectLines(root);
  const chrome = root.querySelector<HTMLElement>(".oo-real-editor .netherwrite-note-chrome, .oo-real-editor .editor-header");
  const tab = root.querySelector<HTMLElement>(".oo-tab.is-on");
  const tl = gsap.timeline({ defaults: { ease, overwrite: "auto" } });

  if (tab) {
    tl.fromTo(tab, { y: 3, autoAlpha: 0.6 }, { y: 0, autoAlpha: 1, duration: 0.22, clearProps: "transform" }, 0);
  }
  if (chrome) {
    tl.fromTo(chrome, { autoAlpha: 0.4 }, { autoAlpha: 1, duration: 0.28 }, 0);
  }
  if (blocks.length) {
    const stagger = Math.min(0.016, 0.34 / blocks.length);
    gsap.set(blocks, { autoAlpha: 0, y: 8 });
    tl.to(
      blocks,
      { autoAlpha: 1, y: 0, duration: 0.34, stagger, clearProps: "transform,opacity,visibility" },
      0.04,
    );
    if (gutters.length) {
      gsap.set(gutters, { autoAlpha: 0 });
      tl.to(
        gutters,
        { autoAlpha: 1, duration: 0.34, stagger, clearProps: "opacity,visibility" },
        0.04,
      );
    }
  }
  return tl;
}

export function useWorkspaceMotion({
  root,
  surface,
  activePath,
  viewMode,
  sidebar,
}: {
  root: RefObject<HTMLElement | null>;
  surface: string;
  activePath: string;
  viewMode: string;
  sidebar: boolean;
}) {
  const skipPath = useRef(true);
  const skipMode = useRef(true);
  const skipSurface = useRef(true);
  const skipSidebar = useRef(true);

  useLayoutEffect(() => {
    const el = root.current;
    if (!el || prefersReducedMotion()) return;

    const ctx = gsap.context(() => {
      const tl = gsap.timeline({ defaults: { ease, overwrite: "auto" } });
      tl.from(el, { y: 10, autoAlpha: 0, duration: 0.44, clearProps: "transform" }, 0);
      tl.from(".oo-title", { y: -6, autoAlpha: 0, duration: 0.28 }, 0.06);
      tl.from(".oo-side", { autoAlpha: 0, duration: 0.3 }, 0.1);
      tl.from(".oo-status", { autoAlpha: 0, duration: 0.24 }, 0.16);
    }, el);

    const alive = { current: true };
    let lines: gsap.core.Timeline | undefined;
    const safety = window.setTimeout(() => {
      gsap.set(el, { autoAlpha: 1, clearProps: "transform" });
    }, 900);
    void (async () => {
      await frames(2);
      if (!alive.current || !root.current) return;
      await whenEditorReady(root.current, alive);
      if (!alive.current || !root.current) return;
      sweepVeil(root.current);
      lines = revealEditor(root.current);
    })();

    return () => {
      alive.current = false;
      window.clearTimeout(safety);
      lines?.kill();
      ctx.revert();
      gsap.set(el, { autoAlpha: 1, clearProps: "transform" });
    };
  }, [root]);

  useEffect(() => {
    if (skipPath.current) {
      skipPath.current = false;
      return;
    }
    const el = root.current;
    if (!el || prefersReducedMotion() || surface !== "write") return;
    const alive = { current: true };
    let tween: gsap.core.Timeline | undefined;
    sweepVeil(el);
    void (async () => {
      await whenEditorReady(el, alive, noteHint(activePath));
      if (!alive.current) return;
      tween = revealEditor(el);
    })();
    return () => {
      alive.current = false;
      tween?.kill();
      releaseEditor(el);
    };
  }, [activePath, root, surface]);

  useEffect(() => {
    if (skipMode.current) {
      skipMode.current = false;
      return;
    }
    const el = root.current;
    if (!el || prefersReducedMotion() || surface !== "write") return;
    const alive = { current: true };
    let tween: gsap.core.Timeline | undefined;
    void (async () => {
      await frames(2);
      await whenEditorReady(el, alive);
      if (!alive.current) return;
      tween = revealEditor(el);
    })();
    return () => {
      alive.current = false;
      tween?.kill();
      releaseEditor(el);
    };
  }, [viewMode, root, surface]);

  useEffect(() => {
    if (skipSurface.current) {
      skipSurface.current = false;
      return;
    }
    const el = root.current;
    if (!el || prefersReducedMotion()) return;
    const main = el.querySelector<HTMLElement>(".oo-main");
    const tween = main
      ? gsap.fromTo(main, { autoAlpha: 0, y: 8 }, { autoAlpha: 1, y: 0, duration: 0.3, ease, clearProps: "transform" })
      : undefined;
    const alive = { current: true };
    let lines: gsap.core.Timeline | undefined;
    if (surface === "write") {
      void (async () => {
        await frames(2);
        await whenEditorReady(el, alive, noteHint(activePath));
        if (!alive.current) return;
        sweepVeil(el);
        lines = revealEditor(el);
      })();
    }
    return () => {
      alive.current = false;
      tween?.kill();
      lines?.kill();
      if (surface === "write") releaseEditor(el);
    };
  }, [surface, root]);

  useEffect(() => {
    if (skipSidebar.current) {
      skipSidebar.current = false;
      return;
    }
    const el = root.current;
    if (!el || prefersReducedMotion() || !sidebar) return;
    const side = el.querySelector<HTMLElement>(".oo-side");
    if (!side) return;
    const tween = gsap.fromTo(
      side,
      { x: -16, autoAlpha: 0 },
      { x: 0, autoAlpha: 1, duration: 0.28, ease, clearProps: "transform" },
    );
    return () => {
      tween.kill();
    };
  }, [sidebar, root]);
}
