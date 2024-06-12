import PageTools from '@/components/page-tools';
import SealTable from '@/components/seal-table';
import SealColumn from '@/components/seal-table/components/seal-column';
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
import dayjs from 'dayjs';
import _ from 'lodash';
import { useEffect, useState } from 'react';
import { createModel, deleteModel, queryModelsList } from './apis';
import AddModal from './components/add-modal';
import { FormData, ListItem } from './config/types';
const { Column } = Table;

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
  const [dataSource, setDataSource] = useState<ListItem[]>([]);
  const [queryParams, setQueryParams] = useState({
    page: 1,
    perPage: 10,
    query: ''
  });

  const fetchData = async () => {
    setLoading(true);
    try {
      const params = {
        ..._.pickBy(queryParams, (val: any) => !!val)
      };
      const res = await queryModelsList(params);
      console.log('res=======', res);
      setDataSource(res.items);
      setTotal(res.pagination.total);
    } catch (error) {
      console.log('error', error);
    } finally {
      setLoading(false);
    }
  };
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

  const handleSearch = (e: any) => {
    fetchData();
  };

  const handleNameChange = (e: any) => {
    setQueryParams({
      ...queryParams,
      query: e.target.value
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

  const handleModalOk = async (data: FormData) => {
    console.log('handleModalOk', data);
    await createModel({ data });
    setOpenAddModal(false);
    message.success('successfully!');
  };

  const handleModalCancel = () => {
    console.log('handleModalCancel');
    setOpenAddModal(false);
  };
  const handleDelete = async (row: any) => {
    Modal.confirm({
      title: '',
      content: 'Are you sure you want to delete the selected models?',
      async onOk() {
        await deleteModel(row.id);
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

  // request data

  useEffect(() => {
    fetchData();
  }, [queryParams]);

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
                allowClear
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
                  onClick={handleDeleteBatch}
                  disabled={!rowSelection.selectedRowKeys.length}
                >
                  Delete
                </Button>
              </Access>
            </Space>
          }
        ></PageTools>
        <SealTable
          dataSource={dataSource}
          rowSelection={rowSelection}
          loading={loading}
          rowKey="id"
          expandable={true}
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
          <SealColumn
            title="Model Name"
            dataIndex="name"
            key="name"
            width={400}
            span={8}
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
          <SealColumn
            span={8}
            title="Create Time"
            dataIndex="created_at"
            key="createTime"
            defaultSortOrder="descend"
            sortOrder={sortOrder}
            showSorterTooltip={false}
            sorter={true}
            render={(val, row) => {
              return dayjs(val).format('YYYY-MM-DD HH:mm:ss');
            }}
          />
          <SealColumn
            span={8}
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
                      onClick={() => handleDelete(record)}
                      icon={<DeleteOutlined></DeleteOutlined>}
                    ></Button>
                  </Tooltip>
                </Space>
              ) : null;
            }}
          />
        </SealTable>
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
