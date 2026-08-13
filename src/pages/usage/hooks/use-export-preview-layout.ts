/**
 * How tall the export dialog's content box and table body should be.
 *
 * Its own file: this changes with the modal's chrome, while the column hook
 * next to it changes with the exported schema — two unrelated reasons to edit.
 */
import React from 'react';

const CONTENT_VIEWPORT_RATIO = 0.72;
const MIN_CONTENT_HEIGHT = 380;
const MAX_CONTENT_HEIGHT = 760;
// Filter bar, table header, pager, and the margins between them.
const PREVIEW_CHROME_HEIGHT = 200;
// The over-limit alert, when it is showing.
const SUGGESTIONS_HEIGHT = 96;
const MIN_PREVIEW_BODY = 200;

/**
 * How tall the dialog's content box and the table's scrolling body may be.
 *
 * ``hasSuggestions`` matters because the remedy alert appears and disappears
 * with the row count: leaving room for it unconditionally wastes a chunk of
 * every normal export, and not accounting for it pushes the pager back out of
 * view exactly when the user most needs the dialog's controls.
 */
export const useExportPreviewLayout = (
  hasSuggestions: boolean
): { contentHeight: number; bodyHeight: number } => {
  const [viewport, setViewport] = React.useState(() => window.innerHeight);
  React.useEffect(() => {
    const onResize = () => setViewport(window.innerHeight);
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);

  const contentHeight = Math.min(
    MAX_CONTENT_HEIGHT,
    Math.max(MIN_CONTENT_HEIGHT, Math.round(viewport * CONTENT_VIEWPORT_RATIO))
  );
  const bodyHeight = Math.max(
    MIN_PREVIEW_BODY,
    contentHeight -
      PREVIEW_CHROME_HEIGHT -
      (hasSuggestions ? SUGGESTIONS_HEIGHT : 0)
  );
  return { contentHeight, bodyHeight };
};
