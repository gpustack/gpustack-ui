import PageTools from '@/components/page-tools';
import { PageAction } from '@/config';
import breakpoints from '@/config/breakpoints';
import { SyncOutlined } from '@ant-design/icons';
import { PageContainer } from '@ant-design/pro-components';
import { useIntl } from '@umijs/max';
import { Button, Col, Input, Pagination, Row, Space, message } from 'antd';
import _ from 'lodash';
import ResizeObserver from 'rc-resize-observer';
import React, { useCallback, useState } from 'react';
import { createModel } from './apis';
import CatalogItem from './components/catalog-item';
import DelopyBuiltInModal from './components/deploy-builtin-modal';
import { getSourceRepoConfigValue, modelSourceMap } from './config';
import { FormData } from './config/types';

const Catalog: React.FC = () => {
  const intl = useIntl();
  const [span, setSpan] = React.useState(6);
  const [activeId, setActiveId] = React.useState(-1);
  const [openDeployModal, setOpenDeployModal] = useState<any>({
    show: false,
    width: 600,
    source: modelSourceMap.huggingface_value
  });

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
        setSpan(8);
      } else {
        setSpan(6);
      }
      console.log('size:', size);
    }, 100),
    []
  );

  const handleDeployModalCancel = () => {
    setOpenDeployModal({
      ...openDeployModal,
      show: false
    });
  };

  const handleOnDeploy = useCallback(
    (index: number) => {
      setActiveId(index);
      setOpenDeployModal({
        show: true,
        source: modelSourceMap.huggingface_value,
        width: 600
      });
    },
    [openDeployModal]
  );

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

  return (
    <PageContainer
      ghost
      header={{
        title: intl.formatMessage({ id: 'menu.models.catalog' }),
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
            ></Input>
            <Button
              type="text"
              style={{ color: 'var(--ant-color-text-tertiary)' }}
              icon={<SyncOutlined></SyncOutlined>}
            ></Button>
          </Space>
        }
      ></PageTools>
      <ResizeObserver onResize={handleResize}>
        <Row gutter={[16, 16]}>
          {Array.from({ length: 12 }).map((_, index) => {
            return (
              <Col span={span} key={index}>
                <CatalogItem
                  onDeploy={() => handleOnDeploy(index)}
                  activeId={activeId}
                  itemId={index}
                ></CatalogItem>
              </Col>
            );
          })}
        </Row>
      </ResizeObserver>
      <div style={{ marginBlock: '32px 16px' }}>
        <Pagination align="end" defaultCurrent={1} total={50} showSizeChanger />
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
