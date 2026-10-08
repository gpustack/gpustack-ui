interface FilterOverflowLayout {
  widths: readonly number[];
  availableWidth: number;
  reservedWidth: number;
  gap: number;
  visibleCount: number;
}

/** Items are ordered by priority; the last item moves into the popover first. */
export const getVisibleFilterCount = ({
  widths,
  availableWidth,
  reservedWidth,
  gap,
  visibleCount
}: FilterOverflowLayout): number => {
  let occupiedWidth = reservedWidth;
  let count = 0;

  for (const width of widths) {
    occupiedWidth += width + gap;
    // Restoring a control needs a little spare room to avoid boundary jitter.
    const buffer = count >= visibleCount ? gap : 0;
    if (occupiedWidth + buffer > availableWidth) break;
    count += 1;
  }

  return count;
};
