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
import React from 'react';
import { ScrollerContext } from '../_components/infinite-scroller/use-scroller-context';
import { MY_MODELS_API, queryMyModels } from './apis';
import ModelItem from './components/model-item';
import { categoryOptions, modelCategoriesMap } from './config';
import { categoryToPathMap } from './config/button-actions';

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
    watch: false
  });
  const intl = useIntl();

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
      ...queryParams,
      page: nextPage
    });
  });

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
          dataList={dataSource.dataList}
          loading={dataSource.loading}
          activeId={false}
          isFirst={!dataSource.loadend}
          Skeleton={CardSkeleton}
          renderItem={renderCard}
        ></CardList>
      </ScrollerContext.Provider>
    </PageContainer>
  );
};

export default UserModels;
