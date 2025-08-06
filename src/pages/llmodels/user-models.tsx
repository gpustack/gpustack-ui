import MoreButton from '@/components/buttons/more';
import PageTools from '@/components/page-tools';
import CardList from '@/components/templates/card-list';
import CardSkeleton from '@/components/templates/card-skelton';
import useTableFetch from '@/hooks/use-table-fetch';
import { SyncOutlined } from '@ant-design/icons';
import { PageContainer } from '@ant-design/pro-components';
import { useIntl } from '@umijs/max';
import { Button, Input, Select, Space } from 'antd';
import React from 'react';
import { MODELS_API, queryModelsList } from './apis';
import ModelItem from './components/model-item';

const UserModels: React.FC = () => {
  const { dataSource, queryParams, fetchData, handleSearch, handleNameChange } =
    useTableFetch<any>({
      fetchAPI: queryModelsList,
      API: MODELS_API,
      watch: false
    });
  const intl = useIntl();

  const loadMore = () => {
    fetchData({
      ...queryParams,
      page: queryParams.page + 1
    });
  };

  const handleOnClick = (model: any) => {
    console.log('Deploying model:', model);
  };

  const renderCard = (data: any) => {
    return <ModelItem model={data} onClick={handleOnClick} />;
  };

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
            <Select
              allowClear
              showSearch={false}
              placeholder={intl.formatMessage({ id: 'models.filter.category' })}
              style={{ width: 180 }}
              size="large"
              maxTagCount={1}
              options={[]}
            ></Select>
            <Button
              type="text"
              style={{ color: 'var(--ant-color-text-tertiary)' }}
              icon={<SyncOutlined></SyncOutlined>}
              onClick={handleSearch}
            ></Button>
          </Space>
        }
      ></PageTools>
      <CardList
        dataList={dataSource.dataList}
        loading={dataSource.loading}
        activeId={-1}
        isFirst={!dataSource.loadend}
        Skeleton={CardSkeleton}
        renderItem={renderCard}
      ></CardList>
      <MoreButton
        show={queryParams.page < dataSource.totalPage}
        loading={dataSource.loading}
        loadMore={loadMore}
      ></MoreButton>
    </PageContainer>
  );
};

export default UserModels;
