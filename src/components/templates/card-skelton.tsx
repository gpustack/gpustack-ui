import { Skeleton } from 'antd';
import React from 'react';
import styled from 'styled-components';
import ResizeContainer from '../resize-container';

const SkeletonWrapper = styled.div`
  .ant-skeleton-paragraph {
    margin-bottom: 0;
  }
`;

interface CatalogSkeltonProps {
  skeletonProps?: any;
  skeletonStyle?: React.CSSProperties;
}

const CardSkelton: React.FC<CatalogSkeltonProps> = (props) => {
  return (
    <ResizeContainer
      dataList={Array(6).fill({ label: 'skeleton' })}
      renderItem={() => (
        <SkeletonWrapper>
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
        </SkeletonWrapper>
      )}
    ></ResizeContainer>
  );
};

export default CardSkelton;
