import {
  AutoTooltip,
  CardWrapper,
  IconFont,
  StatusTag,
  ThemeTag
} from '@gpustack/core-ui';
import { useIntl } from '@umijs/max';
import type { DescriptionsProps } from 'antd';
import { Button, Descriptions, Space } from 'antd';
import dayjs from 'dayjs';
import React from 'react';
import styled from 'styled-components';
import {
  ServiceModeColorMap,
  ServiceModeMap,
  ServiceModeValueMap,
  ServiceStateLabelMap,
  ServiceStatus,
  canViewServiceLogs,
  formatServiceVersion
} from '../config';
import {
  CacheProviderItem,
  CacheServiceInstanceItem,
  ListItem
} from '../config/types';

const Container = styled.div`
  display: flex;
  .left {
    padding: 16px 0px;
    width: 124px;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 20px;
    .img {
      width: 72px;
      height: 72px;
      display: flex;
      align-items: center;
      justify-content: center;
      border-radius: 8px;
      background-color: var(--ant-blue-1);
      .anticon {
        font-size: 36px;
      }
      img {
        width: 40px;
        height: 40px;
      }
    }
  }
  .right {
    flex: 1;
    padding-block: 16px;
    padding-inline: 0 24px;
  }
`;

const Title = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
`;

interface ServiceOverviewProps {
  data: ListItem | null;
  provider?: CacheProviderItem;
  // managed services only; the overview derives the singleton endpoint
  // from its single instance
  instances?: CacheServiceInstanceItem[];
  clusterNameMap: Record<number, string>;
  workerNameMap: Record<number, string>;
  onViewLogs: (row: ListItem) => void;
}

const ServiceOverview: React.FC<ServiceOverviewProps> = ({
  data,
  provider,
  instances,
  clusterNameMap,
  workerNameMap,
  onViewLogs
}) => {
  const intl = useIntl();

  if (!data) {
    return null;
  }

  const isPerNode =
    data.mode === ServiceModeValueMap.Managed &&
    provider?.topology === 'per_node';

  // a concrete worker exists only for singleton managed services;
  // per_node spans workers and external services have none, so those
  // render no Worker row at all
  const workerName = data.worker_id
    ? workerNameMap[data.worker_id] || '-'
    : null;

  // per_node services have no endpoint to state: engines are wired to
  // their own node's instance automatically and each instance owns its
  // port (the instance rows on the list page carry them), so the row
  // renders only where a single address exists
  const renderEndpoint = (): string | null => {
    if (data.mode === ServiceModeValueMap.Managed) {
      if (isPerNode) {
        return null;
      }
      // singleton topology has exactly one instance carrying the port
      const instance = instances?.[0];
      return instance?.port && workerName
        ? `${workerName}:${instance.port}`
        : '-';
    }
    if (data.endpoint?.host) {
      return `${data.endpoint.host}:${data.endpoint.port}`;
    }
    return data.endpoint?.url || '-';
  };
  const endpoint = renderEndpoint();

  const items: DescriptionsProps['items'] = [
    {
      key: 'provider',
      label: intl.formatMessage({ id: 'kvCache.table.provider' }),
      children: [
        provider?.display_name || data.provider_name,
        formatServiceVersion(data.provider_version, data.config?.image)
      ]
        .filter(Boolean)
        .join(' ')
    },
    {
      key: 'cluster',
      label: intl.formatMessage({ id: 'clusters.title' }),
      children: clusterNameMap[data.cluster_id] || '-'
    },
    ...(workerName
      ? [
          {
            key: 'worker',
            label: intl.formatMessage({ id: 'kvCache.table.worker' }),
            children: workerName
          }
        ]
      : []),
    // per_node placement constraint; instances only run on workers
    // matching all of these labels
    ...(Object.keys(data.worker_selector || {}).length
      ? [
          {
            key: 'worker_selector',
            label: intl.formatMessage({ id: 'kvCache.form.workerSelector' }),
            children: (
              <AutoTooltip ghost>
                {Object.entries(data.worker_selector!)
                  .map(([key, value]) => `${key}=${value}`)
                  .join(', ')}
              </AutoTooltip>
            )
          }
        ]
      : []),
    ...(endpoint != null
      ? [
          {
            key: 'endpoint',
            label: intl.formatMessage({ id: 'kvCache.table.endpoint' }),
            children: endpoint
          }
        ]
      : []),
    // the configured L1 RAM size; external services manage their own
    // capacity and show no row
    ...(data.config?.ram_size != null
      ? [
          {
            key: 'ram_size',
            label: intl.formatMessage({ id: 'kvCache.form.ramSize' }),
            children: isPerNode
              ? `${data.config.ram_size} (${intl.formatMessage({
                  id: 'kvCache.detail.perWorker'
                })})`
              : data.config.ram_size
          }
        ]
      : []),
    {
      key: 'created_at',
      label: intl.formatMessage({ id: 'common.table.createTime' }),
      children: data.created_at
        ? dayjs(data.created_at).format('YYYY-MM-DD HH:mm:ss')
        : '-'
    }
  ];

  return (
    <CardWrapper style={{ padding: 0 }}>
      <Container>
        <div className="left">
          <div className="img">
            {provider?.icon ? (
              <img src={provider.icon} alt={`${data.provider_name} icon`} />
            ) : (
              <IconFont type="icon-storage-outlined" />
            )}
          </div>
          <div className="status">
            <StatusTag
              statusValue={{
                status: ServiceStatus[data.state],
                text: ServiceStateLabelMap[data.state],
                message: data.state_message || undefined
              }}
            />
          </div>
        </div>
        <div className="right">
          <Descriptions
            column={2}
            title={
              <Title>
                <span>{data.name}</span>
                <ThemeTag
                  color={ServiceModeColorMap[data.mode] || 'blue'}
                  opacity={0.7}
                >
                  {intl.formatMessage({ id: ServiceModeMap[data.mode] })}
                </ThemeTag>
              </Title>
            }
            extra={
              <Space>
                {canViewServiceLogs(data, provider) && (
                  <Button
                    icon={<IconFont type="icon-logs" />}
                    onClick={() => onViewLogs(data)}
                  >
                    {intl.formatMessage({ id: 'kvCache.button.viewLogs' })}
                  </Button>
                )}
              </Space>
            }
            items={items}
          />
        </div>
      </Container>
    </CardWrapper>
  );
};

export default ServiceOverview;
