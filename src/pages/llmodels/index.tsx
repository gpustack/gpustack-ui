import PageTools from '@/components/page-tools';
import { PageAction } from '@/config';
import type { PageActionType } from '@/config/types';
import useTableRowSelection from '@/hooks/use-table-row-selection';
import useTableSort from '@/hooks/use-table-sort';
import {
  DeleteOutlined,
  DownOutlined,
  PlusOutlined,
  RightOutlined,
  SyncOutlined,
  WechatWorkOutlined
} from '@ant-design/icons';
import { PageContainer } from '@ant-design/pro-components';
import { Access, useAccess, useIntl, useNavigate } from '@umijs/max';
import {
  App,
  Button,
  Input,
  Modal,
  Progress,
  Space,
  Table,
  Tooltip,
  message
} from 'antd';
import { StrictMode, useState } from 'react';
import AddModal from './components/add-modal';
const { Column } = Table;

const dataSource = [
  {
    key: '1',
    name: 'llama3:latest',
    progress: 30,
    transition: true,
    createTime: '2024-05-22 12:20:10'
  },
  {
    key: '2',
    name: 'openbmb/MiniCPM-Llama3-V-2_5',
    createTime: '2024-05-19 13:30:22'
  },
  {
    key: '3',
    name: 'openbmb/MiniCPM-Llama3-V-2_5',
    createTime: '2024-05-18 10:28:32'
  }
];

const Models: React.FC = () => {
  const { modal } = App.useApp();
  const access = useAccess();
  const intl = useIntl();
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
    setTitle('Deploy Model');
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
    <StrictMode>
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
                {intl?.formatMessage?.({ id: 'models.button.deploy' })}
              </Button>
              <Access accessible={access.canDelete}>
                <Button
                  icon={<DeleteOutlined />}
                  danger
                  onClick={handleDelete}
                  disabled={!rowSelection.selectedRowKeys.length}
                >
                  Delete
                </Button>
              </Access>
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
          expandable={{
            expandIcon: ({ expanded, onExpand, record }) => {
              return expanded ? (
                <DownOutlined onClick={(e) => onExpand(record, e)} />
              ) : (
                <RightOutlined onClick={(e) => onExpand(record, e)} />
              );
            },
            expandedRowRender: (record) => <p style={{ margin: 0 }}>list</p>,
            rowExpandable: (record) => record.name !== 'Not Expandable'
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
                  {record.progress && (
                    <Progress
                      percent={record.progress}
                      strokeColor="var(--ant-color-primary)"
                    />
                  )}
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
              return !record.transition ? (
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
              ) : null;
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
    </StrictMode>
  );
};

export default Models;
