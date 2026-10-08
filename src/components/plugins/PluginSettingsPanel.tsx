/**
 * Plugin Settings Panel — Enhanced
 *
 * Plugin manager UI within Settings with:
 * - Enable/disable toggles with permission flow
 * - Error badges & load time display
 * - Debug section (logs, errors, reload)
 * - Version compatibility warnings
 */

import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  AlertTriangle,
  ExternalLink,
  ChevronDown,
  ChevronRight,
  Clock,
  Bug,
  RotateCw,
  ShieldAlert,
  AlertCircle,
  Terminal,
  Trash2,
} from 'lucide-react';
import type { PluginRegistration, PluginSettingTabRegistration } from '../../types/plugin';
import { pluginLogStore, pluginErrorTracker, isVersionCompatible } from '../../lib/pluginDevTools';
import type { PluginLogEntry, PluginErrorRecord } from '../../lib/pluginDevTools';

const APP_VERSION = '1.13.1';

const panelClass = 'plugin-settings-panel';
const settingCardClass =
  'flex items-center justify-between gap-6 border-b border-[var(--divider-color)] py-4 last:border-b-0';
const settingInfoClass = 'flex min-w-0 flex-1 flex-col gap-1 pr-6';
const settingTitleClass = 'text-sm font-medium text-[var(--text-primary)]';
const settingDescriptionClass = 'mt-1 text-[12px] leading-[1.45] text-[var(--text-muted)]';
const iconButtonClass =
  'flex h-7 w-7 shrink-0 cursor-pointer items-center justify-center rounded border-0 bg-transparent text-[var(--text-muted)] transition-colors duration-150 hover:bg-[var(--bg-hover)] hover:text-[var(--text-primary)] disabled:cursor-not-allowed disabled:opacity-35';
const iconButtonActiveClass = 'bg-[var(--bg-active)] text-[var(--color-accent)]';
const iconButtonDangerClass = 'text-[#ef4444] hover:bg-[rgba(239,68,68,0.08)] hover:text-[#f87171]';
const pluginListClass = 'flex flex-col';
const pluginRowClass = 'border-b border-[var(--divider-color)] last:border-b-0';
const pluginMainRowClass = 'grid grid-cols-[18px_minmax(0,1fr)_auto] items-center gap-2.5 py-3.5';
const pluginExpandButtonClass =
  'flex h-6 w-5 cursor-pointer items-center justify-center rounded border-0 bg-transparent text-[var(--text-muted)] transition-colors duration-150 hover:bg-[var(--bg-hover)] hover:text-[var(--text-primary)] disabled:cursor-default disabled:hover:bg-transparent';
const pluginNameLineClass = 'flex min-w-0 flex-wrap items-center gap-x-2 gap-y-1';
const pluginMetaLineClass =
  'mt-1 flex min-w-0 flex-wrap items-center gap-x-2 gap-y-1 text-[11px] leading-[1.35] text-[var(--text-faint,var(--text-muted))]';
const pluginBadgeClass =
  'inline-flex items-center gap-1 rounded-full px-1.5 py-[1px] text-[10px] font-medium leading-4';
const pluginToggleClass =
  'relative h-5 w-[38px] shrink-0 cursor-pointer rounded-full border border-[var(--border-medium)] bg-[var(--bg-tertiary)] transition-colors duration-[250ms] disabled:cursor-not-allowed disabled:opacity-40';
const pluginToggleEnabledClass = 'border-[var(--color-accent-1)] bg-[var(--color-accent)]';
const pluginToggleKnobClass =
  'absolute bottom-0.5 left-0.5 h-3.5 w-3.5 rounded-full bg-white shadow-[0_1px_3px_rgba(0,0,0,0.15)] transition-transform duration-[250ms]';

function cx(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(' ');
}

interface PluginSettingsPanelProps {
  plugins: PluginRegistration[];
  settingTabs: PluginSettingTabRegistration[];
  onEnablePlugin: (pluginId: string) => Promise<void>;
  onDisablePlugin: (pluginId: string) => Promise<void>;
  onRefresh: () => Promise<void>;
  onReloadPlugin?: (pluginId: string) => Promise<void>;
  onUninstallPlugin?: (pluginId: string) => Promise<boolean>;
  onInstallPlugin?: (repo: string, pluginId: string, version?: string) => Promise<boolean>;
  onBrowse?: () => void;
}

