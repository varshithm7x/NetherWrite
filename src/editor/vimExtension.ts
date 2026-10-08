import type { Extension } from "@codemirror/state";
import { Compartment } from "@codemirror/state";
import type { EditorView } from "@codemirror/view";
import { Vim, getCM, vim } from "@replit/codemirror-vim";

export const vimCompartment = new Compartment();

let commandsRegistered = false;
const boundModeListeners = new WeakSet<object>();

async function writeClipboardText(text: string): Promise<void> {
  if (!text) return;

  if (window.electronAPI?.writeClipboardText) {
    await window.electronAPI.writeClipboardText(text);
    return;
  }

  if (navigator.clipboard?.writeText) {
    await navigator.clipboard.writeText(text);
    return;
  }

  const textarea = document.createElement("textarea");
  textarea.value = text;
  textarea.style.position = "fixed";
  textarea.style.opacity = "0";
  document.body.appendChild(textarea);
  textarea.focus();
  textarea.select();
  document.execCommand("copy");
  document.body.removeChild(textarea);
}

function dispatchOOEvent(name: string, detail?: Record<string, unknown>): void {
  window.dispatchEvent(new CustomEvent(name, detail ? { detail } : undefined));
}

function getArgText(params: unknown): string {
  if (!params || typeof params !== "object") {
    return "";
  }

  const typedParams = params as {
    args?: string[];
    argString?: string;
    input?: string;
  };

  if (Array.isArray(typedParams.args)) {
    return typedParams.args.join(" ").trim();
  }

  if (typeof typedParams.argString === "string") {
    return typedParams.argString.trim();
  }

  if (typeof typedParams.input === "string") {
    return typedParams.input.trim();
  }

  return "";
}

export function registerOOCommands(): void {
  if (!commandsRegistered) {
    Vim.defineEx("write", "w", () => {
      dispatchOOEvent("oo:save");
    });

    Vim.defineEx("quit", "q", () => {
      dispatchOOEvent("oo:close-tab");
    });

    Vim.defineEx("wq", "wq", () => {
      dispatchOOEvent("oo:save");
      dispatchOOEvent("oo:close-tab");
    });

    Vim.defineEx("tabnew", "tabnew", (_cm: unknown, params: unknown) => {
      const name = getArgText(params);
      dispatchOOEvent("oo:new-note", name ? { name } : {});
    });

    Vim.defineEx("vsplit", "vs", () => {
      dispatchOOEvent("oo:split-view");
    });

    Vim.defineEx("graph", "graph", () => {
      dispatchOOEvent("oo:open-graph");
    });

    Vim.defineEx("chat", "chat", () => {
      dispatchOOEvent("oo:open-chat");
    });

    Vim.defineEx("daily", "daily", () => {
      dispatchOOEvent("oo:daily-note");
    });

    Vim.defineEx("find", "find", (_cm: unknown, params: unknown) => {
      const query = getArgText(params);
      dispatchOOEvent("oo:fuzzy-search", query ? { query } : {});
    });

    Vim.defineAction("ooYankLineClipboard", (cm: unknown) => {
      const typed = cm as {
        getCursor?: () => { line: number };
        getLine?: (line: number) => string;
      };
      const line = typed.getCursor?.().line;
      if (typeof line !== "number") return;
      const text = typed.getLine?.(line) ?? "";
      void writeClipboardText(`${text}\n`);
    });

    Vim.defineAction("ooYankVisualClipboard", (cm: unknown) => {
      const typed = cm as {
        getSelection?: () => string;
      };
      const selection = typed.getSelection?.() ?? "";
      if (selection) {
        void writeClipboardText(selection);
      }
      Vim.handleKey(cm as never, "<Esc>", "user");
    });

    // Reliable clipboard yanks in Electron regardless of browser clipboard permission state.
    Vim.mapCommand("yy", "action", "ooYankLineClipboard", {}, { context: "normal" });
    // Visual `y` executes immediately; this also covers users pressing `yy` while in visual mode.
    Vim.mapCommand("y", "action", "ooYankVisualClipboard", {}, { context: "visual" });

    commandsRegistered = true;
  }
}

type VimModePayload = {
  mode?: string;
  subMode?: string;
};

function normalizeModeForEvent(payload: VimModePayload): string {
  const baseMode = (payload.mode || "normal").toLowerCase();
  const subMode = (payload.subMode || "").toLowerCase();

  if (baseMode === "visual" && subMode === "linewise") {
    return "visual line";
  }

  if (baseMode === "replace") {
    return "insert";
  }

  return baseMode;
}

function attachVimModeListener(view: EditorView): void {
  const cm = getCM(view);
  if (!cm) return;

  const key = cm as unknown as object;
  if (boundModeListeners.has(key)) {
    return;
  }

  cm.on("vim-mode-change", (payload: VimModePayload) => {
    dispatchOOEvent("oo:vim-mode-change", {
      mode: normalizeModeForEvent(payload),
    });
  });

  cm.on("dialog", () => {
    const hasDialog = !!(cm as unknown as { state?: { dialog?: unknown } }).state?.dialog;
    dispatchOOEvent("oo:vim-mode-change", {
      mode: hasDialog ? "command" : "normal",
    });
  });

  boundModeListeners.add(key);
}

export function toggleVimMode(view: EditorView, enabled: boolean): void {
  const extension: Extension = enabled ? vim() : [];
  view.dispatch({
    effects: vimCompartment.reconfigure(extension),
  });

  if (enabled) {
    // Vim plugin initializes with this dispatch. Defer listener hookup a tick.
    queueMicrotask(() => {
      attachVimModeListener(view);
    });
  }

  if (!enabled) {
    dispatchOOEvent("oo:vim-mode-change", { mode: "INSERT" });
  }
}

registerOOCommands();
