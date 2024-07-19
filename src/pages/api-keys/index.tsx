import DeleteModal from '@/components/delete-modal';
import PageTools from '@/components/page-tools';
import { PageAction } from '@/config';
import type { PageActionType } from '@/config/types';
import useTableRowSelection from '@/hooks/use-table-row-selection';
import useTableSort from '@/hooks/use-table-sort';
import { handleBatchRequest } from '@/utils';
import { DeleteOutlined, PlusOutlined, SyncOutlined } from '@ant-design/icons';
import { PageContainer } from '@ant-design/pro-components';
import { useIntl } from '@umijs/max';
import { Button, Input, Space, Table, Tooltip } from 'antd';
import dayjs from 'dayjs';
import _ from 'lodash';
import { useEffect, useRef, useState } from 'react';
import { deleteApisKey, queryApisKeysList } from './apis';
import AddAPIKeyModal from './components/add-apikey';
import { ListItem } from './config/types';

const { Column } = Table;

const APIKeys: React.FC = () => {
  const rowSelection = useTableRowSelection();
  const { sortOrder, setSortOrder } = useTableSort({
    defaultSortOrder: 'descend'
  });
  const intl = useIntl();
  const modalRef = useRef<any>(null);
  const [dataSource, setDataSource] = useState([]);
  const [total, setTotal] = useState(0);
  const [openAddModal, setOpenAddModal] = useState(false);
  const [loading, setLoading] = useState(false);
  const [action, setAction] = useState<PageActionType>(PageAction.CREATE);
  const [queryParams, setQueryParams] = useState({
    page: 1,
    perPage: 10,
    search: ''
  });

  const handlePageChange = (page: number, pageSize: number) => {
    console.log('handlePageChange====', page, pageSize);
    setQueryParams({
      ...queryParams,
      page: page,
      perPage: pageSize || 10
    });
  };

  const handleTableChange = (pagination: any, filters: any, sorter: any) => {
    console.log('handleTableChange=======', pagination, filters, sorter);
    setSortOrder(sorter.order);
  };

  const fetchData = async () => {
    setLoading(true);
    try {
      const params = {
        ..._.pickBy(queryParams, (val: any) => !!val)
      };
      const res = await queryApisKeysList(params);
      console.log('res=======', res);
      setDataSource(res.items || []);
      setTotal(res.pagination.total);
    } catch (error) {
      console.log('error', error);
      setDataSource([]);
    } finally {
      setLoading(false);
    }
  };
  const handleSearch = (e: any) => {
    fetchData();
  };

  const handleNameChange = (e: any) => {
    setQueryParams({
      ...queryParams,
      search: e.target.value
    });
  };

  const handleAddUser = () => {
    setOpenAddModal(true);
    setAction(PageAction.CREATE);
  };

  const handleModalOk = async () => {
    try {
      await fetchData();
      setOpenAddModal(false);
    } catch (error) {
      // do nothing
    }
  };

  const handleModalCancel = () => {
    console.log('handleModalCancel');
    setOpenAddModal(false);
  };

  const handleDelete = (row: ListItem) => {
    modalRef.current.show({
      content: 'apikeys.table.apikeys',
      async onOk() {
        console.log('OK');
        await deleteApisKey(row.id);
        fetchData();
      }
    });
  };

  const handleDeleteBatch = () => {
    modalRef.current.show({
      content: 'apikeys.table.apikeys',
      async onOk() {
        await handleBatchRequest(rowSelection.selectedRowKeys, deleteApisKey);
        rowSelection.clearSelections();
        fetchData();
      }
    });
  };

  useEffect(() => {
    fetchData();
  }, [queryParams]);

  return (
    <>
      <PageContainer
        ghost
        header={{
          title: intl.formatMessage({ id: 'apikeys.title' })
        }}
        extra={[]}
      >
        <PageTools
          marginBottom={22}
          left={
            <Space>
              <Input
                placeholder={intl.formatMessage({ id: 'common.filter.name' })}
                style={{ width: 300 }}
                allowClear
                onChange={handleNameChange}
              ></Input>
              <Button
                type="text"
                style={{ color: 'var(--ant-color-text-tertiary)' }}
                onClick={handleSearch}
                icon={<SyncOutlined></SyncOutlined>}
              ></Button>
            </Space>
          }
          right={
            <Space size={20}>
              <Button
                icon={<PlusOutlined></PlusOutlined>}
                type="primary"
                onClick={handleAddUser}
              >
                {intl.formatMessage({ id: 'apikeys.button.create' })}
              </Button>
              <Button
                icon={<DeleteOutlined />}
                danger
                onClick={handleDeleteBatch}
                disabled={!rowSelection.selectedRowKeys.length}
              >
                {intl.formatMessage({ id: 'common.button.delete' })}
              </Button>
            </Space>
          }
        ></PageTools>
        <Table
          dataSource={dataSource}
          rowSelection={rowSelection}
          loading={loading}
          rowKey="id"
          onChange={handleTableChange}
          pagination={{
            showSizeChanger: true,
            pageSize: queryParams.perPage,
            current: queryParams.page,
            total: total,
            hideOnSinglePage: queryParams.perPage === 10,
            onChange: handlePageChange
          }}
        >
          <Column
            title={intl.formatMessage({ id: 'common.table.name' })}
            dataIndex="name"
            key="name"
            width={400}
            ellipsis={{
              showTitle: true
            }}
          />

          <Column
            title={intl.formatMessage({ id: 'apikeys.form.expiretime' })}
            dataIndex="expires_at"
            key="expiration"
            render={(text, record) => {
              return text
                ? dayjs(text).format('YYYY-MM-DD HH:mm:ss')
                : intl.formatMessage({ id: 'apikeys.form.expiration.never' });
            }}
          />
          <Column
            title={intl.formatMessage({ id: 'common.table.description' })}
            dataIndex="description"
            key="description"
            ellipsis={{
              showTitle: true
            }}
          />
          <Column
            title={intl.formatMessage({ id: 'common.table.createTime' })}
            dataIndex="created_at"
            key="createTime"
            defaultSortOrder="descend"
            sortOrder={sortOrder}
            showSorterTooltip={false}
            sorter={false}
            render={(text, record) => {
              return dayjs(text).format('YYYY-MM-DD HH:mm:ss');
            }}
          />
          <Column
            title={intl.formatMessage({ id: 'common.table.operation' })}
            key="operation"
            render={(text, record: ListItem) => {
              return (
                <Space size={20}>
                  <Tooltip
                    title={intl.formatMessage({ id: 'common.button.delete' })}
                  >
                    <Button
                      onClick={() => handleDelete(record)}
                      size="small"
                      danger
                      icon={<DeleteOutlined></DeleteOutlined>}
                    ></Button>
                  </Tooltip>
                </Space>
              );
            }}
          />
        </Table>
      </PageContainer>
      <AddAPIKeyModal
        open={openAddModal}
        action={action}
        title={intl.formatMessage({ id: 'apikeys.button.create' })}
        onCancel={handleModalCancel}
        onOk={handleModalOk}
      ></AddAPIKeyModal>
      <DeleteModal ref={modalRef}></DeleteModal>
    </>
  );
};

export default APIKeys;
