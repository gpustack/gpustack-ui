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
}

// DropdownButtons reads `locale` / `props` at runtime; its `items` prop is
// typed as antd's MenuProps['items'], so cast the config to satisfy it. The
// activate / deactivate action is chosen from the row's current phase: Active
// types can be deactivated, Inactive ones activated (none while Preparing).
const buildRowActions = (record: ListItem) => {
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
  handleSelect
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
        title: intl.formatMessage({ id: 'gpuservice.instanceType.flavor' }),
        dataIndex: ['spec', 'product'],
        key: 'product',
        ellipsis: { showTitle: false },
        render: (_text: string, record: ListItem) => (
          <FlavorOption
            spec={record.spec}
            fallbackName={record.name}
            maxWidth={200}
          />
        )
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
            items={buildRowActions(record)}
            onSelect={(val: string) => handleSelect(val, record)}
          />
        )
      }
    ];
  }, [handleSelect, intl]);
};

export default useInstanceTypeColumns;
