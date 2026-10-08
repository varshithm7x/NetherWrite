import type { MarkdownPostProcessorContext } from './index';

interface RegisteredPostProcessor {
  pluginId: string;
  processor: (el: HTMLElement, ctx: MarkdownPostProcessorContext) => Promise<any> | void;
  sortOrder: number;
}

interface RegisteredCodeBlockProcessor {
  pluginId: string;
  language: string;
  handler: (source: string, el: HTMLElement, ctx: MarkdownPostProcessorContext) => Promise<any> | void;
  sortOrder: number;
}

const postProcessors: RegisteredPostProcessor[] = [];
const codeBlockProcessors: RegisteredCodeBlockProcessor[] = [];

function notifyProcessorsChanged(): void {
  window.dispatchEvent(new CustomEvent('obsidian:markdown-processors-changed'));
}

function sortProcessors<T extends { sortOrder: number }>(processors: T[]): void {
  processors.sort((a, b) => a.sortOrder - b.sortOrder);
}

export function registerMarkdownPostProcessor(
  pluginId: string,
  processor: RegisteredPostProcessor['processor'],
  sortOrder = 0,
): () => void {
  const registration = { pluginId, processor, sortOrder };
  postProcessors.push(registration);
  sortProcessors(postProcessors);
  notifyProcessorsChanged();
  return () => {
    const index = postProcessors.indexOf(registration);
    if (index >= 0) postProcessors.splice(index, 1);
    notifyProcessorsChanged();
  };
}

export function registerMarkdownCodeBlockProcessor(
  pluginId: string,
  language: string,
  handler: RegisteredCodeBlockProcessor['handler'],
  sortOrder = 0,
): () => void {
  const registration = { pluginId, language: language.toLowerCase(), handler, sortOrder };
  codeBlockProcessors.push(registration);
  sortProcessors(codeBlockProcessors);
  notifyProcessorsChanged();
  return () => {
    const index = codeBlockProcessors.indexOf(registration);
    if (index >= 0) codeBlockProcessors.splice(index, 1);
    notifyProcessorsChanged();
  };
}

function createContext(sourcePath: string): MarkdownPostProcessorContext {
  return {
    docId: sourcePath,
    sourcePath,
    frontmatter: (window as any).__oo_app?.metadataCache?.getCache(sourcePath)?.frontmatter,
    addChild(child: any) {
      child.load?.();
    },
    getSectionInfo(el: HTMLElement) {
      const section = el.closest<HTMLElement>('[data-line-start]');
      if (!section) return null;
      const lineStart = Number(section.dataset.lineStart || 0);
      const lineEnd = Number(section.dataset.lineEnd || lineStart);
      return { text: section.textContent || '', lineStart, lineEnd };
    },
  };
}

function escapeCssIdentifier(value: string): string {
  if (typeof CSS !== 'undefined' && typeof CSS.escape === 'function') return CSS.escape(value);
  return value.replace(/[^a-zA-Z0-9_-]/g, (character) => `\\${character}`);
}

export async function runMarkdownPostProcessors(
  containerEl: HTMLElement,
  sourcePath: string,
): Promise<() => void> {
  const context = createContext(sourcePath);
  const loadedChildren: any[] = [];
  context.addChild = (child: any) => {
    loadedChildren.push(child);
    child.load?.();
  };

  for (const registration of codeBlockProcessors) {
    const language = escapeCssIdentifier(registration.language);
    const selector = `pre > code.language-${language}, pre > code.lang-${language}`;
    for (const codeEl of Array.from(containerEl.querySelectorAll<HTMLElement>(selector))) {
      const preEl = codeEl.parentElement;
      if (!preEl) continue;
      const outputEl = document.createElement('div');
      outputEl.className = `block-language-${registration.language}`;
      outputEl.dataset.pluginId = registration.pluginId;
      preEl.replaceWith(outputEl);
      await registration.handler(codeEl.textContent || '', outputEl, context);
    }
  }

  for (const registration of postProcessors) {
    await registration.processor(containerEl, context);
  }

  return () => {
    for (const child of loadedChildren.reverse()) child.unload?.();
  };
}

export function getMarkdownProcessorCounts(): { postProcessors: number; codeBlockProcessors: number } {
  return {
    postProcessors: postProcessors.length,
    codeBlockProcessors: codeBlockProcessors.length,
  };
}
