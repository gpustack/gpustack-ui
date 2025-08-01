import AutoTooltip from '@/components/auto-tooltip';
import DeleteModal from '@/components/delete-modal';
import DropDownActions from '@/components/drop-down-actions';
import DropdownButtons from '@/components/drop-down-buttons';
import IconFont from '@/components/icon-font';
import PageTools from '@/components/page-tools';
import { PageAction } from '@/config';
import type { PageActionType } from '@/config/types';
import useTableFetch from '@/hooks/use-table-fetch';
import {
  DeleteOutlined,
  DownOutlined,
  EditOutlined,
  KubernetesOutlined,
  SyncOutlined
} from '@ant-design/icons';
import { PageContainer } from '@ant-design/pro-components';
import { useIntl } from '@umijs/max';
import {
  Button,
  ConfigProvider,
  Empty,
  Input,
  Space,
  Table,
  message
} from 'antd';
import dayjs from 'dayjs';
import { useState } from 'react';
import {
  createCredential,
  deleteCredential,
  queryCredentialList,
  updateCredential
} from './apis';
import AddModal from './components/add-credential';
import { FormData, ListItem } from './config/types';
const { Column } = Table;

const ActionList = [
  {
    key: 'edit',
    label: 'common.button.edit',
    icon: <EditOutlined></EditOutlined>
  },
  {
    key: 'delete',
    props: {
      danger: true
    },
    label: 'common.button.delete',
    icon: <DeleteOutlined></DeleteOutlined>
  }
];

const addActions = [
  {
    label: 'Digital Ocean',
    locale: false,
    value: 'digital_ocean',
    key: 'digital_ocean',
    icon: <IconFont type="icon-digitalocean" />
  },
  {
    label: 'Kubernetes',
    locale: false,
    value: 'kubernetes',
    key: 'kubernetes',
    icon: <KubernetesOutlined className="size-16" />
  }
];

const Credentials: React.FC = () => {
  const {
    dataSource,
    rowSelection,
    queryParams,
    sortOrder,
    modalRef,
    handleDelete,
    handleDeleteBatch,
    fetchData,
    handlePageChange,
    handleTableChange,
    handleSearch,
    handleNameChange
  } = useTableFetch<ListItem>({
    fetchAPI: queryCredentialList,
    deleteAPI: deleteCredential,
    contentForDelete: 'users.table.user'
  });

  const intl = useIntl();
  const [openModalStatus, setOpenModalStatus] = useState<{
    provider: string;
    open: boolean;
    action: PageActionType;
    title: string;
  }>({
    provider: '',
    open: false,
    action: PageAction.CREATE,
    title: ''
  });
  const [currentData, setCurrentData] = useState<ListItem | undefined>(
    undefined
  );

  const handleAddCredential = (value: string) => {
    const title =
      value === 'digital_ocean'
        ? 'Add Digital Ocean Credential'
        : 'Add Kubernetes Credential';
    setOpenModalStatus({
      provider: value,
      open: true,
      action: PageAction.CREATE,
      title: title
    });
  };

  const handleModalOk = async (data: FormData) => {
    const params = {
      ...data
    };
    try {
      if (openModalStatus.action === PageAction.EDIT) {
        await updateCredential({
          data: {
            ...params,
            id: currentData?.id
          }
        });
      } else {
        await createCredential({ data: params });
      }
      fetchData();
      setOpenModalStatus({ ...openModalStatus, open: false });
      message.success(intl.formatMessage({ id: 'common.message.success' }));
    } catch (error) {
      setOpenModalStatus({ ...openModalStatus, open: false });
    }
  };

  const handleModalCancel = () => {
    console.log('handleModalCancel');
    setOpenModalStatus({ ...openModalStatus, open: false });
  };

  const handleEditUser = (row: ListItem) => {
    setCurrentData(row);
    setOpenModalStatus({
      provider: row.provider,
      open: true,
      action: PageAction.EDIT,
      title: `Edit ${row.provider} Credential`
    });
  };

  const handleSelect = (val: any, row: ListItem) => {
    if (val === 'edit') {
      handleEditUser(row);
    } else if (val === 'delete') {
      handleDelete({ ...row, name: row.name });
    }
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

  const handleClickDropdown = (e: any) => {
    const value = e.key;
    handleAddCredential(value);
  };

  return (
    <>
      <PageContainer
        ghost
        header={{
          title: intl.formatMessage({
            id: 'menu.clusterManagement.credentials'
          }),
          style: {
            paddingInline: 'var(--layout-content-header-inlinepadding)'
          },
          breadcrumb: {}
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
              <DropDownActions
                menu={{
                  items: addActions,
                  onClick: handleClickDropdown
                }}
                trigger={['hover']}
                placement="bottomRight"
              >
                <Button
                  icon={<DownOutlined></DownOutlined>}
                  type="primary"
                  iconPosition="end"
                >
                  Add Credential
                </Button>
              </DropDownActions>
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
              title="Name"
              dataIndex="name"
              key="name"
              ellipsis={{
                showTitle: false
              }}
              render={(text, record) => {
                return (
                  <AutoTooltip ghost minWidth={20}>
                    {text}
                  </AutoTooltip>
                );
              }}
            />
            <Column
              title="Provider"
              dataIndex="provider"
              key="provider"
              ellipsis={{
                showTitle: false
              }}
              render={(text, record) => {
                return (
                  <AutoTooltip ghost minWidth={20}>
                    {text}
                  </AutoTooltip>
                );
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
                  <AutoTooltip ghost minWidth={20}>
                    {dayjs(text).format('YYYY-MM-DD HH:mm:ss')}
                  </AutoTooltip>
                );
              }}
            />
            <Column
              title="Description"
              dataIndex="description"
              key="description"
              ellipsis={{
                showTitle: false
              }}
              render={(text, record) => {
                return (
                  <AutoTooltip ghost minWidth={20}>
                    {text}
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
                  <DropdownButtons
                    items={ActionList}
                    onSelect={(val) => handleSelect(val, record)}
                  ></DropdownButtons>
                );
              }}
            />
          </Table>
        </ConfigProvider>
      </PageContainer>
      <AddModal
        provider={openModalStatus.provider}
        open={openModalStatus.open}
        action={openModalStatus.action}
        title={openModalStatus.title}
        data={currentData}
        onCancel={handleModalCancel}
        onOk={handleModalOk}
      ></AddModal>
      <DeleteModal ref={modalRef}></DeleteModal>
    </>
  );
};

export default Credentials;
