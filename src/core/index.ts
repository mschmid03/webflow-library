export { announce, ensureFocusable, ensureId, onActivate, prefersReducedMotion } from './a11y';
export { ERROR_ATTR, INIT_ATTR, optionAttr, PREFIX, roleAttr, ROOT_ROLE } from './attributes';
export { start, VERSION, type PublicApi } from './bootstrap';
export { destroy, scan } from './instances';
export { disconnect, observe } from './observer';
export { bool, cls, coerce, list, ms, num, oneOf, readOptions, required, str } from './options';
export { defineUtility, register, registered } from './registry';
export type {
  Cleanup,
  Instance,
  OptionSpec,
  OptionSpecs,
  OptionValues,
  Parts,
  RoleSpec,
  RoleSpecs,
  UtilityDefinition,
} from './types';
