/**
 * Obsidian API Compatibility — Barrel Export
 *
 * This module is what plugins receive when they `require('obsidian')`.
 * It re-exports all public Obsidian API classes and functions.
 */

// ── DOM Extensions (must be first — patches HTMLElement.prototype) ──
import './dom-extensions';
import { normalizePath, Scope, setIcon } from './utils';
import { marked } from 'marked';

// ── File System ─────────────────────────────────────
export { TAbstractFile, TFile, TFolder } from './files';
export type { FileStats } from './files';

// ── Core Components ─────────────────────────────────
export {
  Events,
  Component,
  Notice,
  Modal,
  Setting,
  SettingTab,
  PluginSettingTab,
  Menu,
  MenuItem,
  // UI Widgets
  ButtonComponent,
  TextComponent,
  TextAreaComponent,
  ToggleComponent,
  DropdownComponent,
  SliderComponent,
  SearchComponent,
  ExtraButtonComponent,
  ColorComponent,
  // Suggest Modals
  SuggestModal,
  FuzzySuggestModal,
  AbstractInputSuggest,
} from './components';
export type { EventRef } from './components';

// ── Plugin ──────────────────────────────────────────
export { Plugin } from './plugin';

// ── App ─────────────────────────────────────────────
export { OOApp as App } from './app';

// ── Vault ───────────────────────────────────────────
export { OOVault as Vault } from './vault';
import { applyPreferredTrash } from './vault';

// ── Workspace & Views ───────────────────────────────
export {
  OOWorkspace as Workspace,
  WorkspaceLeaf,
  View,
  ItemView,
  MarkdownView,
  FileView,
  EditableFileView,
  TextFileView,
} from './workspace';

// ── Metadata ────────────────────────────────────────
export { OOMetadataCache as MetadataCache } from './metadata';
export type { CachedMetadata } from './metadata';

// ── Utilities ───────────────────────────────────────
export {
  normalizePath,
  parseYaml,
  stringifyYaml,
  addIcon,
  removeIcon,
  setIcon,
  setTooltip,
  requestUrl,
  request,
  Platform,
  Scope,
  debounce,
  sanitizeHTMLToDom,
  htmlToMarkdown,
  prepareFuzzySearch,
  prepareSimpleSearch,
  renderMatches,
  renderResults,
  sortSearchResults,
  requireApiVersion,
  getLinkpath,
  stripHeading,
  stripHeadingForLink,
} from './utils';

// ── Type re-exports for compatibility ───────────────
export type { PluginManifest } from '../../types/plugin';

// ── Stubs for less-used APIs ────────────────────────

// MarkdownRenderChild — very commonly extended by rendering plugins (Dataview, etc.)
export class MarkdownRenderChild extends Component {
  containerEl: HTMLElement;
  constructor(containerEl: HTMLElement) {
    super();
    this.containerEl = containerEl;
  }
}

