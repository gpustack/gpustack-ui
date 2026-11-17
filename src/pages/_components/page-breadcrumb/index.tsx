import { IconFont } from '@gpustack/core-ui';
import { Breadcrumb, Tooltip, type BreadcrumbProps } from 'antd';
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
          <Tooltip title={item.title} trigger={['hover', 'focus']}>
            <span className={styles.text} tabIndex={0}>
              {item.title}
            </span>
          </Tooltip>
        ) : (
          item.title
        )
    }))}
  />
);

export default App;
