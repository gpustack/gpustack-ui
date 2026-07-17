// columns.ts
import { systemConfigAtom } from '@/atoms/system';
import { OPENAI_COMPATIBLE, tableSorter } from '@/config/settings';
import { TargetStatusValueMap } from '@/pages/model-routes/config';
import { usePluginListColumns } from '@/plugins/list-extra-columns';
import { QuestionCircleOutlined } from '@ant-design/icons';
import {
  AutoTooltip,
  DropdownButtons,
  GrafanaIcon,
  icons,
  type TableColumnProps
} from '@gpustack/core-ui';
import { useIntl } from '@umijs/max';
import { useMemoizedFn } from 'ahooks';
import { Flex, Tooltip } from 'antd';
import dayjs from 'dayjs';
import { useAtomValue } from 'jotai';
import _ from 'lodash';
import { useMemo } from 'react';
import ModelTag from '../../_components/model-tag';
import { generateSource } from '../config/button-actions';
import { ListItem } from '../config/types';
interface ActionItem {
  label: string;
  key: string;
  icon: React.ReactNode;
  props?: {
    danger?: boolean;
  };
}

const Dot = ({ color }: { color: string }) => {
  return (
    <span
      style={{
        backgroundColor: color,
        borderRadius: '50%',
        height: 8,
        width: 8,
        display: 'flex'
      }}
    ></span>
  );
};

const ActionList: ActionItem[] = [
  {
    label: 'common.button.edit',
    key: 'edit',
    icon: icons.EditOutlined
  },
  {
    label: 'models.openinplayground',
    key: 'chat',
    icon: icons.ExperimentOutlined
  },
  {
    label: 'common.button.start',
    key: 'start',
    icon: icons.Play
  },
  {
    label: 'common.button.stop',
    key: 'stop',
    icon: icons.Stop
  },
  {
    label: 'resources.metrics.details',
    key: 'metrics',
    icon: (
      <span className="flex-center">
        <GrafanaIcon style={{ width: 14, height: 14 }}></GrafanaIcon>
      </span>
    )
  },
  {
    key: 'copy',
    label: 'common.button.clone',
    icon: icons.CopyOutlined
  },
  {
    label: 'common.button.delete',
    key: 'delete',
    props: {
      danger: true
    },
    icon: icons.DeleteOutlined
  }
];

interface ModelsColumnsHookProps {
  handleSelect: (val: string, record: ListItem) => void;
  sortOrder: string[];
  clusterList: Global.BaseOption<
    number,
    { provider: string; state: string | number }
  >[];
}

