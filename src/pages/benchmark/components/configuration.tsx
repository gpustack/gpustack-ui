import { useIntl } from '@umijs/max';
import { createStyles } from 'antd-style';
import React from 'react';
import BenchMark from './summary/benchmark';
import Instance from './summary/instance';
import { SectionTitle } from './summary/ui';

const useStyles = createStyles(({ css }) => ({
  container: css`
    display: flex;
    flex-direction: column;
    gap: 20px;
    padding: 4px 4px 16px;
    .card {
      border: 1px solid var(--ant-color-border-secondary);
      border-radius: var(--ant-border-radius);
      padding: 18px 20px;
    }
  `
}));

// Configuration tab: two clearly-labelled groups — Deployment (model /
// instance / backend) on top, Benchmark (load / dataset / advanced) below.
const Configuration: React.FC = () => {
  const { styles } = useStyles();
  const intl = useIntl();
  return (
    <div className={styles.container}>
      <div>
        <SectionTitle>
          {intl.formatMessage({ id: 'benchmark.detail.config.deployment' })}
        </SectionTitle>
        <div className="card">
          <Instance />
        </div>
      </div>
      <div>
        <SectionTitle>
          {intl.formatMessage({ id: 'benchmark.detail.config.benchmark' })}
        </SectionTitle>
        <div className="card">
          <BenchMark />
        </div>
      </div>
    </div>
  );
};

export default Configuration;
