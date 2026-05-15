import { expandKeysAtom } from '@/atoms/clusters';
import { registerRouteConfigAtom } from '@/atoms/routes';
import PluginExtraFields from '@/components/plugin-extra-fields';
import { PageAction } from '@/config';
import { PaginationKey, TABLE_SORT_DIRECTIONS } from '@/config/settings';
import useExpandedRowKeys from '@/hooks/use-expanded-row-keys';
import useTableFetch from '@/hooks/use-table-fetch';
import useWatchList from '@/hooks/use-watch-list';
import APIAccessInfoModal from '@/pages/llmodels/components/api-access-info';
import {
  DeleteModal,
  FilterBar,
  IconFont,
  NoResult,
  Table as SealTable,
  TableOrder,
  TableProvider
} from '@gpustack/core-ui';
import { useIntl } from '@umijs/max';
import { useMemoizedFn } from 'ahooks';
import { message } from 'antd';
import { useAtom } from 'jotai';
import _ from 'lodash';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import PageBox from '../_components/page-box';
import { queryModelsList } from '../llmodels/apis';
import AccessControlModal from '../llmodels/components/access-control-modal';
import {
  MODEL_ROUTES,
  MODEL_ROUTE_TARGETS,
  createModelRoute,
  deleteModelRoute,
  deleteModelRouteTarget,
  queryModelRoutes,
  queryRouteTargets,
  setRouteTargetAsFallback,
  updateModelRoute
} from './apis';
import AddRouteModal from './components/add-route-modal';
import RouteTargets from './components/route-targets';
import { FormData, RouteItem as ListItem } from './config/types';
import useAccessControl from './hooks/use-access-control';
import useCreateRoute from './hooks/use-create-route';
import useOpenPlayground from './hooks/use-open-playground';
import useRoutesColumns from './hooks/use-routes-columns';
import useTargetSourceModels from './hooks/use-target-source-models';
import useViewApIInfo from './hooks/use-view-api-info';
import {
  ModelRouteConfigActionMount,
  getModelRouteConfigActions,
  type ModelRouteConfigActionController
} from './plugin';

