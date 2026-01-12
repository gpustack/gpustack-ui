import CardWrapper from '@/components/card-wrapper';
import { Col, Progress, Row } from 'antd';
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
      gap: 8px;
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

  return (
    <Row gutter={16} style={{ marginTop: 24 }}>
      <Col span={6}>
        <CardWrapper>
          <Container>
            <div className="title">GPU Utilization</div>
            <div className="value-wrapper">
              <div className="value">
                <span>44%</span>
                <Progress
                  percent={44}
                  strokeWidth={8}
                  showInfo={false}
                ></Progress>
              </div>
            </div>
          </Container>
        </CardWrapper>
      </Col>
      <Col span={6}>
        <CardWrapper>
          <Container>
            <div className="title">VRAM Utilization</div>
            <div className="value-wrapper">
              <div className="value">44%</div>
              <div className="chart">
                <Progress
                  percent={44}
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
        <CardWrapper>
          <Container>
            <div className="title">CPU Utilization</div>
            <div className="value-wrapper">
              <div className="value">
                <span>44%</span>
                <Progress
                  percent={44}
                  steps={10}
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
              </div>
            </div>
          </Container>
        </CardWrapper>
      </Col>
      <Col span={6}>
        <CardWrapper>
          <Container>
            <div className="title">Memo Utilization</div>
            <div className="value-wrapper">
              <div className="value">
                <span>44%</span>
              </div>
              <div className="chart">
                <Progress
                  percent={44}
                  type="circle"
                  size={50}
                  strokeWidth={8}
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
