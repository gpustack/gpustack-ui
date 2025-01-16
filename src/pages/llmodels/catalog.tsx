import { modelsExpandKeysAtom } from '@/atoms/models';
import PageTools from '@/components/page-tools';
import { PageAction } from '@/config';
import { SyncOutlined } from '@ant-design/icons';
import { PageContainer } from '@ant-design/pro-components';
import { useIntl, useNavigate } from '@umijs/max';
import { Button, Input, Pagination, Select, Space, message } from 'antd';
import { useAtom } from 'jotai';
import _ from 'lodash';
import React, { useCallback, useEffect, useState } from 'react';
import { createModel, queryCatalogList } from './apis';
import CatalogList from './components/catalog-list';
import DelopyBuiltInModal from './components/deploy-builtin-modal';
import { modelCategories, modelSourceMap } from './config';
import { CatalogItem as CatalogItemType, FormData } from './config/types';

const Catalog: React.FC = () => {
  const intl = useIntl();
  const navigate = useNavigate();
  const [activeId, setActiveId] = React.useState(-1);
  const [isFirst, setIsFirst] = React.useState(true);
  const [dataSource, setDataSource] = useState<{
    dataList: CatalogItemType[];
    loading: boolean;
    total: number;
  }>({
    dataList: [],
    loading: false,
    total: 0
  });
  const [queryParams, setQueryParams] = useState({
    page: 1,
    perPage: 100,
    search: '',
    categories: []
  });
  const [openDeployModal, setOpenDeployModal] = useState<any>({
    show: false,
    width: 600,
    current: {},
    source: modelSourceMap.huggingface_value
  });
  const [modelsExpandKeys, setModelsExpandKeys] = useAtom(modelsExpandKeysAtom);
  const cacheData = React.useRef<CatalogItemType[]>([]);

  const categoryOptions = [...modelCategories.filter((item) => item.value)];

  const filterData = useCallback(
    (data: { search: string; categories: string[] }) => {
      const { search, categories } = data;
      const dataList = cacheData.current.filter((item) => {
        if (search && categories.length > 0) {
          return (
            _.toLower(item.name).includes(search) &&
            categories.some((category) => item.categories.includes(category))
          );
        }
        if (search) {
          return _.toLower(item.name).includes(_.toLower(search));
        }
        if (categories.length > 0) {
          return categories.some((category) =>
            item.categories.includes(category)
          );
        }
        return true;
      });
      return dataList;
    },
    [cacheData.current]
  );

  const fetchData = useCallback(async () => {
    setDataSource((pre) => {
      pre.loading = true;
      return { ...pre };
    });
    try {
      const params = {
        ..._.pick(queryParams, ['page', 'perPage'])
      };
      const res: any = await queryCatalogList(params);

      cacheData.current = res.items || [];
      const dataList = filterData({
        search: queryParams.search,
        categories: queryParams.categories
      });
      setDataSource({
        dataList: dataList,
        loading: false,
        total: res.pagination.total
      });
    } catch (error) {
      cacheData.current = [];
      setDataSource({
        dataList: [],
        loading: false,
        total: dataSource.total
      });
      console.log('error', error);
    } finally {
      setIsFirst(false);
    }
  }, [queryParams, cacheData.current]);

  const handleDeployModalCancel = () => {
    setOpenDeployModal({
      ...openDeployModal,
      show: false
    });
    setActiveId(-1);
  };

  const handleOnDeploy = useCallback((item: CatalogItemType) => {
    setActiveId(item.id);
    setOpenDeployModal({
      show: true,
      source: modelSourceMap.huggingface_value,
      current: item,
      width: 600
    });
  }, []);

  const handleCreateModel = useCallback(
    async (data: FormData) => {
      try {
        console.log('data:', data, openDeployModal);

        const modelData = await createModel({
          data: {
            ..._.omit(data, ['size', 'quantization'])
          }
        });
        setOpenDeployModal({
          ...openDeployModal,
          show: false
        });
        message.success(intl.formatMessage({ id: 'common.message.success' }));
        setModelsExpandKeys([modelData.id]);
        navigate('/models/list');
      } catch (error) {}
    },
    [openDeployModal]
  );

  const handleOnPageChange = useCallback(
    (page: number, pageSize?: number) => {
      setQueryParams({
        ...queryParams,
        page,
        perPage: pageSize || 10
      });
    },
    [queryParams]
  );

  const handleSearch = (e: any) => {
    fetchData();
  };

  const handleNameChange = _.debounce((e: any) => {
    const dataList = filterData({
      search: e.target.value,
      categories: queryParams.categories
    });

    setQueryParams({
      ...queryParams,
      page: 1,
      search: e.target.value
    });

    setDataSource({
      dataList,
      loading: false,
      total: dataSource.total
    });
  }, 200);

  const handleCategoryChange = (value: any) => {
    const dataList = filterData({
      search: queryParams.search,
      categories: value
    });
    setQueryParams({
      ...queryParams,
      page: 1,
      categories: value
    });
    setDataSource({
      dataList,
      loading: false,
      total: dataSource.total
    });
  };

  useEffect(() => {
    fetchData();
  }, []);

  return (
    <PageContainer
      ghost
      header={{
        title: intl.formatMessage({ id: 'menu.modelCatalog' }),
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
              style={{ width: 230 }}
              size="large"
              mode="multiple"
              maxTagCount={1}
              onChange={handleCategoryChange}
              options={categoryOptions}
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
      <CatalogList
        dataList={dataSource.dataList}
        loading={dataSource.loading}
        onDeploy={handleOnDeploy}
        activeId={-1}
        isFirst={isFirst}
      ></CatalogList>
      <div style={{ marginBlock: '32px 16px' }}>
        <Pagination
          hideOnSinglePage={queryParams.perPage === 100}
          align="end"
          defaultCurrent={1}
          total={dataSource.total}
          pageSize={queryParams.perPage}
          showSizeChanger
          onChange={handleOnPageChange}
        />
      </div>
      <DelopyBuiltInModal
        open={openDeployModal.show}
        action={PageAction.CREATE}
        title={intl.formatMessage({ id: 'models.button.deploy' })}
        source={openDeployModal.source}
        width={openDeployModal.width}
        current={openDeployModal.current}
        onCancel={handleDeployModalCancel}
        onOk={handleCreateModel}
      ></DelopyBuiltInModal>
    </PageContainer>
  );
};

export default React.memo(Catalog);
