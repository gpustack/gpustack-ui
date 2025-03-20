import AutoTooltip from '@/components/auto-tooltip';
import PageTools from '@/components/page-tools';
import { modelCategoriesMap } from '@/pages/llmodels/config';
import { convertFileSize } from '@/utils';
import { useIntl } from '@umijs/max';
import { Col, Row, Table } from 'antd';
import { memo, useContext } from 'react';
import { DashboardContext } from '../config/dashboard-context';

const NACategories = [
  modelCategoriesMap.llm,
  modelCategoriesMap.embedding,
  modelCategoriesMap.reranker
];

const ActiveTable = () => {
  const intl = useIntl();
  const data = useContext(DashboardContext).active_models || [];
  const modelColumns = [
    {
      title: intl.formatMessage({ id: 'common.table.name' }),
      dataIndex: 'name',
      key: 'name',
      ellipsis: true,
      render: (text: any, record: any) => {
        return (
          <AutoTooltip ghost>
            <span>{text}</span>
          </AutoTooltip>
        );
      }
    },
    {
      title: intl.formatMessage({ id: 'dashboard.allocatevram' }),
      dataIndex: 'resource_claim.memory',
      key: 'vram',
      ellipsis: true,
      render: (text: any, record: any) => {
        return (
          <AutoTooltip ghost>
            {convertFileSize(record.resource_claim?.vram || 0)} /{' '}
            {convertFileSize(record.resource_claim?.ram || 0)}
          </AutoTooltip>
        );
      }
    },
    {
      title: intl.formatMessage({ id: 'models.form.replicas' }),
      dataIndex: 'instance_count',
      key: 'instance_count'
    },
    {
      title: intl.formatMessage({ id: 'dashboard.tokens' }),
      dataIndex: 'token_count',
      key: 'token_count',
      ellipsis: true,
      render: (text: any, record: any) => {
        let val = text;
        if (!text) {
          val = !NACategories.includes(record.categories?.[0]) ? 'N/A' : 0;
        }
        return (
          <AutoTooltip ghost>
            <span>{val}</span>
          </AutoTooltip>
        );
      }
    }
  ];
  return (
    <Row gutter={[20, 0]}>
      <Col xs={24} sm={24} md={24} lg={24} xl={24}>
        <PageTools
          style={{ margin: '26px 0px' }}
          left={
            <span
              style={{
                padding: '9px 0',
                fontWeight: 'var(--font-weight-bold)'
              }}
            >
              {intl.formatMessage({ id: 'dashboard.activeModels' })}
            </span>
          }
          right={false}
        />
        <div>
          <Table
            columns={modelColumns}
            dataSource={data}
            pagination={false}
            rowKey="id"
          />
        </div>
      </Col>
    </Row>
  );
};

export default memo(ActiveTable);
