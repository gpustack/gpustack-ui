import DeleteModal from '@/components/delete-modal';
import IconFont from '@/components/icon-font';
import { FilterBar } from '@/components/page-tools';
import { PageAction } from '@/config';
import useTableFetch from '@/hooks/use-table-fetch';
import { useIntl } from '@umijs/max';
import useMemoizedFn from 'ahooks/lib/useMemoizedFn';
import _ from 'lodash';
import { useState } from 'react';
import { ScrollerContext } from '../_components/infinite-scroller/use-scroller-context';
import NoResult from '../_components/no-result';
import PageBox from '../_components/page-box';
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
import VersionInfoModal from './components/version-info-modal';
import { backendSourceOptions, json2Yaml, yaml2Json } from './config';
import { FormData, ListItem } from './config/types';
import useCreateBackend from './hooks/use-create-backend';
import useExportYAML from './hooks/use-export-yaml';
import useEnableBackend from './services/use-enable-backend';

const BackendList = () => {
  const intl = useIntl();

  const {
    dataSource,
    rowSelection,
    queryParams,
    modalRef,
    handleQueryChange,
    fetchData,
    handleDelete,
    handleSearch,
    handleNameChange
  } = useTableFetch<ListItem>({
    fetchAPI: queryBackendsList,
    deleteAPI: deleteBackend,
    API: INFERENCE_BACKEND_API,
    watch: false,
    isInfiniteScroll: true,
    contentForDelete: 'backends.title',
    defaultQueryParams: {
      perPage: 24
    }
  });
  const { exportYAML } = useExportYAML();
  const [openVersionInfoModal, setOpenVersionInfoModal] = useState<{
    open: boolean;
    currentData?: ListItem;
  }>({ open: false });
  const { handleEnableBackend } = useEnableBackend();
  const { openBackendModal, closeBackendModal, openBackendModalStatus } =
    useCreateBackend();

  // built_in_version_configs is read-only, but needs to be included when updating
  const handleOnSubmit = async (values: FormData) => {
    try {
      if (openBackendModalStatus.action === 'create') {
        await createBackend({ data: values });
      } else {
        const omitFields = openBackendModalStatus.currentData?.is_built_in
          ? ['built_in_version_configs', 'default_version']
          : ['built_in_version_configs'];

        await updateBackend(openBackendModalStatus.currentData!.id!, {
          data: {
            built_in_version_configs:
              openBackendModalStatus.currentData?.built_in_version_configs,
            ..._.omit(values, omitFields),
            health_check_path: values.health_check_path || null
          }
        });
      }
      closeBackendModal();
      handleSearch();
    } catch (error) {}
  };

  // built_in_version_configs needs to be included when updating from YAML, but not allowed to be changed
  const handleOnSubmitYaml = async (values: { content: string }) => {
    try {
      if (openBackendModalStatus.action === 'create') {
        await createBackendFromYAML({ data: values });
      } else {
        const jsonData = yaml2Json(values.content);
        const yamlContent = json2Yaml({
          backend_name: openBackendModalStatus.currentData?.backend_name,
          default_version: openBackendModalStatus.currentData?.default_version,
          built_in_version_configs:
            openBackendModalStatus.currentData?.built_in_version_configs,
          ...jsonData
        });
        await updateBackendFromYAML(openBackendModalStatus.currentData!.id!, {
          data: {
            content: yamlContent
          }
        });
      }
      closeBackendModal();
      handleSearch();
    } catch (error) {}
  };

  const handleFilterBySource = (value: string) => {
    handleQueryChange({
      backend_source: value,
      page: 1
    });
  };

  const handleAddBackend = () => {
    openBackendModal(PageAction.CREATE, '');
  };

  const handleOnSelect = async (item: any) => {
    if (item.action === 'edit') {
      openBackendModal(PageAction.EDIT, '', item.data);
    } else if (item.action === 'delete') {
      handleDelete(item.data, {
        name: item.data.backend_name
      });
    } else if (item.action === 'export') {
      const currentData = structuredClone(item.data);

      currentData.version_configs = _.mapValues(
        currentData.version_configs,
        (v: any) => {
          return _.omit(v, ['built_in_frameworks']);
        }
      );

      exportYAML(_.omit(currentData, ['id', 'created_at', 'updated_at']));
    } else if (item.action === 'view_versions') {
      setOpenVersionInfoModal({
        open: true,
        currentData: item.data
      });
    } else if (item.action === 'enable' || item.action === 'disable') {
      handleEnableBackend({
        id: item.data.id,
        data: {
          ...item.data,
          enabled: item.action === 'enable'
        }
      });
      // delay 200ms to refresh list
      await new Promise((resolve) => {
        setTimeout(resolve, 300);
      });
      handleSearch();
    }
  };

  const handleAddVersion = () => {
    setOpenVersionInfoModal({
      open: false,
      currentData: undefined
    });
    openBackendModal(PageAction.EDIT, '', openVersionInfoModal.currentData);
  };

  const loadMore = useMemoizedFn((nextPage: number) => {
    fetchData({
      query: {
        ...queryParams,
        page: nextPage
      },
      loadmore: true
    });
  });

  return (
    <PageBox>
      <FilterBar
        marginBottom={22}
        marginTop={30}
        widths={{
          input: 300
        }}
        inputHolder={intl.formatMessage({ id: 'common.filter.name' })}
        selectHolder={intl.formatMessage({ id: 'backend.filter.source' })}
        buttonText={intl.formatMessage({ id: 'backend.button.add' })}
        handleClickPrimary={handleAddBackend}
        handleSearch={handleSearch}
        handleSelectChange={handleFilterBySource}
        handleInputChange={handleNameChange}
        rowSelection={rowSelection}
        showSelect={true}
        selectOptions={backendSourceOptions.map((item) => ({
          label: intl.formatMessage({ id: item.label }),
          value: item.value
        }))}
      ></FilterBar>

      <ScrollerContext.Provider
        value={{
          total: dataSource.totalPage,
          current: queryParams.page!,
          loading: dataSource.loading,
          refresh: loadMore,
          throttleDelay: 300
        }}
      >
        <BackendCardList
          dataList={dataSource.dataList}
          loading={dataSource.loading}
          activeId={false}
          isFirst={!dataSource.loadend}
          onSelect={handleOnSelect}
        ></BackendCardList>
        <NoResult
          loading={dataSource.loading}
          loadend={dataSource.loadend}
          dataSource={dataSource.dataList}
          image={<IconFont type="icon-models" />}
          filters={_.omit(queryParams, ['sort_by'])}
          noFoundText={intl.formatMessage({
            id: 'noresult.backend.nofound'
          })}
          title={intl.formatMessage({ id: 'noresult.backend.title' })}
          subTitle={intl.formatMessage({ id: 'noresult.backend.subTitle' })}
          onClick={handleAddBackend}
          buttonText={intl.formatMessage({ id: 'noresult.button.add' })}
        ></NoResult>
      </ScrollerContext.Provider>
      <AddModal
        action={openBackendModalStatus.action}
        onClose={closeBackendModal}
        onSubmit={handleOnSubmit}
        onSubmitYaml={handleOnSubmitYaml}
        currentData={openBackendModalStatus.currentData as ListItem}
        open={openBackendModalStatus.open}
        title={
          openBackendModalStatus.action === PageAction.CREATE
            ? intl.formatMessage({ id: 'backend.button.add' })
            : intl.formatMessage({ id: 'backend.button.edit' })
        }
      ></AddModal>
      <VersionInfoModal
        addVersion={handleAddVersion}
        open={openVersionInfoModal.open}
        currentData={openVersionInfoModal.currentData as ListItem}
        onClose={() =>
          setOpenVersionInfoModal({
            open: false,
            currentData: undefined
          })
        }
      ></VersionInfoModal>
      <DeleteModal ref={modalRef}></DeleteModal>
    </PageBox>
  );
};

export default BackendList;
