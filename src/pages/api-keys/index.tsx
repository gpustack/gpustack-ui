import PageTools from '@/components/page-tools';
import { PageAction } from '@/config';
import type { PageActionType } from '@/config/types';
import useTableRowSelection from '@/hooks/use-table-row-selection';
import useTableSort from '@/hooks/use-table-sort';
import {
  DeleteOutlined,
  EditOutlined,
  PlusOutlined,
  SyncOutlined
} from '@ant-design/icons';
import { PageContainer } from '@ant-design/pro-components';
import { Button, Input, Modal, Space, Table, Tooltip, message } from 'antd';
import { useState } from 'react';
import AddAPIKeyModal from './components/add-apikey';
const { Column } = Table;

const dataSource = [
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
  const [total, setTotal] = useState(0);
  const [openAddModal, setOpenAddModal] = useState(false);
  const [loading, setLoading] = useState(false);
  const [action, setAction] = useState<PageActionType>(PageAction.CREATE);
  const [title, setTitle] = useState<string>('');
  const [queryParams, setQueryParams] = useState({
    current: 1,
    pageSize: 10,
    name: ''
  });
  const handleShowSizeChange = (current: number, size: number) => {
    console.log(current, size);
  };

  const handlePageChange = (page: number, pageSize: number | undefined) => {
    console.log(page, pageSize);
  };

  const handleTableChange = (pagination: any, filters: any, sorter: any) => {
    console.log('handleTableChange=======', pagination, filters, sorter);
    setSortOrder(sorter.order);
  };

  const fetchData = async () => {
    console.log('fetchData');
  };
  const handleSearch = (e: any) => {
    fetchData();
  };

  const handleNameChange = (e: any) => {
    setQueryParams({
      ...queryParams,
      name: e.target.value
    });
  };

  const handleAddUser = () => {
    setOpenAddModal(true);
    setAction(PageAction.CREATE);
    setTitle('Add API Key');
  };

  const handleClickMenu = (e: any) => {
    console.log('click', e);
  };

  const handleModalOk = () => {
    console.log('handleModalOk');
    setOpenAddModal(false);
  };

  const handleModalCancel = () => {
    console.log('handleModalCancel');
    setOpenAddModal(false);
  };

  const handleDelete = () => {
    Modal.confirm({
      title: '',
      content: 'Are you sure you want to delete the selected keys?',
      onOk() {
        console.log('OK');
        message.success('successfully!');
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
                placeholder="按名称查询"
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
                onClick={handleDelete}
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
          onChange={handleTableChange}
          pagination={{
            showSizeChanger: true,
            pageSize: 10,
            current: 2,
            total: total,
            hideOnSinglePage: true,
            onShowSizeChange: handleShowSizeChange,
            onChange: handlePageChange
          }}
        >
          <Column title="Name" dataIndex="name" key="name" width={400} />
          <Column title="Secret Key" dataIndex="secretKey" key="secretKey" />
          <Column
            title="Create Time"
            dataIndex="createTime"
            key="createTime"
            defaultSortOrder="descend"
            sortOrder={sortOrder}
            showSorterTooltip={false}
            sorter={true}
          />
          <Column
            title="Last Used"
            dataIndex="lastusedTime"
            key="lastusedTime"
          />
          <Column
            title="Operation"
            key="operation"
            render={(text, record) => {
              return (
                <Space size={20}>
                  <Tooltip title="编辑">
                    <Button
                      size="small"
                      type="primary"
                      onClick={handleEditUser}
                      icon={<EditOutlined></EditOutlined>}
                    ></Button>
                  </Tooltip>
                  <Tooltip title="删除">
                    <Button
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
