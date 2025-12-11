import { Skeleton } from 'antd';
import React from 'react';
import ResizeContainer from '../resize-container';

interface CatalogSkeltonProps {
  skeletonProps?: any;
  skeletonStyle?: React.CSSProperties;
}

const CardSkelton: React.FC<CatalogSkeltonProps> = (props) => {
  return (
    <ResizeContainer
      dataList={Array(6).fill({ label: 'skeleton' })}
      renderItem={() => (
        <Skeleton
          avatar={{
            size: 32
          }}
          paragraph={{ rows: 2 }}
          style={{
            border: '1px solid var(--ant-color-border)',
            borderRadius: 'var(--border-radius-base)',
            padding: '16px 16px',
            ...props.skeletonStyle
          }}
          {...(props.skeletonProps || {})}
        ></Skeleton>
      )}
    ></ResizeContainer>
  );
};

export default CardSkelton;
