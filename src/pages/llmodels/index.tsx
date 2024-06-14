import PageTools from '@/components/page-tools';
import SealTable from '@/components/seal-table';
import RowChildren from '@/components/seal-table/components/row-children';
import SealColumn from '@/components/seal-table/components/seal-column';
import StatusTag from '@/components/status-tag';
import { PageAction } from '@/config';
import type { PageActionType } from '@/config/types';
import useTableRowSelection from '@/hooks/use-table-row-selection';
import useTableSort from '@/hooks/use-table-sort';
import {
  DeleteOutlined,
  FieldTimeOutlined,
  PlusOutlined,
  SyncOutlined,
  WechatWorkOutlined
} from '@ant-design/icons';
import { PageContainer } from '@ant-design/pro-components';
import { Access, useAccess, useIntl, useNavigate } from '@umijs/max';
import {
  App,
  Button,
  Col,
  Input,
  Modal,
  Progress,
  Row,
  Space,
  Tooltip,
  message
} from 'antd';
import dayjs from 'dayjs';
import _ from 'lodash';
import { useEffect, useState } from 'react';
import {
  createModel,
  createModelInstance,
  deleteModel,
  deleteModelInstance,
  queryModelInstanceLogs,
  queryModelInstancesList,
  queryModelsList
} from './apis';
import AddModal from './components/add-modal';
import ViewLogsModal from './components/view-logs-modal';
import { status } from './config';
import { FormData, ListItem, ModelInstanceListItem } from './config/types';

const Models: React.FC = () => {
  const { modal } = App.useApp();
  const access = useAccess();
  const intl = useIntl();
  const navigate = useNavigate();
  const rowSelection = useTableRowSelection();
  const { sortOrder, setSortOrder } = useTableSort({
    defaultSortOrder: 'descend'
  });
  const [logContent, setLogContent] = useState('');
  const [openLogModal, setOpenLogModal] = useState(false);
  const [hoverChildIndex, setHoverChildIndex] = useState<string | number>(-1);
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

  const handleLogModalCancel = () => {
    setOpenLogModal(false);
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
    navigate(`/playground?model=${row.name}`);
  };

  const handleDeployInstance = async (row: any) => {
    try {
      const data = {
        model_id: row.id,
        model_name: row.name,
        huggingface_repo_id: row.huggingface_repo_id,
        huggingface_filename: row.huggingface_filename,
        source: row.source
      };
      await createModelInstance({ data });
      message.success('successfully!');
    } catch (error) {}
  };

  const handleViewLogs = async (row: any) => {
    try {
      const data = await queryModelInstanceLogs(row.id);
      setLogContent(data);
      setOpenLogModal(true);
    } catch (error) {}
  };
  const handleDeleteInstace = (row: any) => {
    Modal.confirm({
      title: '',
      content: 'Are you sure you want to delete the instance?',
      async onOk() {
        console.log('OK');
        await deleteModelInstance(row.id);
        message.success('successfully!');
        fetchData();
      },
      onCancel() {
        console.log('Cancel');
      }
    });
  };

  const handleOnMouseEnter = (id: number, index: number) => {
    setHoverChildIndex(`${id}-${index}`);
  };

  const handleOnMouseLeave = () => {
    setHoverChildIndex(-1);
  };

  const getModelInstances = async (row: any) => {
    const params = {
      id: row.id,
      page: 1,
      perPage: 100
    };
    const data = await queryModelInstancesList(params);
    return data.items || [];
  };

  const renderChildren = (list: any) => {
    return (
      <Space size={16} direction="vertical" style={{ width: '100%' }}>
        {_.map(list, (item: ModelInstanceListItem, index: number) => {
          return (
            <div
              key={`${item.id}`}
              onMouseEnter={() => handleOnMouseEnter(item.id, index)}
              onMouseLeave={handleOnMouseLeave}
            >
              <RowChildren>
                <Row style={{ width: '100%' }} align="middle">
                  <Col span={4}>
                    {item.node_ip}:{item.port}
                  </Col>
                  <Col span={5}>
                    <span>{item.huggingface_repo_id}</span>
                  </Col>
                  <Col span={4}>
                    {dayjs(item.updated_at).format('YYYY-MM-DD HH:mm:ss')}
                  </Col>
                  <Col span={4}>
                    {item.state && (
                      <StatusTag
                        download={
                          item.download_progress !== 100
                            ? { percent: item.download_progress }
                            : undefined
                        }
                        statusValue={{
                          status: status[item.state] as any,
                          text: item.state
                        }}
                      ></StatusTag>
                    )}
                  </Col>
                  <Col span={7}>
                    {hoverChildIndex === `${item.id}-${index}` && (
                      <Space size={20}>
                        <Tooltip title="Delete">
                          <Button
                            size="small"
                            danger
                            onClick={() => handleDeleteInstace(item)}
                            icon={<DeleteOutlined></DeleteOutlined>}
                          ></Button>
                        </Tooltip>
                        <Tooltip title="View Logs">
                          <Button
                            size="small"
                            onClick={() => handleViewLogs(item)}
                            icon={<FieldTimeOutlined />}
                          ></Button>
                        </Tooltip>
                      </Space>
                    )}
                  </Col>
                </Row>
              </RowChildren>
            </div>
          );
        })}
      </Space>
    );
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
          loadChildren={getModelInstances}
          renderChildren={renderChildren}
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
                <Space size={20}>
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
      <ViewLogsModal
        title="View Logs"
        open={openLogModal}
        onCancel={handleLogModalCancel}
      ></ViewLogsModal>
    </>
  );
};

export default Models;
