import IconFont from '@/components/icon-font';
import PageTools from '@/components/page-tools';
import BaseSelect from '@/components/seal-form/base/select';
import CardList from '@/components/templates/card-list';
import CardSkeleton from '@/components/templates/card-skelton';
import useTableFetch from '@/hooks/use-table-fetch';
import { SyncOutlined } from '@ant-design/icons';
import { PageContainer } from '@ant-design/pro-components';
import { useIntl, useNavigate } from '@umijs/max';
import useMemoizedFn from 'ahooks/lib/useMemoizedFn';
import { Button, Input, Space } from 'antd';
import React, { useCallback, useMemo } from 'react';
import { ScrollerContext } from '../_components/infinite-scroller/use-scroller-context';
import NoResult from '../_components/no-result';
import { MY_MODELS_API, queryMyModels } from './apis';
import ModelItem from './components/model-item';
import {
  categoryOptions,
  modelCategoriesMap,
  MyModelsStatusValueMap
} from './config';
import { categoryToPathMap } from './config/button-actions';

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
  const navigate = useNavigate();
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
      perPage: 24
    }
  });
  const intl = useIntl();
  const [status, setStatus] = React.useState<string | undefined>(undefined);

  const statusOptions = useMemo(() => {
    return [
      {
        value: MyModelsStatusValueMap.Active,
        color: 'var(--ant-color-success)',
        label: intl.formatMessage({
          id: 'models.mymodels.status.active'
        })
      },
      {
        value: MyModelsStatusValueMap.Inactive,
        color: 'var(--ant-color-fill)',
        label: intl.formatMessage({
          id: 'models.mymodels.status.inactive'
        })
      },
      {
        value: MyModelsStatusValueMap.Degrade,
        color: 'var(--ant-color-error)',
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

  const handleOnClick = (model: any) => {
    for (const [category, path] of Object.entries(categoryToPathMap)) {
      if (
        model.categories?.includes(category) &&
        [
          modelCategoriesMap.text_to_speech,
          modelCategoriesMap.speech_to_text
        ].includes(category)
      ) {
        navigate(`${path}&model=${model.name}`);
        return;
      }
      if (model.categories?.includes(category)) {
        navigate(`${path}?model=${model.name}`);
        return;
      }
    }
    navigate(`/playground/chat?model=${model.name}`);
  };

  const renderCard = (data: any) => {
    return <ModelItem model={data} onClick={handleOnClick} />;
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
    setStatus(value);
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
    if (!model.replicas && !model.ready_replicas) {
      return MyModelsStatusValueMap.Inactive;
    }

    if (model.replicas > 0 && !model.ready_replicas) {
      return MyModelsStatusValueMap.Degrade;
    }

    if (model.replicas === model.ready_replicas && model.replicas > 0) {
      return MyModelsStatusValueMap.Active;
    }
    return MyModelsStatusValueMap.Degrade;
  }, []);

  const dataList = useMemo(() => {
    const result = dataSource.dataList.map((item) => {
      return {
        ...item,
        status: getStatus(item)
      };
    });
    if (!status) return result;
    return result.filter((item) => item.status === status);
  }, [dataSource.dataList, status]);

  return (
    <PageContainer
      ghost
      header={{
        title: intl.formatMessage({ id: 'menu.models.userModels' }),
        style: {
          paddingInline: 'var(--layout-content-header-inlinepadding)'
        },
        breadcrumb: {}
      }}
      extra={[]}
    >
      <PageTools
        marginBottom={22}
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
              placeholder={intl.formatMessage({ id: 'models.filter.category' })}
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
              onChange={handleStatusChange}
            ></BaseSelect>
            <Button
              type="text"
              style={{ color: 'var(--ant-color-text-tertiary)' }}
              icon={<SyncOutlined></SyncOutlined>}
              onClick={handleSearch}
            ></Button>
          </Space>
        }
      ></PageTools>
      <ScrollerContext.Provider
        value={{
          total: dataSource.totalPage,
          current: queryParams.page,
          loading: dataSource.loading,
          refresh: loadMore
        }}
      >
        <CardList
          dataList={dataList}
          loading={dataSource.loading}
          activeId={false}
          isFirst={!dataSource.loadend}
          Skeleton={CardSkeleton}
          renderItem={renderCard}
        ></CardList>
        <NoResult
          loading={dataSource.loading}
          loadend={dataSource.loadend}
          dataSource={dataList}
          image={<IconFont type="icon-models" />}
          filters={{ ...queryParams, status: status }}
          noFoundText={intl.formatMessage({
            id: 'noresult.mymodels.nofound'
          })}
          title={intl.formatMessage({ id: 'noresult.mymodels.title' })}
          subTitle={intl.formatMessage({ id: 'noresult.mymodels.subTitle' })}
        ></NoResult>
      </ScrollerContext.Provider>
    </PageContainer>
  );
};

export default UserModels;
