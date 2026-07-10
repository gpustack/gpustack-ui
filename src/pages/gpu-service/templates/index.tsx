import { PageAction } from '@/config';
import useTableFetch from '@/hooks/use-table-fetch';
import {
  BaseSelect,
  DeleteModal,
  FilterBar,
  IconFont,
  InfiniteScrollerProvider,
  NoResult,
  useFilterDrawer
} from '@gpustack/core-ui';
import { useIntl } from '@umijs/max';
import { useMemoizedFn } from 'ahooks';
import _ from 'lodash';
import { useMemo } from 'react';
import PageBox from '../../_components/page-box';
import { GPUsConfigs } from '../../resources/config/gpu-driver';
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
import VendorFilterForm from './filters/vendor-filter-form';
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
      // Default (non-``mine``) scope: Global rows plus rows owned by the
      // caller's current principal, matching the Inference Backend page.
      // Global rows a non-admin can't edit render read-only — the card
      // gates Edit/Delete on ownership.
      perPage: 24
    }
  });
  const { openTemplateModalStatus, openTemplateModal, closeTemplateModal } =
    useCreateTemplate();

  const {
    filtersVisible,
    toggleFilters,
    filterRef,
    filterValues,
    filtersCount,
    handleOnFilterChange,
    handleOnClearFilters
  } = useFilterDrawer({
    onFilterChange: (filters) => {
      handleQueryChange({
        page: 1,
        ...filters
      });
    },
    clearKeys: ['manufacturer']
  });

  const manufacturerOptions = useMemo(
    () => [
      ...Object.values(GPUsConfigs).map((item) => ({
        label: item.locales.locale
          ? intl.formatMessage({ id: item.locales.label })
          : item.locales.label,
        value: item.gpuVendor as string
      })),
      { label: 'CPU', value: 'cpu' }
    ],
    [intl]
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

  const handleCloneTemplate = (row: ListItem) => {
    // Clone reuses the create flow: drop the source's identity and
    // ownership so the backend assigns a fresh id and scopes the copy
    // to the caller's own principal. The prefilled name is editable —
    // the create endpoint enforces per-owner name uniqueness.
    const source = _.omit(row, [
      'id',
      'owner_principal_id',
      'creator_id',
      'created_at',
      'updated_at',
      'status'
    ]) as ListItem;
    // Default to a ``-clone`` suffix so cloning within the same scope
    // (e.g. a Global preset kept Global) doesn't immediately collide on
    // the unique name. Keep within the 63-char name limit by trimming
    // the base first.
    const suffix = '-clone';
    const base = (row.name ?? '').slice(0, 63 - suffix.length);
    source.name = `${base}${suffix}`;
    // The card renders ``displayName || name``, so a copied displayName
    // would make the clone indistinguishable from its source. Append a
    // localized clone label, trimmed to the same 63-char field limit.
    if (row.displayName) {
      const cloneLabel = intl.formatMessage({ id: 'common.button.clone' });
      const displaySuffix = ` (${cloneLabel})`;
      const displayBase = row.displayName.slice(0, 63 - displaySuffix.length);
      source.displayName = `${displayBase}${displaySuffix}`;
    }
    openTemplateModal(
      PageAction.CREATE,
      intl.formatMessage({ id: 'gpuservice.template.clone' }),
      source
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
    if (item.action === 'clone') {
      handleCloneTemplate(item.data);
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

  const handleRefresh = () => {
    fetchData({ query: { ...queryParams, page: 1 } });
  };

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'flex-start',
        minWidth: 0,
        maxWidth: '100%'
      }}
    >
      <VendorFilterForm
        ref={filterRef}
        open={filtersVisible}
        manufacturerOptions={manufacturerOptions}
        initialValues={filterValues}
        onValuesChange={handleOnFilterChange}
        onClose={toggleFilters}
        onClear={handleOnClearFilters}
      />
      <div style={{ flex: 1, minWidth: 0, maxWidth: '100%' }}>
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
            buttonText={intl.formatMessage({ id: 'gpuservice.template.add' })}
            handleClickPrimary={handleAddTemplate}
            handleSearch={handleRefresh}
            handleInputChange={handleNameChange}
            rowSelection={rowSelection}
            showSelect={false}
            collapseInlineFilters
            filtersButtonProps={{
              show: true,
              count: filtersCount,
              onClick: toggleFilters,
              onClear: handleOnClearFilters
            }}
            inlineFilters={
              <BaseSelect
                allowClear
                showSearch={false}
                placeholder={intl.formatMessage({
                  id: 'gpuservice.template.filter.vendor'
                })}
                style={{ width: 160 }}
                size="large"
                maxTagCount={1}
                onChange={handleFilterByManufacturer}
                options={manufacturerOptions}
              />
            }
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
      </div>
    </div>
  );
};

export default GPUServiceTemplates;
