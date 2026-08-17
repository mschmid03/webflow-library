import { warn } from './errors';
import type { AnyUtilityDefinition, OptionSpecs, RoleSpecs, UtilityDefinition } from './types';

const utilities = new Map<string, AnyUtilityDefinition>();
const NAME_PATTERN = /^[a-z]{3,12}$/;

/** Erzeugt eine Utility-Definition. Registrierung passiert in `src/index.ts`. */
export function defineUtility<O extends OptionSpecs, R extends RoleSpecs>(
  definition: UtilityDefinition<O, R>,
): UtilityDefinition<O, R> {
  return definition;
}

export function register(...definitions: AnyUtilityDefinition[]): void {
  for (const definition of definitions) {
    if (!NAME_PATTERN.test(definition.name)) {
      warn('core', `Utility-Name "${definition.name}" ist ungültig: genau ein Token, 3–12 Kleinbuchstaben, kein Bindestrich.`);
      continue;
    }
    if (utilities.has(definition.name)) {
      warn('core', `Utility "${definition.name}" ist bereits registriert und wird ignoriert.`);
      continue;
    }
    utilities.set(definition.name, definition);
  }
}

export function registered(): AnyUtilityDefinition[] {
  return [...utilities.values()];
}
