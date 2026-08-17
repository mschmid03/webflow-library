import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { destroy, register, scan } from '../../core';
import count, { formatCount } from './index';

register(count);

function mount(html: string): HTMLElement {
  document.body.innerHTML = html;
  const root = document.body.firstElementChild;
  if (!(root instanceof HTMLElement)) throw new Error('Kein Root-Element im Test-Markup.');
  return root;
}

function stubReducedMotion(matches: boolean): void {
  vi.stubGlobal('matchMedia', (media: string) => ({
    matches,
    media,
    onchange: null,
    addListener: () => {},
    removeListener: () => {},
    addEventListener: () => {},
    removeEventListener: () => {},
    dispatchEvent: () => false,
  }));
}

beforeEach(() => {
  document.body.innerHTML = '';
  vi.restoreAllMocks();
});

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('formatCount', () => {
  it('gruppiert Tausender mit dem gesetzten Trennzeichen', () => {
    expect(formatCount(1200, 0, '.')).toBe('1.200');
    expect(formatCount(1234567, 0, ',')).toBe('1,234,567');
    expect(formatCount(1200, 0, '')).toBe('1200');
  });

  it('leitet das Dezimalzeichen aus dem Trennzeichen ab', () => {
    expect(formatCount(1234.5, 1, '.')).toBe('1.234,5');
    expect(formatCount(1234.5, 1, ',')).toBe('1,234.5');
  });

  it('rundet auf die gewünschten Dezimalstellen und behält das Vorzeichen', () => {
    expect(formatCount(2.345, 2, '')).toBe('2,35');
    expect(formatCount(-1500, 0, '.')).toBe('-1.500');
  });
});

describe('Options-Parsing', () => {
  it('startet nicht ohne Pflichtoption und meldet den Fehler am Element', () => {
    const root = mount('<div wl-count="root">Platzhalter</div>');
    scan(document.body);

    expect(root.hasAttribute('wl-init')).toBe(false);
    expect(root.getAttribute('wl-error')).toBe('count:missing-to');
    expect(root.textContent).toBe('Platzhalter');
  });

  it('startet nicht bei ungültiger Pflichtoption', () => {
    const root = mount('<div wl-count="root" wl-count-to="viele">0</div>');
    scan(document.body);

    expect(root.hasAttribute('wl-init')).toBe(false);
    expect(root.getAttribute('wl-error')).toBe('count:invalid-to');
  });

  it('nutzt den Standardwert bei ungültiger optionaler Option und startet trotzdem', () => {
    stubReducedMotion(true);
    const root = mount('<div wl-count="root" wl-count-to="10" wl-count-duration="1600ms" wl-count-start="load">0</div>');
    scan(document.body);

    expect(root.getAttribute('wl-init')).toBe('count');
    expect(root.getAttribute('wl-error')).toBe('count:invalid-duration');
    expect(root.textContent).toBe('10');
  });

  it('meldet unbekannte Optionen, ohne die Instanz zu blockieren', () => {
    stubReducedMotion(true);
    const root = mount('<div wl-count="root" wl-count-to="10" wl-count-durationn="500" wl-count-start="load">0</div>');
    scan(document.body);

    expect(root.getAttribute('wl-init')).toBe('count');
    expect(root.getAttribute('wl-error')).toBe('count:unknown-option');
  });

  it('lehnt Enum-Werte außerhalb der Liste ab und fällt auf den Standard zurück', () => {
    const root = mount('<div wl-count="root" wl-count-to="10" wl-count-start="sofort">0</div>');
    scan(document.body);

    expect(root.getAttribute('wl-error')).toBe('count:invalid-start');
  });
});

describe('Verhalten', () => {
  it('setzt bei reduzierter Bewegung sofort den Endwert', () => {
    stubReducedMotion(true);
    const root = mount('<div wl-count="root" wl-count-to="1200" wl-count-separator="." wl-count-start="load">0</div>');
    const complete = vi.fn();
    root.addEventListener('wl:count:complete', complete);

    scan(document.body);

    expect(root.textContent).toBe('1.200');
    expect(complete).toHaveBeenCalledTimes(1);
  });

  it('animiert bis zum Endwert und feuert start und complete', async () => {
    stubReducedMotion(false);
    const root = mount('<div wl-count="root" wl-count-to="50" wl-count-duration="30" wl-count-start="load">0</div>');
    const started = vi.fn();
    const completed = vi.fn();
    root.addEventListener('wl:count:start', started);
    root.addEventListener('wl:count:complete', completed);

    scan(document.body);
    expect(started).toHaveBeenCalledTimes(1);

    await vi.waitFor(() => expect(completed).toHaveBeenCalledTimes(1));
    expect(root.textContent).toBe('50');
  });

  it('bubbelt Events und liefert den Root im detail', () => {
    stubReducedMotion(true);
    const root = mount('<div wl-count="root" wl-count-to="7" wl-count-start="load">0</div>');
    let detail: unknown = null;
    document.addEventListener('wl:count:complete', (event) => {
      detail = (event as CustomEvent).detail;
    });

    scan(document.body);

    expect(detail).toEqual({ root, value: 7 });
  });

  it('startet erst bei Sichtbarkeit, wenn start auf visible steht', () => {
    stubReducedMotion(true);
    const observed: Element[] = [];
    const fake: { notify?: (entries: Partial<IntersectionObserverEntry>[]) => void } = {};
    vi.stubGlobal(
      'IntersectionObserver',
      class {
        constructor(callback: (entries: Partial<IntersectionObserverEntry>[]) => void) {
          fake.notify = callback;
        }
        observe(element: Element) {
          observed.push(element);
        }
        disconnect() {}
      },
    );

    const root = mount('<div wl-count="root" wl-count-to="9">0</div>');
    scan(document.body);

    expect(observed).toEqual([root]);
    expect(root.textContent).toBe('0');

    fake.notify?.([{ isIntersecting: true }]);
    expect(root.textContent).toBe('9');
  });
});

describe('Lifecycle', () => {
  it('ist idempotent: zweiter Scan verändert nichts', () => {
    stubReducedMotion(true);
    const root = mount('<div wl-count="root" wl-count-to="5" wl-count-start="load">0</div>');
    scan(document.body);
    root.textContent = 'unangetastet';

    scan(document.body);

    expect(root.textContent).toBe('unangetastet');
    expect(root.getAttribute('wl-init')).toBe('count');
  });

  it('initialisiert mehrere Instanzen auf einer Seite unabhängig', () => {
    stubReducedMotion(true);
    document.body.innerHTML = `
      <div wl-count="root" wl-count-to="10" wl-count-start="load">0</div>
      <div wl-count="root" wl-count-to="20" wl-count-start="load">0</div>
    `;
    scan(document.body);

    const [first, second] = Array.from(document.querySelectorAll('[wl-count="root"]'));
    expect(first?.textContent).toBe('10');
    expect(second?.textContent).toBe('20');
  });

  it('initialisiert nachgeladene CMS-Elemente beim erneuten Scan des Teilbaums', () => {
    stubReducedMotion(true);
    const list = mount('<div class="w-dyn-items"></div>');
    list.innerHTML = '<div wl-count="root" wl-count-to="42" wl-count-start="load">0</div>';

    scan(list);

    expect(list.firstElementChild?.textContent).toBe('42');
  });

  it('entfernt den Init-Marker beim Abräumen', () => {
    stubReducedMotion(true);
    const root = mount('<div wl-count="root" wl-count-to="5" wl-count-start="load">0</div>');
    scan(document.body);

    destroy(document.body);

    expect(root.hasAttribute('wl-init')).toBe(false);
  });
});
