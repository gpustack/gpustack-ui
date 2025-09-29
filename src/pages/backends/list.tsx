import DeleteModal from '@/components/delete-modal';
import { FilterBar } from '@/components/page-tools';
import { PageActionType } from '@/config/types';
import useTableFetch from '@/hooks/use-table-fetch';
import { PageContainer } from '@ant-design/pro-components';
import { useIntl } from '@umijs/max';
import _ from 'lodash';
import { useState } from 'react';
import {
  createBackend,
  createBackendFromYAML,
  deleteBackend,
  INFERENCE_BACKEND_API,
  queryBackendsList,
  updateBackend,
  updateBackendFromYAML
} from './apis';
import AddModal from './components/add-modal';
import BackendCardList from './components/backend-list';
import { json2Yaml, yaml2Json } from './config';
import { FormData, ListItem } from './config/types';
import useExportYAML from './hooks/use-export-yaml';

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
    contentForDelete: 'backends.title',
    defaultQueryParams: {
      perPage: 100
    }
  });
  const { exportYAML } = useExportYAML();
  const [openModalStatus, setOpenModalStatus] = useState<{
    open: boolean;
    action: PageActionType;
    currentData?: Partial<ListItem>;
  }>({ open: false, action: 'create' });

  // build_in_version_configs is read-only, but needs to be included when updating
  const handleOnSubmit = async (values: FormData) => {
    try {
      if (openModalStatus.action === 'create') {
        await createBackend({ data: values });
      } else {
        await updateBackend(openModalStatus.currentData!.id!, {
          data: {
            build_in_version_configs:
              openModalStatus.currentData?.build_in_version_configs,
            ..._.omit(values, ['build_in_version_configs'])
          }
        });
      }
      setOpenModalStatus({
        open: false,
        action: 'create',
        currentData: undefined
      });
      handleSearch();
    } catch (error) {}
  };

  // build_in_version_configs needs to be included when updating from YAML, but not allowed to be changed
  const handleOnSubmitYaml = async (values: { content: string }) => {
    try {
      if (openModalStatus.action === 'create') {
        await createBackendFromYAML({ data: values });
      } else {
        const jsonData = yaml2Json(values.content);
        const yamlContent = json2Yaml({
          backend_name: openModalStatus.currentData?.backend_name,
          default_version: openModalStatus.currentData?.default_version,
          build_in_version_configs:
            openModalStatus.currentData?.build_in_version_configs,
          ...jsonData
        });
        await updateBackendFromYAML(openModalStatus.currentData!.id!, {
          data: {
            content: yamlContent
          }
        });
      }
      setOpenModalStatus({
        open: false,
        action: 'create',
        currentData: undefined
      });
      handleSearch();
    } catch (error) {}
  };

  const handleAddBackend = () => {
    setOpenModalStatus({
      open: true,
      action: 'create'
    });
  };

  const handleOnSelect = (item: any) => {
    console.log('selected item:', item);
    if (item.action === 'edit') {
      setOpenModalStatus({
        open: true,
        action: 'edit',
        currentData: item.data
      });
    } else if (item.action === 'delete') {
      handleDelete(item.data, {
        name: item.data.backend_name
      });
    } else if (item.action === 'export') {
      // Export YAML action
      console.log('Export YAML for:', item.data);
      exportYAML(item.data);
    }
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
        dataList={dataSource.dataList}
        loading={dataSource.loading}
        activeId={false}
        isFirst={!dataSource.loadend}
        onSelect={handleOnSelect}
      ></BackendCardList>
      <AddModal
        action={openModalStatus.action}
        onClose={() => setOpenModalStatus({ open: false, action: 'create' })}
        onSubmit={handleOnSubmit}
        onSubmitYaml={handleOnSubmitYaml}
        currentData={openModalStatus.currentData as ListItem}
        open={openModalStatus.open}
        title={
          openModalStatus.action === 'create'
            ? 'Create Backend'
            : 'Edit Backend'
        }
      ></AddModal>
      <DeleteModal ref={modalRef}></DeleteModal>
    </PageContainer>
  );
};

export default BackendList;
