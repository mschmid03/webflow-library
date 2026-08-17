import { warn } from './errors';
import { destroy, scan } from './instances';
import { observe } from './observer';

declare const __WL_VERSION__: string | undefined;

export const VERSION = typeof __WL_VERSION__ === 'string' ? __WL_VERSION__ : '0.0.0-dev';

export interface PublicApi {
  readonly version: string;
  /** Initialisiert Instanzen in `target`. Wird nur gebraucht, wenn DOM außerhalb des Observers entsteht. */
  init(target?: Element): void;
  /** Räumt Instanzen in `target` ab. */
  destroy(target?: Element): void;
}

declare global {
  interface Window {
    wl?: PublicApi;
  }
}

export function start(): void {
  expose();
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot, { once: true });
  else boot();
}

function boot(): void {
  const target: Element = document.body ?? document.documentElement;
  scan(target);
  observe(target);
}

function expose(): void {
  if (window.wl) {
    warn('core', 'window.wl war bereits definiert. Prüfe, ob das Bundle doppelt eingebunden ist.');
  }
  window.wl = {
    version: VERSION,
    init: (target) => scan(target ?? document.body),
    destroy: (target) => destroy(target ?? document.body),
  };
}
