import { modelsExpandKeysAtom } from '@/atoms/models';
import MoreButton from '@/components/buttons/more';
import PageTools from '@/components/page-tools';
import BaseSelect from '@/components/seal-form/base/select';
import { PageAction } from '@/config';
import useBodyScroll from '@/hooks/use-body-scroll';
import { IS_FIRST_LOGIN, writeState } from '@/utils/localstore/index';
import { SyncOutlined } from '@ant-design/icons';
import { PageContainer } from '@ant-design/pro-components';
import { useIntl, useNavigate } from '@umijs/max';
import { Button, Input, Pagination, Space, message } from 'antd';
import { useAtom } from 'jotai';
import _ from 'lodash';
import React, { useCallback, useEffect, useState } from 'react';
import styled from 'styled-components';
import { createModel, queryCatalogList } from './apis';
import CatalogList from './components/catalog-list';
import DelopyBuiltInModal from './components/deploy-builtin-modal';
import { modelCategories, modelSourceMap } from './config';
import { CatalogItem as CatalogItemType, FormData } from './config/types';

const PageWrapper = styled.div`
  display: none;
  margin-block: 32px 16px;
`;

const Catalog: React.FC = () => {
  const intl = useIntl();
  const { saveScrollHeight, restoreScrollHeight } = useBodyScroll();
  const navigate = useNavigate();
  const [activeId, setActiveId] = React.useState(-1);
  const [isFirst, setIsFirst] = React.useState(true);
  const [dataSource, setDataSource] = useState<{
    dataList: CatalogItemType[];
    loading: boolean;
    total: number;
    totalPage: number;
  }>({
    dataList: [],
    loading: false,
    total: 0,
    totalPage: 0
  });
  const [queryParams, setQueryParams] = useState({
    page: 1,
    perPage: 24,
    search: '',
    categories: ''
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
    (data: { search: string; categories: string }) => {
      const { search, categories } = data;
      const dataList = cacheData.current.filter((item) => {
        if (search && categories) {
          return (
            _.toLower(item.name).includes(search) &&
            item.categories.includes(categories)
          );
        }
        if (search) {
          return _.toLower(item.name).includes(_.toLower(search));
        }
        if (categories) {
          return item.categories.includes(categories);
        }
        return true;
      });
      return dataList;
    },
    [cacheData.current]
  );

  const fetchData = useCallback(
    async (query?: any) => {
      const searchQuery = {
        ...queryParams,
        ...query
      };
      if (
        dataSource.loading ||
        (searchQuery.page > dataSource.totalPage && dataSource.totalPage > 0)
      ) {
        return;
      }
      setDataSource((pre) => {
        pre.loading = true;

        return { ...pre };
      });
      try {
        const params = {
          ..._.pickBy(searchQuery, (val: string | number) => !!val)
        };
        const res: any = await queryCatalogList(params);

        const dataList =
          searchQuery.page === 1
            ? res.items
            : _.concat(dataSource.dataList, res.items);
        setDataSource({
          dataList: dataList,
          loading: false,
          total: res.pagination.total,
          totalPage: res.pagination.totalPage
        });
        setQueryParams({
          ...queryParams,
          ...query
        });
      } catch (error) {
        cacheData.current = [];
        setDataSource({
          dataList: [],
          loading: false,
          total: dataSource.total,
          totalPage: dataSource.totalPage
        });
        setQueryParams({
          ...queryParams,
          ...query
        });
        console.log('error', error);
      } finally {
        setIsFirst(false);
      }
    },
    [queryParams, cacheData.current]
  );

  const handleDeployModalCancel = () => {
    setOpenDeployModal({
      ...openDeployModal,
      show: false
    });
    restoreScrollHeight();
    setActiveId(-1);
  };

  const handleOnDeploy = useCallback((item: CatalogItemType) => {
    saveScrollHeight();
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
        const modelData = await createModel({
          data: {
            ..._.omit(data, ['size', 'quantization'])
          }
        });
        writeState(IS_FIRST_LOGIN, false);
        setOpenDeployModal({
          ...openDeployModal,
          show: false
        });
        message.success(intl.formatMessage({ id: 'common.message.success' }));
        setModelsExpandKeys([modelData.id]);
        navigate('/models/deployments');
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
    fetchData({
      ...queryParams,
      page: 1
    });
  };

  const handleNameChange = _.debounce((e: any) => {
    fetchData({
      ...queryParams,
      page: 1,
      search: e.target.value
    });
  }, 200);

  const handleCategoryChange = (value: any) => {
    fetchData({
      ...queryParams,
      page: 1,
      categories: value
    });
  };

  const loadMore = () => {
    fetchData({
      ...queryParams,
      page: queryParams.page + 1
    });
  };

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    const handleScroll = async () => {
      // Determine the scrolling element
      const scrollingElement = document.documentElement || document.body;

      // Calculate if the user has scrolled to the bottom
      const isAtBottom =
        scrollingElement.scrollTop + scrollingElement.clientHeight >=
        scrollingElement.scrollHeight - 20; // Adding a small buffer for precision

      if (isAtBottom) {
        fetchData({
          ...queryParams,
          page: queryParams.page + 1
        });
      }
    };

    window.addEventListener('scroll', handleScroll);

    return () => {
      window.removeEventListener('scroll', handleScroll);
    };
  }, [fetchData]);

  return (
    <PageContainer
      ghost
      header={{
        title: intl.formatMessage({ id: 'menu.modelCatalog' }),
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
              onChange={handleCategoryChange}
              options={categoryOptions}
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
      <CatalogList
        dataList={dataSource.dataList}
        loading={dataSource.loading}
        onDeploy={handleOnDeploy}
        activeId={-1}
        isFirst={isFirst}
      ></CatalogList>
      <MoreButton
        show={queryParams.page < dataSource.totalPage}
        loading={dataSource.loading}
        loadMore={loadMore}
      ></MoreButton>
      <PageWrapper>
        <Pagination
          hideOnSinglePage={queryParams.perPage === 100}
          align="end"
          defaultCurrent={1}
          total={dataSource.total}
          pageSize={queryParams.perPage}
          showSizeChanger
          onChange={handleOnPageChange}
        />
      </PageWrapper>
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

export default Catalog;
