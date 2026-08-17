import { QuestionCircleOutlined } from '@ant-design/icons';
import {
  AutoTooltip,
  DropdownButtons,
  icons,
  StatusTag
} from '@gpustack/core-ui';
import { useIntl } from '@umijs/max';
import { Space, Tooltip } from 'antd';
import type { ColumnsType } from 'antd/lib/table';
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

interface ColumnsHookProps {
  handleSelect: (val: string, record: ListItem) => void;
  // Whether the cluster still derives instance types from its nodes. While it
  // does, the operator re-creates a derived type as soon as it is deleted, so
  // those rows offer no delete rather than one that cannot stick. Turning the
  // setting off hands them back to the admin, delete included.
  derivedFromNodeEnabled: boolean;
}

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

// Flavor identity for the column's sort (AC5.2): the same five fields the
// operator resolves a cluster's Kueue pool by — acceleratable together with
// acceleratorGroup/generalGroup, os, arch — not the observed status.detail
// the cell renders below, so rows sharing a flavor sort adjacent even before
// the operator backfills status.
//
// Compared field by field rather than through one JSON.stringify'd string: that
// spelling sorted the JSON *text*, where `false` lands ahead of `true`
// (`f` < `t`) and sank every accelerated row below the CPU-only ones. Nor can
// the fields be joined into a single key — an acceleratorGroup or a product
// name may contain whichever separator we picked, letting one field's value
// bleed into the next field's comparison.
const getFlavorSortFields = (record: ListItem) => [
  // Accelerated first: this page exists for those rows.
  record.spec?.acceleratable ? '0' : '1',
  record.spec?.acceleratorGroup || '',
  record.spec?.generalGroup || '',
  record.spec?.os || '',
  record.spec?.arch || '',
  // Tiebreak within one flavor, so its rows keep an explicable order rather
  // than the server's. The cell renders `product`, so that is what it sorts by.
  record.status?.detail?.product || record.name
];

const compareByFlavor = (a: ListItem, b: ListItem) => {
  const left = getFlavorSortFields(a);
  const right = getFlavorSortFields(b);
  for (let i = 0; i < left.length; i += 1) {
    const diff = left[i].localeCompare(right[i]);
    if (diff !== 0) {
      return diff;
    }
  }
  return 0;
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
  derivedFromNodeEnabled
}: ColumnsHookProps): ColumnsType<ListItem> => {
  const intl = useIntl();

  return useMemo(() => {
    return [
      {
        title: intl.formatMessage({ id: 'common.table.name' }),
        dataIndex: 'name',
        key: 'name',
        ellipsis: { showTitle: false },
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
        dataIndex: ['status', 'detail', 'product'],
        key: 'product',
        ellipsis: { showTitle: false },
        sorter: compareByFlavor,
        defaultSortOrder: 'ascend',
        render: (_text: string, record: ListItem) => {
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
        dataIndex: ['spec', 'unitResources', 'cpu'],
        key: 'cpu',
        ellipsis: { showTitle: false },
        render: (value: string) => {
          const cores = ceilMilliToCore(value ?? null)?.cores;
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
        dataIndex: ['spec', 'unitResources', 'ram'],
        key: 'ram',
        ellipsis: { showTitle: false },
        render: (value: string) => {
          const gi = parseQuantityToGi(value ?? null)?.value;
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
        dataIndex: ['spec', 'localStorage'],
        key: 'localStorage',
        ellipsis: { showTitle: false },
        render: (value: string) => {
          const gi = parseQuantityToGi(value ?? null)?.value;
          return gi != null ? `${gi} GB` : '-';
        }
      },
      {
        title: intl.formatMessage({ id: 'gpuservice.instanceType.platform' }),
        key: 'os',
        ellipsis: { showTitle: false },
        render: (_text, record: ListItem) => {
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
        title: intl.formatMessage({ id: 'common.table.status' }),
        dataIndex: ['status', 'phase'],
        key: 'status',
        ellipsis: { showTitle: false },
        render: (value: string, record: ListItem) =>
          value ? (
            <StatusTag
              statusValue={{
                status: phaseStatusMap[value],
                text: InstanceTypePhaseLabelMap[value] || value,
                message: record.status?.phaseMessage || ''
              }}
            />
          ) : (
            '-'
          )
      },
      {
        title: intl.formatMessage({ id: 'common.table.operation' }),
        key: 'operation',
        dataIndex: 'operation',
        ellipsis: { showTitle: false },
        render: (_text, record: ListItem) => (
          <DropdownButtons
            items={buildRowActions(record, derivedFromNodeEnabled)}
            onSelect={(val: string) => handleSelect(val, record)}
          />
        )
      }
    ];
  }, [handleSelect, derivedFromNodeEnabled, intl]);
};

export default useInstanceTypeColumns;
