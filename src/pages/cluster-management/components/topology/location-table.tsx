import { useIntl } from '@umijs/max';
import { Table, Tooltip } from 'antd';
import { createStyles } from 'antd-style';
import { useEffect, useRef, useState } from 'react';
import { TopologyWorker } from '../../config/types';
import { LocationField, isFilled, valueOptions } from './location';
import LocationCell from './location-cell';

/** Past this many rows the table renders only what is on screen. */
const VIRTUAL_THRESHOLD = 50;
const HOST_WIDTH = 180;
const FIELD_WIDTH = 180;
const SELECT_WIDTH = 40;

const useStyles = createStyles(({ css }) => ({
  table: css`
    .ant-table-cell {
      padding-block: 6px !important;
    }
    .host {
      display: inline-flex;
      align-items: center;
      gap: 8px;
      max-width: 100%;
      .dot {
        width: 8px;
        height: 8px;
        border-radius: 50%;
        flex-shrink: 0;
        background: var(--ant-color-success);
      }
      .dot.offline {
        background: transparent;
        border: 1px solid var(--ant-color-text-quaternary);
      }
      .name {
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
      }
    }
  `,
  /* A tint that fades rather than a border: the row was pointed at from the
     tree or the Workers list, and the eye needs a moment to find it, not a
     permanent mark. */
  highlight: css`
    > td {
      animation: topology-row-highlight 3s ease-out forwards;
    }
    @keyframes topology-row-highlight {
      0%,
      60% {
        background-color: var(--ant-color-primary-bg);
      }
      100% {
        background-color: transparent;
      }
    }
  `
}));

interface EditingCell {
  id: number;
  field: string;
}

interface LocationTableProps {
  /** Filtered by the toolbar; sorted here. */
  workers: TopologyWorker[];
  /** Every worker, for value ranking — the dropdown must not shrink with a filter. */
  allWorkers: TopologyWorker[];
  fields: LocationField[];
  selectedIds: number[];
  onSelectionChange: (ids: number[]) => void;
  highlightId?: number | null;
  /** Body height in px; the virtual list needs a number. */
  height: number;
  onAssign: (
    field: LocationField,
    workers: TopologyWorker[],
    value: string | null
  ) => Promise<void>;
  onBusy: (busy: boolean) => void;
}

/**
 * [S1a] One row per worker, one column per location field, every cell
 * editable in place. Unfilled rows sort first because they are the work.
 */
