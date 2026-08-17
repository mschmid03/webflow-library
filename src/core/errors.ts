import { addToken, ERROR_ATTR, removeToken } from './attributes';

export function warn(utility: string, message: string, element?: Element): void {
  if (element) console.warn(`[wl:${utility}] ${message}`, element);
  else console.warn(`[wl:${utility}] ${message}`);
}

/** Setzt `wl-error="<utility>:<code>"` am Element, für Designer im Inspector sichtbar. */
export function markError(element: Element, utility: string, code: string): void {
  addToken(element, ERROR_ATTR, `${utility}:${code}`);
}

export function clearErrors(element: Element, utility: string): void {
  removeToken(element, ERROR_ATTR, (token) => token.startsWith(`${utility}:`));
}
