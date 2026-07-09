/**
 * Text form of the deleted marker for the usage CHARTS and EXPORTS, where a
 * Tag component can't be used (chart legends, Excel cells). Renders
 * "<label> [<Deleted>.<id>]", or "<label> [<Deleted>]" when no id is available
 * (e.g. the Tokens tab, whose backend nulls the id for deleted entities).
 *
 * The filter dropdowns and table cells use the <DeletedTag> component instead;
 * this keeps that same information as plain text for surfaces that only take
 * strings.
 */
export const withDeletedMark = (
  label: string | undefined | null,
  deleted: boolean | undefined | null,
  deletedWord: string,
  id?: string | number | null
): string => {
  const safeLabel = label || '';
  if (!deleted) return safeLabel;
  const suffix = `[${deletedWord}${id != null ? `.#${id}` : ''}]`;
  return safeLabel ? `${safeLabel} ${suffix}` : suffix;
};