const LocationTable: React.FC<LocationTableProps> = ({
  workers,
  allWorkers,
  fields,
  selectedIds,
  onSelectionChange,
  highlightId,
  height,
  onAssign,
  onBusy
}) => {
  const intl = useIntl();
  const { styles } = useStyles();
  const [editing, setEditing] = useState<EditingCell | null>(null);
  const tableRef = useRef<any>(null);

  const fieldIds = fields.map((field) => field.id);
  const unfilledAny = (worker: TopologyWorker) =>
    fieldIds.some((id) => !isFilled(worker, id));

  // Unfilled first, then by rack, then by name.
  const rows = [...workers].sort((a, b) => {
    const au = unfilledAny(a);
    const bu = unfilledAny(b);
    if (au !== bu) {
      return au ? -1 : 1;
    }
    const ar = a.location?.rack?.value || '';
    const br = b.location?.rack?.value || '';
    return ar.localeCompare(br) || a.name.localeCompare(b.name);
  });

  useEffect(() => {
    if (highlightId && rows.some((row) => row.id === highlightId)) {
      tableRef.current?.scrollTo?.({ key: highlightId });
    }
  }, [highlightId]);

  const optionsByField = Object.fromEntries(
    fields.map((field) => [field.id, valueOptions(allWorkers, field.id)])
  );

  /**
   * Tab lands on the next *unfilled* cell of the same column, wrapping past
   * filled ones: the operator is filling a column, not touring it. With no
   * unfilled cell left it steps to the next row so Tab never dead-ends.
   */
  const moveEditing = (from: EditingCell, shift: boolean) => {
    const index = rows.findIndex((row) => row.id === from.id);
    const step = shift ? -1 : 1;
    let fallback: TopologyWorker | null = null;
    for (let i = index + step; i >= 0 && i < rows.length; i += step) {
      fallback = fallback || rows[i];
      if (!isFilled(rows[i], from.field)) {
        setEditing({ id: rows[i].id, field: from.field });
        return;
      }
    }
    setEditing(fallback ? { id: fallback.id, field: from.field } : null);
  };

  const fieldColumn = (field: LocationField) => ({
    // 🔴 The per-column «⋮» menu was removed in review. It held
    // «批量填未填的» and «按交换机填», both of which are still reachable —
    // selecting rows and using the bulk action does the same thing, and
    // does it with the rows in view. A menu on every column header put
    // three affordances on a table whose job is to show one value per
    // cell.
    title: field.label,
    dataIndex: ['location', field.id],
    key: field.id,
    width: FIELD_WIDTH,
    render: (_: any, worker: TopologyWorker) => (
      <LocationCell
        worker={worker}
        field={field}
        options={optionsByField[field.id] || []}
        editing={editing?.id === worker.id && editing.field === field.id}
        onStartEdit={() => setEditing({ id: worker.id, field: field.id })}
        onStopEdit={() =>
          setEditing((cur) =>
            cur?.id === worker.id && cur.field === field.id ? null : cur
          )
        }
        onSave={(value) => onAssign(field, [worker], value)}
        onTab={(shift) =>
          moveEditing({ id: worker.id, field: field.id }, shift)
        }
        onBusy={onBusy}
      />
    )
  });

  // 🔴 The two-row header band is gone with the second chain. It grouped the
  // columns under «层级» and «加速器域» so a «机柜» of the network hierarchy and
  // an Atlas 950 «计算柜» could not be read as neighbours on one scale. One
  // chain means they ARE neighbours on one scale — that is the point of the
  // model — so the band would now assert a distinction that does not exist.
  const fieldColumns: any[] = fields.map(fieldColumn);

  const columns: any[] = [
    {
      title: intl.formatMessage({ id: 'clusters.topology.field.host' }),
      dataIndex: 'name',
      key: 'name',
      fixed: 'left',
      width: HOST_WIDTH,
      render: (name: string, worker: TopologyWorker) => (
        <Tooltip
          title={
            worker.state === 'ready'
              ? intl.formatMessage({ id: 'clusters.topology.host.online' })
              : intl.formatMessage({ id: 'clusters.topology.host.offline' })
          }
        >
          {/* Plain text: the open-source edition has no worker detail page
              to send anyone to. */}
          <span className="host">
            <span
              className={worker.state === 'ready' ? 'dot' : 'dot offline'}
            />
            <span className="name">{name}</span>
          </span>
        </Tooltip>
      )
    },
    ...fieldColumns
  ];
  // 🔴 «卡 / 空闲» was removed in review: this table answers «这台机器在拓扑
  // 的哪个位置», and card capacity is the worker list's question. Keeping it
  // here meant the one column nobody edits was the widest thing competing
  // with the columns that are editable.
  // 🔴 «来源» was removed in review, like «卡 / 空闲» before it. The cell
  // already carries a lock icon when a value was discovered rather than
  // typed, so a whole column repeating «机柜 手填» for every row said the same
  // thing a second time — and it was off by default, which meant the column
  // existed mainly as a checkbox.

  const totalWidth = SELECT_WIDTH + HOST_WIDTH + FIELD_WIDTH * fields.length;

  return (
    <Table
      ref={tableRef}
      className={styles.table}
      size="small"
      rowKey="id"
      tableLayout="fixed"
      columns={columns}
      dataSource={rows}
      pagination={false}
      virtual={rows.length > VIRTUAL_THRESHOLD}
      scroll={{ x: totalWidth, y: height }}
      rowClassName={(row: TopologyWorker) =>
        row.id === highlightId ? styles.highlight : ''
      }
      rowSelection={{
        selectedRowKeys: selectedIds,
        columnWidth: SELECT_WIDTH,
        onChange: (keys) => onSelectionChange(keys as number[])
      }}
      onRow={(row: TopologyWorker) => ({
        tabIndex: 0,
        onKeyDown: (e: React.KeyboardEvent) => {
          // Space on the row itself toggles it; inside a cell it types.
          if (e.key === ' ' && e.target === e.currentTarget) {
            e.preventDefault();
            onSelectionChange(
              selectedIds.includes(row.id)
                ? selectedIds.filter((id) => id !== row.id)
                : [...selectedIds, row.id]
            );
          }
        }
      })}
      locale={{
        emptyText: intl.formatMessage({
          id: 'clusters.topology.preview.noWorkers'
        })
      }}
    />
  );
};

export default LocationTable;