const useModelsColumns = ({
  handleSelect,
  clusterList,
  sortOrder,
  targetList
}: ModelsColumnsHookProps & { targetList: any[] }): TableColumnProps[] => {
  const intl = useIntl();
  const systemConfig = useAtomValue(systemConfigAtom);
  const pluginCols = usePluginListColumns('llmodels');

  const setModelActionList = useMemoizedFn((record: any) => {
    return _.filter(ActionList, (action: any) => {
      if (action.key === 'chat') {
        return (
          record.ready_replicas > 0 &&
          targetList?.find(
            (target) =>
              target.model_id === record.id &&
              target.state === TargetStatusValueMap.Active
          )
        );
      }

      if (action.key === 'start') {
        return record.replicas === 0;
      }

      if (action.key === 'stop') {
        return record.replicas > 0;
      }
      if (action.key === 'metrics') {
        return systemConfig?.showMonitoring;
      }

      return true;
    });
  });

  const getColor = (record: ListItem) => {
    if (!record.replicas && !record.ready_replicas) {
      return 'var(--ant-color-fill-secondary)';
    }

    if (record.replicas > 0 && !record.ready_replicas) {
      return 'var(--ant-color-warning)';
    }

    if (record.ready_replicas > 0 && record.replicas > 0) {
      return 'var(--ant-color-success)';
    }
    return 'var(--ant-color-warning)';
  };

  return useMemo(() => {
    // Two prebuilt span maps for the 24-unit SealTable grid: one for
    // the default layout, one for when a plugin contributes an extra
    // column (currently always the 4-span Organization cell). Width
    // absorbed comes from the widest non-name columns (`source`,
    // `replicas`, `created_at`). See the matching map in
    // `use-cluster-columns.tsx` for rationale.
    const SPANS_DEFAULT = {
      source: 5,
      replicas: 4,
      createTime: 4
    };
    const SPANS_WITH_PLUGIN = {
      source: 3,
      replicas: 3,
      createTime: 3
    };
    const spans = pluginCols.length > 0 ? SPANS_WITH_PLUGIN : SPANS_DEFAULT;
    const pluginRendered = pluginCols.map((c) => ({
      title: intl.formatMessage({ id: c.titleId }),
      dataIndex: c.key,
      key: c.key,
      span: c.span ?? 4,
      render: (_text: any, record: ListItem) => c.render(record)
    }));
    return [
      {
        title: intl.formatMessage({ id: 'common.table.name' }),
        dataIndex: 'name',
        key: 'name',
        sorter: tableSorter(1),
        span: 5,
        render: (text: string, record: ListItem) => (
          <Flex align="center" gap={4} style={{ maxWidth: '100%' }}>
            <AutoTooltip
              ghost
              title={
                <span style={{ color: 'var(--ant-color-text-light-solid)' }}>
                  {text}
                </span>
              }
            >
              <span className="text-primary font-400">{text}</span>
            </AutoTooltip>
            <ModelTag categoryKey={record.categories?.[0] || ''} />
          </Flex>
        )
      },
      ...pluginRendered,
      {
        title: intl.formatMessage({ id: 'clusters.title' }),
        dataIndex: 'cluster_id',
        key: 'cluster_id',
        sorter: tableSorter(2),
        span: 3,
        render: (text: string, record: ListItem) => (
          <span className="flex flex-column" style={{ width: '100%' }}>
            {
              clusterList.find((item) => item.value === record.cluster_id)
                ?.label
            }
          </span>
        )
      },
      {
        title: intl.formatMessage({ id: 'models.form.source' }),
        dataIndex: 'source',
        key: 'source',
        sorter: tableSorter(3),
        span: spans.source,
        render: (text: string, record: ListItem) => (
          <span className="flex flex-column" style={{ width: '100%' }}>
            <AutoTooltip ghost>{generateSource(record)}</AutoTooltip>
          </span>
        )
      },
      {
        title: (
          <Tooltip
            title={intl.formatMessage(
              { id: 'models.form.replicas.tips' },
              { api: `${window.location.origin}/${OPENAI_COMPATIBLE}` }
            )}
          >
            <span>{intl.formatMessage({ id: 'models.form.replicas' })}</span>
            <QuestionCircleOutlined className="m-l-5" />
          </Tooltip>
        ),
        dataIndex: 'replicas',
        key: 'replicas',
        align: 'left',
        sorter: tableSorter(4),
        span: spans.replicas,
        editable: {
          valueType: 'number',
          title: intl.formatMessage({ id: 'models.table.replicas.edit' })
        },
        render: (text: number, record: ListItem) => (
          <span
            style={{
              minWidth: '23px',
              display: 'inline-flex',
              alignItems: 'center',
              gap: 8,
              color: 'var(--ant-color-text)'
            }}
          >
            <Dot color={getColor(record)}></Dot>
            {record.ready_replicas} / {record.replicas}
          </span>
        )
      },
      {
        title: intl.formatMessage({ id: 'common.table.createTime' }),
        dataIndex: 'created_at',
        key: 'created_at',
        sorter: tableSorter(5),
        width: 180,
        render: (text: number) => (
          <AutoTooltip ghost>
            {dayjs(text).format('YYYY-MM-DD HH:mm:ss')}
          </AutoTooltip>
        )
      },
      {
        title: intl.formatMessage({ id: 'common.table.operation' }),
        key: 'operation',
        dataIndex: 'operation',
        span: 3,
        render: (text: any, record: ListItem) => (
          <DropdownButtons
            items={setModelActionList(record)}
            onSelect={(val) => handleSelect(val, record)}
          />
        )
      }
    ];
  }, [
    sortOrder,
    clusterList,
    intl,
    handleSelect,
    setModelActionList,
    pluginCols
  ]);
};

export default useModelsColumns;
