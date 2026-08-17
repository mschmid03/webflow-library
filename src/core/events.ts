export function emit(
  root: HTMLElement,
  utility: string,
  action: string,
  detail: Record<string, unknown> = {},
): void {
  root.dispatchEvent(
    new CustomEvent(`wl:${utility}:${action}`, {
      bubbles: true,
      detail: { root, ...detail },
    }),
  );
}
