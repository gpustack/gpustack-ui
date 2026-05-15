import { createAxiosToken } from '@/hooks/use-chunk-request';
import { ReloadOutlined } from '@ant-design/icons';
import {
  AlertBlockInfo,
  AutoTooltip,
  ScrollerModal,
  StatusTag
} from '@gpustack/core-ui';
import { useIntl } from '@umijs/max';
import { Button, Table } from 'antd';
import type { ColumnsType } from 'antd/lib/table';
import dayjs from 'dayjs';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { queryGPUServiceInstanceEvents } from '../apis';
import { InstanceEventItem } from '../config/types';

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
  const [events, setEvents] = useState<InstanceEventItem[]>([]);
  const [loading, setLoading] = useState(false);
  const tokenRef = useRef<ReturnType<typeof createAxiosToken> | null>(null);

  const fetchEvents = useCallback(async () => {
    if (!name || !clusterID || !namespace) return;
    tokenRef.current?.cancel?.();
    const source = createAxiosToken();
    tokenRef.current = source;
    setLoading(true);
    try {
      const res = await queryGPUServiceInstanceEvents(
        { name, namespace, clusterID },
        { token: source.token }
      );
      setEvents(res?.items ?? []);
    } catch (e) {
      // request cancellation or network failure — keep prior items
    } finally {
      setLoading(false);
    }
  }, [name, namespace, clusterID]);

  useEffect(() => {
    if (open) {
      fetchEvents();
    } else {
      tokenRef.current?.cancel?.();
      setEvents([]);
    }
    return () => {
      tokenRef.current?.cancel?.();
    };
  }, [open, fetchEvents]);

  const handleCancel = useCallback(() => {
    tokenRef.current?.cancel?.();
    onCancel();
  }, [onCancel]);

  const columns: ColumnsType<InstanceEventItem> = [
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
      title: intl.formatMessage({ id: 'gpuservice.instance.event.lastSeen' }),
      key: 'lastTimestamp',
      width: 180,
      render: (_text, record) =>
        formatRelative(
          record.lastTimestamp ||
            record.series?.lastObservedTime ||
            record.eventTime
        )
    }
  ];

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
            onClick={fetchEvents}
            loading={loading}
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
      <Table
        columns={columns}
        className={'scroll-table'}
        tableLayout={'auto'}
        style={{ width: '100%', minHeight: 400 }}
        dataSource={events || []}
        rowKey={(record) =>
          `${record.metadata?.name}-${record.metadata.namespace}`
        }
        loading={{
          spinning: loading,
          size: 'middle'
        }}
        virtual
        scroll={{ y: 'calc(100vh -  80px)' }}
        pagination={false}
      ></Table>
    </ScrollerModal>
  );
};

export default ViewEventsModal;
