import PageTools from '@/components/page-tools';
import { convertFileSize } from '@/utils';
import { useIntl } from '@umijs/max';
import { Col, Row, Table } from 'antd';
import { memo, useContext } from 'react';
import { DashboardContext } from '../config/dashboard-context';

const ActiveTable = () => {
  const intl = useIntl();
  const data = useContext(DashboardContext).active_models || [];
  const modelColumns = [
    {
      title: intl.formatMessage({ id: 'common.table.name' }),
      dataIndex: 'name',
      key: 'name'
    },
    {
      title: intl.formatMessage({ id: 'dashboard.allocatevram' }),
      dataIndex: 'resource_claim.memory',
      key: 'vram',
      render: (text: any, record: any) => {
        return (
          <span>
            {convertFileSize(record.resource_claim?.vram || 0)} /{' '}
            {convertFileSize(record.resource_claim?.ram || 0)}
          </span>
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
      key: 'token_count'
    }
  ];
  return (
    <Row gutter={[20, 0]}>
      <Col xs={24} sm={24} md={24} lg={24} xl={24}>
        <PageTools
          style={{ margin: '26px 0px' }}
          left={
            <span style={{ padding: '9px 0' }}>
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
