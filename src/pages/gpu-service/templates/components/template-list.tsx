import {
  InfiniteScroller,
  ResizeContainer,
  TemplateCardSkeleton,
  useScrollerContext
} from '@gpustack/core-ui';
import { Spin } from 'antd';
import React from 'react';
import backendListCss from '../../../backends/styles/backend-list.less';
import { ListItem } from '../config/types';
import TemplateCard from './template-card';

interface TemplateListProps {
  dataList: ListItem[];
  loading: boolean;
  isFirst: boolean;
  onSelect?: (item: { action: string; data: ListItem }) => void;
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
                />
              </div>
            )}
          </Spin>
        </div>
      )}
    </div>
  );
};

const TemplateCardList: React.FC<TemplateListProps> = ({
  dataList,
  loading,
  isFirst,
  onSelect
}) => {
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
        defaultSpan={8}
        resizable={true}
        dataList={dataList}
        renderItem={(item) => <TemplateCard data={item} onSelect={onSelect} />}
      />
      <ListSkeleton loading={loading} isFirst={isFirst} />
    </InfiniteScroller>
  );
};

export default TemplateCardList;
