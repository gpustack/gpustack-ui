import { useIntl } from '@umijs/max';
import { Card, Col, Row } from 'antd';
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
      variant="borderless"
      style={{ background: 'var(--color-white-1)' }}
      className={styles['card-body']}
    >
      <div className={styles.content}>
        <div className="label text-secondary">{label}</div>
        <div className="value font-600 font-size-16">{value}</div>
      </div>
    </Card>
  );
};
const Overview: React.FC = () => {
  const intl = useIntl();
  const data = useContext(DashboardContext).resource_counts || {};

  return (
    <div>
      <Row gutter={[20, 20]} className={styles.row}>
        {overviewConfigs.map((config, index) => (
          <Col
            xs={{ flex: '100%' }}
            sm={{ flex: '50%' }}
            md={{ flex: '50%' }}
            lg={{ flex: '20%' }}
            xl={{ flex: '20%' }}
            key={config.key}
          >
            {renderCardItem({
              label: intl.formatMessage({ id: config.label }),
              value: _.get(data, config.key, 0),
              bgColor: config.backgroundColor
            })}
          </Col>
        ))}
      </Row>
    </div>
  );
};

export default Overview;
