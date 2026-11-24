import { AutoTooltip, IconFont } from '@gpustack/core-ui';
import { Breadcrumb, type BreadcrumbProps } from 'antd';
import React from 'react';
import styles from './index.module.less';

const App: React.FC<BreadcrumbProps> = ({ items }) => (
  <Breadcrumb
    className={styles.breadcrumb}
    separator={<IconFont type="icon-down2" rotate={-90} />}
    items={items?.map((item) => ({
      ...item,
      title:
        typeof item.title === 'string' || typeof item.title === 'number' ? (
          <AutoTooltip
            ghost
            showTitle
            title={item.title}
            style={{ width: 'fit-content' }}
            tooltipProps={{ trigger: ['hover', 'focus'] }}
          >
            <span tabIndex={0}>{item.title}</span>
          </AutoTooltip>
        ) : (
          item.title
        )
    }))}
  />
);

export default App;
