import PageTools from '@/components/page-tools';
import { PageAction } from '@/config';
import breakpoints from '@/config/breakpoints';
import { SyncOutlined } from '@ant-design/icons';
import { PageContainer } from '@ant-design/pro-components';
import { useIntl, useNavigate } from '@umijs/max';
import {
  Button,
  Col,
  Input,
  Pagination,
  Row,
  Select,
  Space,
  message
} from 'antd';
import _ from 'lodash';
import ResizeObserver from 'rc-resize-observer';
import React, { useCallback, useEffect, useState } from 'react';
import { createModel, queryCatalogList } from './apis';
import CatalogItem from './components/catalog-item';
import DelopyBuiltInModal from './components/deploy-builtin-modal';
import { modelCategories, modelSourceMap } from './config';
import { CatalogItem as CatalogItemType, FormData } from './config/types';

const Catalog: React.FC = () => {
  const intl = useIntl();
  const navigate = useNavigate();
  const [span, setSpan] = React.useState(8);
  const [activeId, setActiveId] = React.useState(-1);
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
    perPage: 9,
    search: '',
    categories: []
  });
  const [openDeployModal, setOpenDeployModal] = useState<any>({
    show: false,
    width: 600,
    current: {},
    source: modelSourceMap.huggingface_value
  });

  const fetchData = useCallback(async () => {
    setDataSource((pre) => {
      pre.loading = true;
      return { ...pre };
    });
    try {
      const params = {
        ..._.pickBy(queryParams, (val: any) => !!val)
      };
      const res: any = await queryCatalogList(params);

      setDataSource({
        dataList: res.items,
        loading: false,
        total: res.pagination.total
      });
    } catch (error) {
      setDataSource({
        dataList: [],
        loading: false,
        total: dataSource.total
      });
      console.log('error', error);
    }
  }, [queryParams]);

  const handleDeployModalCancel = () => {
    setOpenDeployModal({
      ...openDeployModal,
      show: false
    });
  };

  const handleResize = useCallback(
    _.throttle((size: { width: number; height: number }) => {
      const { width } = size;
      if (width < breakpoints.xs) {
        setSpan(24);
      } else if (width < breakpoints.sm) {
        setSpan(24);
      } else if (width < breakpoints.md) {
        setSpan(12);
      } else if (width < breakpoints.lg) {
        setSpan(12);
      } else {
        setSpan(8);
      }
    }, 100),
    []
  );

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

  const handleNameChange = (e: any) => {
    setQueryParams({
      ...queryParams,
      page: 1,
      search: e.target.value
    });
  };

  const handleCategoryChange = (value: any) => {
    setQueryParams({
      ...queryParams,
      page: 1,
      categories: value
    });
  };

  useEffect(() => {
    fetchData();
  }, [queryParams]);

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
              style={{ width: 200 }}
              size="large"
              allowClear
              onChange={handleNameChange}
            ></Input>
            <Select
              allowClear
              placeholder="Filter by category"
              style={{ width: 240 }}
              size="large"
              mode="multiple"
              maxTagCount={1}
              onChange={handleCategoryChange}
              options={modelCategories.filter((item) => item.value)}
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
      <ResizeObserver onResize={handleResize}>
        <Row gutter={[16, 16]}>
          {dataSource.dataList.map((item: CatalogItemType, index) => {
            return (
              <Col span={span} key={item.id}>
                <CatalogItem
                  onClick={handleOnDeploy}
                  activeId={activeId}
                  data={item}
                ></CatalogItem>
              </Col>
            );
          })}
        </Row>
      </ResizeObserver>
      <div style={{ marginBlock: '32px 16px' }}>
        <Pagination
          pageSizeOptions={['9', '12', '36', '100']}
          hideOnSinglePage={queryParams.perPage === 9}
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

export default Catalog;
