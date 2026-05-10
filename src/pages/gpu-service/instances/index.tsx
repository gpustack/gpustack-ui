import { currentClusterAtom } from '@/atoms/gpuservice';
import { PageAction } from '@/config';
import { PaginationKey, TABLE_SORT_DIRECTIONS } from '@/config/settings';
import type { PageActionType } from '@/config/types';
import useTableFetch from '@/hooks/use-table-fetch';
import { ProviderValueMap } from '@/pages/cluster-management/config';
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
import { useAtom } from 'jotai';
import _ from 'lodash';
import { useCallback, useEffect, useMemo, useState } from 'react';
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
  const intl = useIntl();
  const { initialState } = useModel('@@initialState');
  const namespace = initialState?.currentUser?.org_name || 'default';
  const [currentCluster, setCurrentCluster] = useAtom(currentClusterAtom);
  const clusterID = currentCluster?.id;

  const deleteInstance = useCallback(
    (id: number) => deleteGPUServiceInstance({ namespace, clusterID, id }),
    [namespace, clusterID]
  );

  const fetchInstances = useCallback(
    async (
      params: any,
      options?: any
    ): Promise<Global.PageResponse<ListItem>> => {
      if (!clusterID) {
        return {
          items: [],
          pagination: {
            total: 0,
            totalPage: 0,
            page: 1,
            perPage: params.perPage || 10
          }
        } as Global.PageResponse<ListItem>;
      }
      const res = await queryGPUServiceInstances(
        { ...params, namespace, clusterID: params.cluster_id ?? clusterID },
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
    [namespace, clusterID]
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
    watch: true,
    API: GPU_SERVICE_INSTANCES_API({ namespace, clusterID }),
    contentForDelete: intl.formatMessage({ id: 'gpuservice.instance' })
  });

  const { fetchData: createInstance } = useCreateInstance();
  const { fetchData: updateInstance } = useUpdateInstance();
  const {
    fetchClusterList,
    cancelRequest: cancelClusterRequest,
    clusterList
  } = useQueryClusterList();

  const k8sClusterList = useMemo(
    () =>
      clusterList.filter(
        (item) => item.provider === ProviderValueMap.Kubernetes
      ),
    [clusterList]
  );

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
      const k8sClusters = clusters.filter(
        (item: any) => item.provider === ProviderValueMap.Kubernetes
      );
      if (k8sClusters.length > 0) {
        const firstCluster = k8sClusters[0];
        setCurrentCluster({
          ...firstCluster,
          label: firstCluster.name,
          value: firstCluster.id
        });
        handleQueryChange({
          cluster_id: firstCluster.id,
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
      title: intl.formatMessage({ id: 'gpuservice.instance.add' }),
      open: true,
      currentData: null
    });
  };

  const handleEditInstance = (row: ListItem) => {
    setOpenAddModalStatus({
      action: PageAction.EDIT,
      title: intl.formatMessage({ id: 'gpuservice.instance.edit' }),
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
      message.success(intl.formatMessage({ id: 'common.message.success' }));
    } catch (error) {
      message.error(intl.formatMessage({ id: 'common.message.fail' }));
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
    const cluster = k8sClusterList.find((item) => item.value === value);
    if (cluster) {
      setCurrentCluster(cluster);
    }
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
        image={<IconFont type="icon-cloud-outlined" />}
        filters={_.omit(queryParams, ['sort_by'])}
        noFoundText={intl.formatMessage({
          id: 'noresult.gpuservice.instance.nofound'
        })}
        title={intl.formatMessage({
          id: 'noresult.gpuservice.instance.title'
        })}
        subTitle={intl.formatMessage({
          id: 'noresult.gpuservice.instance.subTitle'
        })}
        onClick={handleAddInstance}
        buttonText={intl.formatMessage({ id: 'noresult.button.add' })}
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
            options={k8sClusterList}
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
        selectOptions={k8sClusterList}
        select={{ showSearch: true }}
        selectHolder={intl.formatMessage({
          id: 'gpuservice.instance.filter.cluster'
        })}
        buttonText={intl.formatMessage({ id: 'gpuservice.instance.add' })}
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
          rowKey={(record) => record.metadata.name}
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
