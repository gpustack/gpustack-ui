import { useIntl } from '@umijs/max';
import { Card, Col, Row, Space } from 'antd';
import _ from 'lodash';
import React, { useContext } from 'react';
import { overviewConfigs } from '../config';
import { DashboardContext } from '../config/dashboard-context';
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
const Overview: React.FC = () => {
  const intl = useIntl();
  const data = useContext(DashboardContext).resource_counts || {};

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
      <Space className="value-box" size={20}>
        <span className={'value-healthy'}>{value.healthy}</span>
        <span className={'value-warning'}>{value.warning}</span>
        <span className={'value-error'}>{value.error}</span>
      </Space>
    );
  };
  return (
    <div>
      <Row gutter={[24, 20]} className={styles.row}>
        {overviewConfigs.map((config, index) => (
          <Col
            xs={{ flex: '100%' }}
            sm={{ flex: '50%' }}
            md={{ flex: '50%' }}
            lg={{ flex: '25%' }}
            xl={{ flex: '25%' }}
            key={config.key}
          >
            {renderCardItem({
              label: intl.formatMessage({ id: config.label }),
              value: renderValue(_.get(data, config.key, 0)),
              bgColor: config.backgroundColor
            })}
          </Col>
        ))}
      </Row>
    </div>
  );
};

export default React.memo(Overview);
