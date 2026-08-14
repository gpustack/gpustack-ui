import {
  buildInstanceTypeRecordFromMiB,
  renderInstanceType
} from '@/pages/gpu-service/instances/utils/render-instance-type';
import { InfoCircleOutlined } from '@ant-design/icons';
import { AutoTooltip } from '@gpustack/core-ui';
import { useIntl } from '@umijs/max';
import { Flex, Tag, Tooltip } from 'antd';
import React, { useMemo } from 'react';
import { ResourceBreakdownItem } from '../../apis/resource';
import DeletedTag from '../../components/deleted-tag';
import {
  instanceTypeSeriesLabel,
  shapeSize,
  shapeSizeIsRedundant
} from '../../utils/format-instance-type';
import { parseRollup } from '../../utils/time-buckets';

type GroupKey = 'gpu_type' | 'instance' | 'user';

// Structural subset of react-intl's shape, so the cell components can be used
// without dragging the full IntlShape in. Second argument is the interpolation
// bag (``{shape}`` / ``{count}``).
type IntlLike = {
  formatMessage: (
    descriptor: { id: string },
    values?: Record<string, string | number>
  ) => string;
};

// At most this many formula lines are rendered inline; the rest collapse into a
// "+N more" hint whose tooltip carries them. The line count is the number of
// DISTINCT shapes, not of resize events (flipping between 2c4g and 4c8g ten
// times still aggregates to two shapes), so in practice it is 1–3 and this is
// only a safety valve against an instance that genuinely used many sizes.
/**
 * The usage cell: the number, and what it is made of when that can be stated
 * truthfully.
 *
 * The quantity is deliberately not NAMED — the multiplier (`sku_count`) is
 * dimensionless and the size of "one unit" is defined per instance type, so no
 * short column name is both accurate and self-explanatory. Showing `1c2g x 4`
 * instead needs neither a name nor a tooltip. It is omitted at a count of 1,
 * where there is no multiplication to explain.
 *
 * For a reconfigured instance there is NO composition that holds. "latest count
 * times total hours" is not what was billed, so printing the latest shape under
 * the total would invite arithmetic that comes out wrong: a row totalling 5.83
 * over 5.28 hours with `1c2g x 1` beneath it reads as 5.28, and nothing on screen
 * accounts for the 0.55 that came from the GPU shape it held earlier. So the cell
 * states the total alone and hands the split to the marker beside it — which is
 * also why the marker lives HERE rather than on the Instance Type column: the
 * number is what needs explaining, so the explanation hangs off the number.
 *
 * The per-shape rows say `hours → usage`, never `hours × count = usage`: at two
 * decimals the product genuinely does not hold, and the fix (deriving usage from
 * the rounded hours) would break the one number that must stay exact, the billed
 * total. See ``shapeFormula`` for the worked numbers.
 */
