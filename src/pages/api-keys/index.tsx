import { PageAction } from '@/config';
import { PaginationKey } from '@/config/settings';
import type { PageActionType } from '@/config/types';
import useTableFetch from '@/hooks/use-table-fetch';
import useQueryUserList from '@/pages/users/services/use-query-user-list';
import { DeleteModal, FilterBar, IconFont, NoResult } from '@gpustack/core-ui';
import { useAccess, useIntl } from '@umijs/max';
import useMemoizedFn from 'ahooks/lib/useMemoizedFn';
import { ConfigProvider, Table } from 'antd';
import _ from 'lodash';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import PageBox from '../_components/page-box';
import { deleteApisKey, queryApisKeysList } from './apis';
import AddAPIKeyModal from './components/add-apikey-modal';
import { ListItem } from './config/types';
import useKeysColumns from './hooks/use-keys-columns';
import {
  APIKeyConfigActionMount,
  getAPIKeyConfigActions,
  type APIKeyConfigActionController
} from './plugin';

const APIKeys: React.FC = () => {
  const access = useAccess();
  // `canSeeOrgAdmin` widens to Org owners in the enterprise build —
  // mirrors the BE's "platform admin OR current-Org owner" gate on
  // listing every key in scope. Personal/member users continue to see
  // only their own keys (`user_id: undefined`).
  const canSeeAllKeys = !!access.canSeeOrgAdmin;
  const {
    TABLE_SORT_DIRECTIONS,
    dataSource,
    rowSelection,
    queryParams,
    sortOrder,
    modalRef,
    handleDelete,
    handleDeleteBatch,
    fetchData,
    handlePageChange,
    handleTableChange,
    handleQueryChange,
    handleSearch,
    handleNameChange
  } = useTableFetch<ListItem>({
    key: PaginationKey.APIKeys,
    fetchAPI: queryApisKeysList,
    deleteAPI: deleteApisKey,
    contentForDelete: 'apikeys.table.apikeys',
    defaultQueryParams: {
      user_id: canSeeAllKeys ? '*' : undefined
    }
  });
  const {
    dataList: userList,
    fetchData: fetchUserData,
    cancelRequest: cancelUserRequest
  } = useQueryUserList({
    getLabel: (item) => item.username,
    getValue: (item) => item.id
  });

  const intl = useIntl();

  // Generic per-row plugin slot. Each enterprise plugin contributes a
  // `{ key, labelId, icon, priority, form, useCreate }` entry; the
  // host renders a button per entry in the dropdown and renders one
  // `APIKeyConfigActionMount` per entry — those mounts own each
  // entry's controller and register it back into `controllersRef` so
  // dropdown clicks can route to the correct `openModal`. See
  // `./plugin.tsx`.
  //
  // The action list is read once. Plugins are registered at boot and
  // never recompute, so the reference is stable for the lifetime of
  // the page and `useMemo([])` is safe.
  const configActions = useMemo(() => getAPIKeyConfigActions(), []);
  const controllersRef = useRef<Record<string, APIKeyConfigActionController>>(
    {}
  );
  const registerController = useCallback(
    (key: string, controller: APIKeyConfigActionController) => {
      controllersRef.current[key] = controller;
    },
    []
  );

  const [openAddModal, setOpenAddModal] = useState<{
    open: boolean;
    action: PageActionType;
    title: string;
    currentData?: Partial<ListItem> | null;
  }>({
    open: false,
    action: PageAction.CREATE,
    title: '',
    currentData: null
  });

  useEffect(() => {
    // `scope=current_org` limits the creator dropdown to members of the
    // active Org. Without it, an Org owner sees every user in the
    // system — most of whom can't own a key visible in this list, so
    // selecting them produces an empty result. The BE drops the
    // param silently when the request has no Org context, so callers
    // without an Org keep the full-directory behavior.
    fetchUserData({
      page: -1,
      scope: 'current_org'
    });
    return () => {
      cancelUserRequest();
    };
  }, []);

  const handleAddKey = () => {
    setOpenAddModal({
      open: true,
      title: intl.formatMessage({ id: 'apikeys.button.create' }),
      action: PageAction.CREATE,
      currentData: null
    });
  };

  const handleEditKey = (record: ListItem) => {
    setOpenAddModal({
      open: true,
      title: intl.formatMessage({ id: 'apikeys.button.edit' }),
      action: PageAction.EDIT,
      currentData: record
    });
  };

  const handleModalOk = async () => {
    try {
      await fetchData();
    } catch (error) {
      // do nothing
    }
  };

  const handleModalCancel = () => {
    setOpenAddModal({
      open: false,
      title: '',
      action: PageAction.CREATE,
      currentData: null
    });
  };

  const onSelect = useMemoizedFn(
    async (
      val: string,
      record: ListItem,
      item?: { onClick?: (r: ListItem) => void }
    ) => {
      if (item?.onClick) {
        item.onClick(record);
        return;
      }
      if (val === 'delete') {
        handleDelete(record);
      } else if (val === 'edit') {
        handleEditKey(record);
      }
    }
  );

  // Each plugin entry's button onClick routes here. The controller
  // registry is populated by each `APIKeyConfigActionMount` on mount.
  const handleConfigAction = useMemoizedFn(
    (actionKey: string, record: ListItem) => {
      controllersRef.current[actionKey]?.openModal(record);
    }
  );

  const handleUserChange = (val: string) => {
    handleQueryChange({
      user_id: val || '*'
    });
  };

  const renderEmpty = (type?: string) => {
    if (type !== 'Table') return;
    return (
      <NoResult
        minHeight="calc(100vh - 300px)"
        loading={dataSource.loading}
        loadend={dataSource.loadend}
        dataSource={dataSource.dataList}
        image={<IconFont type="icon-key" />}
        filters={{
          ..._.omit(queryParams, ['sort_by']),
          user_id: queryParams.user_id === '*' ? undefined : queryParams.user_id
        }}
        noFoundText={intl.formatMessage({
          id: 'noresult.keys.nofound'
        })}
        title={intl.formatMessage({ id: 'noresult.keys.title' })}
        subTitle={intl.formatMessage({ id: 'noresult.keys.subTitle' })}
        onClick={handleAddKey}
        buttonText={intl.formatMessage({ id: 'noresult.button.add' })}
      ></NoResult>
    );
  };

  const columns = useKeysColumns({
    handleSelect: onSelect,
    sortOrder,
    showCreator: canSeeAllKeys,
    configActions,
    onConfigAction: handleConfigAction
  });

  return (
    <>
      <PageBox>
        <FilterBar
          marginBottom={22}
          marginTop={30}
          showSelect={canSeeAllKeys}
          selectOptions={userList}
          select={{ showSearch: { optionFilterProp: 'label' } }}
          selectHolder={intl.formatMessage({ id: 'common.filter.byCreator' })}
          buttonText={intl.formatMessage({ id: 'apikeys.button.create' })}
          handleSearch={handleSearch}
          handleDeleteByBatch={handleDeleteBatch}
          handleClickPrimary={handleAddKey}
          handleSelectChange={handleUserChange}
          handleInputChange={handleNameChange}
          rowSelection={rowSelection}
          widths={{ input: 300 }}
        ></FilterBar>
        <ConfigProvider renderEmpty={renderEmpty}>
          <Table
            columns={columns}
            dataSource={dataSource.dataList}
            rowSelection={rowSelection}
            loading={{
              spinning: dataSource.loading,
              size: 'middle'
            }}
            sortDirections={TABLE_SORT_DIRECTIONS}
            showSorterTooltip={false}
            rowKey="id"
            onChange={handleTableChange}
            pagination={{
              size: 'middle',
              showSizeChanger: true,
              pageSize: queryParams.perPage,
              current: queryParams.page,
              total: dataSource.total,
              hideOnSinglePage: queryParams.perPage === 10,
              onChange: handlePageChange
            }}
          ></Table>
        </ConfigProvider>
      </PageBox>
      <AddAPIKeyModal
        open={openAddModal.open}
        action={openAddModal.action}
        title={openAddModal.title}
        currentData={openAddModal.currentData}
        onCancel={handleModalCancel}
        onOk={handleModalOk}
      ></AddAPIKeyModal>
      <DeleteModal ref={modalRef}></DeleteModal>
      {/* One mount per registered action. Each mount calls its
          entry's `useCreate` (single hook per component, so iterating
          the plugin list doesn't violate the Rules of Hooks),
          renders the form, and registers its controller so dropdown
          clicks can dispatch to it. */}
      {configActions.map((action) => (
        <APIKeyConfigActionMount
          key={action.key}
          action={action}
          registerController={registerController}
          onOk={fetchData}
        />
      ))}
    </>
  );
};

export default APIKeys;
