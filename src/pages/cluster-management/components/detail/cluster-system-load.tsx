import { CardWrapper } from '@gpustack/core-ui';
import { useIntl } from '@umijs/max';
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
    font-weight: 400;
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
  const intl = useIntl();

  useEffect(() => {
    if (clusterId) {
      fetchClusterSystemLoad({ cluster_id: clusterId });
    }
  }, [clusterId]);

  const generateStrokeColor = (percent: number) => {
    if (percent <= 50) {
      return 'var(--ant-color-success)';
    }
    if (percent <= 80) {
      return 'var(--ant-color-warning)';
    }
    return 'var(--ant-color-error)';
  };

  const renderStepsProgress = (
    percent: number,
    tag: { color: string; text: string }
  ) => {
    const strokeColor = generateStrokeColor(percent);
    return (
      <Progress
        percent={percent}
        type="circle"
        size={50}
        strokeWidth={8}
        showInfo={true}
        strokeColor={strokeColor}
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
              <span>
                {intl.formatMessage({ id: 'dashboard.gpuutilization' })}
              </span>
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
              <span>
                {intl.formatMessage({ id: 'dashboard.vramutilization' })}
              </span>
            </div>
            <div className="value-wrapper">
              <div className="value">{`${round(systemLoad.current.vram, 1)}%`}</div>
              <div className="chart">
                {renderStepsProgress(round(systemLoad.current.vram, 1), {
                  color: 'purple',
                  text: intl.formatMessage({ id: 'dashboard.vram' })
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
              <span>
                {intl.formatMessage({ id: 'dashboard.cpuutilization' })}
              </span>
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
              <span>
                {intl.formatMessage({ id: 'dashboard.memoryutilization' })}
              </span>
            </div>
            <div className="value-wrapper">
              <div className="value">
                <span>{`${round(systemLoad.current.ram, 1)}%`}</span>
              </div>
              <div className="chart">
                {renderStepsProgress(round(systemLoad.current.ram, 1), {
                  color: 'green',
                  text: intl.formatMessage({ id: 'dashboard.memory' })
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
