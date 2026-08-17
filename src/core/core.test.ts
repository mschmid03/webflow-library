import { beforeEach, describe, expect, it, vi } from 'vitest';
import { bool, cls, coerce, defineUtility, destroy, list, ms, num, oneOf, register, scan, str } from './index';
import type { Instance } from './types';

const roles = { root: {}, trigger: { required: true }, item: { many: true }, label: {} } as const;
const options = { title: str(''), size: num(0) };

type DemoInstance = Instance<typeof options, typeof roles>;

const instances: DemoInstance[] = [];
const cleanup = vi.fn();

const demo = defineUtility({
  name: 'demo',
  roles,
  options,
  init(instance) {
    instances.push(instance);
    return cleanup;
  },
});

register(demo);

beforeEach(() => {
  document.body.innerHTML = '';
  instances.length = 0;
  cleanup.mockClear();
  vi.restoreAllMocks();
});

describe('Instanz-Auflösung', () => {
  it('ordnet Sub-Elemente dem nächsten Root zu', () => {
    document.body.innerHTML = `
      <section wl-demo="root" id="outer">
        <button wl-demo="trigger" id="outer-trigger"></button>
        <div wl-demo="root" id="inner">
          <button wl-demo="trigger" id="inner-trigger"></button>
        </div>
      </section>
    `;

    scan(document.body);

    expect(instances).toHaveLength(2);
    const byRoot = new Map(instances.map((instance) => [instance.root.id, instance.parts.trigger.id]));
    expect(byRoot.get('outer')).toBe('outer-trigger');
    expect(byRoot.get('inner')).toBe('inner-trigger');
  });

  it('liefert many-Rollen als Array und fehlende optionale Rollen als null', () => {
    document.body.innerHTML = `
      <div wl-demo="root">
        <button wl-demo="trigger"></button>
        <div wl-demo="item"></div>
        <div wl-demo="item"></div>
      </div>
    `;

    scan(document.body);

    expect(instances[0]?.parts.item).toHaveLength(2);
    expect(instances[0]?.parts.label).toBeNull();
  });

  it('startet nicht, wenn eine Pflichtrolle fehlt', () => {
    document.body.innerHTML = '<div wl-demo="root"></div>';

    scan(document.body);

    const root = document.querySelector('[wl-demo="root"]');
    expect(instances).toHaveLength(0);
    expect(root?.getAttribute('wl-error')).toBe('demo:missing-trigger');
    expect(root?.hasAttribute('wl-init')).toBe(false);
  });

  it('bindet externe Teile über id und for', () => {
    document.body.innerHTML = `
      <div wl-demo="root" wl-demo-id="pricing">
        <button wl-demo="trigger"></button>
      </div>
      <span wl-demo="label" wl-demo-for="pricing" id="external"></span>
    `;

    scan(document.body);

    expect(instances[0]?.parts.label?.id).toBe('external');
  });

  it('meldet unbekannte Rollen und Optionen an Sub-Elementen', () => {
    document.body.innerHTML = `
      <div wl-demo="root">
        <button wl-demo="trigger" wl-demo-size="4"></button>
        <div wl-demo="triggr"></div>
      </div>
    `;

    scan(document.body);

    const errors = document.querySelector('[wl-demo="root"]')?.getAttribute('wl-error')?.split(' ') ?? [];
    expect(errors).toContain('demo:option-on-part');
    expect(errors).toContain('demo:unknown-role');
  });

  it('nutzt bei doppelter Einzelrolle das erste Element und meldet es', () => {
    document.body.innerHTML = `
      <div wl-demo="root">
        <button wl-demo="trigger" id="first"></button>
        <button wl-demo="trigger" id="second"></button>
      </div>
    `;

    scan(document.body);

    expect(instances[0]?.parts.trigger.id).toBe('first');
    expect(document.querySelector('[wl-demo="root"]')?.getAttribute('wl-error')).toBe('demo:duplicate-trigger');
  });
});

describe('Optionen am Root', () => {
  it('liest Werte am Root und ignoriert Optionen an Sub-Elementen', () => {
    document.body.innerHTML = `
      <div wl-demo="root" wl-demo-title="Preise" wl-demo-size="3">
        <button wl-demo="trigger" wl-demo-size="99"></button>
      </div>
    `;

    scan(document.body);

    expect(instances[0]?.options).toEqual({ title: 'Preise', size: 3 });
  });
});

describe('Lifecycle', () => {
  it('markiert Instanzen und initialisiert nicht doppelt', () => {
    document.body.innerHTML = '<div wl-demo="root"><button wl-demo="trigger"></button></div>';

    scan(document.body);
    scan(document.body);

    expect(instances).toHaveLength(1);
    expect(document.querySelector('[wl-demo="root"]')?.getAttribute('wl-init')).toBe('demo');
  });

  it('ruft Cleanup beim Abräumen und initialisiert danach wieder', () => {
    document.body.innerHTML = '<div wl-demo="root"><button wl-demo="trigger"></button></div>';

    scan(document.body);
    destroy(document.body);

    expect(cleanup).toHaveBeenCalledTimes(1);

    scan(document.body);

    expect(instances).toHaveLength(2);
  });
});

describe('Werte-Coercion', () => {
  it('akzeptiert nur true und false als Boolean', () => {
    expect(coerce(bool(false), 'true')).toEqual({ ok: true, value: true });
    expect(coerce(bool(false), 'TRUE')).toEqual({ ok: true, value: true });
    expect(coerce(bool(false), 'yes').ok).toBe(false);
  });

  it('akzeptiert bei ms nur ganze, nicht negative Millisekunden', () => {
    expect(coerce(ms(0), '250')).toEqual({ ok: true, value: 250 });
    expect(coerce(ms(0), '250ms').ok).toBe(false);
    expect(coerce(ms(0), '2.5').ok).toBe(false);
    expect(coerce(ms(0), '-1').ok).toBe(false);
  });

  it('akzeptiert bei num Punkt als Dezimaltrenner', () => {
    expect(coerce(num(0), '1.5')).toEqual({ ok: true, value: 1.5 });
    expect(coerce(num(0), '1,5').ok).toBe(false);
  });

  it('trennt Listen an Kommas und Klassen an Leerzeichen', () => {
    expect(coerce(list([]), ' a , b ,')).toEqual({ ok: true, value: ['a', 'b'] });
    expect(coerce(cls([]), 'is-visible  is-active')).toEqual({ ok: true, value: ['is-visible', 'is-active'] });
  });

  it('prüft Enum-Werte gegen die Liste', () => {
    const option = oneOf(['visible', 'load'] as const, 'visible');
    expect(coerce(option, 'load')).toEqual({ ok: true, value: 'load' });
    expect(coerce(option, 'sofort').ok).toBe(false);
  });
});
