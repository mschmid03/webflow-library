export type OptionType = 'str' | 'num' | 'ms' | 'bool' | 'enum' | 'list' | 'cls';

export interface OptionSpec<T> {
  readonly type: OptionType;
  readonly required: boolean;
  readonly fallback: T;
  readonly values?: readonly string[];
}

/** `any` ist nötig, damit die Registry Utilities mit unterschiedlichen Options-Typen halten kann. */
export type OptionSpecs = Record<string, OptionSpec<any>>;

export type OptionValues<O> = {
  readonly [K in keyof O]: O[K] extends OptionSpec<infer T> ? T : never;
};

/** `required`/`many` sind absichtlich auf `true` typisiert: so bleiben Literale literal und `parts` wird präzise typisiert. */
export interface RoleSpec {
  readonly required?: true;
  readonly many?: true;
}

export type RoleSpecs = Record<string, RoleSpec> & { readonly root: RoleSpec };

export type PartOf<S> = S extends { many: true }
  ? HTMLElement[]
  : S extends { required: true }
    ? HTMLElement
    : HTMLElement | null;

export type Parts<R> = {
  readonly [K in Exclude<keyof R, 'root'>]: PartOf<R[K]>;
};

export type Cleanup = () => void;

export interface Instance<O, R> {
  /** Name der Utility, z. B. `count`. */
  readonly utility: string;
  /** Element mit `wl-<utility>="root"`. Gleichzeitig der Scope der Instanz. */
  readonly root: HTMLElement;
  /** Aufgelöste Sub-Elemente nach Rolle. */
  readonly parts: Parts<R>;
  /** Am Root gelesene und typisierte Optionen. */
  readonly options: OptionValues<O>;
  /** Meldet einen Konfigurationsfehler: `console.warn` + `wl-error="<utility>:<code>"`. */
  fail(code: string, message?: string): void;
  /** Feuert `wl:<utility>:<action>` am Root, bubbelnd, `detail` enthält immer `root`. */
  emit(action: string, detail?: Record<string, unknown>): void;
}

export interface UtilityDefinition<O extends OptionSpecs, R extends RoleSpecs> {
  readonly name: string;
  readonly roles: R;
  readonly options: O;
  init(instance: Instance<O, R>): void | Cleanup;
}

export type AnyUtilityDefinition = UtilityDefinition<OptionSpecs, RoleSpecs>;

export interface Report {
  (code: string, message: string): void;
}
