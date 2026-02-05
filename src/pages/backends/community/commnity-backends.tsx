import { enabledBackendsAtom } from '@/atoms/backend';
import IconFont from '@/components/icon-font';
import ThemeTag from '@/components/tags-wrapper/theme-tag';
import useTableFetch from '@/hooks/use-table-fetch';
import { SearchOutlined } from '@ant-design/icons';
import { useIntl } from '@umijs/max';
import { Input, Tooltip } from 'antd';
import { useAtom } from 'jotai';
import _ from 'lodash';
import React, { useEffect } from 'react';
import styled from 'styled-components';
import { ScrollerContext } from '../../_components/infinite-scroller/use-scroller-context';
import NoResult from '../../_components/no-result';
import { INFERENCE_BACKEND_API, queryBackendsList } from '../apis';
import BackendCard from '../components/backend-card';
import BackendCardList from '../components/backend-list';
import { ListItem } from '../config/types';

const FilterBox = styled.div`
  position: sticky;
  top: 0;
  width: 100%;
  z-index: 100;
  margin-bottom: 16px;
  background-color: var(--ant-color-bg-container);
`;

const CommunityBackends: React.FC<{
  onEnable: (checked: boolean, data: ListItem) => void;
  onClick: (data: ListItem) => void;
}> = ({ onEnable, onClick }) => {
  const intl = useIntl();
  const [enabledBackendAtom] = useAtom(enabledBackendsAtom);
  const [currentData, setCurrentData] = React.useState<ListItem | null>(null);
  const {
    dataSource,
    loadMore,
    queryParams,
    handleSearch,
    setDataSource,
    handleNameChange
  } = useTableFetch<ListItem>({
    fetchAPI: queryBackendsList,
    API: INFERENCE_BACKEND_API,
    watch: false,
    isInfiniteScroll: true,
    contentForDelete: 'backends.title',
    defaultQueryParams: {
      perPage: 24,
      community: 1
    }
  });

  useEffect(() => {
    if (enabledBackendAtom) {
      setDataSource((prev) => {
        const newDataList = prev.dataList.map((item) => {
          if (item.id === enabledBackendAtom.id) {
            return {
              ...item,
              enabled: enabledBackendAtom.enabled
            };
          }
          return item;
        });
        return {
          ...prev,
          dataList: newDataList
        };
      });
    }
  }, [enabledBackendAtom]);

  const handleOnClickItem = (data: ListItem) => {
    onClick(data);
    setCurrentData(data);
  };

  const handleOnEnable = async (checked: boolean, data: ListItem) => {
    await onEnable(checked, data);
    await handleSearch();
    if (data.id === currentData?.id) {
      handleOnClickItem({
        ...data,
        enabled: checked
      });
    }
  };

  const actionsRenderer = (data: ListItem) => {
    return (
      <Tooltip
        title={
          data.enabled
            ? false
            : intl.formatMessage({ id: 'common.button.enable' })
        }
      >
        <>
          {data.enabled && (
            <ThemeTag
              style={{ margin: 0, fontWeight: 400 }}
              color="geekblue"
              variant="filled"
            >
              {intl.formatMessage({ id: 'common.status.enabled' })}
            </ThemeTag>
          )}
        </>
      </Tooltip>
    );
  };
  useEffect(() => {
    if (dataSource.dataList.length > 0 && dataSource.loadend && !currentData) {
      handleOnClickItem(dataSource.dataList[0]);
    }
  }, [dataSource.dataList, dataSource.loadend]);

  const renderItem = (item: ListItem) => {
    return (
      <BackendCard
        active={currentData?.id === item.id}
        data={item}
        layout="community"
        onClick={handleOnClickItem}
        actionsRenderer={actionsRenderer}
      />
    );
  };

  return (
    <div>
      <FilterBox>
        <Input
          prefix={
            <SearchOutlined
              style={{ color: 'var(--ant-color-text-placeholder)' }}
            ></SearchOutlined>
          }
          placeholder={intl.formatMessage({
            id: 'common.filter.name'
          })}
          style={{ width: '100%' }}
          allowClear
          onChange={handleNameChange}
        ></Input>
      </FilterBox>
      <ScrollerContext.Provider
        value={{
          total: dataSource.totalPage,
          current: queryParams.page!,
          loading: dataSource.loading,
          refresh: loadMore,
          throttleDelay: 300
        }}
      >
        <BackendCardList
          dataList={dataSource.dataList}
          loading={dataSource.loading}
          activeId={false}
          isFirst={!dataSource.loadend}
          renderItem={renderItem}
        ></BackendCardList>
        <NoResult
          loading={dataSource.loading}
          loadend={dataSource.loadend}
          dataSource={dataSource.dataList}
          image={<IconFont type="icon-models" />}
          filters={_.omit(queryParams, ['sort_by'])}
          noFoundText={intl.formatMessage({
            id: 'noresult.backend.nofound'
          })}
        ></NoResult>
      </ScrollerContext.Provider>
    </div>
  );
};

export default CommunityBackends;
