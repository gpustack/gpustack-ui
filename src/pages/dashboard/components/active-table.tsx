import ContentWrapper from '@/components/content-wrapper';
import { Col, Row, Table } from 'antd';

const modelColumns = [
  {
    title: 'Name',
    dataIndex: 'name',
    key: 'name'
  },
  {
    title: 'Allocated GPUs',
    dataIndex: 'allocated',
    key: 'allocated',
    render: (text: any, record: any) => <span>{record.gpu.allocated}</span>
  },
  {
    title: 'GPU Utilization',
    dataIndex: 'utilization',
    key: 'utilization',
    render: (text: any, record: any) => <span>{record.gpu.utilization}</span>
  },
  {
    title: 'Running Instances',
    dataIndex: 'running',
    key: 'running',
    render: (text: any, record: any) => <span>{record.instances.running}</span>
  },
  {
    title: 'Pending Instances',
    dataIndex: 'pending',
    key: 'pending',
    render: (text: any, record: any) => <span>{record.instances.pending}</span>
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
    key: 'quota'
  },
  {
    title: 'Token Utilization',
    dataIndex: 'utilization',
    key: 'utilization'
  },
  {
    title: 'Members',
    dataIndex: 'members',
    key: 'members'
  }
];

const modelData = [
  {
    id: 1,
    name: 'qwen2',
    gpu: { allocated: 4, utilization: '50%' },
    instances: { running: 1, pending: 0 }
  },
  {
    id: 2,
    name: 'llama3:70b',
    gpu: { allocated: 3, utilization: '70%' },
    instances: { running: 1, pending: 0 }
  },
  {
    id: 3,
    name: 'llama3',
    gpu: { allocated: 5, utilization: '20%' },
    instances: { running: 1, pending: 0 }
  },
  {
    id: 4,
    name: 'gemma',
    gpu: { allocated: 1, utilization: '25%' },
    instances: { running: 1, pending: 0 }
  },
  {
    id: 5,
    name: 'phi3',
    gpu: { allocated: 2, utilization: '46%' },
    instances: { running: 1, pending: 0 }
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
  return (
    <Row>
      <Col span={12}>
        <ContentWrapper
          contentStyle={{ paddingRight: 0 }}
          title={<span style={{ lineHeight: '48px' }}>Active Models</span>}
        >
          <Table
            columns={modelColumns}
            dataSource={modelData}
            pagination={false}
            rowKey="id"
          />
        </ContentWrapper>
      </Col>
      <Col span={12}>
        <ContentWrapper
          title={<span style={{ lineHeight: '48px' }}>Active Projects</span>}
        >
          <Table
            columns={projectColumns}
            dataSource={projectData}
            pagination={false}
            rowKey="id"
          />
        </ContentWrapper>
      </Col>
    </Row>
  );
};

export default ActiveTable;
