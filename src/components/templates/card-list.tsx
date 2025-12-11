import ResizeContainer from '@/components/resize-container';
import CardSkeleton from '@/components/templates/card-skelton';
import InfiniteScroller from '@/pages/_components/infinite-scroller';
import { useScrollerContext } from '@/pages/_components/infinite-scroller/use-scroller-context';
import { Spin } from 'antd';
import React from 'react';
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
            {isFirst && <CardSkeleton></CardSkeleton>}
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
    renderItem
  } = props;
  const {
    total,
    current,
    loading: contextLoading,
    refresh
  } = useScrollerContext();

  return (
    <InfiniteScroller
      total={total}
      current={current}
      loading={contextLoading}
      refresh={refresh}
    >
      <ResizeContainer
        dataList={dataList}
        renderItem={renderItem}
        defaultSpan={defaultSpan}
        resizable={resizable}
      ></ResizeContainer>
      <ListSkeleton loading={loading} isFirst={isFirst} />
    </InfiniteScroller>
  );
};

export default CardList;
