import CardWrapper from '@/components/card-wrapper';
import IconFont from '@/components/icon-font';
import StatusTag from '@/components/status-tag';
import { StarFilled } from '@ant-design/icons';
import { useIntl } from '@umijs/max';
import type { DescriptionsProps } from 'antd';
import { Descriptions, Tooltip } from 'antd';
import dayjs from 'dayjs';
import React, { useEffect } from 'react';
import styled from 'styled-components';
import {
  ClusterStatus,
  ClusterStatusLabelMap,
  ProviderLabelMap
} from '../../config';
import providers from '../../config/providers';
import { useClusterDetail } from '../../services/use-cluster-detail';

const Container = styled.div`
  display: flex;
  height: 168px;
  .left {
    padding: 16px 24px;
    width: 160px;
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

const Resources = styled.div`
  display: flex;
  gap: 24px;
  align-items: center;
  line-height: 22px;
  margin-top: 16px;
  .item {
    display: flex;
    align-items: center;
    gap: 8px;
    .anticon {
      color: var(--ant-color-text-quaternary);
      font-size: 16px;
    }
    .value {
      font-weight: 500;
    }
    .label {
      color: var(--ant-color-text-secondary);
    }
  }
`;

const ClusterBasic: React.FC<{ clusterId: number }> = ({ clusterId }) => {
  const intl = useIntl();
  const { clusterDetail, fetchClusterDetail } = useClusterDetail();

  const items: DescriptionsProps['items'] = [
    {
      key: 'provider',
      label: intl.formatMessage({ id: 'clusters.table.provider' }),
      children: ProviderLabelMap[clusterDetail.provider || '']
    },
    {
      key: 'created_at',
      label: intl.formatMessage({ id: 'common.table.createTime' }),
      children: dayjs(clusterDetail.created_at).format('YYYY-MM-DD HH:mm:ss')
    }
  ];

  useEffect(() => {
    if (clusterId) {
      fetchClusterDetail({ id: clusterId });
    }
  }, [clusterId]);

  return (
    <CardWrapper style={{ padding: 0 }}>
      <Container>
        <div className="left">
          <div className="img">
            {
              providers.find((item) => item.value === clusterDetail?.provider)
                ?.icon
            }
          </div>
          <div className="status">
            <StatusTag
              statusValue={{
                status: ClusterStatus[clusterDetail?.state || ''],
                text: ClusterStatusLabelMap[clusterDetail?.state || '']
              }}
            />
          </div>
        </div>
        <div className="right">
          <Descriptions
            title={
              <Title>
                <span>{clusterDetail.name}</span>
                {clusterDetail.is_default && (
                  <Tooltip
                    title={intl.formatMessage({
                      id: 'clusters.form.setDefault.tips'
                    })}
                  >
                    <StarFilled
                      style={{ color: 'var(--ant-gold-4)', marginLeft: 4 }}
                    />
                  </Tooltip>
                )}
              </Title>
            }
            layout="vertical"
            items={items}
          />
          <Resources>
            <div className="item">
              <IconFont type="icon-resources-filled"></IconFont>
              <span className="value">
                {clusterDetail.ready_workers}/{clusterDetail.workers}
              </span>
              <span className="label">Workers</span>
            </div>
            <div className="item">
              <IconFont type="icon-rocket-launch-fill"></IconFont>
              <span className="value">{clusterDetail.models}</span>
              <span className="label">Deployments</span>
            </div>
            <div className="item">
              <IconFont type="icon-gpu"></IconFont>
              <span className="value">{clusterDetail.gpus}</span>
              <span className="label">GPUs</span>
            </div>
          </Resources>
        </div>
      </Container>
    </CardWrapper>
  );
};

export default ClusterBasic;
