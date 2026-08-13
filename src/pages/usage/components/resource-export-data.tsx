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
import { Alert, Flex, Table } from 'antd';
import dayjs from 'dayjs';
import React, { useEffect, useState } from 'react';
import {
  ResourceBreakdownItem,
  ResourceBreakdownRequest,
  ResourceBreakdownResponse,
  toResourceExportRequest
} from '../apis/resource';
import { XLSX_MAX_ROWS_PER_SHEET } from '../config';
import { useExportPreviewColumns } from '../hooks/use-export-preview-columns';
import { useExportPreviewLayout } from '../hooks/use-export-preview-layout';
import useExportUsage from '../services/use-export-usage';
import { resourcePreviewValue } from '../utils/export-preview-values';
import ExportSuggestions from './export-suggestions';
import ResourceFilterBar from './resource-filter-bar';

type Scope = 'self' | 'all';

interface SelectOption {
  value: number;
  label: string;
  deleted?: boolean;
  // ``org`` / ``user`` / ``group`` — set on organization options for the tag.
  kind?: string;
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
  // Which export endpoints back this tab (GPU instances vs storage).
  exportEndpoints: { exportUrl: string; estimateUrl: string };
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
  // Platform-wide "All" view only; empty otherwise. Mirrors the tab's
  // Organization / User Group filters so the export can re-narrow by them.
  organizationOptions?: SelectOption[];
  userGroupOptions?: SelectOption[];
  initialSelectedOrganizations?: number[];
  initialSelectedUserGroups?: number[];
}

const INITIAL_PAGE = { page: 1, perPage: 100 };

