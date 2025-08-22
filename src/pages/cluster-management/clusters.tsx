import DeleteModal from '@/components/delete-modal';
import { FilterBar } from '@/components/page-tools';
import CardList from '@/components/templates/card-list';
import CardSkeleton from '@/components/templates/card-skelton';
import { PageAction } from '@/config';
import type { PageActionType } from '@/config/types';
import useTableFetch from '@/hooks/use-table-fetch';
import AddWorker from '@/pages/resources/components/add-worker';
import { PageContainer } from '@ant-design/pro-components';
import { useIntl } from '@umijs/max';
import { Table, message } from 'antd';
import { useState } from 'react';
import {
  createCluster,
  deleteCluster,
  queryClusterList,
  queryClusterToken,
  updateCluster
} from './apis';
import AddCluster from './components/add-cluster';
import ClusterDetailModal from './components/cluster-detail-modal';
import ClusterItem from './components/cluster-item';
import { ProviderLabelMap, ProviderValueMap, addActions } from './config';
import {
  ClusterFormData as FormData,
  ClusterListItem as ListItem
} from './config/types';
const { Column } = Table;

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
    registrationInfo: {
      token: string;
      image: string;
      server_url: string;
    };
  }>({
    open: false,
    registrationInfo: {
      token: '',
      image: '',
      server_url: ''
    }
  });
  const [openAddModal, setOpenAddModal] = useState<{
    open: boolean;
    action: PageActionType;
    currentData?: ListItem;
    title: string;
    provider: string;
  }>({
    open: false,
    action: PageAction.CREATE,
    currentData: undefined,
    title: '',
    provider: ''
  });

  const [addPoolStatus, setAddPoolStatus] = useState<{
    open: boolean;
    action: PageActionType;
    title: string;
    provider: string;
  }>({
    open: false,
    action: PageAction.CREATE,
    title: '',
    provider: ProviderValueMap.DigitalOcean
  });

  const handleAddCluster = (value: string) => {
    const label = ProviderLabelMap[value];

    setOpenAddModal({
      open: true,
      action: PageAction.CREATE,
      currentData: undefined,
      title: `Add ${label} Cluster`,
      provider: value
    });
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
      if (openAddModal.action === PageAction.EDIT) {
        await updateCluster({
          data: params,
          id: openAddModal.currentData!.id
        });
      } else {
        await createCluster({ data: params });
      }
      fetchData();
      setOpenAddModal({
        open: false,
        action: PageAction.CREATE,
        currentData: undefined,
        title: '',
        provider: ''
      });
      message.success(intl.formatMessage({ id: 'common.message.success' }));
    } catch (error) {
      setOpenAddModal({
        open: false,
        action: PageAction.CREATE,
        currentData: undefined,
        title: '',
        provider: ''
      });
    }
  };

  const handleModalCancel = () => {
    console.log('handleModalCancel');
    setOpenAddModal({
      open: false,
      action: PageAction.CREATE,
      currentData: undefined,
      title: '',
      provider: ''
    });
  };

  const handleEditCluster = (row: ListItem) => {
    setOpenAddModal({
      open: true,
      action: PageAction.EDIT,
      currentData: row,
      title: `Edit ${row.name} Cluster`,
      provider: row.provider
    });
  };

  const handleAddWorker = async (row: ListItem) => {
    try {
      const data = await queryClusterToken({ id: row.id });
      setOpenAddWorker({
        open: true,
        registrationInfo: data
      });
    } catch (error: any) {
      message.error(error.message || 'Failed to fetch cluster token');
    }
  };

  const handleSelect = (val: any, row: ListItem) => {
    if (val === 'edit') {
      handleEditCluster(row);
    } else if (val === 'delete') {
      handleDelete({ ...row, name: row.name });
    } else if (val === 'add_worker') {
      handleAddWorker(row);
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
          width={{ input: 300 }}
          buttonText="Add Cluster"
          actionType="dropdown"
          actionItems={addActions}
          handleClickPrimary={handleClickDropdown}
        ></FilterBar>
        <CardList
          dataList={dataSource.dataList}
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
        provider={openAddModal.provider}
        open={openAddModal.open}
        action={openAddModal.action}
        title={openAddModal.title}
        currentData={openAddModal.currentData}
        onCancel={handleModalCancel}
        onOk={handleModalOk}
      ></AddCluster>
      <AddWorker
        open={openAddWorker.open}
        onCancel={() =>
          setOpenAddWorker({
            open: false,
            registrationInfo: { token: '', image: '', server_url: '' }
          })
        }
        registrationInfo={openAddWorker.registrationInfo}
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
