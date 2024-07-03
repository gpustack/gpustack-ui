import CopyButton from '@/components/copy-button';
import PageTools from '@/components/page-tools';
import { PageAction } from '@/config';
import type { PageActionType } from '@/config/types';
import useTableRowSelection from '@/hooks/use-table-row-selection';
import useTableSort from '@/hooks/use-table-sort';
import { handleBatchRequest } from '@/utils';
import { DeleteOutlined, PlusOutlined, SyncOutlined } from '@ant-design/icons';
import { PageContainer } from '@ant-design/pro-components';
import { useIntl } from '@umijs/max';
import {
  Button,
  Input,
  Modal,
  Space,
  Table,
  Tag,
  Tooltip,
  message
} from 'antd';
import dayjs from 'dayjs';
import _ from 'lodash';
import { useEffect, useState } from 'react';
import { deleteApisKey, queryApisKeysList } from './apis';
import AddAPIKeyModal from './components/add-apikey';
import { ListItem } from './config/types';

const { Column } = Table;

const Models: React.FC = () => {
  const rowSelection = useTableRowSelection();
  const { sortOrder, setSortOrder } = useTableSort({
    defaultSortOrder: 'descend'
  });
  const intl = useIntl();
  const [dataSource, setDataSource] = useState([]);
  const [total, setTotal] = useState(0);
  const [openAddModal, setOpenAddModal] = useState(false);
  const [loading, setLoading] = useState(false);
  const [action, setAction] = useState<PageActionType>(PageAction.CREATE);
  const [title, setTitle] = useState<string>('');
  const [queryParams, setQueryParams] = useState({
    page: 1,
    perPage: 10,
    query: ''
  });

  const handleShowSizeChange = (page: number, size: number) => {
    console.log(page, size);
    setQueryParams({
      ...queryParams,
      perPage: size
    });
  };

  const handlePageChange = (page: number, pageSize: number | undefined) => {
    console.log(page, pageSize);
    setQueryParams({
      ...queryParams,
      page: page
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
      query: e.target.value
    });
  };

  const handleAddUser = () => {
    setOpenAddModal(true);
    setAction(PageAction.CREATE);
  };

  const handleModalOk = async () => {
    try {
      setOpenAddModal(false);
      fetchData();
    } catch (error) {
      setOpenAddModal(false);
    }
  };

  const handleModalCancel = () => {
    console.log('handleModalCancel');
    setOpenAddModal(false);
  };

  const handleDelete = (row: ListItem) => {
    Modal.confirm({
      title: '',
      content: intl.formatMessage(
        { id: 'common.delete.confirm' },
        { type: intl.formatMessage({ id: 'apikeys.table.apikeys' }) }
      ),
      async onOk() {
        console.log('OK');
        await deleteApisKey(row.id);
        message.success(intl.formatMessage({ id: 'common.message.success' }));
        fetchData();
      },
      onCancel() {
        console.log('Cancel');
      }
    });
  };

  const handleDeleteBatch = () => {
    Modal.confirm({
      title: '',
      content: intl.formatMessage(
        { id: 'common.delete.confirm' },
        { type: intl.formatMessage({ id: 'apikeys.table.apikeys' }) }
      ),
      async onOk() {
        await handleBatchRequest(rowSelection.selectedRowKeys, deleteApisKey);
        message.success(intl.formatMessage({ id: 'common.message.success' }));
        fetchData();
      },
      onCancel() {
        console.log('Cancel');
      }
    });
  };

  const renderSecrectKey = (text: string, record: ListItem) => {
    const { value } = record;

    return (
      <Space direction="vertical">
        <span>{text}</span>
        {value && (
          <span>
            <Tag color="error" style={{ padding: '10px 12px' }}>
              {intl.formatMessage({ id: 'apikeys.table.save.tips' })}
            </Tag>
            <span className="flex-center">
              <Tooltip
                title={value}
              >{`${value?.slice(0, 8)}...${value?.slice(-8, -1)}`}</Tooltip>
              <CopyButton text={value}></CopyButton>
            </span>
          </span>
        )}
      </Space>
    );
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
                onChange={handleNameChange}
              ></Input>
              <Button
                type="text"
                style={{ color: 'var(--ant-color-primary)' }}
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
            hideOnSinglePage: true,
            onShowSizeChange: handleShowSizeChange,
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
              return dayjs(text).format('YYYY-MM-DD HH:mm:ss');
            }}
          />
          <Column
            title={intl.formatMessage({ id: 'common.table.createTime' })}
            dataIndex="created_at"
            key="createTime"
            defaultSortOrder="descend"
            sortOrder={sortOrder}
            showSorterTooltip={false}
            sorter={true}
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
    </>
  );
};

export default Models;