export function PluginSettingsPanel({
  plugins,
  settingTabs,
  onEnablePlugin,
  onDisablePlugin,
  onReloadPlugin,
  onUninstallPlugin,
}: PluginSettingsPanelProps) {
  const [loading, setLoading] = useState<string | null>(null);
  const [expandedPlugin, setExpandedPlugin] = useState<string | null>(null);
  const [debugPlugin, setDebugPlugin] = useState<string | null>(null);
  const [debugLogs, setDebugLogs] = useState<PluginLogEntry[]>([]);
  const [debugErrors, setDebugErrors] = useState<PluginErrorRecord[]>([]);
  const settingsContainerRef = useRef<Map<string, HTMLDivElement>>(new Map());

  const handleToggle = useCallback(async (pluginId: string, currentState: string) => {
    setLoading(pluginId);
    try {
      if (currentState === 'enabled') {
        await onDisablePlugin(pluginId);
      } else {
        await onEnablePlugin(pluginId);
      }
    } catch (e) {
      console.error('Failed to toggle plugin:', e);
    }
    setLoading(null);
  }, [onEnablePlugin, onDisablePlugin]);

  const handleExpand = useCallback((pluginId: string) => {
    setExpandedPlugin(prev => prev === pluginId ? null : pluginId);
  }, []);

  const handleDebugToggle = useCallback((pluginId: string) => {
    if (debugPlugin === pluginId) {
      setDebugPlugin(null);
    } else {
      setDebugPlugin(pluginId);
      setDebugLogs(pluginLogStore.getPluginLogs(pluginId));
      setDebugErrors(pluginErrorTracker.getErrors(pluginId));
    }
  }, [debugPlugin]);

  const handleReload = useCallback(async (pluginId: string) => {
    if (!onReloadPlugin) return;
    setLoading(pluginId);
    try {
      await onReloadPlugin(pluginId);
    } catch (e) {
      console.error('Failed to reload plugin:', e);
    }
    setLoading(null);
  }, [onReloadPlugin]);

  const handleUninstall = useCallback(async (pluginId: string, pluginName: string) => {
    if (!onUninstallPlugin || !window.confirm(`Remove ${pluginName}? Its plugin files and settings will be deleted.`)) return;
    setLoading(pluginId);
    try {
      await onUninstallPlugin(pluginId);
      setExpandedPlugin((current) => current === pluginId ? null : current);
      setDebugPlugin((current) => current === pluginId ? null : current);
    } catch (error) {
      console.error('Failed to remove plugin:', error);
    } finally {
      setLoading(null);
    }
  }, [onUninstallPlugin]);

  // Mount plugin setting tabs when expanded
  useEffect(() => {
    if (!expandedPlugin) return;
    const tab = settingTabs.find(t => t.pluginId === expandedPlugin);
    if (!tab) return;
    const container = settingsContainerRef.current.get(expandedPlugin);
    if (!container) return;

    container.innerHTML = '';
    tab.tab.containerEl = container;
    try {
      tab.tab.display();
    } catch (e) {
      console.error(`[Plugin Settings] Error rendering settings for ${expandedPlugin}:`, e);
      container.innerHTML = '<p style="color: var(--text-muted);">Failed to render plugin settings.</p>';
    }
  }, [expandedPlugin, settingTabs]);

  // Refresh debug logs periodically
  useEffect(() => {
    if (!debugPlugin) return;
    const interval = setInterval(() => {
      setDebugLogs(pluginLogStore.getPluginLogs(debugPlugin));
      setDebugErrors(pluginErrorTracker.getErrors(debugPlugin));
    }, 2000);
    return () => clearInterval(interval);
  }, [debugPlugin]);

  return (
    <div className={panelClass}>
      {plugins.length === 0 ? (
        <div className={settingCardClass}>
          <div className={settingInfoClass}>
            <div className={settingTitleClass}>No plugins installed</div>
            <div className={settingDescriptionClass}>
              Install plugins from the marketplace or place plugin folders containing manifest.json and main.js in{' '}
              <code className="rounded bg-[var(--bg-hover)] px-1.5 py-0.5 text-[11px] text-[var(--text-secondary)]">
                .netherwrite/plugins/
              </code>
            </div>
          </div>
        </div>
      ) : (
        <div className={pluginListClass}>
          {plugins.map((plugin) => {
            const isEnabled = plugin.state === 'enabled';
            const isErrored = plugin.state === 'errored';
            const isLoading = loading === plugin.manifest.id || plugin.state === 'loading';
            const hasSettings = settingTabs.some(t => t.pluginId === plugin.manifest.id);
            const isExpanded = expandedPlugin === plugin.manifest.id;
            const isDebugging = debugPlugin === plugin.manifest.id;
            const errorCount = plugin.errorCount || pluginErrorTracker.getErrorCount(plugin.manifest.id);

            // Version compatibility
            const versionOk = !plugin.manifest.minAppVersion ||
              isVersionCompatible(plugin.manifest.minAppVersion, APP_VERSION);

            return (
              <div key={plugin.manifest.id} className={pluginRowClass}>
                <div className={pluginMainRowClass}>
                  <button
                    className={pluginExpandButtonClass}
                    onClick={() => handleExpand(plugin.manifest.id)}
                    disabled={!hasSettings}
                    title={hasSettings ? 'Show plugin settings' : 'No settings available'}
                    aria-label={hasSettings ? `${plugin.manifest.name} settings` : `${plugin.manifest.name} has no settings`}
                    aria-expanded={isExpanded}
                  >
                    {isExpanded ? <ChevronDown size={15} /> : <ChevronRight size={15} />}
                  </button>

                  <div className="min-w-0">
                    <div className={pluginNameLineClass}>
                      <span className="truncate text-[13.5px] font-medium text-[var(--text-primary)]">
                        {plugin.manifest.name}
                      </span>
                      <span className="text-[11px] text-[var(--text-muted)] opacity-70">
                        v{plugin.manifest.version}
                      </span>

                      {isEnabled && plugin.loadTimeMs != null && (
                        <span
                          className={cx(
                            pluginBadgeClass,
                            plugin.loadTimeMs > 2000
                              ? 'bg-[rgba(245,158,11,0.12)] text-[#f59e0b]'
                              : 'bg-[var(--bg-tertiary)] text-[var(--text-muted)]',
                          )}
                        >
                          <Clock size={10} /> {plugin.loadTimeMs}ms
                        </span>
                      )}

                      {errorCount > 0 && (
                        <span className={cx(pluginBadgeClass, 'bg-[rgba(239,68,68,0.14)] text-[#ef4444]')}>
                          <AlertCircle size={10} /> {errorCount}
                        </span>
                      )}

                      {!versionOk && (
                        <span className={cx(pluginBadgeClass, 'bg-[rgba(245,158,11,0.14)] text-[#f59e0b]')}>
                          <ShieldAlert size={10} /> Incompatible
                        </span>
                      )}
                    </div>

                    <div className="mt-1 text-[12px] leading-[1.45] text-[var(--text-muted)]">
                      {plugin.manifest.description}
                    </div>
                    <div className={pluginMetaLineClass}>
                      <span>by {plugin.manifest.author}</span>
                      {plugin.manifest.authorUrl && (
                        <a
                          href={plugin.manifest.authorUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center text-[var(--text-link)]"
                          title="Open author website"
                        >
                          <ExternalLink size={10} />
                        </a>
                      )}
                    </div>

                    {isErrored && (
                      <div className="mt-1 flex items-center gap-1 text-[11px] text-[#ef4444]">
                        <AlertTriangle size={12} />
                        {plugin.error || 'Failed to load'}
                      </div>
                    )}
                  </div>

                  <div className="flex shrink-0 items-center gap-1.5">
                    <button
                      className={cx(iconButtonClass, isDebugging && iconButtonActiveClass)}
                      onClick={() => handleDebugToggle(plugin.manifest.id)}
                      title="Debug"
                      aria-label={`Debug ${plugin.manifest.name}`}
                    >
                      <Bug size={14} />
                    </button>

                    {isEnabled && onReloadPlugin && (
                      <button
                        className={iconButtonClass}
                        onClick={() => handleReload(plugin.manifest.id)}
                        title="Reload plugin"
                        disabled={isLoading}
                        aria-label={`Reload ${plugin.manifest.name}`}
                      >
                        <RotateCw size={14} />
                      </button>
                    )}

                    {onUninstallPlugin && (
                      <button
                        className={cx(iconButtonClass, iconButtonDangerClass)}
                        onClick={() => void handleUninstall(plugin.manifest.id, plugin.manifest.name)}
                        title="Remove plugin"
                        disabled={isLoading}
                        aria-label={`Remove ${plugin.manifest.name}`}
                      >
                        <Trash2 size={14} />
                      </button>
                    )}

                    <button
                      className={cx(pluginToggleClass, isEnabled && pluginToggleEnabledClass)}
                      onClick={() => !isLoading && versionOk && handleToggle(plugin.manifest.id, plugin.state)}
                      disabled={isLoading || !versionOk}
                      role="switch"
                      aria-checked={isEnabled}
                      aria-label={`${isEnabled ? 'Disable' : 'Enable'} ${plugin.manifest.name}`}
                    >
                      <span className={cx(pluginToggleKnobClass, isEnabled && 'translate-x-[18px]')} />
                    </button>
                  </div>
                </div>

                {isExpanded && hasSettings && isEnabled && (
                  <div
                    ref={(el) => {
                      if (el) settingsContainerRef.current.set(plugin.manifest.id, el);
                    }}
                    className="border-t border-[var(--border-subtle)] pb-4 pl-7 pt-3"
                  />
                )}

                {isDebugging && (
                  <div className="border-t border-[var(--border-subtle)] bg-[var(--bg-secondary)] px-7 py-4">
                    <div className="mb-2.5 flex items-center gap-1.5 text-[12px] font-semibold text-[var(--text-secondary)]">
                      <Terminal size={12} /> Debug Console
                    </div>

                    {debugErrors.length > 0 && (
                      <div style={{ marginBottom: '10px' }}>
                        <div style={{ fontSize: '11px', fontWeight: 600, color: '#ef4444', marginBottom: '4px' }}>
                          Errors ({debugErrors.length})
                        </div>
                        <div style={{
                          maxHeight: '100px',
                          overflow: 'auto',
                          background: 'rgba(239,68,68,0.05)',
                          borderRadius: '6px',
                          padding: '6px 8px',
                        }}>
                          {debugErrors.slice(-5).map((err, i) => (
                            <div key={i} style={{
                              fontSize: '11px',
                              color: '#fca5a5',
                              fontFamily: 'monospace',
                              padding: '2px 0',
                              borderBottom: i < debugErrors.length - 1 ? '1px solid rgba(255,255,255,0.03)' : 'none',
                            }}>
                              <span style={{ opacity: 0.5 }}>[{new Date(err.timestamp).toLocaleTimeString()}]</span>{' '}
                              <span style={{ color: '#f87171' }}>[{err.context}]</span>{' '}
                              {err.error}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Logs */}
                    <div>
                      <div style={{ fontSize: '11px', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '4px' }}>
                        Logs ({debugLogs.length})
                      </div>
                      <div style={{
                        maxHeight: '150px',
                        overflow: 'auto',
                        background: 'rgba(0,0,0,0.2)',
                        borderRadius: '6px',
                        padding: '6px 8px',
                        fontFamily: 'monospace',
                        fontSize: '11px',
                      }}>
                        {debugLogs.length === 0 ? (
                          <span style={{ color: 'var(--text-muted)', opacity: 0.5 }}>No logs yet</span>
                        ) : (
                          debugLogs.slice(-20).map((log, i) => (
                            <div key={i} style={{
                              padding: '1px 0',
                              color: log.level === 'error' ? '#f87171'
                                : log.level === 'warn' ? '#fbbf24'
                                : 'var(--text-secondary)',
                            }}>
                              <span style={{ opacity: 0.4 }}>{new Date(log.timestamp).toLocaleTimeString()}</span>{' '}
                              <span style={{
                                color: log.level === 'error' ? '#ef4444' : log.level === 'warn' ? '#f59e0b' : '#6b7280',
                                fontWeight: 600,
                              }}>
                                {log.level.toUpperCase().padEnd(5)}
                              </span>{' '}
                              {log.message}
                            </div>
                          ))
                        )}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
