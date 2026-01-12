import CardWrapper from '@/components/card-wrapper';
import { Col, Progress, Row } from 'antd';
import { round } from 'lodash';
import React, { useEffect } from 'react';
import styled from 'styled-components';
import { useClusterSystemLoad } from '../../services/use-cluster-detail';

const Container = styled.div`
  display: flex;
  flex-direction: column;
  height: 86px;
  gap: 16px;
  .title {
    font-size: 14px;
    font-weight: 500;
    color: var(--ant-color-text-secondary);
  }

  .value-wrapper {
    display: flex;
    align-items: center;
    justify-content: space-between;
    .value {
      display: flex;
      flex: 1;
      gap: 12px;
      flex-direction: column;
      align-items: flex-start;
      justify-content: center;
      font-size: 20px;
      font-weight: 600;
    }
  }
`;

const ClusterSystemLoad: React.FC<{ clusterId: number }> = ({ clusterId }) => {
  const { systemLoad, fetchClusterSystemLoad } = useClusterSystemLoad();

  useEffect(() => {
    if (clusterId) {
      fetchClusterSystemLoad({ cluster_id: clusterId });
    }
  }, [clusterId]);

  const renderStepsProgress = (percent: number) => {
    return (
      <Progress
        percent={percent}
        size={{
          height: 8
        }}
        styles={{
          root: {
            width: '100%'
          },
          track: {
            flex: 1
          },
          body: {
            display: 'flex',
            width: '100%'
          }
        }}
        showInfo={false}
      ></Progress>
    );
  };

  console.log('systemLoad', systemLoad);

  return (
    <Row gutter={16} style={{ marginTop: 24 }}>
      <Col span={6}>
        <CardWrapper style={{ padding: '16px', height: 120 }}>
          <Container>
            <div className="title">GPU Utilization</div>
            <div className="value-wrapper">
              <div className="value">
                <span>{`${round(systemLoad.current.gpu, 1)}%`}</span>
                {renderStepsProgress(round(systemLoad.current.gpu, 1))}
              </div>
            </div>
          </Container>
        </CardWrapper>
      </Col>
      <Col span={6}>
        <CardWrapper style={{ padding: '16px', height: 120 }}>
          <Container>
            <div className="title">VRAM Utilization</div>
            <div className="value-wrapper">
              <div className="value">{`${round(systemLoad.current.vram, 1)}%`}</div>
              <div className="chart">
                <Progress
                  percent={round(systemLoad.current.vram, 1)}
                  type="circle"
                  size={50}
                  strokeWidth={8}
                  showInfo={false}
                ></Progress>
              </div>
            </div>
          </Container>
        </CardWrapper>
      </Col>
      <Col span={6}>
        <CardWrapper style={{ padding: '16px', height: 120 }}>
          <Container>
            <div className="title">CPU Utilization</div>
            <div className="value-wrapper">
              <div className="value">
                <span>{`${round(systemLoad.current.cpu, 1)}%`}</span>
                {renderStepsProgress(round(systemLoad.current.cpu, 1))}
              </div>
            </div>
          </Container>
        </CardWrapper>
      </Col>
      <Col span={6}>
        <CardWrapper style={{ padding: '16px', height: 120 }}>
          <Container>
            <div className="title">Memo Utilization</div>
            <div className="value-wrapper">
              <div className="value">
                <span>{`${round(systemLoad.current.ram, 1)}%`}</span>
              </div>
              <div className="chart">
                <Progress
                  percent={round(systemLoad.current.ram, 1)}
                  type="circle"
                  size={50}
                  strokeWidth={8}
                  showInfo={false}
                ></Progress>
              </div>
            </div>
          </Container>
        </CardWrapper>
      </Col>
    </Row>
  );
};

export default ClusterSystemLoad;
