import useTableFetch from '@/hooks/use-table-fetch';
import { SyncOutlined } from '@ant-design/icons';
import {
  BaseSelect,
  InfiniteScrollerProvider,
  PageTools,
  TemplateCardList
} from '@gpustack/core-ui';
import { useAccess, useIntl, useNavigate } from '@umijs/max';
import useMemoizedFn from 'ahooks/lib/useMemoizedFn';
import { Button, Input, Space } from 'antd';
import React, { useCallback, useEffect, useMemo } from 'react';
import PageBox from '../_components/page-box';
import { MY_MODELS_API, queryMyModels } from './apis';
import APIAccessInfoModal from './components/api-access-info';
import ModelItem from './components/model-item';
import { categoryOptions, MyModelsStatusValueMap } from './config';
import useFormInitialValues from './hooks/use-form-initial-values';
import useNoResourceResult from './hooks/use-no-resource-result';
import useViewApIInfo from './hooks/use-view-api-info';
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
  const access = useAccess();
  const navigate = useNavigate();
  const { apiAccessInfo, openViewAPIInfo, closeViewAPIInfo } = useViewApIInfo();

  // Only managers (platform admin or org owner) can see / manage
  // clusters and workers, so only they hit those endpoints. A plain
  // user falls straight through to the default "no models" empty state
  // without the infra-guidance queries firing.
  const canManageResources = access?.canSeeAdmin || access?.canSeeOrgAdmin;
  const { getClusterList, getWorkerList, clusterList, workerList } =
    useFormInitialValues();

  useEffect(() => {
    if (canManageResources) {
      getClusterList();
      getWorkerList();
    }
  }, [canManageResources]);

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

  const { noResourceResult } = useNoResourceResult({
    loading: dataSource.loading,
    loadend: dataSource.loadend,
    dataSource: dataList,
    // Preserve the original filters heuristic: only treat the current
    // query as an active filter when there is data across pages, so a
    // truly empty account still shows the full empty state (CTA).
    queryParams: dataSource.totalPage > 0 ? queryParams : {},
    iconType: 'icon-models',
    title: intl.formatMessage({ id: 'noresult.mymodels.title' }),
    noClusters: !!canManageResources && !clusterList.length,
    noWorkers:
      !!canManageResources && workerList.length === 0 && clusterList.length > 0,
    defaultContent: {
      // Infra is in place but no models yet: guide managers to deploy
      // one, reusing the deployments-page copy so the two empty states
      // read consistently. Plain users can't deploy (and skip the infra
      // queries), so they keep the consumer-facing "ask an admin" copy
      // and a button-less empty state.
      subTitle: canManageResources
        ? intl.formatMessage({ id: 'noresult.deployments.subTitle' })
        : intl.formatMessage({ id: 'noresult.mymodels.subTitle' }),
      noFoundText: intl.formatMessage({ id: 'noresult.mymodels.nofound' }),
      buttonText: canManageResources
        ? intl.formatMessage({ id: 'models.table.button.deploy' })
        : '',
      onClick: canManageResources ? () => navigate('/models/catalog') : () => {}
    }
  });

  return (
    <>
      <PageBox>
        <PageTools
          marginBottom={22}
          marginTop={0}
          left={
            <Space>
              <Input
                placeholder={intl.formatMessage({ id: 'common.filter.name' })}
                style={{ width: 230 }}
                size="large"
                allowClear
                onClear={() =>
                  handleNameChange({
                    target: {
                      value: ''
                    }
                  })
                }
                onChange={handleNameChange}
              ></Input>
              <BaseSelect
                allowClear
                showSearch={false}
                placeholder={intl.formatMessage({
                  id: 'models.filter.category'
                })}
                style={{ width: 180 }}
                size="large"
                maxTagCount={1}
                options={categoryOptions}
                onChange={handleCategoryChange}
              ></BaseSelect>
              <BaseSelect
                allowClear
                showSearch={false}
                placeholder={intl.formatMessage({ id: 'common.filter.status' })}
                style={{ width: 180 }}
                size="large"
                maxTagCount={1}
                optionRender={optionRender}
                labelRender={labelRender}
                options={statusOptions}
                value={queryParams.state}
                onChange={handleStatusChange}
              ></BaseSelect>
              <Button
                type="text"
                style={{ color: 'var(--ant-color-text-tertiary)' }}
                icon={<SyncOutlined></SyncOutlined>}
                onClick={handleRefresh}
              ></Button>
            </Space>
          }
        ></PageTools>
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
          {noResourceResult}
        </InfiniteScrollerProvider>
      </PageBox>
      <APIAccessInfoModal
        open={apiAccessInfo.show}
        data={apiAccessInfo.data}
        onClose={closeViewAPIInfo}
      ></APIAccessInfoModal>
    </>
  );
};

export default UserModels;
