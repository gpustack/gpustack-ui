import { WarningOutlined } from '@ant-design/icons';
import { useIntl } from '@umijs/max';
import { Button, Flex, Popover, Select, Spin, message } from 'antd';
import { useEffect, useState } from 'react';
import { queryClusterTopology, setTopologyLocations } from '../../apis';
import { RACK_LAYER, TopologyView, TopologyWorker } from '../../config/types';
import {
  LocationField,
  isDiscovered,
  valueOptions,
  visibleFields
} from './location';
import { LocationValueSelect } from './location-cell';

/** How many conflicting hosts to name before "and N more". */
const NAMED_CONFLICTS = 3;

interface SetLocationPanelProps {
  /** The selection: what the write lands on. */
  targets: TopologyWorker[];
  /** Every worker of the cluster, for the value dropdown's ranking. */
  allWorkers: TopologyWorker[];
  fields: LocationField[];
  defaultField?: string;
  onApply: (field: string, value: string | null) => Promise<void>;
  onCancel: () => void;
}

/**
 * [S3] One field, one value, N workers.
 *
 * The conflicts are spelled out above the button instead of behind a
 * confirmation: "this will overwrite node-5 (R2)" read before clicking is a
 * decision; the same sentence in a Popconfirm after clicking is a speed bump,
 * and a batch already went through one click to get here.
 */
export const SetLocationPanel: React.FC<SetLocationPanelProps> = ({
  targets,
  allWorkers,
  fields,
  defaultField,
  onApply,
  onCancel
}) => {
  const intl = useIntl();
  const [field, setField] = useState<string | undefined>(
    defaultField && fields.some((f) => f.id === defaultField)
      ? defaultField
      : fields[0]?.id
  );
  // undefined: nothing picked yet; null: "clear".
  const [value, setValue] = useState<string | null | undefined>(undefined);
  const [applying, setApplying] = useState(false);

  const current = fields.find((f) => f.id === field);
  const options = field ? valueOptions(allWorkers, field) : [];

  const overwritten = field
    ? targets.filter((worker) => {
        const location = worker.location?.[field];
        return (
          !!location?.value &&
          location.source === 'user' &&
          value !== undefined &&
          location.value !== value
        );
      })
    : [];
  const autoOverwritten = field
    ? targets.filter((worker) => isDiscovered(worker.location?.[field]))
    : [];
  const anyCleared = targets.some((worker) => !!worker.location?.[field!]);

  const conflictNames = (list: TopologyWorker[]) => {
    const named = list
      .slice(0, NAMED_CONFLICTS)
      .map((worker) =>
        worker.location?.[field!]?.value
          ? `${worker.name}（${worker.location[field!].value}）`
          : worker.name
      )
      .join('、');
    const more = list.length - NAMED_CONFLICTS;
    return more > 0
      ? intl.formatMessage(
          { id: 'clusters.topology.batch.more' },
          { names: named, count: more }
        )
      : named;
  };

  const handleApply = async () => {
    if (!field || value === undefined) {
      return;
    }
    setApplying(true);
    try {
      await onApply(field, value);
    } finally {
      setApplying(false);
    }
  };

  // Flat, in chain order. It was briefly grouped under «层级» / «加速器域»,
  // because two chains could each carry a rung called something like «机柜» and
  // the list gave no way to tell which one a value was about. One chain, one
  // list: chain order alone says where a field sits.
  const fieldOptions = fields.map((f) => ({ value: f.id, label: f.label }));

  return (
    <Flex orientation="vertical" gap={12} style={{ width: 360 }}>
      <span style={{ fontWeight: 500 }}>
        {intl.formatMessage(
          { id: 'clusters.topology.batch.title' },
          { count: targets.length }
        )}
      </span>
      <Flex align="center" gap={12}>
        <span style={{ width: 48, flexShrink: 0 }}>
          {intl.formatMessage({ id: 'clusters.topology.batch.field' })}
        </span>
        <Select
          style={{ flex: 1 }}
          value={field}
          options={fieldOptions}
          onChange={(next) => {
            setField(next);
            setValue(undefined);
          }}
        />
      </Flex>
      <Flex align="center" gap={12}>
        <span style={{ width: 48, flexShrink: 0 }}>
          {intl.formatMessage({ id: 'clusters.topology.batch.value' })}
        </span>
        <div style={{ flex: 1 }}>
          <LocationValueSelect
            key={field}
            options={options}
            fieldLabel={current?.label || ''}
            current={anyCleared ? '·' : null}
            value={value}
            onPick={setValue}
          />
        </div>
      </Flex>
      {overwritten.length > 0 && (
        <Flex gap={6} className="text-tertiary" style={{ fontSize: 12 }}>
          <WarningOutlined style={{ color: 'var(--ant-color-warning)' }} />
          <span>
            {intl.formatMessage(
              { id: 'clusters.topology.batch.overwrite' },
              {
                count: overwritten.length,
                names: conflictNames(overwritten)
              }
            )}
          </span>
        </Flex>
      )}
      {autoOverwritten.length > 0 && value !== undefined && (
        <Flex gap={6} className="text-tertiary" style={{ fontSize: 12 }}>
          <WarningOutlined style={{ color: 'var(--ant-color-warning)' }} />
          <span>
            {intl.formatMessage(
              { id: 'clusters.topology.batch.overwriteAuto' },
              { count: autoOverwritten.length, field: current?.label || '' }
            )}
          </span>
        </Flex>
      )}
      <Flex justify="flex-end" gap={8}>
        <Button size="small" onClick={onCancel}>
          {intl.formatMessage({ id: 'common.button.cancel' })}
        </Button>
        <Button
          size="small"
          type="primary"
          loading={applying}
          disabled={!field || value === undefined}
          onClick={handleApply}
        >
          {intl.formatMessage(
            { id: 'clusters.topology.batch.apply' },
            { count: targets.length }
          )}
        </Button>
      </Flex>
    </Flex>
  );
};

