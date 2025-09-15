import { fromClusterCreationAtom } from '@/atoms/clusters';
import DeleteModal from '@/components/delete-modal';
import IconFont from '@/components/icon-font';
import { FilterBar } from '@/components/page-tools';
import { PageAction } from '@/config';
import type { PageActionType } from '@/config/types';
import useTableFetch from '@/hooks/use-table-fetch';
import { PageContainer } from '@ant-design/pro-components';
import { useIntl, useNavigate } from '@umijs/max';
import { useMemoizedFn } from 'ahooks';
import { ConfigProvider, Empty, Table, message } from 'antd';
import { useAtom } from 'jotai';
import { useState } from 'react';
import {
  createCredential,
  deleteCredential,
  queryCredentialList,
  updateCredential
} from './apis';
import AddModal from './components/add-credential';
import { ProviderLabelMap, ProviderType, ProviderValueMap } from './config';
import {
  CredentialFormData as FormData,
  CredentialListItem as ListItem
} from './config/types';
import useCredentialColumns from './hooks/use-credential-columns';

const addActions = [
  {
    label: 'Digital Ocean',
    locale: false,
    key: ProviderValueMap.DigitalOcean,
    value: ProviderValueMap.DigitalOcean,
    icon: <IconFont type="icon-digitalocean" />
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
    fetchAPI: queryCredentialList,
    deleteAPI: deleteCredential,
    contentForDelete: 'menu.clusterManagement.credentials'
  });
  const [isFromCluster] = useAtom(fromClusterCreationAtom);
  const intl = useIntl();
  const navigate = useNavigate();
  const [openModalStatus, setOpenModalStatus] = useState<{
    provider: ProviderType;
    open: boolean;
    action: PageActionType;
    title: string;
    currentData: ListItem | undefined;
  }>({
    provider: null,
    open: false,
    action: PageAction.CREATE,
    title: '',
    currentData: undefined
  });

  const handleAddCredential = (item: { key: string; label: string }) => {
    setOpenModalStatus({
      provider: item.key as ProviderType,
      open: true,
      action: PageAction.CREATE,
      title: intl.formatMessage(
        { id: 'clusters.button.add.credential' },
        {
          provider: ProviderLabelMap[item.key] || item.key
        }
      ),
      currentData: undefined
    });
  };

  const handleModalOk = async (data: FormData) => {
    const params = {
      ...data
    };
    try {
      if (openModalStatus.action === PageAction.EDIT) {
        await updateCredential({
          data: {
            ...params
          },
          id: openModalStatus.currentData!.id
        });
      } else {
        await createCredential({ data: params });
        // if (isFromCluster) {
        //   navigate(-1);
        // }
      }
      fetchData();
      setOpenModalStatus({ ...openModalStatus, open: false });
      message.success(intl.formatMessage({ id: 'common.message.success' }));
    } catch (error) {
      setOpenModalStatus({ ...openModalStatus, open: false });
    }
  };

  const handleModalCancel = () => {
    setOpenModalStatus({
      ...openModalStatus,
      open: false,
      currentData: undefined
    });
  };

  const handleEditUser = (row: ListItem) => {
    setOpenModalStatus({
      provider: row.provider,
      open: true,
      action: PageAction.EDIT,
      title: intl.formatMessage(
        { id: 'common.button.edit.item' },
        { name: row.name }
      ),
      currentData: row
    });
  };

  const handleSelect = useMemoizedFn((val: any, row: ListItem) => {
    if (val === 'edit') {
      handleEditUser(row);
    } else if (val === 'delete') {
      handleDelete({ ...row, name: row.name });
    }
  });

  const renderEmpty = (type?: string) => {
    if (type !== 'Table') return;
    if (
      !dataSource.loading &&
      dataSource.loadend &&
      !dataSource.dataList.length
    ) {
      return <Empty image={Empty.PRESENTED_IMAGE_SIMPLE}></Empty>;
    }
    return <div></div>;
  };

  const columns = useCredentialColumns(sortOrder, handleSelect);

  return (
    <>
      <PageContainer
        ghost
        header={{
          title: intl.formatMessage({
            id: 'menu.clusterManagement.credentials'
          }),
          style: {
            paddingInline: 'var(--layout-content-header-inlinepadding)'
          },
          breadcrumb: {}
        }}
        extra={[]}
      >
        <FilterBar
          actionItems={addActions}
          actionType="dropdown"
          showSelect={false}
          showPrimaryButton={true}
          marginBottom={22}
          marginTop={30}
          buttonText={intl.formatMessage({
            id: 'clusters.button.addCredential'
          })}
          handleDeleteByBatch={handleDeleteBatch}
          handleSearch={handleSearch}
          handleInputChange={handleNameChange}
          handleClickPrimary={handleAddCredential}
          rowSelection={rowSelection}
          width={{ input: 300 }}
        ></FilterBar>

        <ConfigProvider renderEmpty={renderEmpty}>
          <Table
            tableLayout="fixed"
            columns={columns}
            dataSource={dataSource.dataList}
            rowSelection={rowSelection}
            loading={dataSource.loading}
            rowKey="id"
            onChange={handleTableChange}
            pagination={{
              showSizeChanger: true,
              pageSize: queryParams.perPage,
              current: queryParams.page,
              total: dataSource.total,
              hideOnSinglePage: queryParams.perPage === 10,
              onChange: handlePageChange
            }}
          ></Table>
        </ConfigProvider>
      </PageContainer>
      <AddModal
        provider={openModalStatus.provider}
        open={openModalStatus.open}
        action={openModalStatus.action}
        title={openModalStatus.title}
        currentData={openModalStatus.currentData}
        onCancel={handleModalCancel}
        onOk={handleModalOk}
      ></AddModal>
      <DeleteModal ref={modalRef}></DeleteModal>
    </>
  );
};

export default Credentials;
