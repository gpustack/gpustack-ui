import { Table as SealTable } from '@gpustack/core-ui';
import { createStyles } from 'antd-style';
import type { ComponentProps } from 'react';

const useStyles = createStyles(({ css }) => ({
  wrapper: css`
    --seal-table-row-min-height: 48px;
    .seal-table-container {
      --seal-table-header-height: 80px;
    }
    .header-row-wrapper {
      height: auto;
      min-height: 80px;
      align-items: stretch;
    }
    .table-header {
      height: auto;
      min-height: 80px;
      padding-block: var(--ant-padding-sm);
    }
    .table-header .data-overflow,
    .table-header .table-header-cell {
      white-space: normal !important;
      overflow: visible;
      text-overflow: clip;
    }
    .row-wrapper {
      cursor: pointer;
    }
    .row-wrapper:has([data-benchmark-selected='true']) {
      background: var(--ant-color-primary-bg);
    }
    .row-wrapper:focus-within {
      outline: 1px solid var(--ant-color-primary);
      outline-offset: -1px;
    }
  `
}));

// core-ui's grid Table deliberately has no antd onRow/rowClassName API.
// Delegate to its rendered row and keep the first cell keyboard accessible.
export default function StageTable({
  dataSource,
  columns = [],
  selectedId,
  onSelect,
  ...props
}: ComponentProps<typeof SealTable> & {
  selectedId?: number | null;
  onSelect?: (point: any) => void;
}) {
  const { styles } = useStyles();
  const selectTarget = (target: EventTarget | null) => {
    if (!(target instanceof Element)) return;
    const marker =
      target.closest('.row-wrapper')?.querySelector('[data-benchmark-point]') ||
      target.closest('[data-benchmark-point]');
    const point = dataSource.find(
      (item) => String(item.id) === marker?.getAttribute('data-benchmark-point')
    );
    if (point) onSelect?.(point);
  };
  return (
    <div
      className={styles.wrapper}
      onClick={(event) => selectTarget(event.target)}
      onKeyDown={(event) => {
        if (event.key === 'Enter' || event.key === ' ') {
          event.preventDefault();
          selectTarget(event.target);
        }
      }}
    >
      <SealTable
        {...props}
        loading={props.loading ?? false}
        dataSource={dataSource}
        columns={columns.map((column, index) =>
          index
            ? column
            : {
                ...column,
                render: (value: unknown, point: any) => (
                  <span
                    role="button"
                    tabIndex={0}
                    data-benchmark-point={point.id}
                    data-benchmark-selected={point.id === selectedId}
                    style={{ width: '100%' }}
                  >
                    {column.render
                      ? column.render(value, point)
                      : String(value ?? '—')}
                  </span>
                )
              }
        )}
      />
    </div>
  );
}
