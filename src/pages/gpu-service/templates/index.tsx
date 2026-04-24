import { PageAction } from '@/config';
import useTableFetch from '@/hooks/use-table-fetch';
import { GPUsConfigs } from '@/pages/resources/config/gpu-driver';
import {
  DeleteModal,
  FilterBar,
  IconFont,
  InfiniteScrollerProvider,
  NoResult
} from '@gpustack/core-ui';
import { useMemoizedFn } from 'ahooks';
import { message } from 'antd';
import _ from 'lodash';
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
    fetchAPI: queryGPUServiceTemplates,
    deleteAPI: deleteGPUServiceTemplate,
    API: GPU_SERVICE_TEMPLATES_API,
    watch: false,
    isInfiniteScroll: true,
    contentForDelete: 'GPU 实例模板',
    defaultQueryParams: {
      perPage: 24
    }
  });
  const { openTemplateModalStatus, openTemplateModal, closeTemplateModal } =
    useCreateTemplate();

  const handleAddTemplate = () => {
    openTemplateModal(PageAction.CREATE, '添加实例模板');
  };

  const handleEditTemplate = (row: ListItem) => {
    openTemplateModal(PageAction.EDIT, '编辑实例模板', row);
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
      message.success('操作成功');
    } catch (error) {
      message.error('操作失败');
    }
  };

  const gpuVendorOptions = Object.values(GPUsConfigs).map((item) => ({
    label: item.label,
    value: item.value
  }));

  const handleFilterByVendor = (value: string) => {
    handleQueryChange({
      vendor: value,
      page: 1
    });
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
        inputHolder="按名称过滤"
        selectHolder="按厂商过滤"
        buttonText="添加实例模板"
        handleClickPrimary={handleAddTemplate}
        handleSearch={handleSearch}
        handleSelectChange={handleFilterByVendor}
        handleInputChange={handleNameChange}
        rowSelection={rowSelection}
        showSelect={true}
        selectOptions={gpuVendorOptions}
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
          noFoundText="未找到匹配的实例模板"
          title="暂无实例模板"
          subTitle="创建一个实例模板后会显示在这里"
          onClick={handleAddTemplate}
          buttonText="立即添加"
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
