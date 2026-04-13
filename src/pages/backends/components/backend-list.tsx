import {
  InfiniteScroller,
  ResizeContainer,
  TemplateCardSkeleton
} from '@gpustack/core-ui';
import { useScrollerContext } from '@gpustack/core-ui/lib/components/infinite-scroller/use-scroller-context';
import { Spin } from 'antd';
import React from 'react';
import backendListCss from '../styles/backend-list.less';
import BackendCard from './backend-card';

interface BackendListProps {
  defaultSpan?: number;
  resizable?: boolean;
  dataList: any[];
  loading: boolean;
  activeId: Global.WithFalse<number>;
  isFirst: boolean;
  onSelect?: (item: any) => void;
  renderItem?: (item: any) => React.ReactNode;
}

const ListSkeleton: React.FC<{
  loading: boolean;
  isFirst: boolean;
}> = ({ loading, isFirst }) => {
  return (
    <div>
      {loading && (
        <div className={backendListCss.SpinWrapper}>
          <Spin
            spinning={loading}
            size="middle"
            style={{
              width: '100%'
            }}
            classNames={{
              root: 'skelton-wrapper'
            }}
          >
            {isFirst && (
              <div className={backendListCss.SkeletonWrapper}>
                <TemplateCardSkeleton
                  skeletonProps={{
                    title: false
                  }}
                  skeletonStyle={{
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 24
                  }}
                ></TemplateCardSkeleton>
              </div>
            )}
          </Spin>
        </div>
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
    onSelect,
    renderItem
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
        renderItem={(item) =>
          renderItem ? (
            renderItem(item)
          ) : (
            <BackendCard data={item} onSelect={onSelect} />
          )
        }
      ></ResizeContainer>
      <ListSkeleton loading={loading} isFirst={isFirst} />
    </InfiniteScroller>
  );
};

export default CardList;
