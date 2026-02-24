import { expandKeysAtom } from '@/atoms/clusters';
import { registerRouteConfigAtom } from '@/atoms/routes';
import DeleteModal from '@/components/delete-modal';
import IconFont from '@/components/icon-font';
import { FilterBar } from '@/components/page-tools';
import SealTable from '@/components/seal-table';
import TableContext from '@/components/seal-table/table-context';
import { TableOrder } from '@/components/seal-table/types';
import { PageAction } from '@/config';
import { TABLE_SORT_DIRECTIONS } from '@/config/settings';
import useExpandedRowKeys from '@/hooks/use-expanded-row-keys';
import useTableFetch from '@/hooks/use-table-fetch';
import useWatchList from '@/hooks/use-watch-list';
import APIAccessInfoModal from '@/pages/llmodels/components/api-access-info';
import { useIntl } from '@umijs/max';
import { useMemoizedFn } from 'ahooks';
import { message } from 'antd';
import { useAtom } from 'jotai';
import _ from 'lodash';
import { useEffect, useState } from 'react';
import NoResult from '../_components/no-result';
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

const ModelRoutes: React.FC = () => {
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
    fetchAPI: queryModelRoutes,
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

  const columns = useRoutesColumns(handleSelect);

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
        <TableContext.Provider
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
              showSizeChanger: true,
              pageSize: queryParams.perPage,
              current: queryParams.page,
              total: dataSource.total,
              hideOnSinglePage: queryParams.perPage === 10,
              onChange: handlePageChange
            }}
          ></SealTable>
        </TableContext.Provider>
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
    </>
  );
};

export default ModelRoutes;
