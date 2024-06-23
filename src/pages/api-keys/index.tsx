import CopyButton from '@/components/copy-button';
import PageTools from '@/components/page-tools';
import { PageAction } from '@/config';
import type { PageActionType } from '@/config/types';
import useTableRowSelection from '@/hooks/use-table-row-selection';
import useTableSort from '@/hooks/use-table-sort';
import { handleBatchRequest } from '@/utils';
import { DeleteOutlined, PlusOutlined, SyncOutlined } from '@ant-design/icons';
import { PageContainer } from '@ant-design/pro-components';
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
import { createApisKey, deleteApisKey, queryApisKeysList } from './apis';
import AddAPIKeyModal from './components/add-apikey';
import { expirationOptions } from './config';
import { FormData, ListItem } from './config/types';

const { Column } = Table;

const list = [
  {
    key: '1',
    name: 'local',
    secretKey: `auk_uzem...owsa`,
    lastusedTime: '2024-05-22 12:20:10',
    createTime: '2024-05-20 12:13:25'
  },
  {
    key: '2',
    name: 'dev',
    secretKey: `auk_uzem...okwa`,
    lastusedTime: '2024-05-19 13:30:22',
    createTime: '2024-05-18 10:28:32'
  },
  {
    key: '3',
    name: 'prod',
    secretKey: `auk_uzem...uuds`,
    lastusedTime: '2024-05-18 10:28:32',
    createTime: '2024-05-17 08:21:09'
  },
  {
    key: '4',
    name: 'test',
    secretKey: `auk_uzem...uksa`,
    lastusedTime: '2024-05-18 10:28:32',
    createTime: '2024-05-16 13:33:23'
  }
];

const Models: React.FC = () => {
  const rowSelection = useTableRowSelection();
  const { sortOrder, setSortOrder } = useTableSort({
    defaultSortOrder: 'descend'
  });
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

  const getExpireValue = (val: number | null) => {
    const expires_in = val;
    if (expires_in === -1) {
      return 0;
    }
    const selected = expirationOptions.find(
      (item) => expires_in === item.value
    );

    const d1 = dayjs().add(
      selected?.value as number,
      `${selected?.type}` as never
    );
    const d2 = dayjs();
    const res = d1.diff(d2, 'second');
    return res;
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
    setTitle('Add API Key');
  };

  const handleModalOk = async (data: FormData) => {
    console.log('handleModalOk');

    try {
      const params = {
        ...data,
        expires_in: getExpireValue(data.expires_in)
      };
      const res = await createApisKey({ data: params });
      setOpenAddModal(false);
      message.success('successfully!');
      setDataSource([res, ...dataSource]);
      setTotal(total + 1);
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
      content: 'Are you sure you want to delete the selected keys?',
      async onOk() {
        console.log('OK');
        await deleteApisKey(row.id);
        message.success('successfully!');
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
      content: 'Are you sure you want to delete the selected keys?',
      async onOk() {
        await handleBatchRequest(rowSelection.selectedRowKeys, deleteApisKey);
        message.success('successfully!');
        fetchData();
      },
      onCancel() {
        console.log('Cancel');
      }
    });
  };

  const handleEditUser = () => {
    setOpenAddModal(true);
    setAction(PageAction.EDIT);
    setTitle('Edit User');
  };

  const renderSecrectKey = (text: string, record: ListItem) => {
    const { value } = record;

    return (
      <Space direction="vertical">
        <span>{text}</span>
        {value && (
          <span>
            <Tag color="error" style={{ padding: '10px 12px' }}>
              确保立即复制您的个人访问密钥。您将无法再次看到它！
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
          title: 'API Keys'
        }}
        extra={[]}
      >
        <PageTools
          marginBottom={22}
          left={
            <Space>
              <Input
                placeholder="名称查询"
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
                Add API Key
              </Button>
              <Button
                icon={<DeleteOutlined />}
                danger
                onClick={handleDeleteBatch}
                disabled={!rowSelection.selectedRowKeys.length}
              >
                Delete
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
            title="Name"
            dataIndex="name"
            key="name"
            width={400}
            ellipsis={{
              showTitle: false
            }}
            render={renderSecrectKey}
          />

          <Column
            title="Create Time"
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
            title="Expiration"
            dataIndex="expires_at"
            key="expiration"
            render={(text, record) => {
              return dayjs(text).format('YYYY-MM-DD HH:mm:ss');
            }}
          />
          <Column
            title="Operation"
            key="operation"
            render={(text, record: ListItem) => {
              return (
                <Space size={20}>
                  <Tooltip title="删除">
                    <Button
                      onClick={() => handleDelete(record)}
                      size="small"
                      type="primary"
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
        title={title}
        onCancel={handleModalCancel}
        onOk={handleModalOk}
      ></AddAPIKeyModal>
    </>
  );
};

export default Models;
