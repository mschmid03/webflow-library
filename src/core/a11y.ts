import type { Cleanup } from './types';

const NATIVE_INTERACTIVE = 'button, a[href], input, select, textarea, summary, [contenteditable="true"]';
const liveRegions = new WeakMap<HTMLElement, HTMLElement>();
let idCounter = 0;

export function prefersReducedMotion(): boolean {
  return window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false;
}

/** Vorhandene IDs werden nie überschrieben. */
export function ensureId(element: Element, prefix: string): string {
  if (element.id) return element.id;
  let id = `${prefix}-${++idCounter}`;
  while (document.getElementById(id)) id = `${prefix}-${++idCounter}`;
  element.id = id;
  return id;
}

/** Macht ein Element tastaturbedienbar. Native Buttons/Links bleiben unangetastet. */
export function ensureFocusable(element: HTMLElement): void {
  if (element.matches(NATIVE_INTERACTIVE)) return;
  if (!element.hasAttribute('tabindex')) element.setAttribute('tabindex', '0');
  if (!element.hasAttribute('role')) element.setAttribute('role', 'button');
}

/** Klick plus Enter und Space. Listener liegen am Element selbst, deshalb ohne Cleanup-Pflicht. */
export function onActivate(element: HTMLElement, handler: (event: Event) => void): Cleanup {
  const onClick = (event: Event) => handler(event);
  const onKeydown = (event: KeyboardEvent) => {
    if (event.key !== 'Enter' && event.key !== ' ') return;
    event.preventDefault();
    handler(event);
  };
  element.addEventListener('click', onClick);
  element.addEventListener('keydown', onKeydown);
  return () => {
    element.removeEventListener('click', onClick);
    element.removeEventListener('keydown', onKeydown);
  };
}

/** Statusmeldung für Screenreader über eine additive sr-only Live-Region am Root. */
export function announce(root: HTMLElement, message: string): void {
  let region = liveRegions.get(root);
  if (!region || !region.isConnected) {
    region = document.createElement('span');
    region.setAttribute('aria-live', 'polite');
    region.style.cssText =
      'position:absolute;width:1px;height:1px;margin:-1px;padding:0;overflow:hidden;clip:rect(0 0 0 0);clip-path:inset(50%);white-space:nowrap;border:0';
    root.append(region);
    liveRegions.set(root, region);
  }
  region.textContent = message;
}
