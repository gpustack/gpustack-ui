import CardWrapper from '@/components/card-wrapper';
import { Col, Progress, Row, Tag } from 'antd';
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
    display: flex;
    align-items: center;
    justify-content: space-between;
    font-size: 14px;
    font-weight: 500;
    color: var(--ant-color-text-tertiary);
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

  const renderStepsProgress = (
    percent: number,
    tag: { color: string; text: string }
  ) => {
    return (
      <Progress
        percent={percent}
        type="circle"
        size={50}
        strokeWidth={8}
        showInfo={true}
        format={() => (
          <Tag
            color={tag?.color || 'blue'}
            style={{
              fontSize: 11,
              borderRadius: 12,
              backgroundColor: 'unset',
              fontWeight: 500
            }}
          >
            {tag?.text || ''}
          </Tag>
        )}
      ></Progress>
    );
  };

  console.log('systemLoad', systemLoad);

  return (
    <Row gutter={16} style={{ marginTop: 24 }}>
      <Col span={6}>
        <CardWrapper style={{ padding: '16px', height: 120 }}>
          <Container>
            <div className="title">
              <span>GPU Utilization</span>
            </div>
            <div className="value-wrapper">
              <div className="value">
                <span>{`${round(systemLoad.current.gpu, 1)}%`}</span>
              </div>
              <div className="chart">
                {renderStepsProgress(round(systemLoad.current.gpu, 1), {
                  color: 'magenta',
                  text: 'GPU'
                })}
              </div>
            </div>
          </Container>
        </CardWrapper>
      </Col>
      <Col span={6}>
        <CardWrapper style={{ padding: '16px', height: 120 }}>
          <Container>
            <div className="title">
              <span>VRAM Utilization</span>
            </div>
            <div className="value-wrapper">
              <div className="value">{`${round(systemLoad.current.vram, 1)}%`}</div>
              <div className="chart">
                {renderStepsProgress(round(systemLoad.current.vram, 1), {
                  color: 'purple',
                  text: 'VRAM'
                })}
              </div>
            </div>
          </Container>
        </CardWrapper>
      </Col>
      <Col span={6}>
        <CardWrapper style={{ padding: '16px', height: 120 }}>
          <Container>
            <div className="title">
              <span>CPU Utilization</span>
            </div>
            <div className="value-wrapper">
              <div className="value">
                <span>{`${round(systemLoad.current.cpu, 1)}%`}</span>
              </div>
              <div className="chart">
                {renderStepsProgress(round(systemLoad.current.cpu, 1), {
                  color: 'cyan',
                  text: 'CPU'
                })}
              </div>
            </div>
          </Container>
        </CardWrapper>
      </Col>
      <Col span={6}>
        <CardWrapper style={{ padding: '16px', height: 120 }}>
          <Container>
            <div className="title">
              <span>Memo Utilization</span>
            </div>
            <div className="value-wrapper">
              <div className="value">
                <span>{`${round(systemLoad.current.ram, 1)}%`}</span>
              </div>
              <div className="chart">
                {renderStepsProgress(round(systemLoad.current.ram, 1), {
                  color: 'green',
                  text: 'RAM'
                })}
              </div>
            </div>
          </Container>
        </CardWrapper>
      </Col>
    </Row>
  );
};

export default ClusterSystemLoad;
