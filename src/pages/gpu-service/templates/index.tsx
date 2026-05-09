import { PageAction } from '@/config';
import useTableFetch from '@/hooks/use-table-fetch';
import {
  DeleteModal,
  FilterBar,
  IconFont,
  InfiniteScrollerProvider,
  NoResult
} from '@gpustack/core-ui';
import { useIntl } from '@umijs/max';
import { useMemoizedFn } from 'ahooks';
import _ from 'lodash';
import { useMemo } from 'react';
import { GPUsConfigs } from '../../resources/config/gpu-driver';
import PageBox from '../../_components/page-box';
import {
  createGPUServiceTemplate,
  deleteGPUServiceTemplate,
  GPU_SERVICE_TEMPLATES_API,
  queryGPUServiceTemplates,
  updateGPUServiceTemplate
} from './apis';
import AddModal from './components/add-modal';
import TemplateCardList from './components/template-list';
import { FormData, ListItem } from './config/types';
import useCreateTemplate from './hooks/use-create-template';

const GPUServiceTemplates: React.FC = () => {
  const intl = useIntl();
  const {
    dataSource,
    rowSelection,
    queryParams,
    modalRef,
    fetchData,
    handleDelete,
    handleSearch,
    handleNameChange,
    handleQueryChange
  } = useTableFetch<ListItem>({
    fetchAPI: queryGPUServiceTemplates,
    deleteAPI: deleteGPUServiceTemplate,
    API: GPU_SERVICE_TEMPLATES_API,
    watch: false,
    isInfiniteScroll: true,
    contentForDelete: intl.formatMessage({ id: 'gpuservice.template' }),
    defaultQueryParams: {
      perPage: 24
    }
  });
  const { openTemplateModalStatus, openTemplateModal, closeTemplateModal } =
    useCreateTemplate();

  const manufacturerOptions = useMemo(
    () => [
      ...Object.values(GPUsConfigs).map((item) => ({
        label: item.label,
        value: item.value
      })),
      { label: 'CPU', value: 'cpu' }
    ],
    []
  );

  const handleFilterByManufacturer = (value: string) => {
    handleQueryChange({
      manufacturer: value,
      page: 1
    });
  };

  const handleAddTemplate = () => {
    openTemplateModal(
      PageAction.CREATE,
      intl.formatMessage({ id: 'gpuservice.template.add' })
    );
  };

  const handleEditTemplate = (row: ListItem) => {
    openTemplateModal(
      PageAction.EDIT,
      intl.formatMessage({ id: 'gpuservice.template.edit' }),
      row
    );
  };

  const handleModalOk = async (data: FormData) => {
    try {
      if (openTemplateModalStatus.action === PageAction.EDIT) {
        await updateGPUServiceTemplate({
          id: openTemplateModalStatus.currentData!.id,
          data
        });
      } else {
        await createGPUServiceTemplate({ data });
      }
      closeTemplateModal();
      handleSearch();
    } catch (error) {
      // ignore
    }
  };

  const handleOnSelect = (item: { action: string; data: ListItem }) => {
    if (item.action === 'edit') {
      handleEditTemplate(item.data);
      return;
    }
    if (item.action === 'delete') {
      handleDelete({ ...item.data, name: item.data.name });
    }
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
          input: 230
        }}
        inputHolder={intl.formatMessage({
          id: 'gpuservice.template.filter.name'
        })}
        selectHolder={intl.formatMessage({
          id: 'gpuservice.template.filter.vendor'
        })}
        buttonText={intl.formatMessage({ id: 'gpuservice.template.add' })}
        handleClickPrimary={handleAddTemplate}
        handleSearch={handleSearch}
        handleSelectChange={handleFilterByManufacturer}
        handleInputChange={handleNameChange}
        rowSelection={rowSelection}
        showSelect={true}
        selectOptions={manufacturerOptions}
      />
      <InfiniteScrollerProvider
        value={{
          total: dataSource.totalPage,
          current: queryParams.page!,
          loading: dataSource.loading,
          refresh: loadMore,
          throttleDelay: 300
        }}
      >
        <TemplateCardList
          dataList={dataSource.dataList}
          loading={dataSource.loading}
          isFirst={!dataSource.loadend}
          onSelect={handleOnSelect}
        />
        <NoResult
          loading={dataSource.loading}
          loadend={dataSource.loadend}
          dataSource={dataSource.dataList}
          image={<IconFont type="icon-instance-template-filled" />}
          filters={_.omit(queryParams, ['sort_by'])}
          noFoundText={intl.formatMessage({
            id: 'noresult.gpuservice.template.nofound'
          })}
          title={intl.formatMessage({
            id: 'noresult.gpuservice.template.title'
          })}
          subTitle={intl.formatMessage({
            id: 'noresult.gpuservice.template.subTitle'
          })}
          onClick={handleAddTemplate}
          buttonText={intl.formatMessage({ id: 'noresult.button.add' })}
        />
      </InfiniteScrollerProvider>
      <AddModal
        action={openTemplateModalStatus.action}
        open={openTemplateModalStatus.open}
        title={openTemplateModalStatus.title}
        currentData={openTemplateModalStatus.currentData}
        onCancel={closeTemplateModal}
        onOk={handleModalOk}
      />
      <DeleteModal ref={modalRef} />
    </PageBox>
  );
};

export default GPUServiceTemplates;
