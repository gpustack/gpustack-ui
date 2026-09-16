import { useIntl } from '@umijs/max';
import { Card, Col, Row } from 'antd';
import _ from 'lodash';
import React, { useContext } from 'react';
import { overviewConfigs } from '../config';
import { DashboardContext } from '../config/dashboard-context';
import '../styles/index.less';
import styles from './over-view.less';

// `bgColor` used to be destructured here and never read — a dead prop that
// `overviewConfigs` was still supplying a value for on every entry. Sizing and
// weight now come from `.label` / `.value` in the stylesheet rather than from
// utility classes, so the tile's hierarchy is defined in one place.
const renderCardItem = (data: { label: string; value: React.ReactNode }) => {
  const { label, value } = data;
  return (
    <Card variant="borderless" className={styles['card-body']}>
      <div className={styles.content}>
        <div className={`${styles.label} text-secondary`}>{label}</div>
        <div className={styles.value}>{value}</div>
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
              value: _.get(data, config.key, 0)
            })}
          </Col>
        ))}
      </Row>
    </div>
  );
};

export default Overview;
