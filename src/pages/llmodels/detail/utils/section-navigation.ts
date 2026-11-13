// Collapse animates its height. Scrolling while that height is still zero
// clamps the scroll offset to the old page length and misses the section.
export const scrollWhenSectionSettles = (id: string) => {
  let frame = 0;
  let previousHeight = -1;
  let previousTop = -1;
  let stableFrames = 0;
  const started = performance.now();
  const measure = () => {
    const target = document.getElementById(id);
    if (!target?.isConnected) return;
    const panel = target.closest('.ant-collapse-item') || target;
    const header = panel.querySelector('.ant-collapse-header');
    const content = panel.querySelector(
      '.ant-collapse-panel, .ant-collapse-content'
    );
    const ready =
      !header ||
      (header.getAttribute('aria-expanded') === 'true' &&
        !!content &&
        content.getBoundingClientRect().height > 0);
    const height = panel.getBoundingClientRect().height;
    const top = target.getBoundingClientRect().top;
    stableFrames =
      ready &&
      Math.abs(height - previousHeight) < 0.5 &&
      Math.abs(top - previousTop) < 0.5
        ? stableFrames + 1
        : 0;
    previousHeight = height;
    previousTop = top;
    if (stableFrames >= 4 || performance.now() - started > 1000) {
      target.scrollIntoView({ block: 'start', behavior: 'auto' });
      target
        .closest<HTMLElement>('[role="button"]')
        ?.focus({ preventScroll: true });
      const viewport = target.closest<HTMLElement>(
        '[data-overlayscrollbars-viewport]'
      );
      if (viewport) {
        // The viewport's overflow extent can lag the Collapse layout. Recheck
        // the actual scroll offset so an early clamped scroll is not final.
        let alignedFrames = 0;
        const align = () => {
          if (!target.isConnected || !viewport.isConnected) return;
          const margin =
            parseFloat(
              target.ownerDocument.defaultView?.getComputedStyle(target)
                .scrollMarginTop || ''
            ) || 0;
          const desired = Math.max(
            0,
            viewport.scrollTop +
              target.getBoundingClientRect().top -
              viewport.getBoundingClientRect().top -
              margin
          );
          const aligned = Math.abs(viewport.scrollTop - desired) < 1;
          alignedFrames = aligned ? alignedFrames + 1 : 0;
          if (!aligned) viewport.scrollTop = desired;
          if (alignedFrames < 4 && performance.now() - started < 1500)
            frame = requestAnimationFrame(align);
        };
        frame = requestAnimationFrame(align);
      }
      return;
    }
    frame = requestAnimationFrame(measure);
  };
  frame = requestAnimationFrame(measure);
  return () => cancelAnimationFrame(frame);
};
