import { defineUtility } from '../../core';

export default defineUtility({
  name: 'timespan',
  roles: {
    root: {},
    start: { required: true, many: true },
  },
  options: {},
  init({ root, parts }) {
    const starts = parts.start;
    const previous = starts.map((start) => ({ display: start.style.display, minWidth: start.style.minWidth }));

    // `min-width` greift nicht an Inline-Elementen wie einem Webflow-Span.
    for (const start of starts) {
      if (getComputedStyle(start).display === 'inline') start.style.display = 'inline-block';
    }

    const align = (): void => {
      for (const start of starts) start.style.minWidth = '';
      const widest = Math.max(...starts.map((start) => start.getBoundingClientRect().width));
      // Versteckte Instanz (Tab, Dropdown): nichts setzen, der ResizeObserver misst beim Einblenden neu.
      if (widest <= 0) return;
      const minWidth = `${Math.ceil(widest)}px`;
      for (const start of starts) start.style.minWidth = minWidth;
    };

    align();

    let active = true;
    document.fonts?.ready.then(() => {
      if (active) align();
    });

    // Fängt Breakpoints, Einblenden aus `display: none` und spät geladene Webfonts ab.
    let observer: ResizeObserver | null = null;
    if (typeof ResizeObserver !== 'undefined') {
      observer = new ResizeObserver(align);
      observer.observe(root);
    }

    return () => {
      active = false;
      observer?.disconnect();
      observer = null;
      starts.forEach((start, index) => {
        start.style.display = previous[index]?.display ?? '';
        start.style.minWidth = previous[index]?.minWidth ?? '';
      });
    };
  },
});
