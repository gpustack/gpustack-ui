import { FilterBar } from '@/components/page-tools';
import useTableFetch from '@/hooks/use-table-fetch';
import {
  DeleteOutlined,
  ImportOutlined,
  PlusOutlined
} from '@ant-design/icons';
import { PageContainer } from '@ant-design/pro-components';
import { useIntl } from '@umijs/max';
import { Button, Space } from 'antd';
import {
  deleteBackend,
  INFERENCE_BACKEND_API,
  queryBackendsList
} from './apis';
import BackendCardList from './components/backend-list';
import dataList from './config/test';
import { ListItem } from './config/types';

const BackendList = () => {
  const intl = useIntl();

  const {
    dataSource,
    rowSelection,
    queryParams,
    modalRef,
    fetchData,
    handleDelete,
    handleDeleteBatch,
    handlePageChange,
    handleTableChange,
    handleSearch,
    handleNameChange,
    handleQueryChange
  } = useTableFetch<ListItem>({
    fetchAPI: queryBackendsList,
    deleteAPI: deleteBackend,
    API: INFERENCE_BACKEND_API,
    watch: false,
    contentForDelete: 'resources.modelfiles.modelfile'
  });

  const handleClickDropdown = () => {};

  const handleDeleteByBatch = () => {};

  return (
    <PageContainer
      ghost
      header={{
        title: intl.formatMessage({ id: 'menu.models.backendsList' }),
        style: {
          paddingInline: 'var(--layout-content-header-inlinepadding)'
        },
        breadcrumb: {}
      }}
      extra={[]}
    >
      <FilterBar
        marginBottom={22}
        marginTop={30}
        width={{
          input: 300
        }}
        actionType="dropdown"
        inputHolder={intl.formatMessage({ id: 'common.filter.name' })}
        buttonText={intl.formatMessage({
          id: 'resources.modelfiles.download'
        })}
        handleDeleteByBatch={handleDeleteByBatch}
        handleClickPrimary={handleClickDropdown}
        handleSearch={handleSearch}
        handleInputChange={handleNameChange}
        rowSelection={rowSelection}
        showSelect={false}
        right={
          <Space size={20}>
            <Button type="primary" icon={<PlusOutlined />}>
              Add Backend
            </Button>
            <Button type="primary" icon={<ImportOutlined />}>
              Import backend from yaml
            </Button>
            <Button
              icon={<DeleteOutlined />}
              danger
              onClick={handleDeleteByBatch}
              disabled={!rowSelection?.selectedRowKeys?.length}
            >
              <span>
                {intl?.formatMessage?.({ id: 'common.button.delete' })}
                {rowSelection?.selectedRowKeys?.length > 0 && (
                  <span>({rowSelection?.selectedRowKeys?.length})</span>
                )}
              </span>
            </Button>
          </Space>
        }
      ></FilterBar>

      <BackendCardList
        dataList={dataList}
        loading={dataSource.loading}
        activeId={false}
        isFirst={!dataSource.loadend}
      ></BackendCardList>
    </PageContainer>
  );
};

export default BackendList;
