import { Col, Row, Skeleton } from 'antd';
import React from 'react';

interface CatalogSkeltonProps {
  span: number;
  skeletonProps?: any;
  skeletonStyle?: React.CSSProperties;
}

const CardSkelton: React.FC<CatalogSkeltonProps> = (props) => {
  return (
    <Row gutter={[16, 16]}>
      {Array(6)
        .fill(1)
        .map((_, index) => {
          return (
            <Col span={props.span} key={index}>
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
            </Col>
          );
        })}
    </Row>
  );
};

export default React.memo(CardSkelton);