export class MarkdownRenderer extends MarkdownRenderChild {
  app: any;
  hoverPopover: any = null;
  get file(): any { return null; }
  static async render(app: any, markdown: string, el: any, sourcePath: string, component: any): Promise<void> {
    const container = document.createElement('div');
    container.className = 'markdown-rendered';
    container.innerHTML = marked.parse(markdown, { async: false, breaks: true }) as string;
    for (const link of Array.from(container.querySelectorAll('a'))) {
      const href = link.getAttribute('href') || '';
      if (!href || /^(https?:|mailto:|#)/i.test(href)) continue;
      link.classList.add('internal-link');
      link.setAttribute('data-href', decodeURIComponent(href.replace(/\.md$/i, '')));
    }
    const cleanup = await runMarkdownPostProcessors(container, sourcePath);
    component?.register?.(cleanup);
    if (typeof Node !== 'undefined' && el instanceof Node) {
      while (container.firstChild) el.appendChild(container.firstChild);
    } else {
      // Export plugins use a capture target and inspect the rendered
      // element's HTMLCollection before moving its children elsewhere.
      el.appendChild(container);
    }
  }
  static renderMarkdown = MarkdownRenderer.render;
  static async postProcess(app: any, context: any): Promise<void> {
    const container = context?.containerEl || context?.el;
    if (!container) return;
    const cleanup = await runMarkdownPostProcessors(container, context.sourcePath || '');
    context?.addChild?.({
      load() {},
      unload: cleanup,
    });
    if (Array.isArray(context?.promises)) await Promise.all(context.promises);
  }
}

export class MarkdownPreviewView {
  static renderMarkdownToContainer(el: HTMLElement, markdown: string, sourcePath: string, component: any): void {
    MarkdownRenderer.render(null, markdown, el, sourcePath, component);
  }
}

export class MarkdownPreviewRenderer {
  private static registrations = new Map<any, () => void>();
  static registerPostProcessor(postProcessor: any, sortOrder?: number): void {
    this.unregisterPostProcessor(postProcessor);
    this.registrations.set(
      postProcessor,
      registerMarkdownPostProcessor('global', postProcessor, sortOrder),
    );
  }
  static unregisterPostProcessor(postProcessor: any): void {
    this.registrations.get(postProcessor)?.();
    this.registrations.delete(postProcessor);
  }
}

import type { WorkspaceLeaf, View } from './workspace';
import {
  ButtonComponent,
  Component,
  Events,
  ExtraButtonComponent,
  Modal,
  SearchComponent,
  Setting,
} from './components';
import { TFile, TFolder, TAbstractFile } from './files';
import { registerMarkdownPostProcessor, runMarkdownPostProcessors } from './markdown';

// ── FileSystemAdapter (obsidian-git uses instanceof checks) ──
export class FileSystemAdapter {
  basePath: string;
  constructor() {
    this.basePath = (window as any).__oo_vault_path || '';
  }
  getBasePath(): string { return this.basePath; }
  getName(): string { return this.basePath.split('/').pop() || 'Vault'; }
  private get delegate(): any { return (window as any).__oo_app?.vault?.adapter; }
  async read(path: string): Promise<string> { return this.delegate?.read(path) ?? ''; }
  async write(path: string, data: string, options?: any): Promise<void> { await this.delegate?.write(path, data, options); }
  async exists(path: string, sensitive?: boolean): Promise<boolean> { return !!(await this.delegate?.exists(path, sensitive)); }
  async stat(path: string): Promise<any> { return this.delegate?.stat(path) ?? null; }
  async list(path: string): Promise<{ files: string[]; folders: string[] }> {
    return this.delegate?.list(path) ?? { files: [], folders: [] };
  }
  async mkdir(path: string): Promise<void> { await this.delegate?.mkdir(path); }
  async rmdir(path: string, recursive: boolean): Promise<void> { await this.delegate?.rmdir?.(path, recursive); }
  async remove(path: string): Promise<void> { await this.delegate?.remove(path); }
  async rename(from: string, to: string): Promise<void> { await this.delegate?.rename(from, to); }
  async copy(from: string, to: string): Promise<void> { await this.delegate?.copy?.(from, to); }
  async append(path: string, data: string, options?: any): Promise<void> { await this.delegate?.append(path, data, options); }
  async process(path: string, fn: (data: string) => string, options?: any): Promise<string> {
    const next = fn(await this.read(path));
    await this.write(path, next, options);
    return next;
  }
  async readBinary(path: string): Promise<ArrayBuffer> {
    if (this.delegate?.readBinary) return this.delegate.readBinary(path);
    return new TextEncoder().encode(await this.read(path)).buffer;
  }
  async writeBinary(path: string, data: ArrayBuffer, options?: any): Promise<void> {
    if (this.delegate?.writeBinary) return this.delegate.writeBinary(path, data, options);
    await this.write(path, new TextDecoder().decode(data), options);
  }
  async appendBinary(path: string, data: ArrayBuffer, options?: any): Promise<void> {
    const current = new Uint8Array(await this.readBinary(path));
    const addition = new Uint8Array(data);
    const combined = new Uint8Array(current.length + addition.length);
    combined.set(current);
    combined.set(addition, current.length);
    await this.writeBinary(path, combined.buffer, options);
  }
  getResourcePath(path: string): string { return `app://local${this.basePath}/${path}`; }
  getFilePath(path: string): string { return `${this.basePath}/${normalizePath(path)}`; }
  getFullPath(path: string): string { return this.getFilePath(path); }
  async readLocalFile(path: string): Promise<ArrayBuffer> { return this.readBinary(path); }
  async trashLocal(path: string): Promise<void> {
    if (this.delegate?.trashLocal) {
      await this.delegate.trashLocal(path);
      return;
    }
    await (window as any).__oo_app?.vault?.adapter?.trashLocal?.(path);
  }
  async trashSystem(path: string): Promise<boolean> {
    if (this.delegate?.trashSystem) {
      return !!(await this.delegate.trashSystem(path));
    }
    return !!(await (window as any).__oo_app?.vault?.adapter?.trashSystem?.(path));
  }
}

// ── Keymap (obsidian-git uses Keymap.isModifier) ──
export class Keymap {
  static isModifier(evt: KeyboardEvent, modifier: string): boolean {
    switch (modifier) {
      case 'Mod': return evt.ctrlKey || evt.metaKey;
      case 'Ctrl': return evt.ctrlKey;
      case 'Meta': return evt.metaKey;
      case 'Shift': return evt.shiftKey;
      case 'Alt': return evt.altKey;
      default: return false;
    }
  }
  static isModEvent(evt?: MouseEvent | KeyboardEvent | null): boolean | 'tab' {
    if (!evt) return false;
    if ((evt as KeyboardEvent).ctrlKey || (evt as KeyboardEvent).metaKey) return 'tab';
    return false;
  }
}

// ── PopoverSuggest (base for AbstractInputSuggest in some plugin patterns) ──
function _PopoverSuggest(this: any, app: any, scope?: any) {
  this.app = app || (window as any).__oo_app;
  this.scope = scope || null;
}
_PopoverSuggest.prototype.open = function() {};
_PopoverSuggest.prototype.close = function() {};
_PopoverSuggest.prototype.renderSuggestion = function(value: any, el: HTMLElement) {};
_PopoverSuggest.prototype.selectSuggestion = function(value: any, evt: any) {};
export const PopoverSuggest = _PopoverSuggest as any;

// ── parseFrontMatterTags (calendar-beta uses this) ──
export function parseFrontMatterTags(frontmatter: any): string[] | null {
  if (!frontmatter) return null;
  const tags = frontmatter.tags || frontmatter.tag;
  if (!tags) return null;
  if (Array.isArray(tags)) return tags.map((t: string) => t.startsWith('#') ? t : `#${t}`);
  if (typeof tags === 'string') return tags.split(/[,\s]+/).filter(Boolean).map((t: string) => t.startsWith('#') ? t : `#${t}`);
  return null;
}

// ── parseFrontMatterAliases ──
export function parseFrontMatterAliases(frontmatter: any): string[] | null {
  if (!frontmatter) return null;
  const aliases = frontmatter.aliases || frontmatter.alias;
  if (!aliases) return null;
  if (Array.isArray(aliases)) return aliases;
  if (typeof aliases === 'string') return aliases.split(/[,\s]+/).filter(Boolean);
  return null;
}

// ── parseFrontMatterStringArray ──
export function parseFrontMatterStringArray(frontmatter: any, key: string): string[] | null {
  if (!frontmatter || !frontmatter[key]) return null;
  const val = frontmatter[key];
  if (Array.isArray(val)) return val;
  if (typeof val === 'string') return val.split(/[,\s]+/).filter(Boolean);
  return null;
}

// ── parseFrontMatterEntry ──
export function parseFrontMatterEntry(frontmatter: any, key: string): any {
  if (!frontmatter) return null;
  return frontmatter[key] ?? null;
}

export type ViewCreator = (leaf: WorkspaceLeaf) => View;
export type PaneType = 'tab' | 'split' | 'window';
export type SplitDirection = 'vertical' | 'horizontal';
export type IconName = string;
export type Modifier = 'Mod' | 'Ctrl' | 'Meta' | 'Shift' | 'Alt';

// ── Editor stub ─────────────────────────────────────
export interface EditorPosition { line: number; ch: number; }
export interface EditorRange { from: EditorPosition; to: EditorPosition; }

// CM6 StateField stubs — plugins like obsidian-git import these
import { EditorSelection as CMEditorSelection, StateEffect, StateField } from '@codemirror/state';
export const setEditorInfoEffect: any = StateEffect.define<any>();
export const setEditorEditorEffect: any = StateEffect.define<any>();
export const setEditorLivePreviewEffect: any = StateEffect.define<boolean>();
export const editorInfoField: any = StateField.define({
  create: () => {
    const app = (window as any).__oo_app;
    const file = app?.vault?.getFileByPath?.((window as any).__oo_active_file || '') || null;
    return { file, editor: null, node: null, view: null };
  },
  update: (value: any, tr: any) => {
    for (const effect of tr.effects) {
      if (effect.is(setEditorInfoEffect)) return effect.value;
    }
    return value;
  },
});
export const editorEditorField: any = StateField.define({
  create: () => null,
  update: (value: any, tr: any) => {
    for (const effect of tr.effects) {
      if (effect.is(setEditorEditorEffect)) return effect.value;
    }
    return value;
  },
});
export const editorViewField: any = editorInfoField;
export const editorLivePreviewField: any = StateField.define({
  create: () => false,
  update: (value: any, tr: any) => {
    for (const effect of tr.effects) {
      if (effect.is(setEditorLivePreviewEffect)) return effect.value;
    }
    return value;
  },
});

// EditorSuggest — ES5 function constructor for plugin compatibility
function _EditorSuggest(this: any, app: any) {
  Component.call(this);
  this.app = app || (window as any).__oo_app;
  this.context = null;
  this.limit = 100;
  this.scope = new Scope();
  this.suggestEl = document.createElement('div');
  this.suggestEl.className = 'suggestion-container editor-suggest';
  this.suggestEl.style.display = 'none';
  document.body.appendChild(this.suggestEl);
  this.instructions = [];
}
_EditorSuggest.prototype = Object.create(Component.prototype);
_EditorSuggest.prototype.constructor = _EditorSuggest;
_EditorSuggest.prototype.onTrigger = function(cursor: any, editor: any, file: any) { return null; };
_EditorSuggest.prototype.getSuggestions = function(context: any) { return []; };
_EditorSuggest.prototype.renderSuggestion = function(value: any, el: HTMLElement) {};
_EditorSuggest.prototype.selectSuggestion = function(value: any, evt: any) {};
_EditorSuggest.prototype.showSuggestions = function(suggestions: any[] = []) {
  this.suggestions = Array.isArray(suggestions) ? suggestions : [];
  return this.suggestions;
};
_EditorSuggest.prototype.setInstructions = function(instructions: any[]) { this.instructions = instructions; };
_EditorSuggest.prototype.open = function() { this.suggestEl.style.display = 'block'; };
_EditorSuggest.prototype.close = function() { this.suggestEl.style.display = 'none'; };
_EditorSuggest.prototype.updatePosition = function(force?: boolean) {};
_EditorSuggest.prototype.onunload = function() { this.suggestEl.remove(); };

export const EditorSuggest = _EditorSuggest as any;

// ── Editor stub (used by Templater, Dataview, etc.) ──
export class Editor {
  cm: any;
  constructor(cm?: any) { this.cm = cm || null; }
  getDoc(): any { return this; }
  refresh(): void { this.cm?.requestMeasure?.(); }
  getValue(): string { return this.cm?.state?.doc?.toString?.() || ''; }
  setValue(content: string): void {
    if (!this.cm) return;
    this.cm.dispatch({ changes: { from: 0, to: this.cm.state.doc.length, insert: content } });
  }
  getLine(line: number): string {
    if (!this.cm || line < 0 || line >= this.lineCount()) return '';
    return this.cm.state.doc.line(line + 1).text;
  }
  setLine(line: number, text: string): void {
    if (!this.cm || line < 0 || line >= this.lineCount()) return;
    const current = this.cm.state.doc.line(line + 1);
    this.cm.dispatch({ changes: { from: current.from, to: current.to, insert: text } });
  }
  lineCount(): number { return this.cm?.state?.doc?.lines || 0; }
  lastLine(): number { return Math.max(0, this.lineCount() - 1); }
  getSelection(): string {
    if (!this.cm) return '';
    const selection = this.cm.state.selection.main;
    return this.cm.state.sliceDoc(selection.from, selection.to);
  }
  replaceSelection(replacement: string, origin?: string): void {
    if (!this.cm) return;
    const selection = this.cm.state.selection.main;
    this.cm.dispatch({
      changes: { from: selection.from, to: selection.to, insert: replacement },
      selection: { anchor: selection.from + replacement.length },
    });
  }
  replaceRange(replacement: string, from: EditorPosition, to?: EditorPosition, origin?: string): void {
    if (!this.cm) return;
    this.cm.dispatch({
      changes: {
        from: this.posToOffset(from),
        to: this.posToOffset(to || from),
        insert: replacement,
      },
    });
  }
  setCursor(pos: EditorPosition | number, ch?: number): void {
    if (!this.cm) return;
    const position = typeof pos === 'number' ? { line: pos, ch: ch || 0 } : pos;
    this.cm.dispatch({ selection: { anchor: this.posToOffset(position) }, scrollIntoView: true });
  }
  getCursor(side: 'from' | 'to' | 'head' | 'anchor' = 'head'): EditorPosition {
    if (!this.cm) return { line: 0, ch: 0 };
    const selection = this.cm.state.selection.main;
    const offset = side === 'from' ? selection.from
      : side === 'to' ? selection.to
      : side === 'anchor' ? selection.anchor
      : selection.head;
    return this.offsetToPos(offset);
  }
  listSelections(): EditorSelection[] {
    if (!this.cm) return [{ anchor: { line: 0, ch: 0 }, head: { line: 0, ch: 0 } }];
    return this.cm.state.selection.ranges.map((range: any) => ({
      anchor: this.offsetToPos(range.anchor),
      head: this.offsetToPos(range.head),
    }));
  }
  setSelection(anchor: EditorPosition, head?: EditorPosition): void {
    if (!this.cm) return;
    this.cm.dispatch({
      selection: {
        anchor: this.posToOffset(anchor),
        head: this.posToOffset(head || anchor),
      },
    });
  }
  setSelections(ranges: EditorSelectionOrCaret[], main?: number): void {
    const range = ranges[main || 0];
    if (range) this.setSelection(range.anchor, range.head);
  }
  somethingSelected(): boolean { return !!this.cm && !this.cm.state.selection.main.empty; }
  getRange(from: EditorPosition, to: EditorPosition): string {
    return this.cm?.state?.sliceDoc(this.posToOffset(from), this.posToOffset(to)) || '';
  }
  undo(): void {
    if (this.cm) (window as any).__oo_cm_commands?.undo?.(this.cm);
  }
  redo(): void {
    if (this.cm) (window as any).__oo_cm_commands?.redo?.(this.cm);
  }
  exec(command: string): void {
    const handler = (window as any).__oo_cm_commands?.[command];
    if (this.cm && typeof handler === 'function') handler(this.cm);
  }
  transaction(tx: EditorTransaction, origin?: string): void {
    if (!this.cm) return;
    const changes = (tx.changes || []).map((change) => ({
      from: this.posToOffset(change.from),
      to: this.posToOffset(change.to || change.from),
      insert: change.text,
    }));
    const selections = tx.selections || (tx.selection ? [tx.selection] : undefined);
    const selection = selections ? CMEditorSelection.create(
      selections.map((range) => CMEditorSelection.range(
        this.posToOffset(range.from),
        this.posToOffset(range.to || range.from),
      )),
      0,
    ) : undefined;
    if (tx.replaceSelection !== undefined) {
      const current = this.cm.state.selection.main;
      changes.push({ from: current.from, to: current.to, insert: tx.replaceSelection });
    }
    this.cm.dispatch({
      ...(changes.length ? { changes } : {}),
      ...(selection ? { selection } : {}),
    });
  }
  wordAt(pos: EditorPosition): { from: EditorPosition; to: EditorPosition } | null {
    const line = this.getLine(pos.line);
    const matches = Array.from(line.matchAll(/\S+/g));
    const match = matches.find((item) => {
      const start = item.index || 0;
      return pos.ch >= start && pos.ch <= start + item[0].length;
    });
    if (!match) return null;
    const start = match.index || 0;
    return { from: { line: pos.line, ch: start }, to: { line: pos.line, ch: start + match[0].length } };
  }
  posToOffset(pos: EditorPosition): number {
    if (!this.cm || this.lineCount() === 0) return 0;
    const lineNumber = Math.min(Math.max(pos.line + 1, 1), this.cm.state.doc.lines);
    const line = this.cm.state.doc.line(lineNumber);
    return Math.min(line.to, line.from + Math.max(0, pos.ch));
  }
  offsetToPos(offset: number): EditorPosition {
    if (!this.cm || this.lineCount() === 0) return { line: 0, ch: 0 };
    const clamped = Math.min(Math.max(offset, 0), this.cm.state.doc.length);
    const line = this.cm.state.doc.lineAt(clamped);
    return { line: line.number - 1, ch: clamped - line.from };
  }
  focus(): void { this.cm?.focus?.(); }
  blur(): void { (this.cm?.contentDOM as HTMLElement | undefined)?.blur?.(); }
  hasFocus(): boolean { return !!this.cm?.hasFocus; }
  getScrollInfo(): EditorScrollInfo {
    const scroller = this.cm?.scrollDOM;
    return {
      top: scroller?.scrollTop || 0,
      left: scroller?.scrollLeft || 0,
      height: scroller?.scrollHeight || 0,
      width: scroller?.scrollWidth || 0,
      clientHeight: scroller?.clientHeight || 0,
      clientWidth: scroller?.clientWidth || 0,
    };
  }
  scrollTo(x?: number | null, y?: number | null): void {
    this.cm?.scrollDOM?.scrollTo?.(x ?? this.cm.scrollDOM.scrollLeft, y ?? this.cm.scrollDOM.scrollTop);
  }
  scrollIntoView(range: EditorRangeOrCaret, center?: boolean): void {
    if (!this.cm) return;
    const position = this.posToOffset(range.from);
    const effect = (window as any).__oo_cm_editor_view?.scrollIntoView?.(position, { y: center ? 'center' : 'nearest' });
    if (effect) this.cm.dispatch({ effects: effect });
  }
  processLines<T>(
    read: (line: number, lineText: string) => T | null,
    write: (line: number, lineText: string, value: T | null) => EditorChange | void,
    ignoreEmpty?: boolean,
  ): void {
    const values: Array<{ line: number; text: string; value: T | null }> = [];
    for (let line = 0; line < this.lineCount(); line++) {
      const text = this.getLine(line);
      if (ignoreEmpty && !text) continue;
      values.push({ line, text, value: read(line, text) });
    }
    const changes = values
      .map(({ line, text, value }) => write(line, text, value))
      .filter((change): change is EditorChange => !!change);
    if (changes.length) this.transaction({ changes });
  }
}

// ── HoverPopover stub ──
export class HoverPopover {
  state: number = 0; // 0=Hidden, 1=Shown
  hoverEl: HTMLElement;
  constructor(parent: any, targetEl: HTMLElement | null) {
    this.hoverEl = document.createElement('div');
    this.hoverEl.className = 'hover-popover';
  }
  hide(): void { this.state = 0; }
  show(): void { this.state = 1; }
}

// ── MomentFormatComponent stub ──
export class MomentFormatComponent {
  sampleEl: HTMLElement;
  inputEl: HTMLInputElement;
  constructor(containerEl: HTMLElement) {
    this.inputEl = document.createElement('input');
    this.sampleEl = document.createElement('span');
    containerEl.appendChild(this.inputEl);
    containerEl.appendChild(this.sampleEl);
  }
  setDefaultFormat(format: string): this { return this; }
  setValue(value: string): this { this.inputEl.value = value; return this; }
  getValue(): string { return this.inputEl.value; }
  onChange(callback: (value: string) => any): this { return this; }
}

// ── Debouncer type ──
export type Debouncer<T extends unknown[]> = {
  (...args: T): void;
  cancel(): void;
};

// ── Additional type stubs commonly imported ──
export interface ObsidianProtocolData {
  action: string;
  [key: string]: string;
}

export interface MarkdownFileInfo {
  editor?: Editor;
  file?: TFile | null;
}

// Moment.js — real library, required by many plugins (Calendar, etc.)
import momentLib from 'moment';

// Set on window so plugins that use `window.moment` directly work
if (!(window as any).moment) {
  (window as any).moment = momentLib;
}

// Fix for Calendar plugin crash: it reads moment.localeData()._week which can be undefined in some bundler setups
if (!(window as any)._bundledLocaleWeekSpec) {
  (window as any)._bundledLocaleWeekSpec = (momentLib.localeData() as any)._week || { dow: 0, doy: 6 };
}

// Fix for Calendar plugin bug: it tries to find lowercase "sunday" in capitalized moment.weekdays()
// resulting in dow = -1. This breaks moment math and causes "reading 'isSame'" crashes in Svelte views.
const origUpdateLocale = momentLib.updateLocale;
(momentLib as any).updateLocale = function(name: string, config: any) {
  if (config?.week?.dow === -1) {
    config.week.dow = 0;
  }
  return origUpdateLocale.apply(this, arguments as any);
};

export const moment = momentLib;

// ── apiVersion ──────────────────────────────────────
export let apiVersion: string = '1.13.1';

// ── livePreviewState ──
import { ViewPlugin } from '@codemirror/view';
export const livePreviewState: any = ViewPlugin.define(() => ({ decorations: undefined, destroy() {} }));

// ── FileManager (proper class, not inline stub) ──
export class FileManager {
  private _app: any;
  constructor() { this._app = (window as any).__oo_app; }
  getNewFileParent(sourcePath: string, newFilePath?: string): TFolder {
    return this._app?.vault?.getRoot() || new TFolder('/');
  }
  async renameFile(file: TAbstractFile, newPath: string): Promise<void> {
    await this._app?.vault?.rename(file, newPath);
  }
  async promptForDeletion(file: TAbstractFile): Promise<boolean> {
    return confirm(`Delete ${file.path}?`);
  }
  async trashFile(file: TAbstractFile): Promise<void> {
    if (this._app?.vault) await applyPreferredTrash(this._app.vault, file);
  }
  generateMarkdownLink(file: TFile, sourcePath: string, subpath?: string, alias?: string): string {
    const display = alias || file.basename;
    return `[[${file.basename}${subpath || ''}|${display}]]`;
  }
  async processFrontMatter(file: TFile, fn: (frontmatter: any) => void, options?: any): Promise<void> {
    const content = await this._app?.vault?.read(file);
    if (!content) return;
    const fmMatch = content.match(/^---\n([\s\S]*?)\n---/);
    const fm = fmMatch ? parseYaml(fmMatch[1]) : {};
    fn(fm);
    const newFm = stringifyYaml(fm);
    const newContent = fmMatch
      ? content.replace(/^---\n[\s\S]*?\n---/, `---\n${newFm}\n---`)
      : `---\n${newFm}\n---\n${content}`;
    await this._app?.vault?.modify(file, newContent);
  }
  async getAvailablePathForAttachment(filename: string, sourcePath?: string): Promise<string> {
    return this._app?.vault?.getAvailablePathForAttachments?.(filename, sourcePath || '') || filename;
  }
}

import { parseYaml, stringifyYaml } from './utils';

// ── Missing utility functions (from official API) ──

export function getAllTags(cache: any): string[] | null {
  if (!cache) return null;
  const tags: string[] = [];
  if (cache.tags) for (const t of cache.tags) tags.push(t.tag);
  if (cache.frontmatter) {
    const fmTags = parseFrontMatterTags(cache.frontmatter);
    if (fmTags) tags.push(...fmTags);
  }
  return tags.length > 0 ? tags : null;
}

export function parseLinktext(linktext: string): { path: string; subpath: string } {
  const hashIdx = linktext.indexOf('#');
  if (hashIdx < 0) return { path: linktext, subpath: '' };
  return { path: linktext.substring(0, hashIdx), subpath: linktext.substring(hashIdx) };
}

export function arrayBufferToBase64(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  let binary = '';
  for (let i = 0; i < bytes.byteLength; i++) binary += String.fromCharCode(bytes[i]);
  return btoa(binary);
}

export function base64ToArrayBuffer(base64: string): ArrayBuffer {
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  return bytes.buffer;
}

export function arrayBufferToHex(data: ArrayBuffer): string {
  return Array.from(new Uint8Array(data)).map(b => b.toString(16).padStart(2, '0')).join('');
}

export function hexToArrayBuffer(hex: string): ArrayBuffer {
  const bytes = new Uint8Array(hex.length / 2);
  for (let i = 0; i < hex.length; i += 2) bytes[i / 2] = parseInt(hex.substr(i, 2), 16);
  return bytes.buffer;
}

export async function getBlobArrayBuffer(blob: Blob): Promise<ArrayBuffer> {
  return blob.arrayBuffer();
}

export function getFrontMatterInfo(content: string): { exists: boolean; from: number; to: number; frontmatter: string } {
  const match = content.match(/^---\r?\n([\s\S]*?)\r?\n---/);
  if (!match) return { exists: false, from: 0, to: 0, frontmatter: '' };
  return { exists: true, from: 0, to: match[0].length, frontmatter: match[1] };
}

export function getIcon(iconId: string): SVGSVGElement | null {
  const el = document.createElement('div');
  setIcon(el, iconId);
  return el.querySelector('svg') || null;
}

export function getIconIds(): string[] {
  return [];
}

export function resolveSubpath(cache: any, subpath: string): any {
  if (!cache || !subpath) return null;
  if (subpath.startsWith('#^')) {
    const blockId = subpath.substring(2);
    const block = cache.blocks?.[blockId];
    return block ? { type: 'block', block, start: block.position?.start, end: block.position?.end } : null;
  }
  if (subpath.startsWith('#')) {
    const heading = subpath.substring(1);
    const h = cache.headings?.find((h: any) => h.heading === heading);
    return h ? { type: 'heading', current: h, start: h.position?.start } : null;
  }
  return null;
}

export function iterateCacheRefs(cache: any, cb: (ref: any) => void): void {
  if (!cache) return;
  if (cache.links) cache.links.forEach(cb);
  if (cache.embeds) cache.embeds.forEach(cb);
  if (cache.frontmatterLinks) cache.frontmatterLinks.forEach(cb);
}

export function iterateRefs(refs: any[], cb: (ref: any) => void): void {
  if (refs) refs.forEach(cb);
}

export function displayTooltip(el: HTMLElement, text: string, options?: any): void {
  el.dataset.tooltip = text;
  el.removeAttribute("title");
}

// Math/rendering stubs -- safe no-ops
export async function loadMathJax(): Promise<void> {}
export async function loadMermaid(): Promise<void> {}
export async function loadPdfJs(): Promise<any> { return {}; }
export async function loadPrism(): Promise<void> {}
export function renderMath(source: string, display: boolean): HTMLElement {
  const el = document.createElement('span');
  el.textContent = source;
  el.className = display ? 'math math-block' : 'math math-inline';
  return el;
}
export async function finishRenderMath(): Promise<void> {}

export function getLanguage(): string {
  return navigator.language || 'en';
}

export function parsePropertyId(propertyId: string): any {
  return { name: propertyId, type: 'text' };
}

// ── Workspace hierarchy stubs ──
// These classes form the workspace DOM tree. Plugins do instanceof checks.

export class WorkspaceItem extends Events {
  parent: any = null;
  getRoot(): WorkspaceItem { return (window as any).__oo_app?.workspace?.rootSplit || this; }
  getContainer(): any { return this.getRoot(); }
}

export class WorkspaceParent extends WorkspaceItem {}

export class WorkspaceSplit extends WorkspaceParent {
  parent: WorkspaceParent = null as any;
}

export class WorkspaceContainer extends WorkspaceSplit {
  win: Window = window;
  doc: Document = document;
}

export class WorkspaceRoot extends WorkspaceContainer {
  win = window;
  doc = document;
}

export class WorkspaceTabs extends WorkspaceParent {
  parent: WorkspaceSplit = null as any;
}

export class WorkspaceSidedock extends WorkspaceSplit {
  collapsed: boolean = false;
  toggle(): void { this.collapsed = !this.collapsed; }
  collapse(): void { this.collapsed = true; }
  expand(): void { this.collapsed = false; }
}

export class WorkspaceFloating extends WorkspaceParent {
  parent: WorkspaceParent = null as any;
}

export class WorkspaceWindow extends WorkspaceContainer {
  win = window;
  doc = document;
}

export class WorkspaceMobileDrawer extends WorkspaceParent {
  parent: WorkspaceParent = null as any;
  collapsed: boolean = false;
  expand(): void { this.collapsed = false; }
  collapse(): void { this.collapsed = true; }
  toggle(): void { this.collapsed = !this.collapsed; }
}

export class WorkspaceRibbon {}

// ── Base component classes ──
export class BaseComponent {
  disabled: boolean = false;
  then(cb: (component: any) => any): this { cb(this); return this; }
  setDisabled(disabled: boolean): this { this.disabled = disabled; return this; }
}

export class ValueComponent<T> extends BaseComponent {
  getValue(): T { return undefined as any; }
  setValue(value: T): this { return this; }
}

export class AbstractTextComponent<T extends HTMLInputElement | HTMLTextAreaElement> extends ValueComponent<string> {
  inputEl: T;
  constructor(inputEl: T) { super(); this.inputEl = inputEl; }
  getValue(): string { return this.inputEl.value; }
  setValue(value: string): this { this.inputEl.value = value; return this; }
  setPlaceholder(placeholder: string): this { this.inputEl.placeholder = placeholder; return this; }
  onChanged(): void {}
  onChange(callback: (value: string) => any): this { return this; }
  setDisabled(disabled: boolean): this { this.inputEl.disabled = disabled; return this; }
}

// ── Additional component stubs ──
export class ProgressBarComponent extends BaseComponent {
  progressBar: HTMLProgressElement;
  constructor(containerEl: HTMLElement) {
    super();
    this.progressBar = containerEl.createEl('progress') as unknown as HTMLProgressElement;
  }
  getValue(): number { return this.progressBar.value; }
  setValue(value: number): this { this.progressBar.value = value; return this; }
}

export class MenuSeparator {
  separatorEl: HTMLElement;
  constructor() { this.separatorEl = document.createElement('div'); this.separatorEl.className = 'menu-separator'; }
}

export class SecretComponent extends BaseComponent {
  inputEl: HTMLInputElement;
  constructor(containerEl: HTMLElement) {
    super();
    this.inputEl = containerEl.createEl('input', { type: 'password' }) as unknown as HTMLInputElement;
  }
  getValue(): string { return this.inputEl.value; }
  setValue(value: string): this { this.inputEl.value = value; return this; }
  setPlaceholder(placeholder: string): this { this.inputEl.placeholder = placeholder; return this; }
  onChange(callback: (value: string) => any): this { return this; }
}

export class SettingGroup {
  listEl: HTMLElement;
  settingEl: HTMLElement;
  constructor(containerEl: HTMLElement) {
    this.settingEl = containerEl.createEl('div', { cls: 'setting-group' }) as unknown as HTMLElement;
    this.listEl = this.settingEl.createDiv({ cls: 'setting-group-list' });
  }
  setHeading(text: string): this {
    let heading = this.settingEl.querySelector<HTMLElement>('.setting-group-heading');
    if (!heading) {
      heading = document.createElement('div');
      heading.className = 'setting-group-heading';
      this.settingEl.prepend(heading);
    }
    heading.textContent = text;
    return this;
  }
  addClass(classes: string): this { this.settingEl.addClass(classes); return this; }
  addSetting(cb: (setting: any) => any): this {
    cb(new (Setting as any)(this.listEl));
    return this;
  }
  addSearch(cb: (component: SearchComponent) => any): this {
    cb(new SearchComponent(this.listEl));
    return this;
  }
  addExtraButton(cb: (component: ExtraButtonComponent) => any): this {
    cb(new ExtraButtonComponent(this.settingEl));
    return this;
  }
}

export abstract class SettingPage {
  rootEl: HTMLElement;
  titlebarEl: HTMLElement;
  containerEl: HTMLElement;
  title = '';
  constructor() {
    this.rootEl = document.createElement('div');
    this.rootEl.className = 'setting-page';
    this.titlebarEl = this.rootEl.createDiv({ cls: 'setting-page-titlebar' });
    this.containerEl = this.rootEl.createDiv({ cls: 'setting-page-content' });
  }
  abstract display(): void;
  hide(): void { this.containerEl.empty(); }
}

export class RenderContext {}
export class SecretStorage {
  async getSecret(key: string): Promise<string | null> { return null; }
  async setSecret(key: string, value: string): Promise<void> {}
  async deleteSecret(key: string): Promise<void> {}
}
export class Tasks {}
export class MarkdownEditView {}
export class CapacitorAdapter {}

// ── PopoverState enum ──
export enum PopoverState {
  Showing = 0,
  Shown = 1,
  Hiding = 2,
  Hidden = 3,
}

// ── Additional types ──
export type UserEvent = MouseEvent | KeyboardEvent | TouchEvent | PointerEvent;
export type HexString = string;
export type Side = 'left' | 'right';
export type TooltipPlacement = 'top' | 'bottom' | 'left' | 'right';
export type MarkdownViewModeType = 'source' | 'preview';
export type Constructor<T> = new (...args: any[]) => T;

export interface Command {
  id: string;
  name: string;
  icon?: IconName;
  mobileOnly?: boolean;
  callback?: () => any;
  checkCallback?: (checking: boolean) => boolean | void;
  editorCallback?: (editor: Editor, ctx: MarkdownFileInfo) => any;
  editorCheckCallback?: (checking: boolean, editor: Editor, ctx: MarkdownFileInfo) => boolean | void;
  hotkeys?: any[];
}

export interface Hotkey {
  modifiers: Modifier[];
  key: string;
}

export interface OpenViewState {
  state?: any;
  eState?: any;
  active?: boolean;
}

export interface ViewState {
  type: string;
  state?: any;
  active?: boolean;
  pinned?: boolean;
  group?: WorkspaceLeaf;
}

export interface ViewStateResult {}

export interface DataWriteOptions {
  ctime?: number;
  mtime?: number;
}

export interface DataAdapter {
  getName(): string;
  getBasePath(): string;
  read(normalizedPath: string): Promise<string>;
  write(normalizedPath: string, data: string, options?: DataWriteOptions): Promise<void>;
  exists(normalizedPath: string): Promise<boolean>;
}

export interface Pos { start: Loc; end: Loc; }
export interface Loc { line: number; col: number; offset: number; }

export interface SearchResult { score: number; matches: any[]; }
export interface SearchResultContainer { match: SearchResult; }
export type SearchMatches = [number, number][];
export type SearchMatchPart = [number, number];

// -- Cache-related interfaces --
export interface CacheItem { position: Pos; }
export interface HeadingCache extends CacheItem { heading: string; level: number; }
export interface TagCache extends CacheItem { tag: string; }
export interface LinkCache extends CacheItem { link: string; original: string; displayText?: string; }
export interface EmbedCache extends CacheItem { link: string; original: string; displayText?: string; }
export interface SectionCache extends CacheItem { type: string; id?: string; }
export interface ListItemCache extends CacheItem { parent: number; task?: string; }
export interface FrontMatterCache { [key: string]: any; position: Pos; }
export interface FrontmatterLinkCache { key: string; link: string; original: string; displayText?: string; }
export interface BlockCache extends CacheItem { id: string; }
export interface FootnoteCache extends CacheItem { id: string; }
export interface FootnoteRefCache extends CacheItem { id: string; }
export interface ReferenceCache extends CacheItem { link: string; original: string; displayText?: string; }
export interface ReferenceLinkCache extends CacheItem { reference: string; link: string; original: string; }
export interface FrontMatterInfo { exists: boolean; from: number; to: number; frontmatter: string; }

// -- Subpath results --
export interface HeadingSubpathResult { type: 'heading'; current: HeadingCache; next?: HeadingCache; }
export interface BlockSubpathResult { type: 'block'; block: BlockCache; list?: ListItemCache; }
export interface FootnoteSubpathResult { type: 'footnote'; footnote: FootnoteCache; }
export type SubpathResult = HeadingSubpathResult | BlockSubpathResult | FootnoteSubpathResult;

// -- Editor-related interfaces --
export interface EditorChange { from: EditorPosition; to?: EditorPosition; text: string; }
export interface EditorScrollInfo { top: number; left: number; height: number; width: number; clientHeight: number; clientWidth: number; }
export interface EditorSelection { anchor: EditorPosition; head: EditorPosition; }
export interface EditorSelectionOrCaret { anchor: EditorPosition; head?: EditorPosition; }
export interface EditorRangeOrCaret { from: EditorPosition; to?: EditorPosition; }
export interface EditorTransaction {
  replaceSelection?: string;
  changes?: EditorChange[];
  selections?: EditorRangeOrCaret[];
  selection?: EditorRangeOrCaret;
}
export interface EditorSuggestContext { start: EditorPosition; end: EditorPosition; query: string; editor: Editor; file: TFile; }
export interface EditorSuggestTriggerInfo { start: EditorPosition; end: EditorPosition; query: string; }
export type EditorCommandName = string;

// -- Misc interfaces --
export interface FuzzyMatch<T> { item: T; match: SearchResult; }
export interface Instruction { command: string; purpose: string; }
export interface ISuggestOwner<T> { renderSuggestion(value: T, el: HTMLElement): void; selectSuggestion(value: T, evt: MouseEvent | KeyboardEvent): void; }
export interface HoverParent { hoverPopover: HoverPopover | null; }
export interface HoverLinkSource { display: string; defaultMod?: boolean; }
export interface CloseableComponent { close(): void; }
export interface Reference { link: string; original: string; }
export interface Point { x: number; y: number; }
export interface RGB { r: number; g: number; b: number; }
export interface HSL { h: number; s: number; l: number; }
export interface Stat { type: 'file' | 'folder'; ctime: number; mtime: number; size: number; }
export interface ListedFiles { files: string[]; folders: string[]; }
export interface MenuPositionDef { x: number; y: number; width?: number; overlap?: boolean; }
export interface WorkspaceWindowInitData { x?: number; y?: number; size?: { width: number; height: number; }; }

// -- Request interfaces --
export interface RequestUrlParam { url: string; method?: string; headers?: Record<string, string>; body?: string | ArrayBuffer; contentType?: string; throw?: boolean; }
export interface RequestUrlResponse { status: number; headers: Record<string, string>; arrayBuffer: ArrayBuffer; json: any; text: string; }
export interface RequestUrlResponsePromise extends Promise<RequestUrlResponse> { arrayBuffer: Promise<ArrayBuffer>; json: Promise<any>; text: Promise<string>; }

// -- Keymap interfaces --
export interface KeymapContext { key: string; modifiers: string | null; vkey: string; }
export interface KeymapInfo { modifiers: string | null; key: string | null; }
export interface KeymapEventHandler extends KeymapInfo { scope: any; }
export type KeymapEventListener = (evt: KeyboardEvent, ctx: KeymapContext) => boolean | void;

// -- Markdown interfaces --
export type MarkdownPostProcessor = (el: HTMLElement, ctx: MarkdownPostProcessorContext) => Promise<any> | void;
export interface MarkdownPostProcessorContext { docId: string; sourcePath: string; frontmatter: any | null | undefined; addChild(child: MarkdownRenderChild): void; getSectionInfo(el: HTMLElement): MarkdownSectionInformation | null; }
export interface MarkdownSectionInformation { text: string; lineStart: number; lineEnd: number; }
export interface MarkdownSubView { getScroll(): number; applyScroll(scroll: number): void; get(): string; set(data: string, clear: boolean): void; }
export interface MarkdownPreviewEvents {}

// -- Setting definition interfaces --
export interface SettingControlBase { id?: string; }
export interface SettingTextControl extends SettingControlBase { type: 'text'; default?: string; placeholder?: string; }
export interface SettingToggleControl extends SettingControlBase { type: 'toggle'; default?: boolean; }
export interface SettingDropdownControl extends SettingControlBase { type: 'dropdown'; default?: string; options: Record<string, string>; }
export interface SettingSliderControl extends SettingControlBase { type: 'slider'; default?: number; min?: number; max?: number; step?: number; }
export interface SettingColorControl extends SettingControlBase { type: 'color'; default?: string; }
export type SettingControl = SettingTextControl | SettingToggleControl | SettingDropdownControl | SettingSliderControl | SettingColorControl;
export interface SettingControlBinding { value: any; onChange: (value: any) => any; }

export interface SettingDefinitionBase { id?: string; name?: string; description?: string; }
export interface SettingDefinitionControl extends SettingDefinitionBase { type: 'control'; control: SettingControl; }
export interface SettingDefinitionAction extends SettingDefinitionBase { type: 'action'; action: () => any; }
export interface SettingDefinitionElement extends SettingDefinitionBase { type: 'element'; element: (containerEl: HTMLElement) => any; }
export interface SettingDefinitionRender extends SettingDefinitionBase { type: 'render'; render: (containerEl: HTMLElement) => any; }
export interface SettingDefinitionEmpty extends SettingDefinitionBase { type: 'empty'; }
export interface SettingDefinitionGroup extends SettingDefinitionBase { type: 'group'; }
export interface SettingDefinitionPage extends SettingDefinitionBase { type: 'page'; }
export type SettingDefinitionItem = SettingDefinitionControl | SettingDefinitionAction | SettingDefinitionElement | SettingDefinitionRender | SettingDefinitionEmpty;
export type SettingDefinition = SettingDefinitionItem | SettingDefinitionGroup | SettingDefinitionPage;
export type SettingGroupItem = SettingDefinition;

export interface TooltipOptions { placement?: TooltipPlacement; delay?: number; }
export type ObsidianProtocolHandler = (params: ObsidianProtocolData) => any;
export interface LivePreviewStateType { mousedown: boolean; }

// Stubs for CLI-related types (not commonly used by plugins)
export interface CliFlag { name: string; description: string; type?: string; default?: any; }
export interface CliData { flags: CliFlag[]; }
export type CliFlags = Record<string, any>;
export type CliHandler = (flags: CliFlags) => any;

// QueryController stub
export class QueryController { abort(): void {} }

// ── ConfirmModal ────────────────────────────────────
// Convenience modal with OK/Cancel that some plugins import
export function ConfirmModal(this: any, app: any, title: string, message: string, cb: (confirmed: boolean) => void) {
  Modal.call(this, app);
  const self = this;
  this._title = title;
  this._message = message;
  this._cb = cb;
  
  this.onOpen = function() {
    self.titleEl.textContent = title;
    self.contentEl.textContent = message;
    const btnContainer = document.createElement('div');
    btnContainer.className = 'modal-button-container';
    
    const cancelBtn = document.createElement('button');
    cancelBtn.textContent = 'Cancel';
    cancelBtn.className = 'oo-plugin-btn';
    cancelBtn.addEventListener('click', () => { cb(false); self.close(); });
    
    const confirmBtn = document.createElement('button');
    confirmBtn.textContent = 'Confirm';
    confirmBtn.className = 'oo-plugin-btn mod-cta';
    confirmBtn.addEventListener('click', () => { cb(true); self.close(); });
    
    btnContainer.appendChild(cancelBtn);
    btnContainer.appendChild(confirmBtn);
    self.contentEl.appendChild(btnContainer);
  };
}
ConfirmModal.prototype = Object.create((Modal as any).prototype);
ConfirmModal.prototype.constructor = ConfirmModal;

// ── Additional utility ──────────────────────────────
export function hexStringToArrayBuffer(hexString: string): ArrayBuffer {
  const bytes = new Uint8Array(hexString.length / 2);
  for (let i = 0; i < hexString.length; i += 2) {
    bytes[i / 2] = parseInt(hexString.substring(i, i + 2), 16);
  }
  return bytes.buffer;
}

// ── Bases API Stubs (v1.10+) ────────────────────────
// Minimal stubs to prevent import errors. Most plugins
// do not use these, but having them avoids undefined errors.

export class BasesView extends Component {
  readonly type = '';
  app: any;
  controller: QueryController;
  config: BasesViewConfig;
  allProperties: any[] = [];
  data: BasesQueryResult = new BasesQueryResult();
  containerEl: HTMLElement;
  constructor(controller: QueryController, containerEl: HTMLElement) {
    super();
    this.app = (window as any).__oo_app;
    this.controller = controller;
    this.config = new BasesViewConfig();
    this.containerEl = containerEl;
  }
  onDataUpdated(): void {}
  async createFileForView(baseFileName: string, frontmatterProcessor?: (frontmatter: any) => void): Promise<TFile | null> {
    const app = this.app;
    if (!app?.vault) return null;
    const path = `${baseFileName.replace(/\.md$/i, '')}.md`;
    const file = await app.vault.create(path, '');
    if (frontmatterProcessor) await app.fileManager.processFrontMatter(file, frontmatterProcessor);
    return file;
  }
}

export class BasesEntry {
  file: TFile = null as any;
  _values: Map<string, Value> = new Map();
  getFile(): TFile { return this.file; }
  getValue(id: string): Value { return this._values.get(id) || new NullValue(); }
  setValue(id: string, value: Value): void { this._values.set(id, value); }
}

export class BasesEntryGroup {
  entries: BasesEntry[] = [];
  value: any = null;
}

export class BasesQueryResult {
  entries: BasesEntry[] = [];
  groups: BasesEntryGroup[] = [];
  groupedData: BasesEntryGroup[] = this.groups;
  properties: any[] = [];
}

export class BasesViewConfig {
  id: string = '';
  name: string = '';
  icon: string = '';
  private _values = new Map<string, any>();
  private _order: string[] = [];
  get(key: string): any { return this._values.get(key); }
  set(key: string, value: any): void { this._values.set(key, value); }
  getOrder(): string[] { return [...this._order]; }
  setOrder(order: string[]): void { this._order = [...order]; }
}

// ── Value types for Bases formula system ────────────
export abstract class Value {
  abstract readonly type: string;
  static equals(a: Value | null, b: Value | null): boolean { return a?.equals(b) ?? b === null; }
  static looseEquals(a: Value | null, b: Value | null): boolean { return a?.looseEquals(b) ?? b === null; }
  abstract toString(): string;
  isTruthy(): boolean { return !this.isEmpty(); }
  isEmpty(): boolean { return false; }
  equals(other: Value | null): boolean { return !!other && this.type === other.type && this.toString() === other.toString(); }
  looseEquals(other: Value | null): boolean { return !!other && this.toString() === other.toString(); }
  renderTo(el: HTMLElement, _ctx?: any): void { el.textContent = this.toString(); }
}

export class PrimitiveValue<T> extends Value {
  readonly type: string = 'primitive';
  value: T;
  constructor(value: T) { super(); this.value = value; }
  toString(): string { return String(this.value); }
  isEmpty(): boolean { return this.value === null || this.value === undefined || this.value === ''; }
}

export class BooleanValue extends PrimitiveValue<boolean> { readonly type = 'boolean'; }
export class NumberValue extends PrimitiveValue<number> { readonly type = 'number'; }
export class StringValue extends PrimitiveValue<string> { readonly type = 'string'; }
export class DateValue extends PrimitiveValue<Date> { readonly type = 'date'; }
export class DurationValue extends PrimitiveValue<any> { readonly type = 'duration'; }
export class RegExpValue extends PrimitiveValue<RegExp> { readonly type = 'regexp'; }
export class RelativeDateValue extends PrimitiveValue<any> { readonly type = 'relative-date'; }
export class FileValue extends PrimitiveValue<TFile> { readonly type = 'file'; }
export class LinkValue extends PrimitiveValue<any> { readonly type = 'link'; }
export class TagValue extends PrimitiveValue<string> { readonly type = 'tag'; }
export class UrlValue extends PrimitiveValue<string> { readonly type = 'url'; }
export class IconValue extends PrimitiveValue<string> { readonly type = 'icon'; }
export class ImageValue extends PrimitiveValue<any> { readonly type = 'image'; }
export class HTMLValue extends PrimitiveValue<string> {
  readonly type = 'html';
  renderTo(el: HTMLElement): void { el.innerHTML = this.value; }
}
export class ListValue extends PrimitiveValue<Value[]> {
  readonly type = 'list';
  toString(): string { return this.value.map((value) => value.toString()).join(', '); }
  isEmpty(): boolean { return this.value.length === 0; }
}
export class ObjectValue extends PrimitiveValue<Record<string, Value>> {
  readonly type = 'object';
  toString(): string { return JSON.stringify(this.value); }
  isEmpty(): boolean { return Object.keys(this.value).length === 0; }
}
export class NullValue extends Value {
  readonly type = 'null';
  toString(): string { return ''; }
  isTruthy(): boolean { return false; }
  isEmpty(): boolean { return true; }
  equals(other: Value | null): boolean { return other === null || other instanceof NullValue; }
}
export class NotNullValue extends Value {
  readonly type = 'not-null';
  toString(): string { return 'not null'; }
}

export class DisplayValueComponent extends BaseComponent {
  valueEl: HTMLElement;
  constructor(containerEl: HTMLElement) {
    super();
    this.valueEl = containerEl.createSpan({ cls: 'setting-item-display-value' });
  }
  setValue(value: Value | string): this {
    this.valueEl.empty();
    if (value instanceof Value) value.renderTo(this.valueEl);
    else this.valueEl.textContent = value;
    return this;
  }
}

export class ConfirmationButton extends ButtonComponent {
  private modal: ConfirmationModal;
  private handler: ((evt: MouseEvent) => unknown | Promise<unknown>) | null = null;
  constructor(containerEl: HTMLElement, modal: ConfirmationModal) {
    super(containerEl);
    this.modal = modal;
    this.buttonEl.addEventListener('click', async (evt) => {
      const keepOpen = await this.handler?.(evt);
      if (!keepOpen) this.modal.close();
    });
  }
  onClick(handler: (evt: MouseEvent) => unknown | Promise<unknown>): this {
    this.handler = handler;
    return this;
  }
  setInitialFocus(): this { this.buttonEl.dataset.initialFocus = 'true'; return this; }
  setSecondary(): this { this.buttonEl.classList.add('mod-secondary'); return this; }
  setCancel(): this { this.buttonEl.classList.add('mod-cancel'); return this; }
  setConfirmationText(text: string): this {
    this.buttonEl.dataset.confirmationText = text;
    return this;
  }
}

export class ConfirmationModal extends (Modal as any) {
  buttonContainerEl: HTMLElement;
  constructor(app: any) {
    super(app);
    this.buttonContainerEl = document.createElement('div');
    this.buttonContainerEl.className = 'modal-button-container';
    this.contentEl.appendChild(this.buttonContainerEl);
  }
  addClass(cls: string): this { this.modalEl.addClass(cls); return this; }
  addCheckbox(label: string, cb: (value: boolean) => any | Promise<any>): this {
    const wrapper = this.contentEl.createEl('label', { cls: 'mod-checkbox' });
    const input = wrapper.createEl('input', { type: 'checkbox' }) as HTMLInputElement;
    wrapper.createSpan({ text: label });
    input.addEventListener('change', () => void cb(input.checked));
    this.contentEl.insertBefore(wrapper, this.buttonContainerEl);
    return this;
  }
  addButton(cb: (button: ConfirmationButton) => any): this {
    const button = new ConfirmationButton(this.buttonContainerEl, this);
    cb(button);
    return this;
  }
  addCancelButton(text = 'Cancel'): this {
    return this.addButton((button) => button.setButtonText(text).setCancel());
  }
  open(): void {
    super.open();
    const target = this.buttonContainerEl.querySelector<HTMLElement>('[data-initial-focus="true"]');
    target?.focus();
  }
}

export interface FormulaContext {
  getValue(id: string): any;
}
