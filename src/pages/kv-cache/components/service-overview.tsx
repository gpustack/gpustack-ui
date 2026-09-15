import { localize } from '@/utils/localize';
import { ExportOutlined } from '@ant-design/icons';
import {
  AutoTooltip,
  CardWrapper,
  IconFont,
  StatusTag
} from '@gpustack/core-ui';
import { useIntl } from '@umijs/max';
import type { DescriptionsProps } from 'antd';
import { Button, Descriptions, Space, Tooltip, Typography } from 'antd';
import dayjs from 'dayjs';
import React from 'react';
import styled from 'styled-components';
import {
  ServiceStateLabelMap,
  ServiceStatus,
  canViewServiceLogs,
  formatServiceVersion,
  isHttpUrl,
  profileRamGib
} from '../config';
import { CacheProviderItem, ListItem } from '../config/types';

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
  clusterNameMap: Record<number, string>;
  workerNameMap: Record<number, string>;
  onViewLogs: (row: ListItem) => void;
}

const ServiceOverview: React.FC<ServiceOverviewProps> = ({
  data,
  provider,
  clusterNameMap,
  workerNameMap,
  onViewLogs
}) => {
  const intl = useIntl();

  if (!data) {
    return null;
  }

  const isPerNode = provider?.topology === 'per_node';

  const capacityGib = profileRamGib(
    provider?.resource_profile,
    provider?.fields,
    data.config?.fields
  );

  // a concrete worker exists only for a pinned replicas service;
  // per_node spans workers, so it renders no Worker row at all
  const workerName = data.worker_id
    ? workerNameMap[data.worker_id] || '-'
    : null;

  const items: DescriptionsProps['items'] = [
    {
      key: 'provider',
      label: intl.formatMessage({ id: 'kvCache.table.provider' }),
      children: [
        localize(provider?.display_name) || data.provider_name,
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
    // per-instance capacity from the provider's declared resource
    // profile; a provider without one (a multi-component pool) shows no
    // row
    ...(capacityGib
      ? [
          {
            key: 'capacity',
            label: intl.formatMessage({ id: 'kvCache.detail.capacity' }),
            children: isPerNode
              ? `${capacityGib} GiB (${intl.formatMessage({
                  id: 'kvCache.detail.perWorker'
                })})`
              : `${capacityGib} GiB`
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
                {isHttpUrl(data.config?.management_url) && (
                  <Tooltip
                    title={intl.formatMessage({
                      id: 'kvCache.button.management'
                    })}
                  >
                    <Typography.Link
                      href={data.config?.management_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      aria-label={intl.formatMessage({
                        id: 'kvCache.button.management'
                      })}
                    >
                      <ExportOutlined style={{ fontSize: 13 }} />
                    </Typography.Link>
                  </Tooltip>
                )}
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
