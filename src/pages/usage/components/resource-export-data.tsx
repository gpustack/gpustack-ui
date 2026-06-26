/**
 * Export-preview modal for the resource tabs (GPU Instances / Storage) —
 * the counterpart to the Tokens tab's ``ExportData``.
 *
 * Opening it shows a sticky filter bar (re-filter date / user / resource
 * without leaving the dialog) above a paginated preview of exactly the rows
 * that will be written, then an Export footer button downloads the full
 * filtered result set (not just the visible page) to Excel.
 *
 * It's generic over the breakdown endpoint, ``group_by`` and column set, so
 * the same component backs both the "Export Chart Data" (by-date trend) and
 * "Export Table Data" (active group-by) entries on either tab.
 */
import { ModalFooter, ScrollerModal } from '@gpustack/core-ui';
import { useIntl } from '@umijs/max';
import { Table } from 'antd';
import dayjs from 'dayjs';
import React, { useEffect, useMemo, useState } from 'react';
import {
  ResourceBreakdownItem,
  ResourceBreakdownRequest,
  ResourceBreakdownResponse
} from '../apis/resource';
import {
  exportBreakdownRows,
  toExportColumns
} from '../utils/export-breakdown';
import ResourceFilterBar from './resource-filter-bar';

type Scope = 'self' | 'all';

interface SelectOption {
  value: number;
  label: string;
}

interface ResourceExportDataProps {
  open: boolean;
  onCancel: () => void;
  title: string;
  // Breakdown endpoint + the group_by / columns this export covers.
  queryFn: (
    req: ResourceBreakdownRequest
  ) => Promise<ResourceBreakdownResponse>;
  groupBy: NonNullable<ResourceBreakdownRequest['group_by']>;
  // antd column specs — drive both the preview table and (via dataIndex/title)
  // the exported sheet.
  columns: any[];
  fileName: string;
  sheetName?: string;
  // Filter-bar wiring, seeded from the tab's current filters.
  scope: Scope;
  canManageUsers: boolean;
  userOptions: SelectOption[];
  resourceFilter: {
    options: SelectOption[];
    placeholder: string;
    // Which filters key the selected ids map to on the request.
    key: 'instance_ids' | 'volume_ids';
  };
  initialDateRange: [dayjs.Dayjs, dayjs.Dayjs];
  initialSelectedUsers: number[];
  initialSelectedResources: number[];
}

const INITIAL_PAGE = { page: 1, perPage: 100 };

