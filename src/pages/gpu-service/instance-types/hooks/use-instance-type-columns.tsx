import { QuestionCircleOutlined } from '@ant-design/icons';
import {
  AutoTooltip,
  DropdownButtons,
  icons,
  StatusTag,
  ThemeTag
} from '@gpustack/core-ui';
import { useIntl } from '@umijs/max';
import { Flex, Space, Tooltip } from 'antd';
import type { ColumnsType } from 'antd/lib/table';
import _ from 'lodash';
import { useMemo } from 'react';
import { formatMemoryDisplay } from '../../instances/config';
import { manufactureColorMap } from '../../templates/config';
import {
  ceilMilliToCore,
  formatManufacturer,
  parseQuantityToGi
} from '../../utils';
import { InstanceTypePhaseLabelMap, status as phaseStatusMap } from '../config';
import { ListItem } from '../config/types';

interface ColumnsHookProps {
  handleSelect: (val: string, record: ListItem) => void;
}

// DropdownButtons reads `locale` / `props` at runtime; its `items` prop is
// typed as antd's MenuProps['items'], so cast the config to satisfy it.
const rowActions = [
  {
    label: 'common.button.delete',
    key: 'delete',
    locale: true,
    icon: icons.DeleteOutlined,
    props: { danger: true }
  }
] as any;

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
        render: (text: string) => (
          <AutoTooltip ghost minWidth={20} maxWidth={200} title={text}>
            <span className="text-primary">{text || '-'}</span>
          </AutoTooltip>
        )
      },
      {
        title: intl.formatMessage({ id: 'gpuservice.instanceType.product' }),
        dataIndex: ['spec', 'product'],
        key: 'product',
        ellipsis: { showTitle: false },
        render: (text: string, record: ListItem) => (
          <Flex
            gap={4}
            align="center"
            style={{ maxWidth: '100%', minWidth: 0 }}
          >
            <AutoTooltip ghost minWidth={20} maxWidth={200}>
              {text || '-'}
            </AutoTooltip>
            {record.spec?.sliceable && (
              <ThemeTag
                color="geekblue"
                style={{ fontWeight: 400, flexShrink: 0 }}
              >
                {intl.formatMessage({ id: 'gpuservice.instance.sliceable' })}
              </ThemeTag>
            )}
          </Flex>
        )
      },
      {
        title: intl.formatMessage({ id: 'resources.table.vendor' }),
        dataIndex: ['spec', 'manufacturer'],
        key: 'manufacturer',
        ellipsis: { showTitle: false },
        render: (value: string) =>
          value ? (
            <ThemeTag
              color={manufactureColorMap[value] ?? 'purple'}
              style={{ fontWeight: 400, width: 'fit-content' }}
            >
              {formatManufacturer(value)}
            </ThemeTag>
          ) : (
            '-'
          )
      },
      {
        title: intl.formatMessage({ id: 'gpuservice.instance.memory' }),
        dataIndex: ['spec', 'memory'],
        key: 'memory',
        ellipsis: { showTitle: false },
        // Non-acceleratable (generic) types have no VRAM concept → N/A.
        render: (value: string, record: ListItem) =>
          record.spec?.acceleratable
            ? formatMemoryDisplay(value ?? undefined) || '-'
            : 'N/A'
      },
      // {
      //   title: intl.formatMessage({ id: 'gpuservice.instance.sliceable' }),
      //   dataIndex: ['spec', 'sliceable'],
      //   key: 'sliceable',
      //   ellipsis: { showTitle: false },
      //   render: (value: boolean) =>
      //     value
      //       ? intl.formatMessage({ id: 'common.table.yes' })
      //       : intl.formatMessage({ id: 'common.table.no' })
      // },
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
        title: intl.formatMessage({ id: 'gpuservice.instance.os' }),
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
              title={arch ? `${os} (${arch})` : os}
            >
              {arch ? `${os} (${arch})` : os}
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
            items={rowActions}
            onSelect={(val: string) => handleSelect(val, record)}
          />
        )
      }
    ];
  }, [handleSelect, intl]);
};

export default useInstanceTypeColumns;
