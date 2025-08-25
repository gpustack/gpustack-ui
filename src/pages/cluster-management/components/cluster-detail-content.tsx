import GaugeChart from '@/components/echarts/gauge';
import { PageAction } from '@/config';
import { Col, Row } from 'antd';
import React, { useEffect, useState } from 'react';
import styled from 'styled-components';
import { queryClusterDetail } from '../apis';
import { ProviderValueMap } from '../config';
import { ClusterListItem, NodePoolListItem } from '../config/types';
import AddPool from './add-pool';
import WorkerPools from './worker-pools';

const SubTitle = styled.div`
  font-size: var(--font-size-middle);
  font-weight: 500;
  color: var(--ant-color-text);
  margin-block: 24px 16px;
`;

interface ClusterDetailProps {
  data: ClusterListItem | null;
}

const gaugeConfig = {
  radius: '100%',
  progress: {
    show: true,
    roundCap: false,
    width: 8
  },
  axisLine: {
    roundCap: false,
    lineStyle: {
      width: 8,
      color: [
        [0.5, 'rgba(84, 204, 152, 80%)'],
        [0.8, 'rgba(250, 173, 20, 80%)'],
        [1, 'rgba(255, 77, 79, 80%)']
      ]
    }
  }
};

const ClusterDetail: React.FC<ClusterDetailProps> = ({ data }) => {
  const chartHeight = 160;
  const [show, setShow] = React.useState(false);
  const [addPoolStatus, setAddPoolStatus] = React.useState({
    open: false,
    action: PageAction.CREATE,
    title: '',
    provider: ProviderValueMap.DigitalOcean
  });
  const [detailContent, setDetailContent] = useState<Record<string, any>>({});

  // pool action handler
  const handleOnAction = (action: string, record: NodePoolListItem) => {
    if (action === 'edit') {
      setAddPoolStatus({
        open: true,
        action: PageAction.CREATE,
        title: 'Edit Worker Pool',
        provider: data!.provider
      });
    }
  };

  const getClusterDetail = async () => {
    if (!data) {
      return;
    }
    try {
      const response = await queryClusterDetail({
        cluster_id: data!.id
      });
      setDetailContent(response);
      // handle response
    } catch (error) {
      setDetailContent({});
    }
  };

  useEffect(() => {
    if (data?.id) {
      getClusterDetail();
    }
  }, [data?.id]);

  return (
    <div>
      <div className="chart-wrapper">
        <Row gutter={16} style={{ width: '100%' }}>
          <Col span={6}>
            <GaugeChart
              title="GPU Utilization"
              value={85}
              height={chartHeight}
              gaugeConfig={gaugeConfig}
            />
          </Col>
          <Col span={6}>
            <GaugeChart
              title="CPU Utilization"
              value={50}
              height={chartHeight}
              gaugeConfig={gaugeConfig}
            />
          </Col>
          <Col span={6}>
            <GaugeChart
              title="RAM Utilization"
              value={70}
              height={chartHeight}
              gaugeConfig={gaugeConfig}
            />
          </Col>
          <Col span={6}>
            <GaugeChart
              title="VRAM Utilization"
              value={60}
              height={chartHeight}
              gaugeConfig={gaugeConfig}
            />
          </Col>
        </Row>
      </div>
      {data?.provider === ProviderValueMap.DigitalOcean && (
        <>
          <SubTitle>Worker Pools</SubTitle>
          <WorkerPools
            provider={data?.provider}
            workerPools={data?.worker_pools}
            height={show ? 'auto' : 0}
            onAction={handleOnAction}
          />
        </>
      )}
      <AddPool
        provider={addPoolStatus.provider}
        open={addPoolStatus.open}
        action={addPoolStatus.action}
        title={addPoolStatus.title}
        onCancel={() => {
          setAddPoolStatus({
            open: false,
            action: PageAction.CREATE,
            title: '',
            provider: 'digitalocean'
          });
        }}
        onOk={() => {
          setAddPoolStatus({
            open: false,
            action: addPoolStatus.action,
            title: '',
            provider: 'digitalocean'
          });
        }}
      ></AddPool>
    </div>
  );
};

export default ClusterDetail;
