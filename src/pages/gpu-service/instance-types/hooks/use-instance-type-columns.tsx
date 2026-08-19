import { ClusterListItem } from '@/pages/cluster-management/config/types';
import { QuestionCircleOutlined } from '@ant-design/icons';
import {
  AutoTooltip,
  DropdownButtons,
  icons,
  StatusTag,
  type TableColumnProps
} from '@gpustack/core-ui';
import { useIntl } from '@umijs/max';
import { Space, Tooltip } from 'antd';
import _ from 'lodash';
import { useMemo } from 'react';
import { isSliceableDetail } from '../../instances/config';
import { ceilMilliToCore, parseQuantityToGi } from '../../utils';
import { FlavorOption } from '../components/flavor-display';
import {
  InstanceTypePhaseLabelMap,
  InstanceTypePhaseValueMap,
  status as phaseStatusMap
} from '../config';
import { ListItem } from '../config/types';

type ClusterOption = ClusterListItem & { label: string; value: number };

interface ColumnsHookProps {
  handleSelect: (val: string, record: ListItem) => void;
  // The clusters this page can see. Resolves both a row's cluster name — the
  // payload carries only `clusterId` — and whether that cluster still derives
  // instance types from its nodes.
  clusterList: ClusterOption[];
  sortOrder: string[];
}

// The operator owns the instance types it derived from a node only while the
// row's OWN cluster derives types from nodes; the list is fleet-wide, so the
// answer differs per row. An unset knob means GPUStack does not manage the
// setting and the operator keeps its own default, which is on — so only an
// explicit `false` releases those types.
const isDerivedFromNodeEnabled = (cluster?: ClusterOption) =>
  cluster?.k8s_options?.gpuInstanceOptions?.gpuInstanceTypeDerivedFromNode !==
  false;

// DropdownButtons reads `locale` / `props` at runtime; its `items` prop is
// typed as antd's MenuProps['items'], so cast the config to satisfy it. The
// activate / deactivate action is chosen from the row's current phase: Active
// types can be deactivated, Inactive ones activated (none while Preparing).
const buildRowActions = (record: ListItem, derivedFromNodeEnabled: boolean) => {
  const phase = record.status?.phase;
  const actions: any[] = [];
  if (phase === InstanceTypePhaseValueMap.Active) {
    actions.push({
      label: 'gpuservice.instanceType.deactivate',
      key: 'deactivate',
      locale: true,
      icon: icons.Disabled
    });
  } else if (phase === InstanceTypePhaseValueMap.Inactive) {
    actions.push({
      label: 'gpuservice.instanceType.activate',
      key: 'activate',
      locale: true,
      icon: icons.Charger
    });
  }
  actions.push({
    label: 'common.button.delete',
    key: 'delete',
    locale: true,
    icon: icons.DeleteOutlined,
    disabled: derivedFromNodeEnabled && !!record.derivedFromNode,
    props: { danger: true }
  });
  return actions;
};

// Column header with an info tooltip (used for the per-GPU resource columns).
const TitleWithTip: React.FC<{ title: string; tip: string }> = ({
  title,
  tip
}) => (
  <Space size={4}>
    <span>{title}</span>
    <Tooltip title={tip}>
      <QuestionCircleOutlined
        style={{ color: 'var(--ant-color-text-tertiary)' }}
      />
    </Tooltip>
  </Space>
);

