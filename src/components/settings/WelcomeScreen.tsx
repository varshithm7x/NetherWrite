/**
 * Welcome Screen
 *
 * Displayed when no vault is selected. Provides vault opening
 * and a polished first-use experience.
 */

import React, { useEffect, useRef, useState } from "react";
import { FolderOpen, Plus, X } from "lucide-react";
import { Theme } from "../../types";
import { isDarkTheme, vaultName } from "../../utils/helpers";
import type { AppSettings } from "./SettingsPage";

export type VaultEntryAction = "open" | "create";
export type VaultEntryTransitionPhase = "idle" | "transitioning" | "entered";


interface WelcomeScreenProps {
  onOpenVault: (action: VaultEntryAction) => void;
  currentVaultPath?: string | null;
  previouslyOpenedVaults?: string[];
  onSwitchVault?: (path: string) => Promise<boolean>;
  onRemoveVaultFromList?: (path: string) => Promise<void>;
  transitionPhase?: VaultEntryTransitionPhase;
  theme?: Theme;
  settings?: AppSettings;
}

export function WelcomeScreen({
  onOpenVault,
  currentVaultPath = null,
  previouslyOpenedVaults = [],
  onSwitchVault,
  onRemoveVaultFromList,
  transitionPhase = "idle",
  theme = "dark",
  settings,
}: WelcomeScreenProps) {
  const [pressedAction, setPressedAction] = useState<VaultEntryAction | null>(null);
  const [switchingPath, setSwitchingPath] = useState<string | null>(null);
  const pressTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const screenRef = useRef<HTMLDivElement>(null);
  const isDark = isDarkTheme(theme, settings);

  useEffect(() => {
    return () => {
      if (pressTimerRef.current) {
        clearTimeout(pressTimerRef.current);
      }
    };
  }, []);

  const actionsDisabled = transitionPhase !== "idle";

  const handleAction = (action: VaultEntryAction) => {
    if (actionsDisabled) return;

    setPressedAction(action);
    if (pressTimerRef.current) {
      clearTimeout(pressTimerRef.current);
    }
    pressTimerRef.current = setTimeout(() => {
      setPressedAction(null);
      pressTimerRef.current = null;
    }, 140);

    onOpenVault(action);
  };

  const recentVaults = previouslyOpenedVaults
     .filter((path) => path !== currentVaultPath)
     .slice(0, 5);

  const handleOpenRecent = async (path: string) => {
    if (actionsDisabled || switchingPath || !onSwitchVault) return;
    setSwitchingPath(path);
    try {
       await onSwitchVault(path);
    } finally {
      setSwitchingPath(null);
    }
  };

  const handleRemoveRecent = async (
    event: React.MouseEvent,
    path: string,
  ) => {
    event.stopPropagation();
    if (actionsDisabled || !onRemoveVaultFromList) return;
   await onRemoveVaultFromList(path);
  };

  return (
    <div className="flex flex-col items-center justify-center h-full w-full bg-(--bg-primary) text-(--text-primary) select-none" ref={screenRef} data-transition-phase={transitionPhase}>
      <div className={`mb-6 flex items-center justify-center p-3.5 rounded-2xl shadow-sm border ${isDark ? "bg-[#18181b] border-neutral-800/80" : "bg-white border-neutral-200/60"} h-24 w-24`}>
        <img
          src={isDark ? "logos/logo-dark.png" : "logos/logo-light.png"}
          alt="NetherWrite Logo"
          className="w-full h-full object-contain"
        />
      </div>
      <h1 className="text-3xl font-bold tracking-tight mb-2 text-(--text-primary)">NetherWrite</h1>
      <p className="text-sm text-(--text-secondary) text-center max-w-[360px] leading-relaxed mb-8">
        Your local-first knowledge base. Create, link, and visualize your
        thoughts as an interconnected graph.
      </p>
      <div className="flex items-center gap-4">
        <button
          className={`inline-flex items-center gap-2 px-6 py-3 text-base font-semibold rounded-lg bg-(--accent-primary) text-(--text-on-accent) border border-(--accent-primary) cursor-pointer transition-all duration-150 hover:bg-(--accent-secondary) hover:border-(--accent-secondary) disabled:opacity-50 disabled:cursor-not-allowed ${pressedAction === "open" ? "scale-95" : ""}`}
          onClick={() => handleAction("open")}
          disabled={actionsDisabled}
        >
          <FolderOpen size={18} strokeWidth={2} /> Open Vault
        </button>
        <button
          className={`inline-flex items-center gap-2 px-6 py-3 text-base font-semibold rounded-lg bg-(--bg-secondary) text-(--text-primary) border border-(--border-subtle) cursor-pointer transition-all duration-150 hover:bg-(--bg-hover) hover:border-(--border-medium) disabled:opacity-50 disabled:cursor-not-allowed ${pressedAction === "create" ? "scale-95" : ""}`}
          onClick={() => handleAction("create")}
          disabled={actionsDisabled}
        >
          <Plus size={18} strokeWidth={2} /> Create Vault
        </button>
      </div>
  {recentVaults.length > 0 && (
          <div className="mt-10 w-full max-w-[420px] flex flex-col gap-1.5">
            <span className="text-xs font-medium uppercase tracking-wide text-(--text-secondary) px-1 mb-1">
              Recent
            </span>
            {recentVaults.map((path) => (
              <div
                key={path}
                className="group flex items-center gap-2 px-3 py-2 rounded-lg border border-(--border-subtle) bg-(--bg-secondary) hover:bg-(--bg-hover) hover:border-(--border-medium) transition-colors duration-150"
              >
                <button
                  type="button"
                  className="flex-1 min-w-0 flex flex-col items-start text-left cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                  onClick={() => void handleOpenRecent(path)}
                  disabled={actionsDisabled || switchingPath === path}
                title={path}
                >
                  <span className="text-sm font-medium text-(--text-primary) truncate w-full">
                  {switchingPath === path ? "Opening..." : vaultName(path)}
                  </span>
                  <span className="text-xs text-(--text-secondary) truncate w-full">
                    {path}
                  </span>
                </button>
                <button
                type="button"
                  className="opacity-0 group-hover:opacity-100 p-1 rounded text-(--text-secondary) hover:text-(--text-primary) hover:bg-(--bg-tertiary) transition-all duration-150 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                  aria-label={`Remove ${vaultName(path)} from recent vaults`}
                  onClick={(event) => void handleRemoveRecent(event, path)}
                  disabled={actionsDisabled}
                >
                  <X size={14} strokeWidth={2} />
                </button>
              </div>
            ))}
          </div>
      )}
    </div>
  );
}
