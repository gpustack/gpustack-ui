import PageTools from '@/components/page-tools';
import ProgressBar from '@/components/progress-bar';
import { Col, Row, Table } from 'antd';
import _ from 'lodash';
import { useContext } from 'react';
import { DashboardContext } from '../config/dashboard-context';

const modelColumns = [
  {
    title: 'Name',
    dataIndex: 'name',
    key: 'name'
  },
  {
    title: 'GPU Utilization',
    dataIndex: 'gpu_utilization',
    key: 'gpu_utilization',
    render: (text: any, record: any) => (
      <ProgressBar percent={_.round(text, 2)}></ProgressBar>
    )
  },
  {
    title: 'VRAM Utilization',
    dataIndex: 'gpu_memory_utilization',
    key: 'gpu_memory_utilization',
    render: (text: any, record: any) => (
      <ProgressBar percent={_.round(text, 2)}></ProgressBar>
    )
  },
  {
    title: 'Running Instances',
    dataIndex: 'instance_count',
    key: 'instance_count'
  },
  {
    title: 'Tokens',
    dataIndex: 'token_count',
    key: 'token_count'
  }
];

const projectColumns = [
  {
    title: 'Name',
    dataIndex: 'name',
    key: 'name'
  },
  {
    title: 'Token Quota',
    dataIndex: 'quota',
    key: 'quota',
    render: (text: any, record: any) => <span>{record.quota}k</span>
  },
  {
    title: 'Token Utilization',
    dataIndex: 'utilization',
    key: 'utilization',
    render: (text: any, record: any) => <span>{record.utilization}%</span>
  },
  {
    title: 'Members',
    dataIndex: 'members',
    key: 'members'
  }
];

const projectData = [
  {
    id: 1,
    name: 'copilot-dev',
    quota: 100,
    utilization: 50,
    members: 4
  },
  {
    id: 2,
    name: 'rag-wiki',
    quota: 200,
    utilization: 70,
    members: 3
  },
  {
    id: 3,
    name: 'smart-auto-agent',
    quota: 100,
    utilization: 20,
    members: 5
  },
  {
    id: 4,
    name: 'office-auto-docs',
    quota: 100,
    utilization: 25,
    members: 1
  },
  {
    id: 5,
    name: 'smart-customer-service',
    quota: 100,
    utilization: 46,
    members: 2
  }
];
const ActiveTable = () => {
  const data = useContext(DashboardContext).active_models || [];
  return (
    <Row gutter={[20, 0]}>
      <Col xs={24} sm={24} md={24} lg={24} xl={24}>
        <PageTools
          style={{ margin: '32px 8px' }}
          left={
            <span
              style={{ fontSize: 'var(--font-size-large)', padding: '9px 0' }}
            >
              Active Models
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

export default ActiveTable;
