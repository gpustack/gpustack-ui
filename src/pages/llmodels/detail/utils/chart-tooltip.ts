export interface ChartTooltipRow {
  name: string;
  value: string;
  color: string;
}

// Match the benchmark readout while keeping engine/resource labels as text.
export const chartTooltip = (
  header: string,
  rows: ChartTooltipRow[],
  footer?: string
): HTMLElement => {
  const root = document.createElement('div');
  root.className = 'model-metric-tooltip';
  root.setAttribute('role', 'tooltip');
  root.style.fontSize = '12px';
  root.style.width = 'max-content';
  root.style.maxWidth = 'min(440px, 80vw)';
  root.style.whiteSpace = 'normal';
  const title = document.createElement('div');
  title.style.opacity = '0.7';
  title.textContent = header;
  root.append(title);
  for (const row of rows) {
    const item = document.createElement('div');
    Object.assign(item.style, {
      display: 'grid',
      gridTemplateColumns: '7px minmax(0, 1fr) max-content',
      alignItems: 'center',
      columnGap: '6px',
      marginTop: '3px'
    });
    const dot = document.createElement('span');
    Object.assign(dot.style, {
      width: '7px',
      height: '7px',
      borderRadius: '50%',
      backgroundColor: row.color
    });
    dot.setAttribute('aria-hidden', 'true');
    const name = document.createElement('span');
    name.style.overflowWrap = 'anywhere';
    name.textContent = row.name;
    const value = document.createElement('span');
    value.style.whiteSpace = 'nowrap';
    value.style.fontVariantNumeric = 'tabular-nums';
    value.textContent = row.value;
    item.append(dot, name, value);
    root.append(item);
  }
  if (footer) {
    const note = document.createElement('div');
    note.style.opacity = '0.7';
    note.style.marginTop = '3px';
    note.textContent = footer;
    root.append(note);
  }
  return root;
};
