import PageTools from '@/components/page-tools';
import { PageAction } from '@/config';
import breakpoints from '@/config/breakpoints';
import { SyncOutlined } from '@ant-design/icons';
import { PageContainer } from '@ant-design/pro-components';
import { useIntl } from '@umijs/max';
import { Button, Col, Input, Pagination, Row, Space, message } from 'antd';
import _ from 'lodash';
import ResizeObserver from 'rc-resize-observer';
import React, { useCallback, useEffect, useState } from 'react';
import { createModel, queryCatalogList } from './apis';
import CatalogItem from './components/catalog-item';
import DelopyBuiltInModal from './components/deploy-builtin-modal';
import { getSourceRepoConfigValue, modelSourceMap } from './config';
import { CatalogItem as CatalogItemType, FormData } from './config/types';

const Catalog: React.FC = () => {
  const intl = useIntl();
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
    search: ''
  });
  const [openDeployModal, setOpenDeployModal] = useState<any>({
    show: false,
    width: 600,
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
      const res = await queryCatalogList(params);

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
      width: 600
    });
  }, []);

  const handleCreateModel = useCallback(
    async (data: FormData) => {
      try {
        console.log('data:', data, openDeployModal);

        const result = getSourceRepoConfigValue(openDeployModal.source, data);

        const modelData = await createModel({
          data: {
            ...result.values,
            ..._.omit(data, result.omits)
          }
        });
        setOpenDeployModal({
          ...openDeployModal,
          show: false
        });
        message.success(intl.formatMessage({ id: 'common.message.success' }));
      } catch (error) {}
    },
    [openDeployModal]
  );

  const handleOnPageChange = useCallback((page: number, pageSize?: number) => {
    setQueryParams({
      ...queryParams,
      page,
      perPage: pageSize || 10
    });
  }, []);

  const handleSearch = (e: any) => {
    fetchData();
  };

  const handleNameChange = (e: any) => {
    setQueryParams({
      ...queryParams,
      search: e.target.value
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
              style={{ width: 300 }}
              size="large"
              allowClear
              onChange={handleNameChange}
            ></Input>
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
        onCancel={handleDeployModalCancel}
        onOk={handleCreateModel}
      ></DelopyBuiltInModal>
    </PageContainer>
  );
};

export default Catalog;
