import DeleteModal from '@/components/delete-modal';
import { FilterBar } from '@/components/page-tools';
import { PageAction } from '@/config';
import useTableFetch from '@/hooks/use-table-fetch';
import { useIntl, useSearchParams } from '@umijs/max';
import { useMemoizedFn } from 'ahooks';
import { message, Table } from 'antd';
import { useState } from 'react';
import styled from 'styled-components';
import {
  createWorkerPool,
  deleteWorkerPool,
  queryWorkerPools,
  updateWorkerPool,
  WORKER_POOLS_API
} from '../apis';
import { ProviderType, ProviderValueMap } from '../config';
import {
  NodePoolListItem as ListItem,
  NodePoolFormData
} from '../config/types';
import usePoolsColumns from '../hooks/use-pools-columns';
import AddPool from './add-pool';

const SubTitle = styled.div`
  font-size: var(--font-size-middle);
  font-weight: 700;
  color: var(--ant-color-text);
  margin-block: 24px 16px;
`;

const WorkerPools = () => {
  const [searchParams] = useSearchParams();
  const {
    dataSource,
    rowSelection,
    queryParams,
    modalRef,
    sortOrder,
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
    contentForDelete: 'clusters.workerpool.title',
    defaultQueryParams: {
      cluster_id: searchParams.get('id') || undefined
    }
  });
  const intl = useIntl();
  const [addPoolStatus, setAddPoolStatus] = useState({
    open: false,
    action: PageAction.CREATE,
    title: '',
    provider: ProviderValueMap.DigitalOcean as ProviderType,
    currentData: null as ListItem | null,
    clusterId: 0 as number | string
  });

  // pool action handler
  const handleEdit = (action: string, record: ListItem) => {
    if (action === 'edit') {
      setAddPoolStatus({
        open: true,
        action: PageAction.EDIT,
        title: intl.formatMessage(
          { id: 'common.button.edit.item' },
          { name: record.name }
        ),
        provider: searchParams.get('provider') as ProviderType,
        currentData: record,
        clusterId: searchParams.get('id') || 0
      });
    }
  };

  const handleAddPool = (row: ListItem) => {
    setAddPoolStatus({
      open: true,
      action: PageAction.CREATE,
      title: intl.formatMessage({ id: 'clusters.button.addNodePool' }),
      provider: searchParams.get('provider') as ProviderType,
      clusterId: searchParams.get('id') || 0,
      currentData: null
    });
  };

  const onSelect = useMemoizedFn((key: string, record: ListItem) => {
    if (key === 'delete') {
      handleDelete({ ...record, name: record.instance_type });
    }
    if (key === 'edit') {
      handleEdit(key, record);
    }
  });

  const handleSubmitWorkerPool = async (formdata: NodePoolFormData) => {
    try {
      if (addPoolStatus.action === PageAction.CREATE) {
        await createWorkerPool({
          data: formdata,
          clusterId: searchParams.get('id') || 0
        });
      }
      if (addPoolStatus.action === PageAction.EDIT) {
        await updateWorkerPool({
          data: formdata,
          id: addPoolStatus.currentData!.id
        });
      }
      setAddPoolStatus({
        ...addPoolStatus,
        open: false
      });
      message.success(intl.formatMessage({ id: 'common.message.success' }));
      handleSearch();
    } catch (error) {
      // error
    }
  };

  const columns = usePoolsColumns(onSelect, sortOrder);

  return (
    <>
      <SubTitle>
        <span>{intl.formatMessage({ id: 'clusters.workerpool.title' })}</span>
      </SubTitle>
      <FilterBar
        showSelect={false}
        marginBottom={22}
        marginTop={22}
        widths={{ input: 300 }}
        buttonText={intl.formatMessage({ id: 'clusters.button.addNodePool' })}
        rowSelection={rowSelection}
        handleInputChange={handleNameChange}
        handleSearch={handleSearch}
        handleDeleteByBatch={handleDeleteBatch}
        handleClickPrimary={handleAddPool}
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
            provider: ProviderValueMap.DigitalOcean as ProviderType,
            currentData: null,
            clusterId: 0
          });
        }}
        onOk={handleSubmitWorkerPool}
      ></AddPool>
      <DeleteModal ref={modalRef}></DeleteModal>
    </>
  );
};

export default WorkerPools;
