import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { destroy, register, scan } from '../../core';
import timespan from './index';

register(timespan);

/** jsdom rendert nicht: die Breite einer Startzeit wird aus `data-width` gelesen. */
function stubWidths(): void {
  vi.spyOn(HTMLElement.prototype, 'getBoundingClientRect').mockImplementation(function (this: HTMLElement) {
    const width = Number(this.dataset.width ?? 0);
    return { width, height: 0, top: 0, left: 0, right: width, bottom: 0, x: 0, y: 0, toJSON: () => ({}) };
  });
}

function starts(): HTMLElement[] {
  return [...document.querySelectorAll<HTMLElement>('[wl-timespan="start"]')];
}

const MARKUP = `
  <div wl-timespan="root">
    <p><span wl-timespan="start" data-width="40.2">8:00</span> – 11:45</p>
    <p><span wl-timespan="start" data-width="52.6">15:00</span> – 17:00</p>
    <p><span wl-timespan="start" data-width="40.2">8:00</span> – 11:45</p>
  </div>
`;

beforeEach(() => {
  document.body.innerHTML = '';
  vi.restoreAllMocks();
  stubWidths();
});

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('Verhalten', () => {
  it('gibt allen Startzeiten die aufgerundete Breite der breitesten', () => {
    document.body.innerHTML = MARKUP;
    scan(document.body);

    for (const start of starts()) {
      expect(start.style.minWidth).toBe('53px');
      expect(start.style.display).toBe('inline-block');
    }
  });

  it('lässt ein bereits blockartiges Display unangetastet', () => {
    document.body.innerHTML = `
      <div wl-timespan="root">
        <div wl-timespan="start" style="display: flex" data-width="30">8:00</div>
      </div>
    `;
    scan(document.body);

    expect(starts()[0]?.style.display).toBe('flex');
    expect(starts()[0]?.style.minWidth).toBe('30px');
  });

  it('setzt bei versteckter Instanz keine Breite und misst beim Resize neu', () => {
    const fake: { notify?: () => void } = {};
    vi.stubGlobal(
      'ResizeObserver',
      class {
        constructor(callback: () => void) {
          fake.notify = callback;
        }
        observe(): void {}
        disconnect(): void {}
      },
    );
    document.body.innerHTML = MARKUP;
    const [first, second] = starts();
    const visibleWidth = second!.dataset.width!;
    second!.dataset.width = '0';
    first!.dataset.width = '0';
    starts()[2]!.dataset.width = '0';

    scan(document.body);
    expect(second!.style.minWidth).toBe('');

    second!.dataset.width = visibleWidth;
    fake.notify?.();
    expect(first!.style.minWidth).toBe('53px');
  });

  it('richtet jede Instanz für sich aus', () => {
    document.body.innerHTML = `
      <div wl-timespan="root"><span wl-timespan="start" data-width="40">8:00</span></div>
      <div wl-timespan="root"><span wl-timespan="start" data-width="50">15:00</span></div>
    `;
    scan(document.body);

    expect(starts().map((start) => start.style.minWidth)).toEqual(['40px', '50px']);
  });

  it('meldet fehlende Startzeiten', () => {
    vi.spyOn(console, 'warn').mockImplementation(() => {});
    document.body.innerHTML = '<div wl-timespan="root"><p>8:00 – 11:45</p></div>';
    scan(document.body);

    const root = document.querySelector('[wl-timespan="root"]');
    expect(root?.getAttribute('wl-error')).toBe('timespan:missing-start');
    expect(root?.hasAttribute('wl-init')).toBe(false);
  });

  it('meldet unbekannte Optionen, ohne die Instanz zu blockieren', () => {
    vi.spyOn(console, 'warn').mockImplementation(() => {});
    document.body.innerHTML = MARKUP.replace('wl-timespan="root"', 'wl-timespan="root" wl-timespan-gap="4"');
    scan(document.body);

    const root = document.querySelector('[wl-timespan="root"]');
    expect(root?.getAttribute('wl-error')).toBe('timespan:unknown-option');
    expect(starts()[0]?.style.minWidth).toBe('53px');
  });
});

describe('Lifecycle', () => {
  it('ist idempotent: zweiter Scan verändert nichts', () => {
    document.body.innerHTML = MARKUP;
    scan(document.body);
    for (const start of starts()) start.dataset.width = '99';

    scan(document.body);

    expect(starts()[0]?.style.minWidth).toBe('53px');
  });

  it('initialisiert nachgeladene CMS-Elemente beim erneuten Scan des Teilbaums', () => {
    document.body.innerHTML = '<div class="w-dyn-items"></div>';
    const list = document.body.firstElementChild as HTMLElement;
    list.innerHTML = MARKUP;

    scan(list);

    expect(starts()[1]?.style.minWidth).toBe('53px');
  });

  it('stellt beim Abräumen die ursprünglichen Inline-Styles wieder her', () => {
    document.body.innerHTML = MARKUP;
    const root = document.querySelector<HTMLElement>('[wl-timespan="root"]')!;
    scan(document.body);

    destroy(document.body);

    for (const start of starts()) {
      expect(start.style.minWidth).toBe('');
      expect(start.style.display).toBe('');
    }
    expect(root.hasAttribute('wl-init')).toBe(false);
  });
});
