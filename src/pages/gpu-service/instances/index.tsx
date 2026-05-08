import { PageAction } from '@/config';
import { PaginationKey, TABLE_SORT_DIRECTIONS } from '@/config/settings';
import type { PageActionType } from '@/config/types';
import useTableFetch from '@/hooks/use-table-fetch';
import { useQueryClusterList } from '@/pages/cluster-management/services/use-query-cluster-list';
import { useModel } from '@@/plugin-model';
import {
  BaseSelect,
  DeleteModal,
  FilterBar,
  IconFont,
  NoResult
} from '@gpustack/core-ui';
import { useIntl } from '@umijs/max';
import { useMemoizedFn } from 'ahooks';
import { ConfigProvider, Divider, Flex, message, Table } from 'antd';
import _ from 'lodash';
import { useCallback, useEffect, useState } from 'react';
import { PageContainerInner } from '../../_components/page-box';
import {
  deleteGPUServiceInstance,
  GPU_SERVICE_INSTANCES_API,
  queryGPUServiceInstances
} from './apis';
import AddModal from './components/add-modal';
import { FormData, ListItem } from './config/types';
import useInstancesColumns from './hooks/use-instances-columns';
import useCreateInstance from './services/use-create-instance';
import useUpdateInstance from './services/use-update-instance';

const GPUService: React.FC = () => {
  const { initialState } = useModel('@@initialState');
  const namespace = initialState?.currentUser?.org_name || 'default';

  const deleteInstance = useCallback(
    (id: number) => deleteGPUServiceInstance({ namespace, id }),
    [namespace]
  );

  const fetchInstances = useCallback(
    async (
      params: any,
      options?: any
    ): Promise<Global.PageResponse<ListItem>> => {
      const res = await queryGPUServiceInstances(
        { ...params, namespace },
        options
      );
      const total = res.items?.length ?? 0;
      const perPage = params.perPage || 10;
      return {
        items: res.items ?? [],
        pagination: {
          total,
          totalPage: Math.ceil(total / perPage),
          page: params.page || 1,
          perPage
        }
      };
    },
    [namespace]
  );

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
    handleQueryChange,
    handleSearch,
    handleNameChange
  } = useTableFetch<ListItem>({
    key: PaginationKey.Instances,
    fetchAPI: fetchInstances,
    deleteAPI: deleteInstance,
    watch: false,
    API: GPU_SERVICE_INSTANCES_API(namespace),
    contentForDelete: 'GPU 实例'
  });

  const { fetchData: createInstance } = useCreateInstance();
  const { fetchData: updateInstance } = useUpdateInstance();
  const {
    fetchClusterList,
    cancelRequest: cancelClusterRequest,
    clusterList
  } = useQueryClusterList();
  const intl = useIntl();

  const [openAddModalStatus, setOpenAddModalStatus] = useState<{
    action: PageActionType;
    open: boolean;
    title: string;
    currentData?: ListItem | null;
  }>({
    action: PageAction.CREATE,
    title: '',
    open: false,
    currentData: null
  });

  useEffect(() => {
    fetchClusterList({ page: -1 }).then((clusters) => {
      if (clusters.length > 0) {
        handleQueryChange({
          cluster_id: clusters[0].id,
          page: 1
        });
      }
    });
    return () => {
      cancelClusterRequest();
    };
  }, []);

  const handleAddInstance = () => {
    setOpenAddModalStatus({
      action: PageAction.CREATE,
      title: '添加 GPU 实例',
      open: true,
      currentData: null
    });
  };

  const handleEditInstance = (row: ListItem) => {
    setOpenAddModalStatus({
      action: PageAction.EDIT,
      title: '编辑 GPU 实例',
      open: true,
      currentData: row
    });
  };

  const closeModal = () => {
    setOpenAddModalStatus({
      action: PageAction.CREATE,
      title: '',
      open: false,
      currentData: null
    });
  };

  const handleModalOk = async (data: FormData) => {
    try {
      if (openAddModalStatus.action === PageAction.EDIT) {
        await updateInstance({
          id: openAddModalStatus.currentData!.id,
          data
        });
      } else {
        await createInstance({ data });
      }

      fetchData();
      closeModal();
      message.success('操作成功');
    } catch (error) {
      message.error('操作失败');
    }
  };

  const handleSelect = useMemoizedFn((val: string, row: ListItem) => {
    if (val === 'edit') {
      handleEditInstance(row);
    } else if (val === 'delete') {
      handleDelete({ ...row, name: row.metadata?.name });
    }
  });

  const handleClusterChange = (value: number) => {
    handleQueryChange({
      cluster_id: value,
      page: 1
    });
  };

  const renderEmpty = (type?: string) => {
    if (type !== 'Table') return;
    return (
      <NoResult
        loading={dataSource.loading}
        loadend={dataSource.loadend}
        dataSource={dataSource.dataList}
        image={<IconFont type="icon-instances-outlined" />}
        filters={_.omit(queryParams, ['sort_by'])}
        noFoundText="未找到匹配的 GPU 实例"
        title="暂无 GPU 实例"
        subTitle="创建一个 GPU 实例后会显示在这里"
        onClick={handleAddInstance}
        buttonText="立即添加"
      />
    );
  };

  const columns = useInstancesColumns({
    handleSelect,
    sortOrder
  });

  return (
    <PageContainerInner
      leftContent={
        <Flex align="center">
          <span>{intl.formatMessage({ id: 'menu.gpuService.instances' })}</span>
          <Divider
            orientation="vertical"
            style={{
              marginLeft: 16
            }}
          />
          <BaseSelect
            variant="borderless"
            value={queryParams.cluster_id}
            options={clusterList}
            onChange={handleClusterChange}
            style={{ minWidth: 120, fontWeight: 500 }}
          ></BaseSelect>
        </Flex>
      }
    >
      <FilterBar
        marginBottom={22}
        marginTop={30}
        showSelect={false}
        selectOptions={clusterList}
        select={{ showSearch: true }}
        selectHolder="按集群过滤"
        buttonText="添加 GPU 实例"
        handleSearch={handleSearch}
        handleSelectChange={handleClusterChange}
        handleDeleteByBatch={handleDeleteBatch}
        handleClickPrimary={handleAddInstance}
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
          rowKey="id"
          onChange={handleTableChange}
          pagination={{
            size: 'middle',
            showSizeChanger: true,
            pageSize: queryParams.perPage,
            current: queryParams.page,
            total: dataSource.total,
            hideOnSinglePage: queryParams.perPage === 10,
            onChange: handlePageChange
          }}
        />
      </ConfigProvider>
      <AddModal
        open={openAddModalStatus.open}
        action={openAddModalStatus.action}
        title={openAddModalStatus.title}
        data={openAddModalStatus.currentData}
        onCancel={closeModal}
        onOk={handleModalOk}
      />
      <DeleteModal ref={modalRef} />
    </PageContainerInner>
  );
};

export default GPUService;
