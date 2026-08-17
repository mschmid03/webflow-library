import { optionAttr, optionNames, readRaw, RESERVED_OPTIONS } from './attributes';
import type { OptionSpec, OptionSpecs, Report } from './types';

interface Requirement {
  readonly required: true;
}

/** Markiert eine Option als Pflicht: `to: num(required)`. */
export const required: Requirement = { required: true };

function isRequirement(value: unknown): value is Requirement {
  return typeof value === 'object' && value !== null && !Array.isArray(value) && (value as Requirement).required === true;
}

function spec<T>(type: OptionSpec<T>['type'], arg: T | Requirement, values?: readonly string[]): OptionSpec<T> {
  if (isRequirement(arg)) return { type, required: true, fallback: undefined as T, values };
  return { type, required: false, fallback: arg, values };
}

export function str(arg: string | Requirement): OptionSpec<string> {
  return spec('str', arg);
}

export function num(arg: number | Requirement): OptionSpec<number> {
  return spec('num', arg);
}

/** Ganze Millisekunden, `>= 0`. */
export function ms(arg: number | Requirement): OptionSpec<number> {
  return spec('ms', arg);
}

export function bool(arg: boolean | Requirement): OptionSpec<boolean> {
  return spec('bool', arg);
}

/** Komma-getrennte Liste. */
export function list(arg: string[] | Requirement): OptionSpec<string[]> {
  return spec('list', arg);
}

/** Klassennamen, leerzeichen-getrennt wie in `class`. */
export function cls(arg: string[] | Requirement): OptionSpec<string[]> {
  return spec('cls', arg);
}

export function oneOf<V extends string>(values: readonly V[], arg: V | Requirement): OptionSpec<V> {
  return spec('enum', arg, values);
}

export function coerce<T>(option: OptionSpec<T>, raw: string): { ok: true; value: T } | { ok: false; expected: string } {
  switch (option.type) {
    case 'str':
      return { ok: true, value: raw as unknown as T };
    case 'num': {
      const value = Number(raw);
      if (!Number.isFinite(value)) return { ok: false, expected: 'eine Zahl, z. B. "1200" oder "1.5"' };
      return { ok: true, value: value as unknown as T };
    }
    case 'ms': {
      const value = Number(raw);
      if (!Number.isInteger(value) || value < 0) {
        return { ok: false, expected: 'ganze Millisekunden ohne Einheit, z. B. "1200"' };
      }
      return { ok: true, value: value as unknown as T };
    }
    case 'bool': {
      const value = raw.toLowerCase();
      if (value !== 'true' && value !== 'false') return { ok: false, expected: '"true" oder "false"' };
      return { ok: true, value: (value === 'true') as unknown as T };
    }
    case 'enum': {
      const values = option.values ?? [];
      if (!values.includes(raw)) return { ok: false, expected: values.map((value) => `"${value}"`).join(' oder ') };
      return { ok: true, value: raw as unknown as T };
    }
    case 'list': {
      const value = raw
        .split(',')
        .map((entry) => entry.trim())
        .filter(Boolean);
      return { ok: true, value: value as unknown as T };
    }
    case 'cls': {
      const value = raw.split(/\s+/).filter(Boolean);
      return { ok: true, value: value as unknown as T };
    }
  }
}

/**
 * Liest alle Optionen einer Utility am Root.
 * Rückgabe `null` bedeutet: Pflichtoption fehlt oder ist ungültig, die Instanz darf nicht starten.
 */
export function readOptions(
  utility: string,
  root: HTMLElement,
  specs: OptionSpecs,
  report: Report,
): Record<string, unknown> | null {
  const values: Record<string, unknown> = {};
  let fatal = false;

  for (const [name, option] of Object.entries(specs)) {
    const attribute = optionAttr(utility, name);
    const raw = readRaw(root, attribute);

    if (raw === null) {
      if (option.required) {
        report(`missing-${name}`, `"${attribute}" fehlt am Root. Instanz wird übersprungen.`);
        fatal = true;
        continue;
      }
      values[name] = option.fallback;
      continue;
    }

    const result = coerce(option, raw);
    if (result.ok) {
      values[name] = result.value;
      continue;
    }

    if (option.required) {
      report(`invalid-${name}`, `"${attribute}" erwartet ${result.expected}, bekam "${raw}". Instanz wird übersprungen.`);
      fatal = true;
      continue;
    }

    report(`invalid-${name}`, `"${attribute}" erwartet ${result.expected}, bekam "${raw}". Standardwert wird verwendet.`);
    values[name] = option.fallback;
  }

  for (const name of optionNames(root, utility)) {
    if (name in specs) continue;
    if ((RESERVED_OPTIONS as readonly string[]).includes(name)) continue;
    report(`unknown-option`, `"${optionAttr(utility, name)}" ist keine Option dieser Utility und wird ignoriert.`);
  }

  return fatal ? null : values;
}
