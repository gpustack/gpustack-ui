import DeleteModal from '@/components/delete-modal';
import IconFont from '@/components/icon-font';
import { FilterBar } from '@/components/page-tools';
import { PaginationKey, TABLE_SORT_DIRECTIONS } from '@/config/settings';
import useTableFetch from '@/hooks/use-table-fetch';
import NoResult from '@/pages/_components/no-result';
import PageBox from '@/pages/_components/page-box';
import { useIntl } from '@umijs/max';
import { useMemoizedFn } from 'ahooks';
import { ConfigProvider, Table } from 'antd';
import _ from 'lodash';
import {
  deleteModelInstance,
  MODEL_INSTANCE_API,
  queryModelsInstances
} from '../apis';
import { ModelInstanceListItem as ListItem } from '../config/types';
import useInstanceColumns from './use-instance-columns';

const InstanceView: React.FC = () => {
  const {
    dataSource,
    rowSelection,
    queryParams,
    modalRef,
    handleTableChange,
    handleDelete,
    handleDeleteBatch,
    fetchData,
    handlePageChange,
    handleSearch,
    handleNameChange
  } = useTableFetch<ListItem>({
    key: PaginationKey.Providers,
    fetchAPI: queryModelsInstances,
    deleteAPI: deleteModelInstance,
    watch: false,
    API: MODEL_INSTANCE_API,
    contentForDelete: 'menu.models.providers'
  });
  const intl = useIntl();

  const handleSelect = useMemoizedFn((val: any, row: ListItem) => {});

  const renderEmpty = (type?: string) => {
    if (type !== 'Table') return;
    return (
      <NoResult
        loading={dataSource.loading}
        loadend={dataSource.loadend}
        dataSource={dataSource.dataList}
        image={<IconFont type="icon-extension-outline" />}
        filters={_.omit(queryParams, ['sort_by'])}
        noFoundText={intl.formatMessage({
          id: 'noresult.providers.nofound'
        })}
        title={intl.formatMessage({ id: 'noresult.providers.title' })}
        subTitle={intl.formatMessage({
          id: 'noresult.providers.subTitle'
        })}
        buttonText={intl.formatMessage({ id: 'noresult.button.add' })}
      ></NoResult>
    );
  };

  const columns = useInstanceColumns(handleSelect);

  return (
    <>
      <PageBox>
        <FilterBar
          showSelect={false}
          marginBottom={22}
          marginTop={30}
          widths={{ input: 300 }}
          rowSelection={rowSelection}
          handleInputChange={handleNameChange}
          handleSearch={handleSearch}
          handleDeleteByBatch={handleDeleteBatch}
        ></FilterBar>
        <ConfigProvider renderEmpty={renderEmpty}>
          <Table
            rowKey="id"
            tableLayout="fixed"
            sortDirections={TABLE_SORT_DIRECTIONS}
            showSorterTooltip={false}
            dataSource={dataSource.dataList}
            loading={{
              spinning: dataSource.loading,
              size: 'middle'
            }}
            rowSelection={rowSelection}
            columns={columns}
            scroll={{ x: 900 }}
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
      <DeleteModal ref={modalRef}></DeleteModal>
    </>
  );
};

export default InstanceView;
