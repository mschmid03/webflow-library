import {
  addToken,
  INIT_ATTR,
  optionAttr,
  optionNames,
  readRaw,
  roleAttr,
  ROOT_ROLE,
  rootSelector,
  tokens,
} from './attributes';
import { clearErrors, markError, warn } from './errors';
import { emit } from './events';
import { readOptions } from './options';
import { registered } from './registry';
import type { AnyUtilityDefinition, Cleanup, Report } from './types';

type InitArgument = Parameters<AnyUtilityDefinition['init']>[0];
type ResolvedParts = Record<string, HTMLElement | HTMLElement[] | null>;

const cleanups = new WeakMap<Element, Map<string, Cleanup>>();

function elementsIn(target: Element, selector: string): HTMLElement[] {
  const found: HTMLElement[] = [];
  if (target instanceof HTMLElement && target.matches(selector)) found.push(target);
  found.push(...Array.from(target.querySelectorAll<HTMLElement>(selector)));
  return found;
}

function escapeValue(value: string): string {
  return typeof CSS !== 'undefined' && typeof CSS.escape === 'function' ? CSS.escape(value) : value.replace(/"/g, '\\"');
}

/** Initialisiert alle Instanzen aller registrierten Utilities in `target` inklusive `target` selbst. */
export function scan(target: Element = document.body): void {
  for (const definition of registered()) {
    for (const root of elementsIn(target, rootSelector(definition.name))) {
      initInstance(definition, root);
    }
  }
}

/** Räumt alle Instanzen in `target` inklusive `target` selbst ab. */
export function destroy(target: Element = document.body): void {
  for (const element of elementsIn(target, `[${INIT_ATTR}]`)) {
    const map = cleanups.get(element);
    if (map) {
      for (const [utility, cleanup] of map) {
        try {
          cleanup();
        } catch (error) {
          warn(utility, `Cleanup ist fehlgeschlagen: ${String(error)}`, element);
        }
      }
      cleanups.delete(element);
    }
    element.removeAttribute(INIT_ATTR);
  }
}

function initInstance(definition: AnyUtilityDefinition, root: HTMLElement): void {
  const { name } = definition;
  if (tokens(root.getAttribute(INIT_ATTR)).includes(name)) return;

  clearErrors(root, name);
  const report: Report = (code, message) => {
    markError(root, name, code);
    warn(name, message, root);
  };

  const parts = resolveParts(definition, root, report);
  if (!parts) return;

  const options = readOptions(name, root, definition.options, report);
  if (!options) return;

  addToken(root, INIT_ATTR, name);

  const instance = {
    utility: name,
    root,
    parts,
    options,
    fail(code: string, message?: string) {
      report(code, message ?? `Utility hat "${code}" gemeldet.`);
    },
    emit(action: string, detail?: Record<string, unknown>) {
      emit(root, name, action, detail);
    },
  } as unknown as InitArgument;

  let cleanup: void | Cleanup;
  try {
    cleanup = definition.init(instance);
  } catch (error) {
    markError(root, name, 'init-failed');
    warn(name, `Init ist fehlgeschlagen: ${String(error)}`, root);
    return;
  }

  if (typeof cleanup !== 'function') return;
  let map = cleanups.get(root);
  if (!map) {
    map = new Map();
    cleanups.set(root, map);
  }
  map.set(name, cleanup);
}

/**
 * Ordnet Sub-Elemente ihren Rollen zu.
 * Zuordnung ist implizit über den nächsten Root; externe Teile über `wl-<utility>-for` + `wl-<utility>-id`.
 * Rückgabe `null` bedeutet: eine Pflichtrolle fehlt, die Instanz darf nicht starten.
 */
function resolveParts(definition: AnyUtilityDefinition, root: HTMLElement, report: Report): ResolvedParts | null {
  const { name, roles } = definition;
  const attribute = roleAttr(name);
  const found = new Map<string, HTMLElement[]>();

  const collect = (element: HTMLElement): void => {
    const role = readRaw(element, attribute);
    if (role === null || role === ROOT_ROLE) return;
    if (!(role in roles)) {
      report('unknown-role', `"${attribute}=${role}" ist keine Rolle dieser Utility und wird ignoriert.`);
      return;
    }
    const misplaced = optionNames(element, name).filter((option) => option !== 'for');
    const firstMisplaced = misplaced[0];
    if (firstMisplaced !== undefined) {
      report(
        'option-on-part',
        `Optionen gehören an das Root-Element. "${optionAttr(name, firstMisplaced)}" am Sub-Element wird ignoriert.`,
      );
    }
    const bucket = found.get(role);
    if (bucket) bucket.push(element);
    else found.set(role, [element]);
  };

  for (const element of root.querySelectorAll<HTMLElement>(`[${attribute}]`)) {
    if (element.closest(rootSelector(name)) !== root) continue;
    collect(element);
  }

  const id = readRaw(root, optionAttr(name, 'id'));
  if (id) {
    const selector = `[${optionAttr(name, 'for')}="${escapeValue(id)}"]`;
    for (const element of document.querySelectorAll<HTMLElement>(selector)) {
      if (root.contains(element)) continue;
      collect(element);
    }
  }

  const parts: ResolvedParts = {};
  for (const [role, spec] of Object.entries(roles)) {
    if (role === ROOT_ROLE) continue;
    const elements = found.get(role) ?? [];

    if (spec.many) {
      if (spec.required && elements.length === 0) {
        report(`missing-${role}`, `Kein Element mit "${attribute}=${role}" im Scope. Instanz wird übersprungen.`);
        return null;
      }
      parts[role] = elements;
      continue;
    }

    if (elements.length > 1) {
      report(
        `duplicate-${role}`,
        `Mehrere Elemente mit "${attribute}=${role}" im gleichen Scope. Das erste wird verwendet.`,
      );
    }
    const element = elements[0] ?? null;
    if (element === null && spec.required) {
      report(`missing-${role}`, `Kein Element mit "${attribute}=${role}" im Scope. Instanz wird übersprungen.`);
      return null;
    }
    parts[role] = element;
  }

  return parts;
}
