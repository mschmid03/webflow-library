export const PREFIX = 'wl-';
export const INIT_ATTR = 'wl-init';
export const ERROR_ATTR = 'wl-error';
export const ROOT_ROLE = 'root';

/** Optionsnamen, die der Core für die Instanz-Zuordnung reserviert. */
export const RESERVED_OPTIONS = ['id', 'for'] as const;

export function roleAttr(utility: string): string {
  return `${PREFIX}${utility}`;
}

export function optionAttr(utility: string, option: string): string {
  return `${PREFIX}${utility}-${option}`;
}

export function rootSelector(utility: string): string {
  return `[${roleAttr(utility)}="${ROOT_ROLE}"]`;
}

/** Attributwert getrimmt, leer zählt als nicht gesetzt. */
export function readRaw(element: Element, name: string): string | null {
  const raw = element.getAttribute(name);
  if (raw === null) return null;
  const value = raw.trim();
  return value === '' ? null : value;
}

export function tokens(value: string | null): string[] {
  if (!value) return [];
  return value.split(/\s+/).filter(Boolean);
}

export function addToken(element: Element, attribute: string, token: string): void {
  const current = tokens(element.getAttribute(attribute));
  if (current.includes(token)) return;
  current.push(token);
  element.setAttribute(attribute, current.join(' '));
}

export function removeToken(element: Element, attribute: string, predicate: (token: string) => boolean): void {
  const remaining = tokens(element.getAttribute(attribute)).filter((token) => !predicate(token));
  if (remaining.length === 0) element.removeAttribute(attribute);
  else element.setAttribute(attribute, remaining.join(' '));
}

/** Alle `wl-<utility>-…`-Attributnamen eines Elements, ohne den Rollen-Marker. */
export function optionNames(element: Element, utility: string): string[] {
  const prefix = `${roleAttr(utility)}-`;
  return Array.from(element.attributes)
    .map((attribute) => attribute.name.toLowerCase())
    .filter((name) => name.startsWith(prefix))
    .map((name) => name.slice(prefix.length));
}
