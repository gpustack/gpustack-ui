import breakpoints from '@/config/breakpoints';
import { Col, FloatButton, Row, Spin } from 'antd';
import _ from 'lodash';
import ResizeObserver from 'rc-resize-observer';
import React, { useCallback } from 'react';
import styled from 'styled-components';

const SpinWrapper = styled.div`
  width: 100%;
  position: absolute;
  display: flex;
  align-items: center;
  justify-content: center;
  top: 0;
  left: 0;
  max-height: 400px;
  right: 0;
  .skelton-wrapper {
    width: 100%;
  }
`;

interface CatalogListProps {
  defaultSpan?: number;
  resizable?: boolean;
  dataList: any[];
  loading: boolean;
  activeId: Global.WithFalse<number>;
  isFirst: boolean;
  renderItem: (data: any) => React.ReactNode;
  Skeleton: React.ComponentType<{ span: number }>;
}

const InnerSkeleton = (Skeleton: React.ComponentType<{ span: number }>) => {
  return (props: any) => {
    return <Skeleton {...props} />;
  };
};

const ListSkeleton: React.FC<{
  span: number;
  loading: boolean;
  isFirst: boolean;
  Skeleton: React.ComponentType<{ span: number }>;
}> = ({ span, loading, isFirst, Skeleton }) => {
  const CatalogSkeleton = InnerSkeleton(Skeleton);
  return (
    <div>
      {loading && (
        <SpinWrapper>
          <Spin
            spinning={loading}
            style={{
              width: '100%'
            }}
            wrapperClassName="skelton-wrapper"
          >
            {isFirst && <CatalogSkeleton span={span}></CatalogSkeleton>}
          </Spin>
        </SpinWrapper>
      )}
    </div>
  );
};

const CardList: React.FC<CatalogListProps> = (props) => {
  const {
    dataList,
    loading,
    isFirst,
    defaultSpan = 8,
    resizable = true,
    Skeleton,
    renderItem
  } = props;
  const [span, setSpan] = React.useState(defaultSpan);

  const getSpanByWidth = (width: number) => {
    if (width < breakpoints.md) return 24;
    if (width < breakpoints.lg) return 12;
    return 8;
  };

  const handleResize = useCallback(
    _.throttle((size: { width: number; height: number }) => {
      setSpan(getSpanByWidth(size.width));
    }, 100),
    []
  );

  return (
    <div className="relative" style={{ width: '100%' }}>
      <ResizeObserver onResize={handleResize} disabled={!resizable}>
        <div style={{ width: '100%' }}>
          <Row gutter={[16, 16]}>
            {dataList.map((item: any, index) => {
              return (
                <Col span={span} key={item.id}>
                  {renderItem?.(item)}
                </Col>
              );
            })}
          </Row>
          <ListSkeleton
            span={span}
            loading={loading}
            isFirst={isFirst}
            Skeleton={Skeleton}
          />
        </div>
      </ResizeObserver>
      <FloatButton.BackTop visibilityHeight={1000} />
    </div>
  );
};

export default CardList;