const ModelRoutes: React.FC = () => {
  // Single source of truth for plugin data lifecycle. Every successful
  // table fetch updates this atomically: `routeIds` mirrors the rows
  // currently visible (so plugins can bulk-fetch per-row data without
  // N round-trips), and `refreshToken` bumps so plugins refetch even
  // when the id set is unchanged — e.g. an in-place save from the
  // quota-limit drawer leaves the row set intact but invalidates the
  // derived defaults map.
  const [pluginContext, setPluginContext] = useState<{
    routeIds: number[];
    refreshToken: number;
  }>({
    routeIds: [],
    refreshToken: 0
  });

  // Wraps `queryModelRoutes` so the plugin context updates in lockstep
  // with the table data — no separate "bump after save" signal needed.
  const fetchAPI = useMemoizedFn(async (params: any, options?: any) => {
    const res = await queryModelRoutes(params, options);
    setPluginContext((prev) => ({
      routeIds: (res.items ?? []).map((r: ListItem) => r.id),
      refreshToken: prev.refreshToken + 1
    }));
    return res;
  });

  const {
    dataSource,
    rowSelection,
    queryParams,
    modalRef,
    handleTableChange,
    handleDelete,
    handleDeleteBatch,
    fetchData,
    handlePageChange,
    handleSearch,
    handleNameChange
  } = useTableFetch<ListItem>({
    key: PaginationKey.Routes,
    fetchAPI,
    deleteAPI: deleteModelRoute,
    watch: true,
    API: MODEL_ROUTES,
    contentForDelete: 'menu.models.routes'
  });
  const { watchDataList: allRouteTargets, deleteItemFromCache } =
    useWatchList(MODEL_ROUTE_TARGETS);
  const [expandAtom] = useAtom(expandKeysAtom);
  const {
    handleExpandChange,
    handleExpandAll,
    updateExpandedRowKeys,
    removeExpandedRowKey,
    expandedRowKeys
  } = useExpandedRowKeys(expandAtom);
  const intl = useIntl();
  const {
    openRouteModalStatus,
    openRouteModal,
    registerRouteModal,
    closeRouteModal
  } = useCreateRoute();
  const {
    openAccessControlModal,
    closeAccessControlModal,
    openAccessControlModalStatus
  } = useAccessControl();
  const { sourceModels, fetchSourceModels } = useTargetSourceModels();
  const { handleOpenPlayGround } = useOpenPlayground();
  const { apiAccessInfo, openViewAPIInfo, closeViewAPIInfo } = useViewApIInfo();
  const [registerRouteConfig, setRegisterRouteConfig] = useAtom(
    registerRouteConfigAtom
  );
  const [modelList, setModelsList] = useState<Global.BaseOption<number>[]>([]);

  useEffect(() => {
    const fetchModels = async () => {
      try {
        const res = await queryModelsList({ page: -1 });
        const models =
          res.items?.map((model) => ({
            label: model.name,
            value: model.id
          })) || [];
        setModelsList(models);
      } catch (error) {
        setModelsList([]);
      }
    };
    fetchModels();
  }, []);

  const handleCloseRouteModal = () => {
    closeRouteModal();
    setRegisterRouteConfig({
      initialValues: null,
      create: false
    });
  };

  const handleClickDropdown = () => {
    openRouteModal(
      PageAction.CREATE,
      intl.formatMessage({ id: 'routes.button.add' })
    );
  };

  const handleModalOk = async (data: FormData) => {
    const params = {
      ...data
    };
    try {
      let data: ListItem = {} as any;
      if (openRouteModalStatus.action === PageAction.EDIT) {
        data = await updateModelRoute({
          data: params,
          id: openRouteModalStatus.currentData!.id
        });
      }
      if (openRouteModalStatus.action === PageAction.CREATE) {
        data = await createModelRoute({
          data: params
        });
      }

      if (data.targets > 0) {
        updateExpandedRowKeys([data.id, ...expandedRowKeys]);
      }
      fetchData();
      handleCloseRouteModal();
      message.success(intl.formatMessage({ id: 'common.message.success' }));
    } catch (error) {}
  };

  const handleModalCancel = () => {
    console.log('handleModalCancel');
    handleCloseRouteModal();
  };

  const handleEditProvider = (row: ListItem) => {
    openRouteModal(
      PageAction.EDIT,
      intl.formatMessage({ id: 'common.button.edit.item' }, { name: row.name }),
      row
    );
  };

  const handleSelect = useMemoizedFn((val: any, row: ListItem) => {
    if (val === 'edit') {
      handleEditProvider(row);
    } else if (val === 'delete') {
      handleDelete({ ...row, name: row.name });
    } else if (val === 'accessControl') {
      openAccessControlModal(
        PageAction.EDIT,
        intl.formatMessage({ id: 'models.button.accessSettings' }),
        row
      );
    } else if (val === 'chat') {
      handleOpenPlayGround(row);
    } else if (val === 'api') {
      openViewAPIInfo(row);
    }
  });

  const handleOnToggleExpandAll = () => {
    // do nothing
  };

  const handleToggleExpandAll = useMemoizedFn((expanded: boolean) => {
    const keys = dataSource.dataList?.map((item) => item.id);
    handleExpandAll(expanded, keys);
    if (expanded) {
      handleOnToggleExpandAll();
    }
  });

  const loadChildrenData = useMemoizedFn(
    async (row: ListItem, options?: any) => {
      const params = {
        id: row.id
      };
      const res = await queryRouteTargets(params, {
        token: options?.token
      });

      return res.items || [];
    }
  );

  const handleOnSortChange = (order: TableOrder | Array<TableOrder>) => {
    handleTableChange({}, {}, order, { action: 'sort' });
  };

  const handleDeleteTarget = (row: any) => {
    modalRef.current?.show({
      content: 'routes.table.routeTargets',
      okText: 'common.button.delete',
      operation: 'common.delete.single.confirm',
      name: row.name,
      async onOk() {
        await deleteModelRouteTarget(row.id);
        deleteItemFromCache?.(row.id);
      }
    });
  };

  const onChildSelect = useMemoizedFn(async (val: any, record: any) => {
    try {
      if (val === 'fallback') {
        await setRouteTargetAsFallback({
          id: record.id,
          data: {
            fallback_status_codes: ['4xx', '5xx']
          }
        });
        message.success(intl.formatMessage({ id: 'common.message.success' }));
      } else if (val === 'delete') {
        handleDeleteTarget(record);
      }
    } catch (error) {}
  });

  const renderChildren = (
    list: any,
    options: { parent?: any; [key: string]: any }
  ) => {
    return (
      <RouteTargets
        modelList={modelList}
        dataList={list}
        onSelect={onChildSelect}
        sourceModels={sourceModels}
      />
    );
  };

  const setDisableExpand = (record: any) => {
    return !record?.targets;
  };

  useEffect(() => {
    fetchSourceModels();
  }, []);

  useEffect(() => {
    if (registerRouteConfig.create && dataSource.loadend) {
      registerRouteModal(
        PageAction.CREATE,
        intl.formatMessage({ id: 'routes.button.add' }),
        registerRouteConfig.initialValues
      );
    }
  }, [registerRouteConfig, dataSource.loadend]);

  // Generic per-row plugin slot. Each enterprise plugin contributes a
  // `{ key, labelId, icon, priority, form, useCreate }` entry; the host
  // renders a button per entry in the dropdown and renders one
  // `ModelRouteConfigActionMount` per entry — those mounts own each
  // entry's controller and register it back into `controllersRef` so
  // dropdown clicks can route to the correct `openModal`. See
  // `./plugin.tsx`.
  //
  // The action list is read once. Plugins are registered at boot and
  // never recompute, so the reference is stable for the lifetime of
  // the page and `useMemo([])` is safe.
  const configActions = useMemo(() => getModelRouteConfigActions(), []);
  const controllersRef = useRef<
    Record<string, ModelRouteConfigActionController>
  >({});
  const registerController = useCallback(
    (key: string, controller: ModelRouteConfigActionController) => {
      controllersRef.current[key] = controller;
    },
    []
  );

  const handleConfigAction = useMemoizedFn(
    (actionKey: string, record: ListItem) => {
      controllersRef.current[actionKey]?.openModal(record);
    }
  );

  // Per-row save closes the drawer and refetches the table. The wrapped
  // `fetchAPI` above takes care of bumping `pluginContext.refreshToken`
  // for derived plugin data.
  const handleConfigActionOk = useMemoizedFn(() => {
    fetchData();
  });

  const columns = useRoutesColumns({
    handleSelect,
    configActions,
    onConfigAction: handleConfigAction
  });

  return (
    <>
      <PageBox>
        <FilterBar
          showSelect={false}
          marginBottom={22}
          marginTop={30}
          widths={{ input: 300 }}
          buttonText={intl.formatMessage({ id: 'routes.button.add' })}
          rowSelection={rowSelection}
          handleInputChange={handleNameChange}
          handleSearch={handleSearch}
          handleDeleteByBatch={handleDeleteBatch}
          handleClickPrimary={handleClickDropdown}
        ></FilterBar>
        <TableProvider
          value={{
            allChildren: allRouteTargets,
            setDisableExpand: setDisableExpand
          }}
        >
          <SealTable
            rowKey="id"
            loadChildren={loadChildrenData}
            sortDirections={TABLE_SORT_DIRECTIONS}
            expandedRowKeys={expandedRowKeys}
            onExpand={handleExpandChange}
            onExpandAll={handleToggleExpandAll}
            renderChildren={renderChildren}
            onTableSort={handleOnSortChange}
            showSorterTooltip={false}
            dataSource={dataSource.dataList}
            loading={dataSource.loading}
            loadend={dataSource.loadend}
            rowSelection={rowSelection}
            columns={columns}
            childParentKey="route_id"
            expandable={true}
            empty={
              <NoResult
                loading={dataSource.loading}
                loadend={dataSource.loadend}
                dataSource={dataSource.dataList}
                image={<IconFont type="icon-captive_portal" />}
                filters={_.omit(queryParams, ['sort_by'])}
                noFoundText={intl.formatMessage({
                  id: 'noresult.routes.nofound'
                })}
                title={intl.formatMessage({ id: 'noresult.routes.title' })}
                subTitle={intl.formatMessage({
                  id: 'noresult.routes.subTitle'
                })}
                onClick={handleClickDropdown}
                buttonText={intl.formatMessage({ id: 'noresult.button.add' })}
              ></NoResult>
            }
            pagination={{
              size: 'middle',
              showSizeChanger: true,
              pageSize: queryParams.perPage,
              current: queryParams.page,
              total: dataSource.total,
              hideOnSinglePage: queryParams.perPage === 10,
              onChange: handlePageChange
            }}
          ></SealTable>
        </TableProvider>
      </PageBox>
      <AddRouteModal
        open={openRouteModalStatus.open}
        realAction={openRouteModalStatus.realAction}
        action={openRouteModalStatus.action}
        title={openRouteModalStatus.title}
        currentData={openRouteModalStatus.currentData}
        onCancel={handleModalCancel}
        onOk={handleModalOk}
      ></AddRouteModal>
      <AccessControlModal
        onCancel={closeAccessControlModal}
        title={openAccessControlModalStatus.title}
        open={openAccessControlModalStatus.open}
        currentData={openAccessControlModalStatus.currentData}
        action={openAccessControlModalStatus.action}
      ></AccessControlModal>
      <APIAccessInfoModal
        open={apiAccessInfo.show}
        data={apiAccessInfo.data}
        onClose={closeViewAPIInfo}
      ></APIAccessInfoModal>
      <DeleteModal ref={modalRef}></DeleteModal>
      {/* One mount per registered action. Each mount calls its
          entry's `useCreate` (single hook per component, so iterating
          the plugin list doesn't violate the Rules of Hooks),
          renders the form, and registers its controller so dropdown
          clicks can dispatch to it. */}
      {configActions.map((action) => (
        <ModelRouteConfigActionMount
          key={action.key}
          action={action}
          registerController={registerController}
          onOk={handleConfigActionOk}
        />
      ))}
      {/* Page-level data lifecycle for plugin-contributed extra
          columns. Receives the current list of visible route ids so
          the plugin can bulk-fetch their per-user defaults in one
          call (used by the quota-default column cells); `refreshToken`
          bumps after a per-row save so derived page data refetches
          even when the row set is unchanged. Renders nothing when no
          plugin is registered. */}
      <PluginExtraFields name="ModelRoutesPageGlobal" context={pluginContext} />
    </>
  );
};

export default ModelRoutes;
