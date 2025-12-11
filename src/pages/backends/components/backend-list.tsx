import ResizeContainer from '@/components/resize-container';
import CardSkeleton from '@/components/templates/card-skelton';
import InfiniteScroller from '@/pages/_components/infinite-scroller';
import { useScrollerContext } from '@/pages/_components/infinite-scroller/use-scroller-context';
import { Spin } from 'antd';
import React from 'react';
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
            {isFirst && (
              <SkeletonWrapper>
                <CardSkeleton
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
        defaultSpan={defaultSpan}
        resizable={resizable}
        dataList={dataList}
        renderItem={(item) => <BackendCard data={item} onSelect={onSelect} />}
      ></ResizeContainer>
      <ListSkeleton loading={loading} isFirst={isFirst} />
    </InfiniteScroller>
  );
};

export default CardList;
