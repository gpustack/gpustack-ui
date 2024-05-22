import PageTools from '@/components/page-tools';
import { PageAction } from '@/config';
import type { PageActionType } from '@/config/types';
import useTableRowSelection from '@/hooks/use-table-row-selection';
import useTableSort from '@/hooks/use-table-sort';
import {
  DeleteOutlined,
  PlusOutlined,
  SyncOutlined,
  WechatWorkOutlined
} from '@ant-design/icons';
import { PageContainer } from '@ant-design/pro-components';
import { useNavigate } from '@umijs/max';
import {
  Button,
  Input,
  Modal,
  Progress,
  Space,
  Table,
  Tooltip,
  message
} from 'antd';
import { useState } from 'react';
import AddModal from './components/add-modal';
const { Column } = Table;

const dataSource = [
  {
    key: '1',
    name: 'llama3:latest',
    createTime: '2021-09-01 12:00:00'
  },
  {
    key: '2',
    name: 'meta-llama/Meta-Llama-3-8B-nksrlsl-esLscs-1:latest',
    createTime: '2021-09-01 12:00:00'
  },
  {
    key: '3',
    name: 'apple/OpenELM-3B-Instructor',
    createTime: '2021-09-01 12:00:00'
  }
];

const Models: React.FC = () => {
  const navigate = useNavigate();
  const rowSelection = useTableRowSelection();
  const { sortOrder, setSortOrder } = useTableSort({
    defaultSortOrder: 'descend'
  });
  const [total, setTotal] = useState(100);
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

  const handleAddModal = () => {
    setOpenAddModal(true);
    setAction(PageAction.CREATE);
    setTitle('Import Module');
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
      content: 'Are you sure you want to delete the selected models?',
      onOk() {
        console.log('OK');
        message.success('successfully!');
      },
      onCancel() {
        console.log('Cancel');
      }
    });
  };

  const handleOpenPlayGround = (row: any) => {
    console.log('handleOpenPlayGround', row);
    navigate('/playground');
  };
  return (
    <>
      <PageContainer
        ghost
        header={{
          title: 'Models'
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
                onClick={handleAddModal}
              >
                Import Module
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
          <Column
            title="Model Name"
            dataIndex="name"
            key="name"
            width={400}
            render={(text, record) => {
              return (
                <>
                  <Tooltip>{text}</Tooltip>
                  <Progress
                    percent={30}
                    strokeColor="var(--ant-color-primary)"
                  />
                </>
              );
            }}
          />
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
            title="Operation"
            key="operation"
            render={(text, record) => {
              return (
                <Space>
                  <Tooltip title="Open in PlayGround">
                    <Button
                      size="small"
                      type="primary"
                      onClick={() => handleOpenPlayGround(record)}
                      icon={<WechatWorkOutlined />}
                    ></Button>
                  </Tooltip>
                  <Tooltip title="Delete">
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
      <AddModal
        open={openAddModal}
        action={action}
        title={title}
        onCancel={handleModalCancel}
        onOk={handleModalOk}
      ></AddModal>
    </>
  );
};

export default Models;
