import { PaginationKey, TABLE_SORT_DIRECTIONS } from '@/config/settings';
import useTableFetch from '@/hooks/use-table-fetch';
import PageBox from '@/pages/_components/page-box';
import { useQueryClusterList } from '@/pages/cluster-management/services/use-query-cluster-list';
import {
  BaseSelect,
  FilterBar,
  IconFont,
  NoResult,
  AntdResponsiveTable as Table,
  useFilterDrawer
} from '@gpustack/core-ui';
import { useIntl, useSearchParams } from '@umijs/max';
import { ConfigProvider } from 'antd';
import _ from 'lodash';
import { useEffect, useState } from 'react';
import { GPU_DEVICES_API, queryGpuDevicesList } from '../apis';
import { GPUDeviceItem } from '../config/types';
import ClusterFilterForm from '../filters/cluster-filter-form';
import useGPUColumns from '../hooks/use-gpu-columns';

// Optional ``clusterId`` pins the list to a single cluster (used by
// the cluster-detail page) and hides the cluster-filter dropdown so
// the user can't change scope away from the cluster they're already
// inside.
interface GPUListProps {
  clusterId?: number;
  source?: 'clusterDetail';
}

const GPUList: React.FC<GPUListProps> = ({ clusterId, source }) => {
  const {
    dataSource,
    queryParams,
    extraStatus,
    sortOrder,
    handlePageChange,
    handleTableChange,
    handleQueryChange,
    handleSearch,
    handleNameChange
  } = useTableFetch<GPUDeviceItem>({
    key: PaginationKey.GPUs,
    fetchAPI: queryGpuDevicesList,
    polling: true,
    API: GPU_DEVICES_API,
    defaultQueryParams: clusterId ? { cluster_id: clusterId } : undefined
  });
  const [searchParams] = useSearchParams();
  const page = searchParams.get('page');
  const intl = useIntl();
  const {
    filtersVisible,
    toggleFilters,
    filterRef,
    filterValues,
    filtersCount,
    handleOnFilterChange,
    handleOnClearFilters
  } = useFilterDrawer({
    onFilterChange: (filters) => {
      handleQueryChange({ page: 1, ...filters });
    },
    clearKeys: ['cluster_id']
  });
  const [clusterList, setClusterList] = useState<Global.BaseOption<number>[]>(
    []
  );
  const { fetchClusterList } = useQueryClusterList({
    useStateData: false
  });

  const getClusterList = async () => {
    try {
      const items = await fetchClusterList({ page: -1 });
      const list = items?.map((item) => ({
        label: item.name,
        value: item.id
      }));
      setClusterList(list || []);
    } catch (error) {
      setClusterList([]);
    }
  };

  const handleClusterChange = (value: number) => {
    handleQueryChange({
      page: 1,
      cluster_id: value
    });
  };

  const renderEmpty = (type?: string) => {
    if (type !== 'Table') return;
    return (
      <NoResult
        loading={dataSource.loading}
        loadend={dataSource.loadend}
        dataSource={dataSource.dataList}
        image={<IconFont type="icon-gpu1" />}
        filters={_.omit(queryParams, ['sort_by'])}
        noFoundText={intl.formatMessage({ id: 'noresult.gpus.nofound' })}
        title={intl.formatMessage({ id: 'noresult.gpus.title' })}
        subTitle={intl.formatMessage({ id: 'noresult.gpus.subTitle' })}
      ></NoResult>
    );
  };

  const columns = useGPUColumns({
    clusterList,
    loadend: dataSource.loadend,
    sortOrder,
    firstLoad: extraStatus.firstLoad
  });

  useEffect(() => {
    console.log('columns changed!');
  }, [columns]);

  useEffect(() => {
    getClusterList();
  }, []);

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'flex-start',
        minWidth: 0,
        maxWidth: '100%'
      }}
    >
      {source !== 'clusterDetail' && (
        <ClusterFilterForm
          ref={filterRef}
          open={filtersVisible}
          clusterList={clusterList}
          initialValues={filterValues}
          onValuesChange={handleOnFilterChange}
          onClose={toggleFilters}
          onClear={handleOnClearFilters}
        />
      )}
      <div style={{ flex: 1, minWidth: 0, maxWidth: '100%' }}>
        <PageBox>
          <FilterBar
            marginBottom={22}
            showSelect={false}
            handleSearch={handleSearch}
            handleInputChange={handleNameChange}
            widths={{ input: 300 }}
            collapseInlineFilters={source !== 'clusterDetail'}
            filtersButtonProps={
              source !== 'clusterDetail'
                ? {
                    show: true,
                    count: filtersCount,
                    onClick: toggleFilters,
                    onClear: handleOnClearFilters
                  }
                : undefined
            }
            inlineFilters={
              source !== 'clusterDetail' ? (
                <BaseSelect
                  allowClear
                  showSearch={false}
                  placeholder={intl.formatMessage({
                    id: 'clusters.filterBy.cluster'
                  })}
                  style={{ width: 160 }}
                  size="large"
                  maxTagCount={1}
                  onChange={handleClusterChange}
                  options={clusterList}
                />
              ) : null
            }
          ></FilterBar>
          <ConfigProvider renderEmpty={renderEmpty}>
            <Table
              columns={columns}
              sortDirections={TABLE_SORT_DIRECTIONS}
              showSorterTooltip={false}
              tableLayout={'auto'}
              dataSource={dataSource.dataList}
              loading={{
                spinning: dataSource.loading,
                size: 'middle'
              }}
              rowKey="id"
              scroll={{ x: 'max-content' }}
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
      </div>
    </div>
  );
};

export default GPUList;
