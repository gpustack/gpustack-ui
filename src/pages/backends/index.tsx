import DeleteModal from '@/components/delete-modal';
import IconFont from '@/components/icon-font';
import { FilterBar } from '@/components/page-tools';
import { PageActionType } from '@/config/types';
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
  const [openModalStatus, setOpenModalStatus] = useState<{
    open: boolean;
    action: PageActionType;
    currentData?: Partial<ListItem>;
  }>({ open: false, action: 'create' });
  const [openVersionInfoModal, setOpenVersionInfoModal] = useState<{
    open: boolean;
    currentData?: Partial<ListItem>;
  }>({ open: false });

  // built_in_version_configs is read-only, but needs to be included when updating
  const handleOnSubmit = async (values: FormData) => {
    try {
      if (openModalStatus.action === 'create') {
        await createBackend({ data: values });
      } else {
        const omitFields = openModalStatus.currentData?.is_built_in
          ? ['built_in_version_configs', 'default_version']
          : ['built_in_version_configs'];

        await updateBackend(openModalStatus.currentData!.id!, {
          data: {
            built_in_version_configs:
              openModalStatus.currentData?.built_in_version_configs,
            ..._.omit(values, omitFields),
            health_check_path: values.health_check_path || null
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

  // built_in_version_configs needs to be included when updating from YAML, but not allowed to be changed
  const handleOnSubmitYaml = async (values: { content: string }) => {
    try {
      if (openModalStatus.action === 'create') {
        await createBackendFromYAML({ data: values });
      } else {
        const jsonData = yaml2Json(values.content);
        const yamlContent = json2Yaml({
          backend_name: openModalStatus.currentData?.backend_name,
          default_version: openModalStatus.currentData?.default_version,
          built_in_version_configs:
            openModalStatus.currentData?.built_in_version_configs,
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
    }
  };

  const handleAddVersion = () => {
    setOpenVersionInfoModal({
      open: false,
      currentData: undefined
    });
    setOpenModalStatus({
      open: true,
      action: 'edit',
      currentData: openVersionInfoModal.currentData
    });
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
        buttonText={intl.formatMessage({ id: 'backend.button.add' })}
        handleClickPrimary={handleAddBackend}
        handleSearch={handleSearch}
        handleInputChange={handleNameChange}
        rowSelection={rowSelection}
        showSelect={false}
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
        action={openModalStatus.action}
        onClose={() => setOpenModalStatus({ open: false, action: 'create' })}
        onSubmit={handleOnSubmit}
        onSubmitYaml={handleOnSubmitYaml}
        currentData={openModalStatus.currentData as ListItem}
        open={openModalStatus.open}
        title={
          openModalStatus.action === 'create'
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