const UsageCell: React.FC<{
  row: ResourceBreakdownItem;
  intl: IntlLike;
}> = ({ row, intl }) => {
  // The unit rides on the value, not the header: "Usage" stays a neutral noun
  // (no short name is both accurate and self-explanatory for a dimensionless
  // multiplier — see shapeUnitLabel), so the number has to say what it is.
  const total = `${(row.unit_hours ?? 0).toFixed(2)} h`;
  const shapes = row.shapes ?? [];

  if (shapes.length > 1) {
    // The composition line stays, naming the CURRENT shape and saying how many
    // others there were. Two reasons over a bare total: every other row has a
    // grey line under its number, so dropping it here made the column ragged;
    // and "and N more" is what makes naming one shape honest — it tells the
    // reader up front that this one does not account for the total, so nobody is
    // invited to multiply it out (latest count × total hours is NOT what was
    // billed). The split itself is one hover away.
    const current = shapes[shapes.length - 1];
    return (
      <div>
        <Flex align="center" style={{ gap: 8 }}>
          {total}
          {/* Same outlined pill as ``DeletedTag`` — both are row-level state
              markers in these tables, so they read as one family. The icon and
              its bubble are lifted verbatim from the Instance Type spec popover
              in this same row: same component, same style, same Tooltip sizing.
              Both mean "hover for the detail behind this cell", so a different
              glyph or colour would imply a distinction that is not there. */}
          <Tag
            variant="outlined"
            style={{
              margin: 0,
              fontSize: 11,
              borderRadius: 12,
              background: 'transparent'
            }}
          >
            <Flex align="center" style={{ gap: 6 }}>
              {intl.formatMessage({ id: 'usage.table.resized' })}
              <Tooltip
                title={
                  // Current first, then backwards through the history: the shape
                  // the instance is on now is what a reader orients from, and the
                  // server sends them oldest-first. No prose — ``h`` and ``→``
                  // say what the two numbers are.
                  //
                  // The marker gets its OWN column rather than sitting between
                  // the shape and its numbers: there it split the one pairing the
                  // reader is here for (`1c2g × 4` ↔ `0.31h → 1.25`) to annotate
                  // the row as a whole. As a row header it annotates the row
                  // without standing inside the arithmetic.
                  //
                  // A `× 1` DOES print here, unlike the single-shape cell below
                  // that suppresses it. The two are not inconsistent: there the
                  // count is the whole message and a 1 says nothing, while here it
                  // is a column being read DOWN — 1 against 4 is exactly what
                  // explains why the usage changed, and blanking one cell of that
                  // column would leave the reader comparing "" with "× 4".
                  <div
                    style={{
                      display: 'grid',
                      gridTemplateColumns: 'max-content auto max-content',
                      columnGap: 12,
                      rowGap: 2
                    }}
                  >
                    {[...shapes].reverse().map((s, i) => (
                      <React.Fragment key={`${s.sku}-${s.sku_count}-${i}`}>
                        <span style={{ opacity: 0.65 }}>
                          {i === 0
                            ? intl.formatMessage({
                                id: 'usage.table.currentShape'
                              })
                            : ''}
                        </span>
                        <span>{shapeSize(s)}</span>
                        <span style={{ textAlign: 'right' }}>
                          {`${(s.instance_hours ?? 0).toFixed(2)}h → ${(
                            s.unit_hours ?? 0
                          ).toFixed(2)}`}
                        </span>
                      </React.Fragment>
                    ))}
                  </div>
                }
                styles={{ container: { width: 'max-content', maxWidth: 480 } }}
              >
                <InfoCircleOutlined
                  style={{
                    color: 'var(--ant-color-primary)',
                    cursor: 'pointer'
                  }}
                />
              </Tooltip>
            </Flex>
          </Tag>
        </Flex>
        <div className="text-secondary" style={{ fontSize: 12 }}>
          {intl.formatMessage(
            { id: 'usage.table.shapeAndMore' },
            { shape: shapeSize(current), count: shapes.length - 1 }
          )}
        </div>
      </div>
    );
  }

  // A single shape: the number, plus its composition — omitted at a count of 1,
  // where "<unit> x 1" only restates the Instance Type column. Every other count
  // prints, including a whole-card "x 2": without it the row shows 0.21 against
  // 0.11 hours with nothing accounting for the factor. The hours are never
  // repeated here; the Running Time column has them, and for one shape they are
  // the same duration.
  //
  // No shapes at all (a user row aggregates many instances of different sizes)
  // falls back to the bare total — exactly where the weighted number is
  // irreducible.
  const only = shapes[0];
  if (!only || shapeSizeIsRedundant(only)) return <span>{total}</span>;
  return (
    <div>
      <div>{total}</div>
      <div className="text-secondary" style={{ fontSize: 12 }}>
        {shapeSize(only)}
      </div>
    </div>
  );
};

/**
 * Column factory for the GPU-instances breakdown tables, shared by the in-tab
 * table and the export preview. Columns adapt to the active grouping. Sort
 * indicators are uncontrolled (antd manages the header arrows); the table
 * reports changes through its `onChange`.
 */
