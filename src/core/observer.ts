import { destroy, scan } from './instances';

let observer: MutationObserver | null = null;
let scheduled = false;
const pendingAdded = new Set<Element>();
const pendingRemoved = new Set<Element>();

/** Ein einziger Observer für die ganze Seite: deckt CMS-Nachladen, Pagination, Filter und Tabs ab. */
export function observe(target: Element): void {
  if (observer) return;
  observer = new MutationObserver((records) => {
    for (const record of records) {
      for (const node of record.removedNodes) if (node instanceof Element) pendingRemoved.add(node);
      for (const node of record.addedNodes) if (node instanceof Element) pendingAdded.add(node);
    }
    schedule();
  });
  observer.observe(target, { childList: true, subtree: true });
}

export function disconnect(): void {
  observer?.disconnect();
  observer = null;
  pendingAdded.clear();
  pendingRemoved.clear();
}

function schedule(): void {
  if (scheduled) return;
  scheduled = true;
  if (typeof requestAnimationFrame === 'function') requestAnimationFrame(flush);
  else setTimeout(flush, 0);
}

/** Erst Entfernungen, dann Ergänzungen: verschobene Elemente werden dadurch neu initialisiert. */
function flush(): void {
  scheduled = false;
  const removed = [...pendingRemoved];
  const added = [...pendingAdded];
  pendingRemoved.clear();
  pendingAdded.clear();

  for (const element of removed) if (!element.isConnected) destroy(element);
  for (const element of added) if (element.isConnected) scan(element);
}
