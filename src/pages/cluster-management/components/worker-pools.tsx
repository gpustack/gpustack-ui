import DropdownButtons from '@/components/drop-down-buttons';
import { DeleteOutlined, EditOutlined } from '@ant-design/icons';
import { Table } from 'antd';

const actionItems = [
  {
    key: 'edit',
    label: 'common.button.edit',
    icon: <EditOutlined />
  },

  {
    key: 'delete',
    label: 'common.button.delete',
    icon: <DeleteOutlined />,
    props: {
      danger: true
    }
  }
];

interface WorkerPoolsProps {
  dataSource: any[];
  loading?: boolean;
  provider: string;
  height?: string | number;
  onAction?: (action: string, record: any) => void;
}

const WorkerPools: React.FC<WorkerPoolsProps> = ({
  dataSource,
  loading = false,
  provider,
  height = 'auto',
  onAction
}) => {
  // dataindex: type, replicas, Batchsize, GPU, Memory, CPU, Storage, CreateTime, Operations
  const columns = [
    {
      title: 'Type',
      dataIndex: 'type',
      key: 'type'
    },
    {
      title: 'Replicas',
      dataIndex: 'replicas',
      key: 'replicas'
    },
    {
      title: 'Batch Size',
      dataIndex: 'batchSize',
      key: 'batchSize'
    },
    {
      title: 'GPU',
      dataIndex: 'gpu',
      key: 'gpu'
    },
    {
      title: 'Memory',
      dataIndex: 'memory',
      key: 'memory'
    },
    {
      title: 'CPU',
      dataIndex: 'cpu',
      key: 'cpu'
    },
    {
      title: 'Storage',
      dataIndex: 'storage',
      key: 'storage'
    },
    {
      title: 'Create Time',
      dataIndex: 'createTime',
      key: 'createTime'
    },
    {
      title: 'Operations',
      key: 'operations',
      render: (_, record) => (
        <DropdownButtons
          items={actionItems}
          onSelect={(key) => onAction?.(key, record)}
        />
      )
    }
  ];

  // mock dataSource
  const mockData = Array.from({ length: 3 }, (_, index) => ({
    key: index,
    type: `Type ${index + 1}`,
    replicas: Math.floor(Math.random() * 10) + 1,
    batchSize: Math.floor(Math.random() * 100) + 1,
    gpu: `NVIDIA 4090`,
    memory: `${Math.floor(Math.random() * 16) + 1} GB`,
    cpu: `${Math.floor(Math.random() * 8) + 1} Cores`,
    storage: `${Math.floor(Math.random() * 500) + 50} GB`,
    createTime: new Date().toLocaleDateString()
  }));

  return (
    <div style={{ height: height, overflow: 'hidden' }}>
      <Table
        dataSource={dataSource || mockData}
        columns={columns}
        loading={loading}
        pagination={false}
        rowKey="id"
      />
    </div>
  );
};

export default WorkerPools;
