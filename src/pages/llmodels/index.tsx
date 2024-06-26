import PageTools from '@/components/page-tools';
import SealTable from '@/components/seal-table';
import RowChildren from '@/components/seal-table/components/row-children';
import SealColumn from '@/components/seal-table/components/seal-column';
import StatusTag from '@/components/status-tag';
import { PageAction } from '@/config';
import type { PageActionType } from '@/config/types';
import useSetChunkRequest, {
  createAxiosToken
} from '@/hooks/use-chunk-request';
import useTableRowSelection from '@/hooks/use-table-row-selection';
import useTableSort from '@/hooks/use-table-sort';
import useUpdateChunkedList from '@/hooks/use-update-chunk-list';
import { handleBatchRequest } from '@/utils';
import {
  DeleteOutlined,
  EditOutlined,
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
import { useEffect, useRef, useState } from 'react';
import {
  MODELS_API,
  createModel,
  createModelInstance,
  deleteModel,
  deleteModelInstance,
  queryModelInstanceLogs,
  queryModelInstancesList,
  queryModelsList,
  updateModel
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
  const { setChunkRequest } = useSetChunkRequest();
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
  const [currentData, setCurrentData] = useState<ListItem | undefined>(
    undefined
  );
  const timer = useRef<any>();
  let axiosToken = createAxiosToken();
  const [queryParams, setQueryParams] = useState({
    page: 1,
    perPage: 10,
    query: ''
  });
  // request data

  const { updateChunkedList } = useUpdateChunkedList(dataSource, {
    setDataList: setDataSource
  });

  const fetchData = async (polling?: boolean) => {
    axiosToken?.cancel?.();
    axiosToken = createAxiosToken();
    setLoading(!polling);
    try {
      const params = {
        ..._.pickBy(queryParams, (val: any) => !!val)
      };
      const res = await queryModelsList(params, {
        cancelToken: axiosToken.token
      });
      console.log('res=======', res);
      setDataSource(res.items);
      setTotal(res.pagination.total);
    } catch (error) {
      console.log('error', error);
    } finally {
      setLoading(false);
    }
  };

  // update data by polling
  const fetchDataByPolling = () => {
    clearInterval(timer.current);
    timer.current = setInterval(() => {
      fetchData(true);
    }, 5000);
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

  const handleFilter = () => {
    fetchData();
  };

  const updateHandler = (list: any) => {
    _.each(list, (data: any) => {
      updateChunkedList(data);
    });
    if (!dataSource.length) {
      handleFilter();
    }
  };

  const createModelsChunkRequest = () => {
    try {
      setChunkRequest({
        url: MODELS_API,
        params: {
          ..._.pickBy(
            _.omit(queryParams, ['page', 'perPage']),
            (val: any) => !!val
          )
        },
        handler: updateHandler
      });
    } catch (error) {
      // ignore
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

  const handleAddModal = () => {
    setOpenAddModal(true);
    setAction(PageAction.CREATE);
    setTitle(intl.formatMessage({ id: 'models.button.deploy' }));
  };

  const handleModalOk = async (data: FormData) => {
    try {
      if (action === PageAction.CREATE) {
        await createModel({ data });
      }
      if (action === PageAction.EDIT) {
        await updateModel({ data, id: currentData?.id as number });
      }
      setOpenAddModal(false);
      message.success(intl.formatMessage({ id: 'common.message.success' }));
    } catch (error) {}
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
      content: intl.formatMessage(
        { id: 'common.delete.confirm' },
        { type: intl.formatMessage({ id: 'models.table.models' }) }
      ),
      async onOk() {
        await deleteModel(row.id);
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
        { type: intl.formatMessage({ id: 'models.table.models' }) }
      ),
      async onOk() {
        await handleBatchRequest(rowSelection.selectedRowKeys, deleteModel);
        message.success(intl.formatMessage({ id: 'common.message.success' }));
        fetchData();
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
      message.success(intl.formatMessage({ id: 'common.message.success' }));
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
      content: intl.formatMessage(
        { id: 'common.delete.confirm' },
        { type: intl.formatMessage({ id: 'models.instances' }) }
      ),
      async onOk() {
        await deleteModelInstance(row.id);
        message.success(intl.formatMessage({ id: 'common.message.success' }));
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

  const handleEdit = (row: ListItem) => {
    setCurrentData(row);
    setOpenAddModal(true);
    setAction(PageAction.EDIT);
    setTitle(intl.formatMessage({ id: 'models.title.edit' }));
  };

  useEffect(() => {
    fetchData();
  }, [queryParams]);

  useEffect(() => {
    fetchDataByPolling();
    return () => {
      clearInterval(timer.current);
    };
  }, []);

  const renderChildren = (list: any) => {
    return (
      <Space size={16} direction="vertical" style={{ width: '100%' }}>
        {_.map(list, (item: ModelInstanceListItem, index: number) => {
          return (
            <div
              key={`${item.id}`}
              onMouseEnter={() => handleOnMouseEnter(item.id, index)}
              onMouseLeave={handleOnMouseLeave}
              style={{ borderRadius: 'var(--ant-table-header-border-radius)' }}
              className={
                item.download_progress !== 100 ? 'skeleton-loading' : ''
              }
            >
              <RowChildren>
                <Row style={{ width: '100%' }} align="middle">
                  <Col span={4}>
                    {item.worker_ip}:{item.port}
                  </Col>
                  <Col span={5}>
                    <span>{item.huggingface_filename}</span>
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
                        <Tooltip
                          title={intl.formatMessage({
                            id: 'common.button.delete'
                          })}
                        >
                          <Button
                            size="small"
                            danger
                            onClick={() => handleDeleteInstace(item)}
                            icon={<DeleteOutlined></DeleteOutlined>}
                          ></Button>
                        </Tooltip>
                        <Tooltip
                          title={intl.formatMessage({
                            id: 'common.button.viewlog'
                          })}
                        >
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

  return (
    <>
      <PageContainer
        ghost
        header={{
          title: intl.formatMessage({ id: 'models.title' })
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
                  {intl?.formatMessage?.({ id: 'common.button.delete' })}
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
          pollingChildren={true}
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
            title={intl.formatMessage({ id: 'models.table.name' })}
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
            title={intl.formatMessage({ id: 'common.table.createTime' })}
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
            title={intl.formatMessage({ id: 'common.table.operation' })}
            key="operation"
            render={(text, record) => {
              return !record.transition ? (
                <Space size={20}>
                  <Tooltip
                    title={intl.formatMessage({
                      id: 'common.button.edit'
                    })}
                  >
                    <Button
                      size="small"
                      type="primary"
                      onClick={() => handleEdit(record)}
                      icon={<EditOutlined></EditOutlined>}
                    ></Button>
                  </Tooltip>
                  <Tooltip
                    title={intl.formatMessage({
                      id: 'models.openinplayground'
                    })}
                  >
                    <Button
                      size="small"
                      type="primary"
                      onClick={() => handleOpenPlayGround(record)}
                      icon={<WechatWorkOutlined />}
                    ></Button>
                  </Tooltip>
                  <Tooltip
                    title={intl.formatMessage({ id: 'common.button.delete' })}
                  >
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
        data={currentData}
        onCancel={handleModalCancel}
        onOk={handleModalOk}
      ></AddModal>
      <ViewLogsModal
        title={intl.formatMessage({ id: 'common.button.viewlog' })}
        open={openLogModal}
        onCancel={handleLogModalCancel}
      ></ViewLogsModal>
    </>
  );
};

export default Models;
