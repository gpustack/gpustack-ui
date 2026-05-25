import { ReloadOutlined } from '@ant-design/icons';
import {
  AlertBlockInfo,
  AutoTooltip,
  ScrollerModal,
  StatusTag
} from '@gpustack/core-ui';
import { useIntl } from '@umijs/max';
import { Button, Table, Tabs, TabsProps } from 'antd';
import type { ColumnsType } from 'antd/lib/table';
import dayjs from 'dayjs';
import React, { useEffect, useMemo, useState } from 'react';
import { InstanceEventItem } from '../config/types';
import useQueryInstanceEvents from '../services/use-query-instance-events';
import useQueryVolumeEvents from '../services/use-query-volume-events';

type ViewEventsModalProps = {
  open: boolean;
  name: string;
  namespace: string;
  clusterID?: number;
  onCancel: () => void;
};

const formatRelative = (text?: string) => (text ? dayjs(text).fromNow() : '-');

const eventTypeStatus: Record<string, 'success' | 'warning' | 'error'> = {
  Normal: 'success',
  Warning: 'warning'
};

const ViewEventsModal: React.FC<ViewEventsModalProps> = (props) => {
  const intl = useIntl();
  const { open, onCancel, name, namespace, clusterID } = props || {};
  const [activeKey, setActiveKey] = useState('instance');

  const {
    detailData: instanceEventsData,
    loading: instanceLoading,
    cancelRequest: cancelInstanceRequest,
    fetchData: fetchInstanceEvents
  } = useQueryInstanceEvents();

  const {
    detailData: volumeEventsData,
    loading: volumeLoading,
    cancelRequest: cancelVolumeRequest,
    fetchData: fetchVolumeEvents
  } = useQueryVolumeEvents();

  const instanceEvents = instanceEventsData?.items ?? [];
  const volumeEvents = volumeEventsData?.items ?? [];

  const refreshAll = () => {
    if (!name || !namespace || !clusterID) return;
    fetchInstanceEvents({ name, namespace, clusterID });
    fetchVolumeEvents({ name, namespace, clusterID });
  };

  useEffect(() => {
    if (open) {
      refreshAll();
    } else {
      cancelInstanceRequest();
      cancelVolumeRequest();
    }
    return () => {
      cancelInstanceRequest();
      cancelVolumeRequest();
    };
  }, [open]);

  const handleCancel = () => {
    cancelInstanceRequest();
    cancelVolumeRequest();
    onCancel();
  };

  const columns: ColumnsType<InstanceEventItem> = useMemo(
    () => [
      {
        title: intl.formatMessage({ id: 'common.table.type' }),
        dataIndex: 'type',
        key: 'type',
        width: 110,
        render: (value: string) => (
          <StatusTag
            statusValue={{
              status: eventTypeStatus[value] ?? 'inactive',
              text: value || '-'
            }}
          />
        )
      },
      {
        title: intl.formatMessage({ id: 'gpuservice.instance.event.reason' }),
        dataIndex: 'reason',
        key: 'reason',
        width: 180,
        ellipsis: { showTitle: false },
        render: (text: string) => (
          <AutoTooltip ghost style={{ maxWidth: 180 }}>
            {text || '-'}
          </AutoTooltip>
        )
      },
      {
        title: intl.formatMessage({ id: 'gpuservice.instance.event.message' }),
        dataIndex: 'message',
        key: 'message',
        ellipsis: { showTitle: false },
        render: (text: string) => <AutoTooltip ghost>{text || '-'}</AutoTooltip>
      },
      {
        title: intl.formatMessage({ id: 'gpuservice.instance.event.source' }),
        key: 'source',
        width: 200,
        ellipsis: { showTitle: false },
        render: (_text, record) => {
          const src =
            record.source?.component ||
            record.reportingComponent ||
            record.reportingInstance ||
            '-';
          return (
            <AutoTooltip ghost style={{ maxWidth: 200 }}>
              {src}
            </AutoTooltip>
          );
        }
      },
      {
        title: intl.formatMessage({ id: 'gpuservice.instance.event.count' }),
        dataIndex: 'count',
        key: 'count',
        width: 80,
        render: (value?: number) => value ?? '-'
      },
      {
        title: intl.formatMessage({
          id: 'gpuservice.instance.event.lastSeen'
        }),
        key: 'lastTimestamp',
        width: 180,
        render: (_text, record) =>
          formatRelative(
            record.lastTimestamp ||
              record.series?.lastObservedTime ||
              record.eventTime
          )
      }
    ],
    [intl]
  );

  const renderTable = (
    dataSource: InstanceEventItem[],
    tableLoading: boolean
  ) => (
    <Table
      columns={columns}
      className={'scroll-table'}
      tableLayout={'auto'}
      style={{ width: '100%', minHeight: 400 }}
      dataSource={dataSource}
      rowKey={(record) =>
        `${record.metadata?.name}-${record.metadata?.namespace}`
      }
      loading={{
        spinning: tableLoading,
        size: 'middle'
      }}
      virtual
      scroll={{ y: 'calc(100vh -  80px)' }}
      pagination={false}
    />
  );

  const tabItems: TabsProps['items'] = [
    {
      key: 'instance',
      label: intl.formatMessage({
        id: 'gpuservice.instance.event.tab.instance'
      }),
      children: renderTable(instanceEvents, instanceLoading)
    },
    {
      key: 'volume',
      label: intl.formatMessage({
        id: 'gpuservice.instance.event.tab.volume'
      }),
      children: renderTable(volumeEvents, volumeLoading)
    }
  ];

  const isLoading = instanceLoading || volumeLoading;

  return (
    <ScrollerModal
      title={
        <span className="flex flex-center" style={{ gap: 8 }}>
          <span style={{ fontWeight: 'var(--font-weight-bold)' }}>
            {intl.formatMessage({ id: 'common.button.viewevent' })}
          </span>
          <Button
            type="text"
            size="small"
            icon={<ReloadOutlined />}
            onClick={refreshAll}
            loading={isLoading}
          />
        </span>
      }
      zIndex={3000}
      open={open}
      centered={true}
      onCancel={handleCancel}
      destroyOnHidden={true}
      closeIcon={true}
      mask={{
        closable: false
      }}
      keyboard={true}
      styles={{
        wrapper: {
          borderRadius: 0
        }
      }}
      width="1000px"
      maxContentHeight="100vh"
      footer={null}
    >
      <div style={{ marginBlock: '8px 16px' }}>
        <AlertBlockInfo
          message={intl.formatMessage({
            id: 'gpuservice.instance.event.recentHourTip'
          })}
          type="warning"
          contentStyle={{ paddingInline: 0 }}
        ></AlertBlockInfo>
      </div>
      <Tabs
        size="small"
        type="card"
        activeKey={activeKey}
        onChange={setActiveKey}
        items={tabItems}
      />
    </ScrollerModal>
  );
};

export default ViewEventsModal;