const useInstancesColumns = (groupKey: GroupKey) => {
  const intl = useIntl();

  return useMemo(() => {
    // Two usage columns, not three.
    //
    // ``GPU Hours`` is deliberately NOT here: it is the same expression as the
    // usage column with a `WHERE resource_type='gpu'` bolted on, so the two are
    // identical on every GPU row and a single-card instance showed the same
    // number three times across. It stays on the KPI cards and in the chart's
    // metric picker, where the question ("how many card-hours did the fleet
    // burn") is genuinely its own.
    const usageCol = {
      // Sorting is server-side on ``unit_hours`` — the TOTAL — which is why a
      // multi-shape cell must print that total: otherwise the biggest number
      // on screen (a segment) would not be what the ordering follows.
      title: intl.formatMessage({ id: 'usage.metric.usage' }),
      dataIndex: 'unit_hours',
      key: 'unit_hours',
      sorter: true,
      render: (_v: number, row: ResourceBreakdownItem) => (
        <UsageCell row={row} intl={intl} />
      )
    };
    // Wall-clock time. Present on the Instances tab (a row is one instance, so
    // this is a real duration) and on Users (a user's instances summed — not
    // derivable from usage, since one user spans many sizes).
    //
    // NOT on Instance Types: a row there is a SHAPE, and a shape does not "run
    // for N hours" — the figure is a sum across the instances of that shape, the
    // same words meaning something different than on the tab next to it. Worse,
    // a shape has one constant count, so usage is just count × this, and the two
    // columns print the identical number on every ``count = 1`` shape (a 4090 x1
    // row read 1.74 / 1.74). ``Active Instances`` already conveys the "one
    // instance for long vs many briefly" distinction it was carrying.
    const runningTimeCol = {
      // Named for what it measures, not for its unit: "Instance Hours" was
      // self-referential on a table whose every row IS an instance, and on the
      // Users tab the same words silently meant "summed across instances". The
      // unit is on the value, matching the usage column.
      title: intl.formatMessage({ id: 'usage.metric.runningTime' }),
      dataIndex: 'instance_hours',
      key: 'instance_hours',
      sorter: true,
      render: (v: number) => `${(v ?? 0).toFixed(2)} h`
    };
    // Instance Types breakdown: the pretty product name (or flavor slug for
    // older rows; "CPU-only" when no GPU cards) plus a CPU + RAM spec popover —
    // rendered through the canonical renderer so the formatting matches the GPU
    // Instances list, but limited to the CPU/RAM categories.
    const instanceTypeColType = {
      title: intl.formatMessage({ id: 'usage.table.instanceType' }),
      dataIndex: 'gpu_type',
      key: 'gpu_type',
      render: (_v: string, row: ResourceBreakdownItem) => {
        const isCpu = !row.gpu_count && !row.vram_mib;
        return renderInstanceType(
          buildInstanceTypeRecordFromMiB({
            name: row.instance_name,
            product: row.product || row.gpu_type,
            gpuCount: row.gpu_count,
            // CPU instance types show their real total size (cpu/mem totals);
            // GPU keeps per-card specs since the renderer multiplies by the
            // card count.
            unitCpuMilli: isCpu ? row.cpu_milli : row.unit_cpu_milli,
            unitMemoryMib: isCpu ? row.memory_mib : row.unit_memory_mib,
            vramMib: row.vram_mib
          }),
          {
            intl,
            categories: ['cpu', 'ram'],
            // Each row is one shape: GPU "<product> x <cards>", CPU
            // "CPU-only · <spec>".
            title: instanceTypeSeriesLabel(row)
          }
        );
      }
    };
    // Instances breakdown: render through the canonical GPU Instances list
    // renderer so the label + spec popover are identical. The breakdown row
    // carries flat MiB fields, so adapt it into the ListItem shape first.
    const instanceTypeColInstance = {
      title: intl.formatMessage({ id: 'usage.table.instanceType' }),
      dataIndex: 'gpu_type',
      key: 'gpu_type',
      render: (_v: string, row: ResourceBreakdownItem) => {
        const isCpu = !row.gpu_count && !row.vram_mib;
        const cell = renderInstanceType(
          buildInstanceTypeRecordFromMiB({
            name: row.instance_name,
            product: row.product || row.gpu_type,
            gpuCount: row.gpu_count,
            // A per-instance row is one concrete instance, so CPU shows its
            // real requested size (cpu/mem totals), not the per-unit flavor
            // spec — e.g. a 3c6g instance of a 1c2g flavor reads "3 vCPU · 6 GB".
            unitCpuMilli: isCpu ? row.cpu_milli : row.unit_cpu_milli,
            unitMemoryMib: isCpu ? row.memory_mib : row.unit_memory_mib,
            vramMib: row.vram_mib,
            localStorageMib: row.local_storage_mib,
            ephemeralMib: row.ephemeral_mib,
            persistentMib: row.persistent_mib
          }),
          // Keeps the full shape — "<product> × <cards>" / "CPU-only · 4 vCPU ·
          // 8 GB". This column describes the MACHINE; the usage column describes
          // the BILLING. They are complementary, not contradictory: for a sliced
          // GPU the machine is "1 card at 25%" while the bill is "0.25 units",
          // and 1 × 25% = 0.25; for a CPU instance the machine is the 4c8g total
          // while the bill is 1c2g × 4. The scale has to stay: without it the row
          // cannot say how big the instance is.
          // A reconfigured instance renders its LATEST shape here: a per-instance
          // row has one type cell, and the newest shape is the one that still
          // describes the machine. The history is marked on the usage NUMBER
          // instead of here — that is the value the earlier shapes actually
          // change, and this column stays a straight answer to "what is this
          // machine now".
          { intl, title: instanceTypeSeriesLabel(row) }
        );
        return cell;
      }
    };
    // Last Active = the last active day. The backend sends a rollup-tz instant
    // with its offset; parseRollup keeps that wall clock (no browser-tz convert),
    // consistent with the trend chart buckets. Shown date-only.
    const lastActiveCol = {
      title: intl.formatMessage({ id: 'usage.table.lastActive' }),
      dataIndex: 'last_active',
      key: 'last_active',
      render: (v?: string) => (v ? parseRollup(v).format('YYYY-MM-DD') : '-')
    };
    // Name cell with a DeletedTag when the entity no longer exists — mirrors the
    // Tokens tab. The id keeps two deleted rows sharing a stale name distinct.
    const renderName = (text: string, id?: number, deleted?: boolean) => (
      <span className="flex items-center gap-8">
        <AutoTooltip
          ghost
          style={{
            maxWidth: 400,
            ...(deleted ? { color: 'var(--ant-color-text-tertiary)' } : null)
          }}
        >
          {text || '-'}
        </AutoTooltip>
        {deleted && <DeletedTag id={id ?? null} />}
      </span>
    );
    if (groupKey === 'gpu_type') {
      return [
        instanceTypeColType,
        usageCol,
        {
          title: intl.formatMessage({ id: 'usage.metric.activeInstances' }),
          dataIndex: 'active_instances',
          key: 'active_instances'
        },
        lastActiveCol
      ];
    }
    if (groupKey === 'instance') {
      return [
        {
          title: intl.formatMessage({ id: 'common.table.name' }),
          dataIndex: 'instance_name',
          key: 'instance_name',
          render: (text: string, row: ResourceBreakdownItem) =>
            renderName(text, row.instance_id, row.deleted)
        },
        instanceTypeColInstance,
        usageCol,
        runningTimeCol,
        lastActiveCol
      ];
    }
    // user tab
    return [
      {
        title: intl.formatMessage({ id: 'common.table.name' }),
        dataIndex: 'user_name',
        key: 'user_name',
        render: (text: string, row: ResourceBreakdownItem) =>
          renderName(text, row.user_id, row.deleted)
      },
      usageCol,
      runningTimeCol,
      lastActiveCol
    ];
  }, [groupKey, intl]);
};

export default useInstancesColumns;