const ResourceExportData: React.FC<ResourceExportDataProps> = (props) => {
  const {
    open,
    onCancel,
    title,
    queryFn,
    groupBy,
    columns,
    fileName,
    sheetName = 'usage',
    scope,
    canManageUsers,
    userOptions,
    resourceFilter,
    initialDateRange,
    initialSelectedUsers,
    initialSelectedResources
  } = props;
  const intl = useIntl();

  const [dateRange, setDateRange] =
    useState<[dayjs.Dayjs, dayjs.Dayjs]>(initialDateRange);
  const [selectedUsers, setSelectedUsers] =
    useState<number[]>(initialSelectedUsers);
  const [selectedResources, setSelectedResources] = useState<number[]>(
    initialSelectedResources
  );
  const [pageParams, setPageParams] = useState(INITIAL_PAGE);
  const [data, setData] = useState<ResourceBreakdownResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [exporting, setExporting] = useState(false);

  const buildRequest = (
    page: number,
    perPage: number
  ): ResourceBreakdownRequest => ({
    start_date: dateRange[0].format('YYYY-MM-DD'),
    end_date: dateRange[1].format('YYYY-MM-DD'),
    scope,
    group_by: groupBy,
    granularity: 'day',
    filters:
      selectedUsers.length || selectedResources.length
        ? {
            ...(selectedUsers.length ? { creator_ids: selectedUsers } : {}),
            ...(selectedResources.length
              ? { [resourceFilter.key]: selectedResources }
              : {})
          }
        : undefined,
    page,
    perPage
  });

  const fetchPreview = async (page: number, perPage: number) => {
    setLoading(true);
    try {
      const res = await queryFn(buildRequest(page, perPage));
      setData(res);
    } finally {
      setLoading(false);
    }
  };

  // Reset to the tab's filters every time the dialog opens, then fetch.
  useEffect(() => {
    if (!open) return;
    setDateRange(initialDateRange);
    setSelectedUsers(initialSelectedUsers);
    setSelectedResources(initialSelectedResources);
    setPageParams(INITIAL_PAGE);
  }, [open]);

  // Refetch the preview whenever the in-dialog filters or page change.
  useEffect(() => {
    if (!open) return;
    fetchPreview(pageParams.page, pageParams.perPage);
  }, [open, dateRange, selectedUsers, selectedResources, pageParams]);

  const previewColumns = useMemo(
    () => [
      {
        title: intl.formatMessage({ id: 'resources.table.index' }),
        width: 60,
        render: (_t: any, _r: any, index: number) =>
          (pageParams.page - 1) * pageParams.perPage + index + 1
      },
      ...columns
    ],
    [columns, pageParams.page, pageParams.perPage, intl]
  );

  const rows: ResourceBreakdownItem[] = data?.items ?? [];

  const handlePageChange = (page: number, perPage: number) => {
    setPageParams({ page, perPage });
  };

  // Export the full filtered set, not just the visible page. ``page: -1`` is
  // the backend's no-pagination sentinel (perPage is then ignored).
  const handleSubmit = async () => {
    setExporting(true);
    try {
      const res = await queryFn(buildRequest(-1, INITIAL_PAGE.perPage));
      exportBreakdownRows(
        res.items ?? [],
        toExportColumns(columns),
        fileName,
        sheetName
      );
    } finally {
      setExporting(false);
    }
  };

  return (
    <ScrollerModal
      title={title}
      open={open}
      centered={false}
      onCancel={onCancel}
      destroyOnHidden={true}
      closeIcon={true}
      mask={{ closable: false }}
      keyboard={false}
      width={1000}
      style={{ top: '10%' }}
      footer={
        <ModalFooter
          onOk={handleSubmit}
          onCancel={onCancel}
          loading={exporting}
          okText={intl.formatMessage({ id: 'common.button.export' })}
        ></ModalFooter>
      }
    >
      <div
        style={{
          position: 'sticky',
          top: 0,
          zIndex: 1,
          backgroundColor: 'var(--ant-color-bg-elevated)',
          paddingBottom: 8
        }}
      >
        <ResourceFilterBar
          value={dateRange}
          onChange={(dates) => {
            setDateRange(dates);
            setPageParams(INITIAL_PAGE);
          }}
          canManageUsers={canManageUsers}
          userOptions={userOptions}
          selectedUsers={selectedUsers}
          onUsersChange={(ids) => {
            setSelectedUsers(ids);
            setPageParams(INITIAL_PAGE);
          }}
          resourceFilter={{
            options: resourceFilter.options,
            value: selectedResources,
            onChange: (ids) => {
              setSelectedResources(ids);
              setPageParams(INITIAL_PAGE);
            },
            placeholder: resourceFilter.placeholder
          }}
        />
      </div>
      <Table
        columns={previewColumns as any}
        className={'scroll-table'}
        tableLayout={'auto'}
        style={{ width: '100%', marginTop: 16, minHeight: 400 }}
        dataSource={rows}
        rowKey={(_r, index) => `${index}`}
        loading={{ spinning: loading, size: 'middle' }}
        virtual
        scroll={{ y: 400 }}
        pagination={{
          size: 'small',
          pageSize: pageParams.perPage,
          current: pageParams.page,
          total: data?.pagination.total || 0,
          onChange: handlePageChange,
          hideOnSinglePage: pageParams.perPage === 100,
          showSizeChanger: true
        }}
      ></Table>
    </ScrollerModal>
  );
};

export default ResourceExportData;
