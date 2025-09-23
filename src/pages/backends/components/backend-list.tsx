import CardSkeleton from '@/components/templates/card-skelton';
import breakpoints from '@/config/breakpoints';
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

interface BackendListProps {
  defaultSpan?: number;
  resizable?: boolean;
  dataList: any[];
  loading: boolean;
  activeId: Global.WithFalse<number>;
  isFirst: boolean;
}

const InnerSkeleton: React.FC<{
  span: number;
}> = (props) => {
  return <CardSkeleton {...props} />;
};

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
            {isFirst && <InnerSkeleton span={span}></InnerSkeleton>}
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
    defaultSpan = 6,
    resizable = true
  } = props;
  const [span, setSpan] = React.useState(defaultSpan);

  const getSpanByWidth = (width: number) => {
    if (width < breakpoints.md) return 24;
    if (width < breakpoints.lg) return 12;
    return 6;
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
            {dataList.map((item: any) => {
              return (
                <Col span={span} key={item.id}>
                  <BackendCard onClick={() => {}} data={item} />
                </Col>
              );
            })}
          </Row>
          <ListSkeleton span={span} loading={loading} isFirst={isFirst} />
        </div>
      </ResizeObserver>
      <FloatButton.BackTop visibilityHeight={1000} />
    </div>
  );
};

export default CardList;