const ResourceExportData: React.FC<ResourceExportDataProps> = (props) => {
  const {
    open,
    onCancel,
    title,
    queryFn,
    groupBy,
    exportEndpoints,
    scope,
    canManageUsers,
    userOptions,
    resourceFilter,
    initialDateRange,
    initialSelectedUsers,
    initialSelectedResources,
    organizationOptions = [],
    userGroupOptions = [],
    initialSelectedOrganizations = [],
    initialSelectedUserGroups = []
  } = props;
  const intl = useIntl();

  const [dateRange, setDateRange] =
    useState<[dayjs.Dayjs, dayjs.Dayjs]>(initialDateRange);
  const [selectedUsers, setSelectedUsers] =
    useState<number[]>(initialSelectedUsers);
  const [selectedResources, setSelectedResources] = useState<number[]>(
    initialSelectedResources
  );
  const [selectedOrganizations, setSelectedOrganizations] = useState<number[]>(
    initialSelectedOrganizations
  );
  const [selectedUserGroups, setSelectedUserGroups] = useState<number[]>(
    initialSelectedUserGroups
  );
  const [pageParams, setPageParams] = useState(INITIAL_PAGE);
  // Exported bucket size. Fixed at day: the remedies for an over-large export
  // narrow the range or split the file — both lossless — and never re-bucket.
  const exportGranularity: NonNullable<
    ResourceBreakdownRequest['granularity']
  > = 'day';
  const [data, setData] = useState<ResourceBreakdownResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const {
    estimate,
    estimating,
    estimateFailed,
    exporting,
    fetchEstimate,
    resetEstimate,
    exportData
  } = useExportUsage({
    exportUrl: exportEndpoints.exportUrl,
    estimateUrl: exportEndpoints.estimateUrl
  });

  const buildRequest = (
    page: number,
    perPage: number
  ): ResourceBreakdownRequest => ({
    start_date: dateRange[0].format('YYYY-MM-DD'),
    end_date: dateRange[1].format('YYYY-MM-DD'),
    scope,
    group_by: groupBy,
    granularity: exportGranularity,
    filters:
      selectedUsers.length ||
      selectedResources.length ||
      selectedOrganizations.length ||
      selectedUserGroups.length
        ? {
            ...(selectedUsers.length ? { creator_ids: selectedUsers } : {}),
            ...(selectedResources.length
              ? { [resourceFilter.key]: selectedResources }
              : {}),
            ...(selectedOrganizations.length
              ? { organization_ids: selectedOrganizations }
              : {}),
            ...(selectedUserGroups.length
              ? { user_group_ids: selectedUserGroups }
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
    setSelectedOrganizations(initialSelectedOrganizations);
    setSelectedUserGroups(initialSelectedUserGroups);
    setPageParams(INITIAL_PAGE);
  }, [open]);

  // Refetch the preview whenever the in-dialog filters or page change.
  useEffect(() => {
    if (!open) return;
    fetchPreview(pageParams.page, pageParams.perPage);
  }, [
    open,
    dateRange,
    selectedUsers,
    selectedResources,
    selectedOrganizations,
    selectedUserGroups,
    pageParams
  ]);

  // Size the export when the FILTERS change — deliberately NOT on page change.
  // The estimate covers the whole filtered range, so paging cannot alter it,
  // and it is a full-range COUNT: riding along with the preview turned every
  // click through the pager into another aggregate query over the same rows.
  useEffect(() => {
    if (!open) {
      resetEstimate();
      return;
    }
    fetchEstimate(
      toResourceExportRequest(buildRequest(-1, INITIAL_PAGE.perPage))
    );
  }, [
    open,
    dateRange,
    selectedUsers,
    selectedResources,
    selectedOrganizations,
    selectedUserGroups
  ]);

  // Mirror the file: the column set comes from the estimate, which is also
  // what defines the exported schema, so the preview and the download cannot
  // show different things.
  const { columns: previewColumns, scrollX } = useExportPreviewColumns(
    estimate?.sheets?.[0]?.columns,
    resourcePreviewValue,
    pageParams
  );

  // Normalize the date bucket to a plain calendar day (drop the ``T00:00:00``
  // the hourly ``metered_usage`` carries) so the export matches the Tokens
  // tab's date-only format. Slice the ISO string rather than re-parsing with
  // dayjs — a tz-offset timestamp would shift the calendar day on format.
  // The export always requests day granularity.
  const formatRowDates = (
    items: ResourceBreakdownItem[]
  ): ResourceBreakdownItem[] =>
    items.map((i) =>
      i.date ? { ...i, date: String(i.date).slice(0, 10) } : i
    );

  const rows: ResourceBreakdownItem[] = formatRowDates(data?.items ?? []);

  const handlePageChange = (page: number, perPage: number) => {
    setPageParams({ page, perPage });
  };

  // Thresholds come from the server so the dialog can't disagree with what the
  // export endpoint will accept.
  const exportTotal = estimate?.total ?? 0;
  const exceedsHardLimit = !!estimate?.exceeds_hard_limit;
  const { contentHeight, bodyHeight } =
    useExportPreviewLayout(exceedsHardLimit);
  // The dialog always asks for xlsx; the server switches to CSV when the
  // result cannot fit a worksheet. Say so BEFORE the click — a .csv landing
  // in the downloads folder where a .xlsx was expected is the kind of
  // surprise that breaks someone's import script.
  // Two different reasons the file won't be xlsx, and the user should be told
  // which one applies: splitting (the remedy on offer, which only CSV can
  // stream) or a result too big for a worksheet at all.
  const formatNote =
    !estimate || estimate.effective_format === 'xlsx'
      ? ''
      : estimate.split_parts
        ? intl.formatMessage(
            { id: 'usage.export.splitAsCsv' },
            { parts: estimate.split_parts }
          )
        : intl.formatMessage(
            { id: 'usage.export.csvFallback' },
            { limit: XLSX_MAX_ROWS_PER_SHEET }
          );
  const rowsHint = !estimate
    ? null
    : exceedsHardLimit
      ? intl.formatMessage(
          { id: 'usage.export.rowsExceeded' },
          {
            total: exportTotal,
            limit: estimate.hard_limit,
            days: estimate.suggested_max_days ?? 0
          }
        )
      : estimate.exceeds_soft_limit
        ? intl.formatMessage(
            { id: 'usage.export.rowsSlow' },
            { total: exportTotal }
          )
        : intl.formatMessage(
            { id: 'usage.export.rows' },
            { total: exportTotal }
          );
  const exportHint = [rowsHint, formatNote].filter(Boolean).join(' ');

  // The server computed each remedy's numbers; clicking one applies it rather
  // than leaving the user to work out how far to narrow.
  const suggestionHandlers = {
    onShortenRange: (maxDays: number) => {
      const end = dateRange[1];
      setDateRange([end.subtract(Math.max(0, maxDays - 1), 'day'), end]);
    },
    onSplitExport: async (_parts: number) => {
      const ok = await exportData({
        ...toResourceExportRequest(buildRequest(-1, INITIAL_PAGE.perPage)),
        split: 'auto'
      });
      if (ok) {
        onCancel?.();
      }
    }
  };

  const handleSubmit = async () => {
    // Send the filters, not the rows: the server streams the whole filtered
    // set, so the file can't disagree with the preview above it.
    const ok = await exportData(
      toResourceExportRequest(buildRequest(-1, INITIAL_PAGE.perPage))
    );
    if (ok) {
      onCancel?.();
    }
  };

  return (
    <ScrollerModal
      title={title}
      open={open}
      centered={false}
      onCancel={onCancel}
      destroyOnHidden={true}
      maxContentHeight={contentHeight}
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
          okBtnProps={{ disabled: exceedsHardLimit }}
          description={exportHint}
          okText={intl.formatMessage({ id: 'common.button.export' })}
        ></ModalFooter>
      }
    >
      <div
        style={{
          position: 'sticky',
          top: 0,
          // Above antd's sticky table header and fixed columns (z-index 2-3),
          // which otherwise scroll up over the filter bar.
          zIndex: 10,
          backgroundColor: 'var(--ant-color-bg-elevated)',
          paddingBottom: 8
        }}
      >
        {/* Gap rather than a margin on either child: the suggestion banner
            renders nothing when the export fits, and a flex gap does not apply
            to an absent child — so there is no stray space to undo in the
            common case. */}
        <Flex vertical gap={12}>
          {estimateFailed && (
            <Alert
              type="warning"
              showIcon
              message={intl.formatMessage({
                id: 'usage.export.estimateFailed'
              })}
            />
          )}
          <ExportSuggestions
            estimate={estimate}
            exporting={exporting}
            estimating={estimating}
            {...suggestionHandlers}
          />
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
            organizationOptions={organizationOptions}
            userGroupOptions={userGroupOptions}
            selectedOrganizations={selectedOrganizations}
            selectedUserGroups={selectedUserGroups}
            onOrganizationsChange={(ids) => {
              setSelectedOrganizations(ids);
              setPageParams(INITIAL_PAGE);
            }}
            onUserGroupsChange={(ids) => {
              setSelectedUserGroups(ids);
              setPageParams(INITIAL_PAGE);
            }}
          />
        </Flex>
      </div>
      <Table
        columns={previewColumns as any}
        className={'scroll-table'}
        style={{ width: '100%', marginTop: 16 }}
        dataSource={rows}
        rowKey={(_r, index) => `${index}`}
        // ``estimating`` too: the columns come from the estimate, so until it
        // lands there is nothing to render and an idle empty table reads as
        // "no data" rather than "still working".
        loading={{ spinning: loading || estimating, size: 'middle' }}
        virtual
        scroll={{ x: scrollX, y: bodyHeight }}
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
