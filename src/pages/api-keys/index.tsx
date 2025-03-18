import AutoTooltip from '@/components/auto-tooltip';
import DeleteModal from '@/components/delete-modal';
import PageTools from '@/components/page-tools';
import { PageAction } from '@/config';
import HotKeys from '@/config/hotkeys';
import type { PageActionType } from '@/config/types';
import useTableFetch from '@/hooks/use-table-fetch';
import { handleBatchRequest } from '@/utils';
import { DeleteOutlined, PlusOutlined, SyncOutlined } from '@ant-design/icons';
import { PageContainer } from '@ant-design/pro-components';
import { useIntl } from '@umijs/max';
import {
  Button,
  ConfigProvider,
  Empty,
  Input,
  Space,
  Table,
  Tooltip
} from 'antd';
import dayjs from 'dayjs';
import { useRef, useState } from 'react';
import { useHotkeys } from 'react-hotkeys-hook';
import { deleteApisKey, queryApisKeysList } from './apis';
import AddAPIKeyModal from './components/add-apikey';
import { ListItem } from './config/types';

const { Column } = Table;

const APIKeys: React.FC = () => {
  const {
    dataSource,
    rowSelection,
    queryParams,
    sortOrder,
    fetchData,
    handlePageChange,
    handleTableChange,
    handleSearch,
    handleNameChange
  } = useTableFetch<ListItem>({
    fetchAPI: queryApisKeysList
  });

  const intl = useIntl();
  const modalRef = useRef<any>(null);

  const [openAddModal, setOpenAddModal] = useState(false);
  const [action, setAction] = useState<PageActionType>(PageAction.CREATE);

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
      operation: 'common.delete.single.confirm',
      name: row.name,
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
      operation: 'common.delete.confirm',
      selection: true,
      async onOk() {
        await handleBatchRequest(rowSelection.selectedRowKeys, deleteApisKey);
        rowSelection.clearSelections();
        fetchData();
      }
    });
  };

  const renderEmpty = (type?: string) => {
    if (type !== 'Table') return;
    if (
      !dataSource.loading &&
      dataSource.loadend &&
      !dataSource.dataList.length
    ) {
      return <Empty image={Empty.PRESENTED_IMAGE_SIMPLE}></Empty>;
    }
    return <div></div>;
  };

  useHotkeys(
    HotKeys.CREATE,
    () => {
      handleAddUser();
    },
    {
      enabled: !openAddModal
    }
  );

  return (
    <>
      <PageContainer
        ghost
        header={{
          title: intl.formatMessage({ id: 'apikeys.title' }),
          style: {
            paddingInline: 'var(--layout-content-header-inlinepadding)'
          }
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
                <span>
                  {intl?.formatMessage?.({ id: 'common.button.delete' })}
                  {rowSelection.selectedRowKeys.length > 0 && (
                    <span>({rowSelection.selectedRowKeys?.length})</span>
                  )}
                </span>
              </Button>
            </Space>
          }
        ></PageTools>
        <ConfigProvider renderEmpty={renderEmpty}>
          <Table
            dataSource={dataSource.dataList}
            rowSelection={rowSelection}
            loading={dataSource.loading}
            rowKey="id"
            onChange={handleTableChange}
            pagination={{
              showSizeChanger: true,
              pageSize: queryParams.perPage,
              current: queryParams.page,
              total: dataSource.total,
              hideOnSinglePage: queryParams.perPage === 10,
              onChange: handlePageChange
            }}
          >
            <Column
              title={intl.formatMessage({ id: 'common.table.name' })}
              dataIndex="name"
              key="name"
              ellipsis={{
                showTitle: false
              }}
              render={(text, record) => {
                return (
                  <AutoTooltip ghost style={{ maxWidth: 400 }}>
                    {text}
                  </AutoTooltip>
                );
              }}
            />

            <Column
              title={intl.formatMessage({ id: 'apikeys.form.expiretime' })}
              dataIndex="expires_at"
              key="expiration"
              ellipsis={{
                showTitle: false
              }}
              render={(text, record) => {
                return (
                  <AutoTooltip ghost>
                    {text
                      ? dayjs(text).format('YYYY-MM-DD HH:mm:ss')
                      : intl.formatMessage({
                          id: 'apikeys.form.expiration.never'
                        })}
                  </AutoTooltip>
                );
              }}
            />
            <Column
              title={intl.formatMessage({ id: 'common.table.description' })}
              dataIndex="description"
              key="description"
              ellipsis={{
                showTitle: false
              }}
              render={(text, record) => {
                return <AutoTooltip ghost>{text}</AutoTooltip>;
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
              ellipsis={{
                showTitle: false
              }}
              render={(text, record) => {
                return (
                  <AutoTooltip ghost>
                    {dayjs(text).format('YYYY-MM-DD HH:mm:ss')}
                  </AutoTooltip>
                );
              }}
            />
            <Column
              title={intl.formatMessage({ id: 'common.table.operation' })}
              key="operation"
              ellipsis={{
                showTitle: false
              }}
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
        </ConfigProvider>
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
