import { ModalFooter, ScrollerModal } from '@gpustack/core-ui';
import { useIntl } from '@umijs/max';
import { Alert, Flex, Table } from 'antd';
import dayjs from 'dayjs';
import React, { useEffect } from 'react';
import { XLSX_MAX_ROWS_PER_SHEET } from '../config';
import { useExportPreviewColumns } from '../hooks/use-export-preview-columns';
import { useExportPreviewLayout } from '../hooks/use-export-preview-layout';
import { useUsageFilters } from '../hooks/use-usage-filters';
import useExportUsage from '../services/use-export-usage';
import useQueryBreakdownList from '../services/use-query-breakdown-list';
import { tokenPreviewValue } from '../utils/export-preview-values';
import getBreakdownRowKey from '../utils/get-breakdown-row-key';
import ExportSuggestions from './export-suggestions';
import FilterBar from './filter-bar';

type DateType = 'date' | 'week' | 'month' | 'quarter' | 'year';
type ValueType = string | number | null;
const INITIAL_PAGE_PARAMS = {
  page: 1,
  perPage: 100
};

const ExportData: React.FC<{
  open: boolean;
  onCancel: () => void;
  initialScope: string;
  metaData: any;
  granularity: string;
  initialState: {
    activeRoutes: string[];
    activeApiKeys: ValueType[][];
    users: string[];
    start_date: string;
    end_date: string;
  };
  commonFilters: {
    scope: string;
    start_date: string;
    end_date: string;
    routes: string[];
    users: string[];
    api_keys: string[];
  };

  handlePickerChange: (picker: DateType) => void;
}> = (props) => {
  const {
    open,
    onCancel,
    initialScope,
    metaData,
    granularity,
    handlePickerChange,
    initialState
  } = props || {};
  const intl = useIntl();

  // Members are forced to self scope, where the backend forbids grouping by
  // user (privacy) — including it 403s the export request. Drop the user
  // dimension (and its column) when we can't group by it.
  const canGroupByUser = initialScope !== 'self';
  const exportGroupBy = canGroupByUser
    ? ['date', 'user', 'route', 'api_key']
    : ['date', 'route', 'api_key'];

  const [pageParams, setPageParams] = React.useState<{
    page: number;
    perPage: number;
  }>(INITIAL_PAGE_PARAMS);
  // The exported bucket size. Fixed at day: a date-grouped export means one
  // row per calendar day, and the remedies for an over-large export never
  // change that (they narrow the range or split the file, both lossless).
  const exportGranularity = 'day';

  const {
    fetchData: fetchExportData,
    loading,
    dataSource,
    cancelRequest
  } = useQueryBreakdownList({
    key: 'exportTableData'
  });

  // The export payload mirrors what the preview is showing, minus pagination:
  // the server streams the whole filtered set. Sending the filters rather than
  // the rows is the point — the file can no longer disagree with the query
  // that produced the preview.
  const buildExportRequest = (
    nextFilters: any,
    nextCommonFilters: { start_date: string; end_date: string }
  ) => ({
    start_date: nextCommonFilters.start_date,
    end_date: nextCommonFilters.end_date,
    scope: initialScope,
    filters: nextFilters,
    granularity: exportGranularity,
    sort_by: '-date',
    group_by: exportGroupBy
  });

  const {
    estimate,
    estimating,
    estimateFailed,
    exporting,
    fetchEstimate,
    resetEstimate,
    exportData
  } = useExportUsage();

  const { filters, commonFilters, filterBar } = useUsageFilters({
    initialScope: initialScope,
    metaData,
    chartFilters: {
      metric: 'total_tokens',
      group_by: null,
      granularity: props.granularity || 'day'
    },
    initialState: initialState,
    summaryColumns: [],
    autoFetchOnFilterChange: true,
    onFetchData: ({
      chartFilters: nextChartFilters,
      filters: nextFilters,
      commonFilters: nextCommonFilters
    }) => {
      fetchExportData({
        ...pageParams,
        granularity: exportGranularity,
        sort_by: '-date',
        group_by: exportGroupBy,
        filters: nextFilters,
        scope: initialScope,
        start_date: nextCommonFilters.start_date,
        end_date: nextCommonFilters.end_date
      });
      // Re-size the export with the same predicate the preview just used, so
      // the row count under the button never describes stale filters.
      fetchEstimate(buildExportRequest(nextFilters, nextCommonFilters));
    }
  });

  // The preview renders the columns the FILE will have, taken from the
  // estimate — the dialog is called Export Data, so showing a different set
  // than the download would be a small lie. The estimate is also what defines
  // the set, so the two cannot drift apart.
  const { columns: previewColumns, scrollX } = useExportPreviewColumns(
    estimate?.sheets?.[0]?.columns,
    tokenPreviewValue,
    pageParams
  );

  // Thresholds come from the server so the dialog can't drift from what the
  // export endpoint will actually accept.
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

  // Every remedy the server proposed is one click. The numbers are its, not
  // ours: recomputing "how many days fit" in the client is how the advice
  // before the click starts disagreeing with the error after it.
  const suggestionHandlers = {
    onShortenRange: (maxDays: number) => {
      // Keep the end date and pull the start forward: the most recent window
      // is what a user narrowing an export almost always wants.
      const end = dayjs(commonFilters.end_date);
      const start = end.subtract(Math.max(0, maxDays - 1), 'day');
      // antd's RangePicker signature. Today's handler reads only the string
      // pair, but the objects are already in hand, so send them rather than
      // leave a `null` for a future reader of `dates[0]` to trip over.
      filterBar.onDateChange?.(
        [start, end],
        [start.format('YYYY-MM-DD'), end.format('YYYY-MM-DD')]
      );
    },
    onSplitExport: async (_parts: number) => {
      const ok = await exportData({
        ...buildExportRequest(filters, commonFilters),
        split: 'auto'
      });
      if (ok) {
        handleOnCancel();
      }
    }
  };

  const handleSubmit = async () => {
    const ok = await exportData(buildExportRequest(filters, commonFilters));
    if (ok) {
      handleOnCancel();
    }
  };

  const handlePageChange = (page: number, pageSize: number) => {
    setPageParams({ page, perPage: pageSize });
    fetchExportData({
      ...pageParams,
      page,
      perPage: pageSize,
      granularity: exportGranularity,
      group_by: exportGroupBy,
      filters,
      sort_by: '-date',
      scope: initialScope,
      start_date: commonFilters.start_date,
      end_date: commonFilters.end_date
    });
  };

  const handleOnCancel = () => {
    onCancel?.();
  };

  useEffect(() => {
    if (open) {
      setPageParams(INITIAL_PAGE_PARAMS);
      fetchExportData({
        ...INITIAL_PAGE_PARAMS,
        granularity: exportGranularity,
        group_by: exportGroupBy,
        filters,
        sort_by: '-date',
        scope: initialScope,
        start_date: commonFilters.start_date,
        end_date: commonFilters.end_date
      });
      fetchEstimate(buildExportRequest(filters, commonFilters));
    } else {
      cancelRequest();
      resetEstimate();
    }
  }, [open]);

  return (
    <ScrollerModal
      title={intl.formatMessage({ id: 'dashboard.usage.export' })}
      open={open}
      centered={false}
      onCancel={handleOnCancel}
      destroyOnHidden={true}
      maxContentHeight={contentHeight}
      closeIcon={true}
      mask={{
        closable: false
      }}
      keyboard={false}
      width={1280}
      style={{
        top: '10%'
      }}
      footer={
        <ModalFooter
          onOk={handleSubmit}
          onCancel={handleOnCancel}
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
        {/* See resource-export-data: a flex gap contributes nothing when the
            suggestion banner is absent, which is the usual case. */}
        <Flex vertical gap={12}>
          <FilterBar
            {...filterBar}
            pageType="modal"
            handlePickerChange={handlePickerChange}
          ></FilterBar>
          <ExportSuggestions
            estimate={estimate}
            exporting={exporting}
            estimating={estimating}
            {...suggestionHandlers}
          />
          {estimateFailed && (
            <Alert
              type="warning"
              showIcon
              message={intl.formatMessage({
                id: 'usage.export.estimateFailed'
              })}
            />
          )}
        </Flex>
      </div>
      <Table
        columns={previewColumns}
        className={'scroll-table'}
        style={{ width: '100%', marginTop: 16 }}
        dataSource={dataSource.dataList || []}
        rowKey={(record) => getBreakdownRowKey(record, 'export')}
        loading={{
          // ``estimating`` too — the columns come from the estimate, so an
          // idle empty table would read as "no data" rather than "working".
          spinning: loading || estimating,
          size: 'middle'
        }}
        virtual
        scroll={{ x: scrollX, y: bodyHeight }}
        pagination={{
          size: 'small',
          pageSize: pageParams.perPage,
          current: pageParams.page,
          total: dataSource.total || 0,
          onChange: handlePageChange,
          hideOnSinglePage: pageParams.perPage === 100,
          showSizeChanger: true
        }}
      ></Table>
    </ScrollerModal>
  );
};

export default ExportData;
