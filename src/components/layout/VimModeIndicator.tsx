import React, { useEffect, useMemo, useState } from "react";

type VimMode = "NORMAL" | "INSERT" | "VISUAL" | "V-LINE" | "COMMAND";

interface VimModeIndicatorProps {
  vimEnabled: boolean;
}

const MODE_COLORS: Record<VimMode, string> = {
  NORMAL: "#7aa2f7",
  INSERT: "#9ece6a",
  VISUAL: "#bb9af7",
  "V-LINE": "#bb9af7",
  COMMAND: "#e0af68",
};

function normalizeMode(rawMode: unknown): VimMode {
  const mode = typeof rawMode === "string" ? rawMode.toLowerCase() : "";

  if (mode.includes("insert")) return "INSERT";
  if (mode.includes("visual line") || mode === "vline" || mode === "v-line") return "V-LINE";
  if (mode.includes("visual")) return "VISUAL";
  if (mode.includes("command") || mode.includes("ex")) return "COMMAND";
  return "NORMAL";
}

export function VimModeIndicator({ vimEnabled }: VimModeIndicatorProps) {
  const [mode, setMode] = useState<VimMode>("NORMAL");

  useEffect(() => {
    const handleModeChange = (event: Event) => {
      const customEvent = event as CustomEvent<{ mode?: string }>;
      setMode(normalizeMode(customEvent.detail?.mode));
    };

    window.addEventListener("oo:vim-mode-change", handleModeChange as EventListener);
    return () => {
      window.removeEventListener("oo:vim-mode-change", handleModeChange as EventListener);
    };
  }, []);

  const modeColor = useMemo(() => MODE_COLORS[mode], [mode]);

  if (!vimEnabled) {
    return null;
  }

  return (
    <span
      className="inline-flex items-center justify-center px-2 py-px rounded-full text-[10px] font-bold tracking-wide uppercase"
      style={{
        color: "#0b0f14",
        backgroundColor: modeColor,
      }}
      title={`Vim mode: ${mode}`}
    >
      {mode}
    </span>
  );
}
