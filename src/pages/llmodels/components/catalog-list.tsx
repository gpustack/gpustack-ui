import ResizeContainer from '@/components/resize-container';
import CatalogSkelton from '@/components/templates/card-skelton';
import InfiniteScroller from '@/pages/_components/infinite-scroller';
import { useScrollerContext } from '@/pages/_components/infinite-scroller/use-scroller-context';
import { Spin } from 'antd';
import React from 'react';
import styled from 'styled-components';
import CatalogItem from './catalog-item';

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
`;

interface CatalogListProps {
  dataList: any[];
  loading: boolean;
  activeId: number;
  isFirst: boolean;
  onDeploy: (data: any) => void;
}

const ListSkeleton: React.FC<{
  loading: boolean;
  isFirst: boolean;
}> = ({ loading, isFirst }) => {
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
            {isFirst && <CatalogSkelton></CatalogSkelton>}
          </Spin>
        </SpinWrapper>
      )}
    </div>
  );
};

const CatalogList: React.FC<CatalogListProps> = (props) => {
  const { dataList, loading, activeId, isFirst, onDeploy } = props;
  const {
    total,
    current,
    loading: contextLoading,
    refresh,
    throttleDelay
  } = useScrollerContext();

  return (
    <InfiniteScroller
      total={total}
      current={current}
      loading={contextLoading}
      refresh={refresh}
      throttleDelay={throttleDelay}
    >
      <ResizeContainer
        dataList={dataList}
        renderItem={(item) => (
          <CatalogItem
            onClick={onDeploy}
            activeId={activeId}
            data={item}
          ></CatalogItem>
        )}
      ></ResizeContainer>
      <ListSkeleton loading={loading} isFirst={isFirst} />
    </InfiniteScroller>
  );
};

export default CatalogList;
