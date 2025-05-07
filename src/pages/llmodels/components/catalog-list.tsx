import breakpoints from '@/config/breakpoints';
import { Col, FloatButton, Row, Spin } from 'antd';
import _ from 'lodash';
import ResizeObserver from 'rc-resize-observer';
import React, { useCallback } from 'react';
import styled from 'styled-components';
import { CatalogItem as CatalogItemType } from '../config/types';
import CatalogItem from './catalog-item';
import CatalogSkelton from './catalog-skelton';

const SpinWrapper = styled.div`
  width: 100%;
  position: absolute;
  display: flex;
  align-items: center;
  justify-content: center;
  top: 0;
  left: 0;
  height: 400px;
  right: 0;
`;

interface CatalogListProps {
  dataList: any[];
  loading: boolean;
  activeId: number;
  isFirst: boolean;
  onDeploy: (data: any) => void;
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
            {isFirst && <CatalogSkelton span={span}></CatalogSkelton>}
          </Spin>
        </SpinWrapper>
      )}
    </div>
  );
};

const CatalogList: React.FC<CatalogListProps> = (props) => {
  const { dataList, loading, activeId, isFirst, onDeploy } = props;
  const [span, setSpan] = React.useState(8);

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
      <ResizeObserver onResize={handleResize}>
        <div>
          <Row gutter={[16, 16]}>
            {dataList.map((item: CatalogItemType, index) => {
              return (
                <Col span={span} key={item.id}>
                  <CatalogItem
                    onClick={onDeploy}
                    activeId={activeId}
                    data={item}
                  ></CatalogItem>
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

export default React.memo(CatalogList);
