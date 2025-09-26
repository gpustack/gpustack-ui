import { FilterBar } from '@/components/page-tools';
import { PageActionType } from '@/config/types';
import useTableFetch from '@/hooks/use-table-fetch';
import { PageContainer } from '@ant-design/pro-components';
import { useIntl } from '@umijs/max';
import { useState } from 'react';
import {
  deleteBackend,
  INFERENCE_BACKEND_API,
  queryBackendsList
} from './apis';
import AddModal from './components/add-modal';
import BackendCardList from './components/backend-list';
import dataList from './config/test';
import { FormData, ListItem } from './config/types';

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
  const [openModalStatus, setOpenModalStatus] = useState<{
    open: boolean;
    action: PageActionType;
    currentData?: Partial<FormData>;
  }>({ open: false, action: 'create' });

  const handleOnSubmit = (values: FormData) => {
    console.log('yaml content:', values);
    setOpenModalStatus({
      open: false,
      action: 'create',
      currentData: undefined
    });
  };

  const handleAddBackend = () => {
    setOpenModalStatus({
      open: true,
      action: 'create'
    });
  };

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
        inputHolder={intl.formatMessage({ id: 'common.filter.name' })}
        buttonText={'Add Backend'}
        handleDeleteByBatch={handleDeleteBatch}
        handleClickPrimary={handleAddBackend}
        handleSearch={handleSearch}
        handleInputChange={handleNameChange}
        rowSelection={rowSelection}
        showSelect={false}
      ></FilterBar>

      <BackendCardList
        dataList={dataList}
        loading={dataSource.loading}
        activeId={false}
        isFirst={!dataSource.loadend}
      ></BackendCardList>
      <AddModal
        action={openModalStatus.action}
        onClose={() => setOpenModalStatus({ open: false, action: 'create' })}
        onSubmit={handleOnSubmit}
        currentData={openModalStatus.currentData}
        open={openModalStatus.open}
        title={
          openModalStatus.action === 'create'
            ? 'Create Backend'
            : 'Edit Backend'
        }
      ></AddModal>
    </PageContainer>
  );
};

export default BackendList;
