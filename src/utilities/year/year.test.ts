import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { destroy, register, scan } from '../../core';
import year from './index';

register(year);

function mount(html: string): HTMLElement {
  document.body.innerHTML = html;
  const root = document.body.firstElementChild;
  if (!(root instanceof HTMLElement)) throw new Error('Kein Root-Element im Test-Markup.');
  return root;
}

beforeEach(() => {
  document.body.innerHTML = '';
  vi.restoreAllMocks();
  vi.useFakeTimers();
  vi.setSystemTime(new Date('2026-08-26T12:00:00Z'));
});

afterEach(() => {
  vi.useRealTimers();
  vi.unstubAllGlobals();
});

describe('Verhalten', () => {
  it('setzt die aktuelle Jahreszahl als Textinhalt', () => {
    const root = mount('<span wl-year="root">2020</span>');
    scan(document.body);

    expect(root.textContent).toBe('2026');
    expect(root.getAttribute('wl-init')).toBe('year');
  });

  it('meldet unbekannte Optionen, ohne die Instanz zu blockieren', () => {
    const root = mount('<span wl-year="root" wl-year-offset="1">2020</span>');
    scan(document.body);

    expect(root.getAttribute('wl-init')).toBe('year');
    expect(root.getAttribute('wl-error')).toBe('year:unknown-option');
    expect(root.textContent).toBe('2026');
  });
});

describe('Lifecycle', () => {
  it('ist idempotent: zweiter Scan verändert nichts', () => {
    const root = mount('<span wl-year="root">2020</span>');
    scan(document.body);
    root.textContent = 'unangetastet';

    scan(document.body);

    expect(root.textContent).toBe('unangetastet');
    expect(root.getAttribute('wl-init')).toBe('year');
  });

  it('initialisiert mehrere Instanzen auf einer Seite unabhängig', () => {
    document.body.innerHTML = `
      <span wl-year="root">2020</span>
      <span wl-year="root">2020</span>
    `;
    scan(document.body);

    for (const element of document.querySelectorAll('[wl-year="root"]')) {
      expect(element.textContent).toBe('2026');
    }
  });

  it('initialisiert nachgeladene CMS-Elemente beim erneuten Scan des Teilbaums', () => {
    const list = mount('<div class="w-dyn-items"></div>');
    list.innerHTML = '<span wl-year="root">2020</span>';

    scan(list);

    expect(list.firstElementChild?.textContent).toBe('2026');
  });

  it('entfernt den Init-Marker beim Abräumen', () => {
    const root = mount('<span wl-year="root">2020</span>');
    scan(document.body);

    destroy(document.body);

    expect(root.hasAttribute('wl-init')).toBe(false);
  });
});
