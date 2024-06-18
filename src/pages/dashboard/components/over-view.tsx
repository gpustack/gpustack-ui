import { PageContainer } from '@ant-design/pro-components';
import { Card, Col, Row, Space } from 'antd';
import React from 'react';
import { overviewConfigs } from '../config';
import '../styles/index.less';
import styles from './over-view.less';

const renderCardItem = (data: {
  label: string;
  value: React.ReactNode;
  bgColor: string;
}) => {
  const { label, value, bgColor } = data;
  return (
    <Card
      bordered={false}
      style={{ background: bgColor }}
      className={styles['card-body']}
    >
      <div className={styles.content}>
        <div className="label">{label}</div>
        <div className="value">{value}</div>
      </div>
    </Card>
  );
};
const Overview: React.FC = (props) => {
  // const { data = {} } = props;
  const data = {
    workers: 8,
    models: {
      healthy: 10,
      warning: 2,
      error: 1
    },
    gpus: 30,
    allocatedGpus: 12,
    instances: {
      healthy: 32,
      warning: 3,
      error: 2
    }
  };

  const renderValue = (
    value:
      | number
      | {
          healthy: number;
          warning: number;
          error: number;
        }
  ) => {
    if (typeof value === 'number') {
      return value;
    }
    return (
      <Space className="value-box">
        <span className={'value-healthy'}>{value.healthy}</span>
        <span className={'value-warning'}>{value.warning}</span>
        <span className={'value-error'}>{value.error}</span>
      </Space>
    );
  };
  return (
    <PageContainer ghost title={false}>
      <Row gutter={[20, 20]} className={styles.row}>
        {overviewConfigs.map((config, index) => (
          <Col span={5} key={config.key}>
            {renderCardItem({
              label: config.label,
              value: renderValue(data[config.key] || 0),
              bgColor: config.backgroundColor
            })}
          </Col>
        ))}
      </Row>
    </PageContainer>
  );
};

export default Overview;
