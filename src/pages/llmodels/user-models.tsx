import useTableFetch from '@/hooks/use-table-fetch';
import {
  BaseSelect,
  FilterBar,
  IconFont,
  InfiniteScrollerProvider,
  NoResult,
  TemplateCardList,
  useFilterDrawer
} from '@gpustack/core-ui';
import { useIntl } from '@umijs/max';
import useMemoizedFn from 'ahooks/lib/useMemoizedFn';
import React, { useCallback, useMemo } from 'react';
import PageBox from '../_components/page-box';
import { MY_MODELS_API, queryMyModels } from './apis';
import APIAccessInfoModal from './components/api-access-info';
import ModelItem from './components/model-item';
import { categoryOptions, MyModelsStatusValueMap } from './config';
import useViewApIInfo from './hooks/use-view-api-info';
import UserModelsFilterForm from './filters/user-models-filter-form';
const Dot = ({ color }: { color: string }) => {
  return (
    <span
      style={{
        backgroundColor: color,
        borderRadius: '50%',
        height: 8,
        width: 8,
        display: 'flex'
      }}
    ></span>
  );
};

const optionRender = (item: any) => {
  return (
    <span className="flex-center gap-8">
      <Dot color={item.data?.color}></Dot>
      {item.label}
    </span>
  );
};

const UserModels: React.FC = () => {
  const {
    dataSource,
    queryParams,
    fetchData,
    handleSearch,
    handleQueryChange,
    handleNameChange
  } = useTableFetch<any>({
    fetchAPI: queryMyModels,
    API: MY_MODELS_API,
    watch: false,
    isInfiniteScroll: true,
    defaultQueryParams: {
      perPage: 24,
      state: MyModelsStatusValueMap.Ready
    }
  });
  const intl = useIntl();
  const {
    filtersVisible,
    toggleFilters,
    filterRef,
    filterValues,
    filtersCount,
    handleOnFilterChange,
    handleOnClearFilters
  } = useFilterDrawer({
    onFilterChange: (filters) => {
      handleQueryChange({
        page: 1,
        ...filters
      });
    },
    clearKeys: ['categories', 'state']
  });
  const { apiAccessInfo, openViewAPIInfo, closeViewAPIInfo } = useViewApIInfo();

  const statusOptions = useMemo(() => {
    return [
      {
        value: MyModelsStatusValueMap.Ready,
        color: 'var(--ant-color-success)',
        label: intl.formatMessage({
          id: 'models.mymodels.status.active'
        })
      },
      {
        value: MyModelsStatusValueMap.Stopped,
        color: 'var(--ant-color-fill)',
        label: intl.formatMessage({
          id: 'models.mymodels.status.inactive'
        })
      },
      {
        value: MyModelsStatusValueMap.NotReady,
        color: 'var(--ant-color-warning)',
        label: intl.formatMessage({
          id: 'models.mymodels.status.degrade'
        })
      }
    ];
  }, [intl]);

  const handleCategoryChange = (value: string) => {
    handleQueryChange({
      categories: value
    });
  };

  const renderCard = (data: any) => {
    return <ModelItem model={data} onClick={openViewAPIInfo} />;
  };

  const loadMore = useMemoizedFn((nextPage: number) => {
    fetchData({
      query: {
        ...queryParams,
        page: nextPage
      },
      loadmore: true
    });
  });

  const handleStatusChange = (value: string) => {
    handleQueryChange({
      state: value
    });
  };

  const labelRender = (item: any) => {
    const current = statusOptions.find((option) => option.value === item.value);
    return (
      <span className="flex-center gap-8">
        <Dot color={current!.color}></Dot>
        {item.label}
      </span>
    );
  };

  const getStatus = useCallback((model: any) => {
    if (!model.targets && !model.ready_targets) {
      return MyModelsStatusValueMap.Stopped;
    }

    if (model.targets > 0 && !model.ready_targets) {
      return MyModelsStatusValueMap.NotReady;
    }

    if (model.ready_targets > 0 && model.targets > 0) {
      return MyModelsStatusValueMap.Ready;
    }
    return MyModelsStatusValueMap.NotReady;
  }, []);

  const dataList = useMemo(() => {
    const result = dataSource.dataList.map((item) => {
      return {
        ...item,
        status: getStatus(item)
      };
    });
    return result;
  }, [dataSource.dataList]);

  const handleRefresh = () => {
    fetchData({
      query: { ...queryParams, page: 1 }
    });
  };

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'flex-start',
        minWidth: 0,
        maxWidth: '100%'
      }}
    >
      <UserModelsFilterForm
        ref={filterRef}
        open={filtersVisible}
        categoryOptions={categoryOptions}
        statusOptions={statusOptions}
        statusOptionRender={optionRender}
        statusLabelRender={labelRender}
        initialValues={filterValues}
        onValuesChange={handleOnFilterChange}
        onClose={toggleFilters}
        onClear={handleOnClearFilters}
      />
      <div style={{ flex: 1, minWidth: 0, maxWidth: '100%' }}>
        <PageBox>
          <FilterBar
            showSelect={false}
            marginBottom={22}
            marginTop={0}
            handleInputChange={handleNameChange}
            handleSearch={handleRefresh}
            collapseInlineFilters
            filtersButtonProps={{
              show: true,
              count: filtersCount,
              onClick: toggleFilters,
              onClear: handleOnClearFilters
            }}
            inlineFilters={
              <>
                <BaseSelect
                  allowClear
                  showSearch={false}
                  placeholder={intl.formatMessage({
                    id: 'models.filter.category'
                  })}
                  style={{ width: 160 }}
                  size="large"
                  maxTagCount={1}
                  onChange={handleCategoryChange}
                  options={categoryOptions}
                />
                <BaseSelect
                  allowClear
                  showSearch={false}
                  placeholder={intl.formatMessage({
                    id: 'common.filter.status'
                  })}
                  style={{ width: 180 }}
                  size="large"
                  maxTagCount={1}
                  optionRender={optionRender}
                  labelRender={labelRender}
                  options={statusOptions}
                  value={queryParams.state}
                  onChange={handleStatusChange}
                />
              </>
            }
          />
          <InfiniteScrollerProvider
            value={{
              total: dataSource.totalPage,
              current: queryParams.page,
              loading: dataSource.loading,
              refresh: loadMore
            }}
          >
            <TemplateCardList
              dataList={dataList}
              loading={dataSource.loading}
              activeId={false}
              isFirst={!dataSource.loadend}
              renderItem={renderCard}
            ></TemplateCardList>
            <NoResult
              loading={dataSource.loading}
              loadend={dataSource.loadend}
              dataSource={dataList}
              image={<IconFont type="icon-models" />}
              filters={{ ...queryParams }}
              noFoundText={intl.formatMessage({
                id: 'noresult.mymodels.nofound'
              })}
              title={intl.formatMessage({ id: 'noresult.mymodels.title' })}
              subTitle={intl.formatMessage({
                id: 'noresult.mymodels.subTitle'
              })}
            ></NoResult>
          </InfiniteScrollerProvider>
        </PageBox>
      </div>
      <APIAccessInfoModal
        open={apiAccessInfo.show}
        data={apiAccessInfo.data}
        onClose={closeViewAPIInfo}
      ></APIAccessInfoModal>
    </div>
  );
};

export default UserModels;
