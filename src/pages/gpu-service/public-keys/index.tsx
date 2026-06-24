import { PageAction } from '@/config';
import { TABLE_SORT_DIRECTIONS } from '@/config/settings';
import useTableFetch from '@/hooks/use-table-fetch';
import { DeleteModal, FilterBar, IconFont, NoResult } from '@gpustack/core-ui';
import { useIntl } from '@umijs/max';
import { useMemoizedFn } from 'ahooks';
import { ConfigProvider, message, Table } from 'antd';
import _ from 'lodash';
import PageBox from '../../_components/page-box';
import {
  deleteGPUServicePublicKey,
  GPU_SERVICE_PUBLIC_KEY_API,
  queryGPUServicePublicKeys
} from './apis';
import AddPublicKeyModal from './components/add-public-key-modal';
import { FormData, ListItem } from './config/types';
import useCreatePublicKeyModal from './hooks/use-create-public-key-modal';
import usePublicKeyColumns from './hooks/use-public-key-columns';
import useCreateSshkey from './services/use-create-sshkey';
import useUpdateSshkey from './services/use-update-sshkey';

const GPUServicePublicKeys: React.FC = () => {
  const intl = useIntl();

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
    key: 'PublicKeys',
    fetchAPI: queryGPUServicePublicKeys,
    deleteAPI: deleteGPUServicePublicKey,
    watch: false,
    polling: false,
    API: GPU_SERVICE_PUBLIC_KEY_API,
    contentForDelete: intl.formatMessage({ id: 'gpuservice.publicKey' })
  });

  const { fetchData: createSshkey } = useCreateSshkey();
  const { fetchData: updateSshkey } = useUpdateSshkey();
  const { openPublicKeyModalStatus, openPublicKeyModal, closePublicKeyModal } =
    useCreatePublicKeyModal();

  const handleAdd = () => {
    openPublicKeyModal(
      PageAction.CREATE,
      intl.formatMessage({ id: 'gpuservice.publicKey.add' })
    );
  };

  const handleEdit = (row: ListItem) => {
    openPublicKeyModal(
      PageAction.EDIT,
      intl.formatMessage({ id: 'gpuservice.publicKey.edit' }),
      row
    );
  };

  const handleModalOk = async (data: FormData) => {
    try {
      if (openPublicKeyModalStatus.action === PageAction.EDIT) {
        await updateSshkey({
          id: openPublicKeyModalStatus.currentData!.id,
          data: data
        });
      } else {
        await createSshkey({ data });
      }
      fetchData();
      closePublicKeyModal();
      message.success(intl.formatMessage({ id: 'common.message.success' }));
    } catch (error) {
      // it's handled in interceptor
    }
  };

  const handleSelect = useMemoizedFn((val: string, row: ListItem) => {
    if (val === 'edit') {
      handleEdit(row);
    } else if (val === 'delete') {
      handleDelete(
        { ...row, name: row.name as string },
        {
          tips: intl.formatMessage({
            id: 'gpuservice.publicKey.delete.tips'
          })
        }
      );
    }
  });

  const handleDeleteByBatch = () => {
    handleDeleteBatch({
      tips: intl.formatMessage({
        id: 'gpuservice.publicKey.delete.tips'
      })
    });
  };

  const renderEmpty = (type?: string) => {
    if (type !== 'Table') return;
    return (
      <NoResult
        loading={dataSource.loading}
        loadend={dataSource.loadend}
        dataSource={dataSource.dataList}
        image={<IconFont type="icon-ssh-outlined" />}
        filters={_.pick(queryParams, ['search'])}
        noFoundText={intl.formatMessage({
          id: 'noresult.gpuservice.sshkey.nofound'
        })}
        title={intl.formatMessage({ id: 'noresult.gpuservice.sshkey.title' })}
        subTitle={intl.formatMessage({
          id: 'noresult.gpuservice.sshkey.subTitle'
        })}
        onClick={handleAdd}
        buttonText={intl.formatMessage({ id: 'noresult.button.add' })}
      />
    );
  };

  const columns = usePublicKeyColumns({
    handleSelect,
    sortOrder
  });

  return (
    <>
      <PageBox>
        <FilterBar
          marginBottom={22}
          marginTop={30}
          showSelect={false}
          inputHolder={intl.formatMessage({
            id: 'gpuservice.publicKey.filter.name'
          })}
          buttonText={intl.formatMessage({ id: 'gpuservice.publicKey.add' })}
          handleSearch={handleSearch}
          handleDeleteByBatch={handleDeleteByBatch}
          handleClickPrimary={handleAdd}
          handleInputChange={handleNameChange}
          rowSelection={rowSelection}
          widths={{ input: 300 }}
        />
        <ConfigProvider renderEmpty={renderEmpty}>
          <Table
            columns={columns}
            dataSource={dataSource.dataList}
            rowSelection={rowSelection}
            loading={{
              spinning: dataSource.loading,
              size: 'middle'
            }}
            sortDirections={TABLE_SORT_DIRECTIONS}
            showSorterTooltip={false}
            rowKey={(record) => record.id}
            onChange={handleTableChange}
            pagination={{
              showSizeChanger: true,
              pageSize: queryParams.perPage,
              current: queryParams.page,
              total: dataSource.total,
              hideOnSinglePage: queryParams.perPage === 10,
              onChange: handlePageChange
            }}
          />
        </ConfigProvider>
      </PageBox>
      <AddPublicKeyModal
        open={openPublicKeyModalStatus.open}
        action={openPublicKeyModalStatus.action}
        title={openPublicKeyModalStatus.title}
        data={openPublicKeyModalStatus.currentData}
        onCancel={closePublicKeyModal}
        onOk={handleModalOk}
      />
      <DeleteModal ref={modalRef} />
    </>
  );
};

export default GPUServicePublicKeys;
