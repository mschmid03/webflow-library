import { defineUtility, ms, num, oneOf, prefersReducedMotion, required, str } from '../../core';

/** Sichtbarkeitsschwelle für `start="visible"`. Absichtlich keine Option: hält die Utility bei 6 Optionen. */
const VISIBILITY_THRESHOLD = 0.25;

function easeOutCubic(progress: number): number {
  return 1 - (1 - progress) ** 3;
}

/**
 * Tausendertrennzeichen ist `separator`. Das Dezimalzeichen wird daraus abgeleitet:
 * `separator=","` ergibt `.`, alles andere ergibt `,`.
 */
export function formatCount(value: number, decimals: number, separator: string): string {
  const places = Math.max(0, Math.round(decimals));
  const [integers = '0', fraction] = Math.abs(value).toFixed(places).split('.');
  const grouped = separator ? integers.replace(/\B(?=(\d{3})+(?!\d))/g, separator) : integers;
  const decimalMark = separator === ',' ? '.' : ',';
  const sign = value < 0 ? '-' : '';
  return fraction ? `${sign}${grouped}${decimalMark}${fraction}` : `${sign}${grouped}`;
}

export default defineUtility({
  name: 'count',
  roles: {
    root: {},
  },
  options: {
    to: num(required),
    from: num(0),
    duration: ms(1200),
    decimals: num(0),
    separator: str(''),
    start: oneOf(['visible', 'load'] as const, 'visible'),
  },
  init({ root, options, emit }) {
    const { to, from, duration, decimals, separator, start } = options;
    const render = (value: number): void => {
      root.textContent = formatCount(value, decimals, separator);
    };

    let frame = 0;
    let observer: IntersectionObserver | null = null;
    let started = false;

    const finish = (): void => {
      render(to);
      emit('complete', { value: to });
    };

    const run = (): void => {
      if (started) return;
      started = true;

      if (duration <= 0 || prefersReducedMotion()) {
        finish();
        return;
      }

      emit('start', { value: from });
      const begin = performance.now();
      const step = (now: number): void => {
        const progress = Math.min((now - begin) / duration, 1);
        if (progress < 1) {
          render(from + (to - from) * easeOutCubic(progress));
          frame = requestAnimationFrame(step);
          return;
        }
        frame = 0;
        finish();
      };
      frame = requestAnimationFrame(step);
    };

    render(from);

    if (start === 'load' || typeof IntersectionObserver === 'undefined') {
      run();
    } else {
      observer = new IntersectionObserver(
        (entries) => {
          if (!entries.some((entry) => entry.isIntersecting)) return;
          observer?.disconnect();
          observer = null;
          run();
        },
        { threshold: VISIBILITY_THRESHOLD },
      );
      observer.observe(root);
    }

    return () => {
      observer?.disconnect();
      observer = null;
      if (frame) cancelAnimationFrame(frame);
    };
  },
});
