/**
 * Type augmentations for Obsidian's DOM and JS primitive extensions.
 */

export {};

declare global {
  interface HTMLElement {
    empty(): void;
    setText(text: string): void;
    getText(): string;
    createEl(tag: string, o?: any, callback?: (el: HTMLElement) => void): HTMLElement;
    createDiv(o?: any, callback?: (el: HTMLDivElement) => void): HTMLDivElement;
    createSpan(o?: any, callback?: (el: HTMLSpanElement) => void): HTMLSpanElement;
    addClass(...classes: string[]): void;
    removeClass(...classes: string[]): void;
    toggleClass(cls: string, value?: boolean): void;
    hasClass(cls: string): boolean;
    onClickEvent(callback: (e: MouseEvent) => any, options?: boolean | AddEventListenerOptions): this;
    detach(): void;
    show(): void;
    hide(): void;
    isShown(): boolean;
    setCssProps(props: Record<string, string>): void;
    setAttr(key: string, value: string | number | boolean | null): void;
    setAttrs(attrs: Record<string, string | number | boolean | null>): void;
    getCssPropertyValue(prop: string): string;
    matchParent(selector: string, lastParent?: Element): HTMLElement | null;
    win: Window;
    doc: Document;
  }

  interface DocumentFragment {
    createEl(tag: string, o?: any, callback?: (el: HTMLElement) => void): HTMLElement;
    createDiv(o?: any, callback?: (el: HTMLDivElement) => void): HTMLDivElement;
    createSpan(o?: any, callback?: (el: HTMLSpanElement) => void): HTMLSpanElement;
  }

  interface String {
    contains(target: string): boolean;
  }

  interface Array<T> {
    contains(target: T): boolean;
    remove(target: T): void;
  }

  interface Number {
    clamp(min: number, max: number): number;
  }
}