const useInstanceTypeColumns = ({
  handleSelect,
  clusterList,
  sortOrder
}: ColumnsHookProps): TableColumnProps[] => {
  const intl = useIntl();

  // No column sets a `span`, so SealTable gives every one `1fr` and they divide
  // whatever width is left once the floors below are satisfied. What each
  // column carries instead is a `minWidth` floor — the table scrolls
  // horizontally (`scroll={{ x: true }}` widens the row to the sum of the
  // floors), so the floors are what decide when scrolling starts.
  //
  // `dataIndex` is a flat property lookup, not a path: the columns that read a
  // nested value take their value off `record` in `render` instead, and their
  // `dataIndex` only has to be unique (SealTable keys each cell by it). Only
  // `name` is sortable — the list is paginated server-side, and `name` is the
  // one field of this table the backend will sort on that the table also shows
  // (`cluster_id` / `created_at` / `updated_at` are the others; `status.phase`
  // lives in a JSON column and is deliberately not sortable). A client-side
  // sorter would only reorder the page already fetched.
  return useMemo<TableColumnProps[]>(() => {
    return [
      {
        title: intl.formatMessage({ id: 'common.table.name' }),
        dataIndex: 'name',
        key: 'name',
        minWidth: 180,
        sorter: true,
        // Prefer the friendly display name, fall back to the resource name.
        render: (text: string, record: ListItem) => {
          const label = record.spec?.displayName || text;
          return (
            <AutoTooltip ghost minWidth={20} maxWidth={200} title={label}>
              <span className="text-primary">{label || '-'}</span>
            </AutoTooltip>
          );
        }
      },
      {
        // Flavor cell mirrors the create drawer's dropdown: product name on
        // top, manufacturer · memory · sliceable on the meta line below.
        // Observed hardware comes from status.detail (absent until the
        // operator backfills status); sliceable is derived from slicedDetail.
        title: intl.formatMessage({ id: 'gpuservice.instanceType.flavor' }),
        dataIndex: 'product',
        key: 'product',
        minWidth: 200,
        render: (_text: any, record: ListItem) => {
          const detail = record.status?.detail;
          return (
            <FlavorOption
              spec={{
                acceleratable: record.spec?.acceleratable,
                manufacturer: detail?.manufacturer,
                product: detail?.product,
                memory: detail?.memory,
                sliceable: isSliceableDetail(detail?.slicedDetail)
              }}
              fallbackName={record.name}
              maxWidth={200}
            />
          );
        }
      },
      {
        title: (
          <TitleWithTip
            title={intl.formatMessage({
              id: 'gpuservice.instanceType.unitCpu'
            })}
            tip={intl.formatMessage({
              id: 'gpuservice.instanceType.unitCpu.tip'
            })}
          />
        ),
        dataIndex: 'cpu',
        key: 'cpu',
        minWidth: 120,
        render: (_text: any, record: ListItem) => {
          const cores = ceilMilliToCore(
            record.spec?.unitResources?.cpu ?? null
          )?.cores;
          return cores != null ? `${cores} vCPU` : '-';
        }
      },
      {
        title: (
          <TitleWithTip
            title={intl.formatMessage({
              id: 'gpuservice.instanceType.unitRam'
            })}
            tip={intl.formatMessage({
              id: 'gpuservice.instanceType.unitRam.tip'
            })}
          />
        ),
        dataIndex: 'ram',
        key: 'ram',
        minWidth: 120,
        render: (_text: any, record: ListItem) => {
          const gi = parseQuantityToGi(
            record.spec?.unitResources?.ram ?? null
          )?.value;
          return gi != null ? `${gi} GB` : '-';
        }
      },
      {
        title: (
          <TitleWithTip
            title={intl.formatMessage({
              id: 'gpuservice.instanceType.localStorage'
            })}
            tip={intl.formatMessage({
              id: 'gpuservice.instanceType.localStorage.tip'
            })}
          />
        ),
        dataIndex: 'localStorage',
        key: 'localStorage',
        minWidth: 120,
        render: (_text: any, record: ListItem) => {
          const gi = parseQuantityToGi(
            record.spec?.localStorage ?? null
          )?.value;
          return gi != null ? `${gi} GB` : '-';
        }
      },
      {
        title: intl.formatMessage({ id: 'gpuservice.instanceType.platform' }),
        dataIndex: 'os',
        key: 'os',
        minWidth: 140,
        render: (_text: any, record: ListItem) => {
          const os = _.capitalize(record.spec?.os || '');
          const arch = _.toUpper(record.spec?.arch || '');
          if (!os) return '-';
          return (
            <AutoTooltip
              ghost
              maxWidth={240}
              title={arch ? `${os}/${arch}` : os}
            >
              {arch ? `${os}/${arch}` : os}
            </AutoTooltip>
          );
        }
      },
      {
        title: intl.formatMessage({ id: 'clusters.title' }),
        dataIndex: 'clusterId',
        key: 'clusterId',
        minWidth: 140,
        render: (id: number) => (
          <AutoTooltip ghost maxWidth={240}>
            {_.find(clusterList, { value: id })?.label ?? id ?? '-'}
          </AutoTooltip>
        )
      },
      {
        title: intl.formatMessage({ id: 'common.table.status' }),
        dataIndex: 'status',
        key: 'status',
        minWidth: 140,
        render: (_text: any, record: ListItem) => {
          const phase = record.status?.phase;
          return phase ? (
            <StatusTag
              statusValue={{
                status: phaseStatusMap[phase],
                text: InstanceTypePhaseLabelMap[phase] || phase,
                message: record.status?.phaseMessage || ''
              }}
            />
          ) : (
            '-'
          );
        }
      },
      {
        title: intl.formatMessage({ id: 'common.table.operation' }),
        dataIndex: 'operation',
        key: 'operation',
        width: 110,
        render: (_text: any, record: ListItem) => (
          <DropdownButtons
            items={buildRowActions(
              record,
              isDerivedFromNodeEnabled(
                _.find(clusterList, { value: record.clusterId })
              )
            )}
            onSelect={(val: string) => handleSelect(val, record)}
          />
        )
      }
    ];
  }, [handleSelect, clusterList, sortOrder, intl]);
};

export default useInstanceTypeColumns;
