import DeleteModal from '@/components/delete-modal';
import DropdownButtons from '@/components/drop-down-buttons';
import useTableFetch from '@/hooks/use-table-fetch';
import { DeleteOutlined, EditOutlined } from '@ant-design/icons';
import { Table } from 'antd';
import { useMemo } from 'react';
import { WORKER_POOLS_API, deleteWorkerPool, queryWorkerPools } from '../apis';
import { NodePoolListItem as ListItem } from '../config/types';

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
  workerPools: ListItem[];
  loading?: boolean;
  provider: string;
  height?: string | number;
  onAction?: (action: string, record: ListItem) => void;
}

const WorkerPools: React.FC<WorkerPoolsProps> = ({
  workerPools,
  loading = false,
  provider,
  height = 'auto',
  onAction
}) => {
  const {
    dataSource,
    rowSelection,
    queryParams,
    modalRef,
    fetchData,
    handleDelete,
    handleDeleteBatch,
    handlePageChange,
    handleTableChange,
    handleSearch,
    handleNameChange,
    handleQueryChange
  } = useTableFetch<ListItem>({
    fetchAPI: queryWorkerPools,
    deleteAPI: deleteWorkerPool,
    API: WORKER_POOLS_API,
    watch: false,
    contentForDelete: 'resources.modelfiles.modelfile'
  });

  const onSelect = (key: string, record: ListItem) => {
    if (key === 'delete') {
      handleDelete({ ...record, name: record.instance_type });
    }
    if (key === 'edit') {
      onAction?.(key, record);
    }
  };

  const columns = [
    {
      title: 'Instance Type',
      dataIndex: 'instance_type',
      key: 'instance_type'
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
      render: (text: string, record: ListItem) => (
        <DropdownButtons
          items={actionItems}
          onSelect={(key) => onSelect?.(key, record)}
        />
      )
    }
  ];

  // mock dataSource
  const mockData = Array.from({ length: 3 }, (_, index) => ({
    id: index + 1,
    key: index,
    instance_type: `Type ${index + 1}`,
    replicas: Math.floor(Math.random() * 10) + 1,
    batchSize: Math.floor(Math.random() * 100) + 1,
    gpu: `NVIDIA 4090`,
    memory: `${Math.floor(Math.random() * 16) + 1} GB`,
    cpu: `${Math.floor(Math.random() * 8) + 1} Cores`,
    storage: `${Math.floor(Math.random() * 500) + 50} GB`,
    createTime: new Date().toLocaleDateString()
  }));

  const dataList = useMemo(() => {
    if (workerPools && workerPools.length > 0) {
      return workerPools;
    }
    if (dataSource.dataList && dataSource.dataList.length > 0) {
      return dataSource.dataList;
    }
    return mockData;
  }, [workerPools, dataSource.dataList]);

  return (
    <div style={{ height: height, overflow: 'hidden' }}>
      <Table
        dataSource={dataList}
        columns={columns}
        loading={loading}
        pagination={false}
        rowKey="id"
      />
      <DeleteModal ref={modalRef}></DeleteModal>
    </div>
  );
};

export default WorkerPools;
