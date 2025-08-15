import DeleteModal from '@/components/delete-modal';
import IconFont from '@/components/icon-font';
import { FilterBar } from '@/components/page-tools';
import CardList from '@/components/templates/card-list';
import CardSkeleton from '@/components/templates/card-skelton';
import { PageAction } from '@/config';
import type { PageActionType } from '@/config/types';
import useTableFetch from '@/hooks/use-table-fetch';
import AddWorker from '@/pages/resources/components/add-worker';
import {
  DeleteOutlined,
  EditOutlined,
  KubernetesOutlined,
  ProfileOutlined
} from '@ant-design/icons';
import { PageContainer } from '@ant-design/pro-components';
import { useIntl } from '@umijs/max';
import { Table, message } from 'antd';
import { useState } from 'react';
import {
  createCluster,
  deleteCluster,
  queryClusterList,
  updateCluster
} from './apis';
import AddCluster from './components/add-cluster';
import ClusterDetailModal from './components/cluster-detail-modal';
import ClusterItem from './components/cluster-item';
import { ClusterDataList } from './config';
import {
  ClusterFormData as FormData,
  ClusterListItem as ListItem
} from './config/types';
const { Column } = Table;

const addActions = [
  {
    label: 'Custom',
    locale: false,
    value: 'custom',
    key: 'custom',
    icon: <IconFont type="icon-docker" className="size-16" />
  },
  {
    label: 'Kubernetes',
    locale: false,
    value: 'kubernetes',
    key: 'kubernetes',
    icon: <KubernetesOutlined className="size-16" />
  },
  {
    label: 'Digital Ocean',
    locale: false,
    value: 'digitalocean',
    key: 'digitalocean',
    icon: <IconFont type="icon-digitalocean" />
  }
];

const ActionList = [
  {
    key: 'edit',
    label: 'common.button.edit',
    icon: <EditOutlined></EditOutlined>
  },
  {
    key: 'add',
    label: 'Add Worker',
    locale: false,
    icon: <EditOutlined></EditOutlined>
  },

  {
    key: 'terminal',
    label: 'common.button.detail',
    icon: <ProfileOutlined />
  },
  {
    key: 'addPool',
    label: 'Add Node Pool',
    locale: false,
    icon: <IconFont type="icon-catalog1" />
  },
  {
    key: 'delete',
    props: {
      danger: true
    },
    label: 'common.button.delete',
    icon: <DeleteOutlined></DeleteOutlined>
  }
];

