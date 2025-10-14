import CardSkeleton from '@/components/templates/card-skelton';
import breakpoints from '@/config/breakpoints';
import InfiniteScroller from '@/pages/_components/infinite-scroller';
import { useScrollerContext } from '@/pages/_components/infinite-scroller/use-scroller-context';
import { Col, FloatButton, Row, Spin } from 'antd';
import _ from 'lodash';
import ResizeObserver from 'rc-resize-observer';
import React, { useCallback } from 'react';
import styled from 'styled-components';
import BackendCard from './backend-card';

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

const SkeletonWrapper = styled.div`
  .ant-skeleton-content {
    .ant-skeleton-paragraph {
      display: flex;
      flex-direction: column;
      gap: 16px;
      margin-bottom: 0;
      li {
        margin-top: 0 !important;
      }
    }
  }
`;

interface BackendListProps {
  defaultSpan?: number;
  resizable?: boolean;
  dataList: any[];
  loading: boolean;
  activeId: Global.WithFalse<number>;
  isFirst: boolean;
  onSelect?: (item: any) => void;
}

const ListSkeleton: React.FC<{
  span: number;
  loading: boolean;
  isFirst: boolean;
}> = ({ span, loading, isFirst }) => {
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
            {isFirst && (
              <SkeletonWrapper>
                <CardSkeleton
                  span={span}
                  skeletonProps={{
                    title: false
                  }}
                  skeletonStyle={{
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 26
                  }}
                ></CardSkeleton>
              </SkeletonWrapper>
            )}
          </Spin>
        </SpinWrapper>
      )}
    </div>
  );
};

const CardList: React.FC<BackendListProps> = (props) => {
  const {
    dataList,
    loading,
    isFirst,
    defaultSpan = 8,
    resizable = true,
    onSelect
  } = props;
  const [span, setSpan] = React.useState(defaultSpan);
  const {
    total,
    current,
    loading: contextLoading,
    refresh,
    throttleDelay
  } = useScrollerContext();

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
        <InfiniteScroller
          total={total}
          current={current}
          loading={contextLoading}
          refresh={refresh}
          throttleDelay={throttleDelay}
        >
          <Row gutter={[16, 16]}>
            {dataList.map((item: any) => {
              return (
                <Col span={span} key={item.id}>
                  <BackendCard data={item} onSelect={onSelect} />
                </Col>
              );
            })}
          </Row>
          <ListSkeleton span={span} loading={loading} isFirst={isFirst} />
        </InfiniteScroller>
      </ResizeObserver>
      <FloatButton.BackTop visibilityHeight={1000} />
    </div>
  );
};

export default CardList;
