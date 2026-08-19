import { PaginationKey, TABLE_SORT_DIRECTIONS } from '@/config/settings';
import useTableFetch from '@/hooks/use-table-fetch';
import { useQueryClusterList } from '@/pages/cluster-management/services/use-query-cluster-list';
import {
  DeleteModal,
  FilterBar,
  IconFont,
  NoResult,
  Table as SealTable,
  type TableOrder
} from '@gpustack/core-ui';
import { useIntl } from '@umijs/max';
import { useMemoizedFn } from 'ahooks';
import { message } from 'antd';
import _ from 'lodash';
import { useEffect } from 'react';
import ErrorMessageContent from '../../_components/error-message-content';
import PageBox from '../../_components/page-box';
import {
  activateGPUInstanceType,
  deactivateGPUInstanceType,
  deleteGPUInstanceType,
  GPU_INSTANCE_TYPES_API,
  queryGPUInstanceTypes
} from './apis';
import AddInstanceTypeModal from './components/add-instance-type-modal';
import { FormData, ListItem } from './config/types';
import useCreateInstanceTypeModal from './hooks/use-create-instance-type-modal';
import useInstanceTypeColumns from './hooks/use-instance-type-columns';
import useCreateInstanceType from './services/use-create-instance-type';

const GPUServiceInstanceTypes: React.FC = () => {
  const intl = useIntl();

  const {
    dataSource,
    queryParams,
    sortOrder,
    modalRef,
    fetchData,
    handlePageChange,
    handleTableChange,
    handleSearch,
    handleQueryChange,
    handleNameChange
  } = useTableFetch<ListItem>({
    key: PaginationKey.InstanceTypes,
    fetchAPI: queryGPUInstanceTypes,
    events: ['CREATE', 'UPDATE', 'DELETE'],
    watch: true,
    API: GPU_INSTANCE_TYPES_API,
    // Without it the list would also carry Model Service clusters' types, which
    // cannot host a GPU Instance. The route narrows nothing when it is omitted,
    // because the model deploy form's GPU type picker relies on that default.
    defaultQueryParams: { purpose: 'gpu_service' }
  });

  const { fetchData: createInstanceType } = useCreateInstanceType();
  const {
    clusterList,
    fetchClusterList,
    loading: clusterLoading
  } = useQueryClusterList();
  const {
    openInstanceTypeModalStatus,
    openInstanceTypeModal,
    closeInstanceTypeModal
  } = useCreateInstanceTypeModal();

  useEffect(() => {
    // Only clusters registered for GPU Service (k8s_options.gpu_instance_options
    // set) are eligible here — a Model Service cluster must never appear in the
    // filter or the create form. It is the same narrowing the list itself asks
    // the server for, so this covers every cluster the Cluster column can have
    // to name.
    fetchClusterList({ page: -1, gpu_instance_enabled: true });
  }, []);

  const hasK8sCluster = clusterList.length > 0;

  const handleClusterChange = useMemoizedFn((value: number) => {
    handleQueryChange({ page: 1, cluster_id: value });
  });

  // The writes proxy into a cluster and opt out of the global error toast, so
  // the message is chosen here: a cluster with no ready worker answers 503, and
  // all the backend can pass on is its proxy's bare "Service Unavailable".
  // Rethrows — DeleteModal announces success unless its onOk rejects.
  const runWrite = useMemoizedFn(async (write: () => Promise<any>) => {
    try {
      return await write();
    } catch (error: any) {
      const { response } = error || {};
      const errMsg =
        response?.status === 503
          ? intl.formatMessage({
              id: 'gpuservice.instanceType.clusterUnavailable'
            })
          : response?.data?.error?.message ||
            response?.data?.message ||
            error?.message;
      message.error({ content: <ErrorMessageContent errMsg={errMsg} /> });
      throw error;
    }
  });

  const handleAdd = useMemoizedFn(() => {
    openInstanceTypeModal(
      intl.formatMessage({ id: 'gpuservice.instanceType.add' })
    );
  });

  const handleModalOk = useMemoizedFn(
    async (clusterId: number, data: FormData) => {
      try {
        await runWrite(() =>
          createInstanceType({ cluster_id: clusterId, data })
        );
        closeInstanceTypeModal();
        message.success(intl.formatMessage({ id: 'common.message.success' }));
        // The create returns the cluster's live CR; the row shows up once the
        // controller projects it into the record table and the watch delivers
        // it, so this refresh may still not carry it.
        fetchData();
      } catch (error) {
        // already reported by runWrite; the drawer stays open
      }
    }
  );

  const handleDelete = useMemoizedFn((record: ListItem) => {
    modalRef.current?.show({
      content: intl.formatMessage({ id: 'gpuservice.instanceType' }),
      operation: 'common.delete.single.confirm',
      name: record.name,
      async onOk() {
        // The row's own cluster, not the page's: the list is fleet-wide.
        await runWrite(() =>
          deleteGPUInstanceType({
            name: record.name,
            cluster_id: record.clusterId!
          })
        );
        fetchData();
      }
    });
  });

  const handleToggleActive = useMemoizedFn(
    (record: ListItem, activate: boolean) => {
      const action = activate
        ? activateGPUInstanceType
        : deactivateGPUInstanceType;
      modalRef.current?.show({
        content: intl.formatMessage({ id: 'gpuservice.instanceType' }),
        title: activate
          ? 'common.title.activate.confirm'
          : 'common.title.deactivate.confirm',
        okText: activate
          ? 'gpuservice.instanceType.activate'
          : 'gpuservice.instanceType.deactivate',
        operation: activate
          ? 'common.activate.single.confirm'
          : 'common.deactivate.single.confirm',
        name: record.spec?.displayName || record.name,
        async onOk() {
          // The row's own cluster, not the page's: the list is fleet-wide.
          await runWrite(() =>
            action({ name: record.name, cluster_id: record.clusterId! })
          );
          fetchData();
        }
      });
    }
  );

  const handleSelect = useMemoizedFn((val: string, record: ListItem) => {
    if (val === 'delete') {
      handleDelete(record);
    } else if (val === 'activate') {
      handleToggleActive(record, true);
    } else if (val === 'deactivate') {
      handleToggleActive(record, false);
    }
  });

  const columns = useInstanceTypeColumns({
    handleSelect,
    clusterList,
    sortOrder
  });

  // SealTable reports a sort as a `TableOrder` (or a list of them) instead of
  // antd's `(pagination, filters, sorter, extra)`, so feed `handleTableChange`
  // the shape it expects — the sorter slot plus an explicit `sort` action.
  const handleTableSort = useMemoizedFn(
    (order: TableOrder | Array<TableOrder>) => {
      handleTableChange({}, {}, order, { action: 'sort' });
    }
  );

  // SealTable takes the empty state as a node (`empty`) rather than through
  // antd's `ConfigProvider renderEmpty`, so this is built eagerly. Only the
  // narrowing params count as filters — `purpose` rides every request, and
  // passing it would make an empty fleet read as "no match" forever.
  const renderEmpty = () => (
    <NoResult
      minHeight="calc(100vh - 300px)"
      loading={dataSource.loading || clusterLoading}
      loadend={dataSource.loadend}
      dataSource={dataSource.dataList}
      image={<IconFont type="icon-gpu1" />}
      filters={_.pick(queryParams, ['search', 'cluster_id'])}
      noFoundText={intl.formatMessage({
        id: 'noresult.gpuservice.instanceType.nofound'
      })}
      title={intl.formatMessage({
        id: 'noresult.gpuservice.instanceType.title'
      })}
      subTitle={
        hasK8sCluster
          ? intl.formatMessage({
              id: 'noresult.gpuservice.instanceType.subTitle'
            })
          : intl.formatMessage({ id: 'noresult.resources.k8sCluster' })
      }
      {...(hasK8sCluster
        ? {
            onClick: handleAdd,
            buttonText: intl.formatMessage({ id: 'noresult.button.add' })
          }
        : {})}
    />
  );

  return (
    <>
      <PageBox>
        <FilterBar
          marginBottom={22}
          showSelect
          selectHolder={intl.formatMessage({ id: 'clusters.filterBy.cluster' })}
          inputHolder={intl.formatMessage({
            id: 'gpuservice.instanceType.filter.name'
          })}
          buttonText={intl.formatMessage({
            id: 'gpuservice.instanceType.add'
          })}
          selectOptions={clusterList}
          handleSearch={handleSearch}
          handleSelectChange={handleClusterChange}
          handleClickPrimary={hasK8sCluster ? handleAdd : undefined}
          handleInputChange={handleNameChange}
          widths={{ select: 230, input: 230 }}
        />
        <SealTable
          rowKey="id"
          columns={columns}
          dataSource={dataSource.dataList}
          loading={dataSource.loading}
          loadend={dataSource.loadend}
          sortDirections={TABLE_SORT_DIRECTIONS}
          showSorterTooltip={false}
          onTableSort={handleTableSort}
          // `true` widens the row out to the columns' own floors (sum of their
          // `minWidth` / `width` + the prefix gutter) and scrolls past that. Not
          // `'max-content'`: the columns are `fr` tracks, and under a
          // content-driven constraint the greediest cell sets the `fr` unit for
          // every track, which blows the table far past the width it needs.
          scroll={{ x: true }}
          empty={renderEmpty()}
          // Matches the `<NoResult minHeight>` inside the empty state, so the
          // first-load spinner, the empty state and the eventual rows occupy one
          // stable block instead of jumping on entry.
          emptyMinHeight="calc(100vh - 300px)"
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
      </PageBox>
      <AddInstanceTypeModal
        open={openInstanceTypeModalStatus.open}
        title={openInstanceTypeModalStatus.title}
        clusterList={clusterList}
        onCancel={closeInstanceTypeModal}
        onOk={handleModalOk}
      />
      <DeleteModal ref={modalRef} />
    </>
  );
};

export default GPUServiceInstanceTypes;
