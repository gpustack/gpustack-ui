import { clusterSessionAtom, fromClusterCreationAtom } from '@/atoms/clusters';
import DeleteModal from '@/components/delete-modal';
import IconFont from '@/components/icon-font';
import { FilterBar } from '@/components/page-tools';
import { PageAction } from '@/config';
import { TABLE_SORT_DIRECTIONS } from '@/config/settings';
import type { PageActionType } from '@/config/types';
import useTableFetch from '@/hooks/use-table-fetch';
import { useIntl, useNavigate } from '@umijs/max';
import { useMemoizedFn } from 'ahooks';
import { ConfigProvider, Table, message } from 'antd';
import { useAtom } from 'jotai';
import _ from 'lodash';
import { useState } from 'react';
import NoResult from '../_components/no-result';
import PageBox from '../_components/page-box';
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
    label: 'DigitalOcean',
    locale: false,
    key: ProviderValueMap.DigitalOcean,
    value: ProviderValueMap.DigitalOcean,
    icon: (
      <IconFont
        type="icon-digitalocean"
        style={{ color: 'var(--ant-blue-6)' }}
      />
    )
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
  const [, setClusterSession] = useAtom(clusterSessionAtom);
  const [isFromCluster, setIsFromCluster] = useAtom(fromClusterCreationAtom);
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
        if (isFromCluster) {
          setClusterSession({
            firstAddWorker: false,
            firstAddCluster: true
          });
          setIsFromCluster(false);
          navigate(-1);
        }
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
    return (
      <NoResult
        loading={dataSource.loading}
        loadend={dataSource.loadend}
        dataSource={[]}
        image={<IconFont type="icon-credential-outline" />}
        filters={_.omit(queryParams, ['sort_by'])}
        noFoundText={intl.formatMessage({
          id: 'noresult.credentials.nofound'
        })}
        title={intl.formatMessage({ id: 'noresult.credentials.title' })}
        subTitle={intl.formatMessage({
          id: 'noresult.credentials.subTitle'
        })}
        onClick={() => handleAddCredential(addActions[0])}
        buttonText={intl.formatMessage({ id: 'noresult.button.add' })}
      ></NoResult>
    );
  };

  const columns = useCredentialColumns(sortOrder, handleSelect);

  return (
    <>
      <PageBox>
        <FilterBar
          actionItems={addActions}
          actionType="dropdown"
          showSelect={false}
          marginBottom={22}
          marginTop={0}
          buttonText={intl.formatMessage({
            id: 'clusters.button.addCredential'
          })}
          handleDeleteByBatch={handleDeleteBatch}
          handleSearch={handleSearch}
          handleInputChange={handleNameChange}
          handleClickPrimary={handleAddCredential}
          rowSelection={rowSelection}
          widths={{ input: 300 }}
        ></FilterBar>

        <ConfigProvider renderEmpty={renderEmpty}>
          <Table
            tableLayout="fixed"
            columns={columns}
            dataSource={dataSource.dataList}
            rowSelection={rowSelection}
            loading={dataSource.loading}
            sortDirections={TABLE_SORT_DIRECTIONS}
            showSorterTooltip={false}
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
      </PageBox>
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
