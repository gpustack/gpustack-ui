import DeleteModal from '@/components/delete-modal';
import DropdownButtons from '@/components/drop-down-buttons';
import LabelsCell from '@/components/label-cell';
import { PageAction } from '@/config';
import useTableFetch from '@/hooks/use-table-fetch';
import { DeleteOutlined, EditOutlined } from '@ant-design/icons';
import { useIntl } from '@umijs/max';
import { message, Table } from 'antd';
import dayjs from 'dayjs';
import { useState } from 'react';
import styled from 'styled-components';
import {
  createWorkerPool,
  deleteWorkerPool,
  queryWorkerPools,
  updateWorkerPool,
  WORKER_POOLS_API
} from '../apis';
import { ProviderValueMap } from '../config';
import {
  ClusterListItem,
  NodePoolListItem as ListItem,
  NodePoolFormData
} from '../config/types';
import AddPool from './add-pool';

const SubTitle = styled.div`
  font-size: var(--font-size-middle);
  font-weight: 700;
  color: var(--ant-color-text);
  margin-block: 24px 16px;
`;

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
  loading?: boolean;
  height?: string | number;
  clusterData: ClusterListItem | null;
}

const WorkerPools: React.FC<WorkerPoolsProps> = ({
  loading = false,
  clusterData,
  height = 'auto'
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
    contentForDelete: 'resources.modelfiles.modelfile',
    defaultQueryParams: {
      cluster_id: clusterData!.id
    }
  });
  const intl = useIntl();
  const [addPoolStatus, setAddPoolStatus] = useState({
    open: false,
    action: PageAction.CREATE,
    title: '',
    provider: ProviderValueMap.DigitalOcean,
    currentData: null as ListItem | null,
    clusterId: 0
  });

  // pool action handler
  const handleEdit = (action: string, record: ListItem) => {
    if (action === 'edit') {
      setAddPoolStatus({
        open: true,
        action: PageAction.EDIT,
        title: 'Edit Worker Pool',
        provider: clusterData!.provider,
        currentData: record,
        clusterId: clusterData!.id
      });
    }
  };

  const onSelect = (key: string, record: ListItem) => {
    if (key === 'delete') {
      handleDelete({ ...record, name: record.instance_type });
    }
    if (key === 'edit') {
      handleEdit(key, record);
    }
  };

  const handleSubmitWorkerPool = async (formdata: NodePoolFormData) => {
    try {
      if (addPoolStatus.action === PageAction.CREATE) {
        await createWorkerPool({
          data: formdata,
          clusterId: clusterData!.id
        });
      }
      if (addPoolStatus.action === PageAction.EDIT) {
        await updateWorkerPool({
          data: formdata,
          id: addPoolStatus.currentData!.id
        });
      }
      message.success(intl.formatMessage({ id: 'common.message.success' }));
      handleSearch();
    } catch (error) {
      // error
    }
    setAddPoolStatus({
      ...addPoolStatus,
      open: false
    });
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
      dataIndex: 'batch_size',
      key: 'batch_size'
    },
    {
      title: 'Labels',
      dataIndex: 'labels',
      key: 'labels',
      render: (text: string, record: ListItem) => (
        <LabelsCell labels={record.labels}></LabelsCell>
      )
    },
    {
      title: 'Create Time',
      dataIndex: 'create_at',
      key: 'created_at',
      render: (text: string) => dayjs(text).format('YYYY-MM-DD HH:mm:ss')
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

  return (
    <>
      <SubTitle>
        <span>Worker Pools</span>
      </SubTitle>
      <div style={{ height: height, overflow: 'hidden' }}>
        <Table
          dataSource={dataSource.dataList}
          columns={columns}
          loading={loading}
          pagination={false}
          rowKey="id"
        />
        <AddPool
          provider={addPoolStatus.provider}
          open={addPoolStatus.open}
          action={addPoolStatus.action}
          title={addPoolStatus.title}
          currentData={addPoolStatus.currentData}
          onCancel={() => {
            setAddPoolStatus({
              open: false,
              action: PageAction.CREATE,
              title: '',
              provider: ProviderValueMap.DigitalOcean,
              currentData: null,
              clusterId: 0
            });
          }}
          onOk={handleSubmitWorkerPool}
        ></AddPool>
        <DeleteModal ref={modalRef}></DeleteModal>
      </div>
    </>
  );
};

export default WorkerPools;
