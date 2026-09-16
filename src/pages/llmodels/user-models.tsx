import PluginExtraFields from '@/components/plugin-extra-fields';
import useTableFetch from '@/hooks/use-table-fetch';
import { getGPUStackPlugin } from '@/plugins';
import { SearchOutlined, SyncOutlined } from '@ant-design/icons';
import {
  BaseSelect,
  InfiniteScrollerProvider,
  PageTools,
  StatusDot,
  TemplateCardList
} from '@gpustack/core-ui';
import { useAccess, useIntl, useNavigate } from '@umijs/max';
import useMemoizedFn from 'ahooks/lib/useMemoizedFn';
import { Button, Input, Space } from 'antd';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import PageBox from '../_components/page-box';
import { MY_MODELS_API, queryMyModels } from './apis';
import APIAccessInfoModal from './components/api-access-info';
import ModelItem from './components/model-item';
import {
  categoryOptions,
  MyModelsStatusMap,
  MyModelsStatusValueMap
} from './config';
import useFormInitialValues from './hooks/use-form-initial-values';
import useNoResourceResult from './hooks/use-no-resource-result';
import useViewApIInfo from './hooks/use-view-api-info';
// The status filter renders the same dot + label that the model CARD does, so
// it uses the same component and the same map. The local `Dot` this replaces
// picked its colours from three different systems — `--ant-color-success` and
// `--ant-color-warning` (semantic) but `--ant-color-fill` for Stopped, which is
// antd's FIRST-LEVEL FILL, a token antd documents as "currently only used in
// the hover effect of Slider". `dark.ts` sets `colorFill: '#0A0A0A'`, the same
// value as `colorBgBase`, so the Stopped dot was invisible in the dark theme.
//
// It also disagreed with the card on what Not Ready means: this list said
// `warning` (amber) while `MyModelsStatusMap` says `error` (red). One map now.
const renderStatusOption = (item: any) => (
  <StatusDot
    statusValue={{
      status: MyModelsStatusMap[item.value],
      text: item.label
    }}
  />
);

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
  // A card action contributed by the plugin opens an overlay the plugin
  // owns (enterprise: the pricing-detail drawer). Mount it once here —
  // the action's `onClick` drives its open state, so the host never
  // learns what the overlay is. OSS renders nothing.
  const CardActionOverlay = getGPUStackPlugin()?.myModels?.CardActionOverlay;

  // Only managers (platform admin or org owner) can see / manage
  // clusters and workers, so only they hit those endpoints. A plain
  // user falls straight through to the default "no models" empty state
  // without the infra-guidance queries firing.
  const canManageResources = access?.canSeeAdmin || access?.canSeeOrgAdmin;
  const { getClusterList, getWorkerList, clusterList, workerList } =
    useFormInitialValues();

  // Managers start in a loading state so the empty state waits for the
  // infra queries to resolve — otherwise the initially-empty
  // cluster/worker lists briefly flash the "no clusters" / "no workers"
  // guidance before the real data lands.
  const [infraLoading, setInfraLoading] = useState(!!canManageResources);

  useEffect(() => {
    if (canManageResources) {
      setInfraLoading(true);
      Promise.all([getClusterList(), getWorkerList()]).finally(() => {
        setInfraLoading(false);
      });
    }
  }, [canManageResources]);

  const statusOptions = useMemo(() => {
    return [
      // No `color` field any more — the dot's colour comes from
      // `MyModelsStatusMap` via `StatusDot`, the same route the card uses.
      {
        value: MyModelsStatusValueMap.Ready,
        label: intl.formatMessage({
          id: 'models.mymodels.status.active'
        })
      },
      {
        value: MyModelsStatusValueMap.Stopped,
        label: intl.formatMessage({
          id: 'models.mymodels.status.inactive'
        })
      },
      {
        value: MyModelsStatusValueMap.NotReady,
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
    // Hold the empty state until infra queries resolve so managers don't
    // see a "no clusters/workers" flash before the real data arrives.
    loading: dataSource.loading || infraLoading,
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
          marginTop={0}
          marginBottom={16}
          left={
            <Space>
              <Input
                placeholder={intl.formatMessage({ id: 'common.filter.name' })}
                style={{ width: 230 }}
                size="large"
                allowClear
                prefix={
                  <SearchOutlined
                    style={{ color: 'var(--ant-color-text-placeholder)' }}
                  ></SearchOutlined>
                }
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
                optionRender={renderStatusOption}
                labelRender={renderStatusOption}
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
        <PluginExtraFields
          name="ModelBillingProvider"
          context={{ models: dataList }}
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
          {noResourceResult}
        </InfiniteScrollerProvider>
      </PageBox>
      <APIAccessInfoModal
        open={apiAccessInfo.show}
        data={apiAccessInfo.data}
        onClose={closeViewAPIInfo}
      ></APIAccessInfoModal>
      {CardActionOverlay && <CardActionOverlay />}
    </>
  );
};

export default UserModels;
