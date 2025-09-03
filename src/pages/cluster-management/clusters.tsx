import DeleteModal from '@/components/delete-modal';
import { FilterBar } from '@/components/page-tools';
import { PageAction } from '@/config';
import type { PageActionType } from '@/config/types';
import useTableFetch from '@/hooks/use-table-fetch';
import AddWorker from '@/pages/resources/components/add-worker';
import { PageContainer } from '@ant-design/pro-components';
import { useIntl, useNavigate, useSearchParams } from '@umijs/max';
import { useMemoizedFn } from 'ahooks';
import { Table, message } from 'antd';
import { useEffect, useState } from 'react';
import {
  createCluster,
  createWorkerPool,
  deleteCluster,
  queryClusterList,
  queryClusterToken,
  queryCredentialList,
  updateCluster
} from './apis';
import AddCluster from './components/add-cluster';
import AddPool from './components/add-pool';
import RegisterCluster from './components/register-cluster';
import { ProviderLabelMap, ProviderValueMap, addActions } from './config';
import {
  ClusterFormData as FormData,
  ClusterListItem as ListItem,
  NodePoolFormData
} from './config/types';
import useClusterColumns from './hooks/use-cluster-columns';

const Credentials: React.FC = () => {
  const {
    dataSource,
    rowSelection,
    queryParams,
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
    contentForDelete: 'menu.clusterManagement.clusters'
  });

  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const intl = useIntl();
  const [registerClusterStatus, setRegisterClusterStatus] = useState<{
    open: boolean;
    registrationInfo: {
      token: string;
      image: string;
      server_url: string;
      cluster_id: number;
    };
  }>({
    open: false,
    registrationInfo: {
      token: '',
      image: '',
      server_url: '',
      cluster_id: 0
    }
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

  const [credentialList, setCredentialList] = useState<
    Global.BaseOption<number>[]
  >([]);

  const [addPoolStatus, setAddPoolStatus] = useState<{
    open: boolean;
    action: PageActionType;
    title: string;
    provider: string;
    clusterId: number;
  }>({
    open: false,
    action: PageAction.CREATE,
    title: '',
    provider: ProviderValueMap.DigitalOcean,
    clusterId: 0
  });

  const handleAddCluster = (value: string) => {
    const label = ProviderLabelMap[value];
    const clusterLabel =
      value === ProviderValueMap.Custom
        ? intl.formatMessage({ id: 'clusters.provider.custom' })
        : label;

    setOpenAddModal({
      open: true,
      action: PageAction.CREATE,
      currentData: undefined,
      title: intl.formatMessage(
        { id: 'clusters.add.cluster' },
        { cluster: clusterLabel }
      ),
      provider: value
    });
  };

  const handleAddPool = (row: ListItem) => {
    setAddPoolStatus({
      open: true,
      action: PageAction.CREATE,
      title: intl.formatMessage({ id: 'clusters.button.addNodePool' }),
      provider: row.provider,
      clusterId: row.id
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
      title: intl.formatMessage(
        { id: 'clusters.edit.cluster' },
        { cluster: row.name }
      ),
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

  const handleRegisterCluster = async (row: ListItem) => {
    try {
      const info = await queryClusterToken({ id: row.id });
      setRegisterClusterStatus({
        open: true,
        registrationInfo: {
          ...info,
          cluster_id: row.id
        }
      });
    } catch (error) {}
  };

  const handleSelect = useMemoizedFn((val: any, row: ListItem) => {
    if (val === 'edit') {
      handleEditCluster(row);
    } else if (val === 'delete') {
      handleDelete({ ...row, name: row.name });
    } else if (val === 'add_worker') {
      handleAddWorker(row);
    } else if (val === 'addPool') {
      handleAddPool(row);
    } else if (val === 'register_cluster') {
      handleRegisterCluster(row);
    }
  });

  const handleSubmitWorkerPool = async (formdata: NodePoolFormData) => {
    try {
      await createWorkerPool({
        data: formdata,
        clusterId: addPoolStatus.clusterId
      });
      setAddPoolStatus({
        ...addPoolStatus,
        open: false
      });
      message.success(intl.formatMessage({ id: 'common.message.success' }));
    } catch (error) {
      // error
    }
  };

  useEffect(() => {
    const fetchCredentialList = async () => {
      const data = await queryCredentialList({ page: 1, perPage: 100 });
      const list = data?.items?.map((item) => ({
        label: item.name,
        value: item.id
      }));
      setCredentialList(list);
    };
    fetchCredentialList();
  }, []);

  const columns = useClusterColumns(handleSelect);

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
          marginBottom={22}
          marginTop={30}
          width={{ input: 300 }}
          buttonText={intl.formatMessage({ id: 'clusters.button.add' })}
          actionType="dropdown"
          actionItems={addActions}
          rowSelection={rowSelection}
          handleInputChange={handleNameChange}
          handleSearch={handleSearch}
          handleDeleteByBatch={handleDeleteBatch}
          handleClickPrimary={handleClickDropdown}
        ></FilterBar>
        <Table
          rowKey="id"
          tableLayout="fixed"
          style={{ width: '100%' }}
          onChange={handleTableChange}
          dataSource={dataSource.dataList}
          loading={dataSource.loading}
          rowSelection={rowSelection}
          columns={columns}
          pagination={{
            showSizeChanger: true,
            pageSize: queryParams.perPage,
            current: queryParams.page,
            total: dataSource.total,
            hideOnSinglePage: queryParams.perPage === 10,
            onChange: handlePageChange
          }}
        ></Table>
      </PageContainer>
      <AddCluster
        provider={openAddModal.provider}
        open={openAddModal.open}
        action={openAddModal.action}
        title={openAddModal.title}
        currentData={openAddModal.currentData}
        credentialList={credentialList}
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
      <RegisterCluster
        title={intl.formatMessage({ id: 'clusters.button.register' })}
        open={registerClusterStatus.open}
        registrationInfo={registerClusterStatus.registrationInfo}
        onCancel={() => {
          setRegisterClusterStatus({
            open: false,
            registrationInfo: {
              token: '',
              image: '',
              server_url: '',
              cluster_id: 0
            }
          });
        }}
      ></RegisterCluster>
      <AddPool
        provider={addPoolStatus.provider}
        open={addPoolStatus.open}
        action={addPoolStatus.action}
        title={addPoolStatus.title}
        onCancel={() => {
          setAddPoolStatus({
            open: false,
            action: PageAction.CREATE,
            title: '',
            provider: ProviderValueMap.DigitalOcean,
            clusterId: 0
          });
        }}
        onOk={handleSubmitWorkerPool}
      ></AddPool>
      <DeleteModal ref={modalRef}></DeleteModal>
    </>
  );
};

export default Credentials;