interface SetLocationPopoverProps extends Omit<
  SetLocationPanelProps,
  'onCancel'
> {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  children: React.ReactElement;
}

/** [S3] anchored to whatever opened it — the selection bar's button, a tree bucket. */
export const SetLocationPopover: React.FC<SetLocationPopoverProps> = ({
  open,
  onOpenChange,
  children,
  ...panel
}) => (
  <Popover
    open={open}
    onOpenChange={onOpenChange}
    trigger="click"
    placement="topLeft"
    destroyOnHidden
    content={
      <SetLocationPanel {...panel} onCancel={() => onOpenChange(false)} />
    }
  >
    {children}
  </Popover>
);

interface SetLocationForWorkersProps {
  /** Workers list rows, possibly across clusters. */
  workers: { id: number; name: string; cluster_id: number }[];
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onDone: () => void;
  children: React.ReactElement;
}

/**
 * [S3] from the Workers list, where the selection may span clusters. Each
 * cluster's topology is fetched on open, the field list is the intersection,
 * and the write goes out once per cluster with the toast counting them all.
 */
export const SetLocationForWorkers: React.FC<SetLocationForWorkersProps> = ({
  workers,
  open,
  onOpenChange,
  onDone,
  children
}) => {
  const intl = useIntl();
  const [views, setViews] = useState<Record<number, TopologyView>>({});
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!open) {
      return;
    }
    const clusterIds = Array.from(new Set(workers.map((w) => w.cluster_id)));
    setLoading(true);
    Promise.all(
      clusterIds.map((id) =>
        queryClusterTopology({ id }, { skipErrorHandler: true })
          .then((view) => [id, view] as const)
          .catch(() => null)
      )
    )
      .then((pairs) => {
        const next: Record<number, TopologyView> = {};
        pairs.forEach((pair) => {
          if (pair) {
            next[pair[0]] = pair[1];
          }
        });
        setViews(next);
      })
      .finally(() => setLoading(false));
  }, [open]);

  const loaded = Object.values(views);
  const fields = loaded.length
    ? visibleFields(intl, loaded[0]).filter((field) =>
        loaded.every((view) =>
          visibleFields(intl, view).some((f) => f.id === field.id)
        )
      )
    : [];
  const selected = new Set(workers.map((w) => w.id));
  const targets = loaded.flatMap((view) =>
    view.workers.filter((worker) => selected.has(worker.id))
  );
  const allWorkers = loaded.flatMap((view) => view.workers);

  const handleApply = async (field: string, value: string | null) => {
    const label = fields.find((f) => f.id === field)?.label || field;
    const results = await Promise.allSettled(
      Object.entries(views).map(([clusterId, view]) => {
        const ids = view.workers
          .filter((worker) => selected.has(worker.id))
          .map((worker) => worker.id);
        if (!ids.length) {
          return Promise.resolve(null);
        }
        return setTopologyLocations({
          id: Number(clusterId),
          assignments: [{ worker_ids: ids, layer: field, value }]
        });
      })
    );
    const failed = results.filter((r) => r.status === 'rejected').length;
    if (failed) {
      message.warning(
        intl.formatMessage(
          { id: 'clusters.topology.batch.partial' },
          { failed }
        )
      );
    } else {
      message.success(
        value === null
          ? intl.formatMessage(
              { id: 'clusters.topology.toast.cleared' },
              { count: targets.length, field: label }
            )
          : intl.formatMessage(
              { id: 'clusters.topology.toast.set' },
              { count: targets.length, field: label, value }
            )
      );
    }
    onOpenChange(false);
    onDone();
  };

  return (
    <Popover
      open={open}
      onOpenChange={onOpenChange}
      trigger="click"
      placement="bottomRight"
      destroyOnHidden
      content={
        loading ? (
          <Flex justify="center" style={{ width: 360, padding: 16 }}>
            <Spin size="small" />
          </Flex>
        ) : (
          <SetLocationPanel
            targets={targets}
            allWorkers={allWorkers}
            fields={fields}
            // The constant, not the string: a field's id is the registry
            // number (`builtin-000003`), so `"rack"` matched nothing and the
            // panel silently opened on `fields[0]` — the room layer, on any
            // cluster that declares one.
            defaultField={RACK_LAYER}
            onApply={handleApply}
            onCancel={() => onOpenChange(false)}
          />
        )
      }
    >
      {children}
    </Popover>
  );
};