const Credentials: React.FC = () => {
  const {
    dataSource,
    rowSelection,
    queryParams,
    sortOrder,
    modalRef,
    handleDelete,
    handleDeleteBatch,
    fetchData,
    handlePageChange,
    handleTableChange,
    handleSearch,
    handleNameChange
  } = useTableFetch<ListItem>({
    fetchAPI: queryClusterList,
    deleteAPI: deleteCluster,
    contentForDelete: 'users.table.user'
  });

  const intl = useIntl();
  const [openClusterDetail, setOpenClusterDetail] = useState<{
    open: boolean;
    id: number;
  }>({
    open: false,
    id: 0
  });
  const [openAddWorker, setOpenAddWorker] = useState<{
    open: boolean;
    token: string;
  }>({
    open: false,
    token: ''
  });
  const [openAddModal, setOpenAddModal] = useState(false);
  const [provider, setProvider] = useState<string>('custom');
  const [action, setAction] = useState<PageActionType>(PageAction.CREATE);
  const [title, setTitle] = useState<string>('');
  const [addPoolStatus, setAddPoolStatus] = useState<{
    open: boolean;
    action: PageActionType;
    title: string;
    provider: string;
  }>({
    open: false,
    action: PageAction.CREATE,
    title: '',
    provider: 'digitalocean'
  });
  const [currentData, setCurrentData] = useState<ListItem | undefined>(
    undefined
  );

  const setActions = (row: ListItem) => {
    if (row.provider !== 'custom') {
      return ActionList.filter((item) => item.key !== 'add');
    }
    return ActionList;
  };

  const handleAddCluster = (value: string) => {
    setOpenAddModal(true);
    setAction(PageAction.CREATE);
    setProvider(value);
    const label = addActions.find((item) => item.value === value)?.label;
    setTitle(`Add ${label} Cluster`);
  };

  const handleAddPool = (value: string) => {
    setAddPoolStatus({
      open: true,
      action: PageAction.CREATE,
      title: `Add Node Pool`,
      provider: value
    });
  };

  const handleClickDropdown = (item: any) => {
    handleAddCluster(item.key);
  };

  const handleModalOk = async (data: FormData) => {
    const params = {
      ...data
    };
    try {
      if (action === PageAction.EDIT) {
        await updateCluster({
          data: params,
          id: currentData!.id
        });
      } else {
        await createCluster({ data: params });
      }
      fetchData();
      setOpenAddModal(false);
      message.success(intl.formatMessage({ id: 'common.message.success' }));
    } catch (error) {
      setOpenAddModal(false);
    }
  };

  const handleModalCancel = () => {
    console.log('handleModalCancel');
    setOpenAddModal(false);
  };

  const handleEditCluster = (row: ListItem) => {
    setCurrentData(row);
    setOpenAddModal(true);
    setAction(PageAction.EDIT);
    setTitle(`Edit ${row.name} Cluster`);
  };

  const handleSelect = (val: any, row: ListItem) => {
    if (val === 'edit') {
      handleEditCluster(row);
    } else if (val === 'delete') {
      handleDelete({ ...row, name: row.name });
    } else if (val === 'add_worker') {
      setOpenAddWorker({
        open: true,
        token: '${token}'
      });
      setCurrentData(row);
    } else if (val === 'addPool') {
      handleAddPool(row.provider);
    } else if (val === 'details') {
      setOpenClusterDetail({
        open: true,
        id: row.id
      });
    }
  };

  const renderCard = (item: ListItem) => {
    return <ClusterItem data={item} onSelect={handleSelect}></ClusterItem>;
  };

  return (
    <>
      <PageContainer
        ghost
        header={{
          title: intl.formatMessage({
            id: 'menu.clusterManagement.clusters'
          }),
          style: {
            paddingInline: 'var(--layout-content-header-inlinepadding)'
          },
          breadcrumb: {}
        }}
        extra={[]}
      >
        <FilterBar
          showSelect={false}
          showPrimaryButton={true}
          showDeleteButton={true}
          selectHolder="Filter by name"
          marginBottom={22}
          marginTop={30}
          handleInputChange={handleNameChange}
          handleSearch={handleSearch}
          width={{ input: 200 }}
          buttonText="Add Cluster"
          actionType="dropdown"
          actionItems={addActions}
          handleClickPrimary={handleClickDropdown}
        ></FilterBar>
        <CardList
          dataList={ClusterDataList}
          loading={dataSource.loading}
          activeId={-1}
          isFirst={!dataSource.loadend}
          Skeleton={CardSkeleton}
          resizable={false}
          defaultSpan={24}
          renderItem={renderCard}
        ></CardList>
      </PageContainer>
      <AddCluster
        provider={provider}
        open={openAddModal}
        action={action}
        title={title}
        data={currentData}
        onCancel={handleModalCancel}
        onOk={handleModalOk}
      ></AddCluster>
      <AddWorker
        open={openAddWorker.open}
        onCancel={() => setOpenAddWorker({ open: false, token: '' })}
        token={openAddWorker.token}
      ></AddWorker>
      <ClusterDetailModal
        open={openClusterDetail.open}
        id={openClusterDetail.id}
        onClose={() => setOpenClusterDetail({ open: false, id: 0 })}
      ></ClusterDetailModal>
      <DeleteModal ref={modalRef}></DeleteModal>
    </>
  );
};

export default Credentials;
