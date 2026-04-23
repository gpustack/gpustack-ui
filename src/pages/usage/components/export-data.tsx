import { exportJsonToExcel } from '@/utils/excel-reader';
import { AutoTooltip, ModalFooter, ScrollerModal } from '@gpustack/core-ui';
import { useIntl } from '@umijs/max';
import { Table, TableColumnType } from 'antd';
import React, { useEffect } from 'react';
import { useUsageFilters } from '../hooks/use-usage-filters';
import useQueryBreakdownList from '../services/use-query-breakdown-list';
import getBreakdownRowKey from '../utils/get-breakdown-row-key';
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
    activeModels: ValueType[][];
    activeApiKeys: ValueType[][];
    users: string[];
    start_date: string;
    end_date: string;
  };
  commonFilters: {
    scope: string;
    start_date: string;
    end_date: string;
    models: string[];
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

  const [pageParams, setPageParams] = React.useState<{
    page: number;
    perPage: number;
  }>(INITIAL_PAGE_PARAMS);

  const {
    fetchData: fetchExportData,
    loading,
    dataSource,
    cancelRequest
  } = useQueryBreakdownList({
    key: 'exportTableData'
  });

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
        granularity: 'day',
        sort_by: '-date',
        group_by: ['date', 'user', 'model', 'api_key'],
        filters: nextFilters,
        scope: initialScope,
        start_date: nextCommonFilters.start_date,
        end_date: nextCommonFilters.end_date
      });
    }
  });

  const exportTableColumns: TableColumnType<any>[] = [
    {
      title: intl.formatMessage({ id: 'resources.table.index' }),
      width: 80,
      render(text: any, row: any, index: number) {
        return index + 1;
      }
    },
    {
      title: intl.formatMessage({ id: 'dashboard.usage.export.date' }),
      dataIndex: ['date', 'label'],
      render: (text: string) => {
        return (
          <AutoTooltip ghost>
            <span className="text-primary">{text}</span>
          </AutoTooltip>
        );
      }
    },
    {
      title: intl.formatMessage({ id: 'usage.table.cluster' }),
      dataIndex: ['model', 'identity', 'value', 'cluster_name'],
      render: (text: string) => {
        return <AutoTooltip ghost>{text}</AutoTooltip>;
      }
    },
    {
      title: intl.formatMessage({ id: 'dashboard.usage.export.model' }),
      dataIndex: ['model', 'identity', 'value', 'model_name'],
      render: (text: string, record: any) => {
        return (
          <AutoTooltip ghost>
            {record?.model?.identity?.value?.provider_name
              ? `${record?.model?.identity?.value?.provider_name}/${text}`
              : text}
          </AutoTooltip>
        );
      }
    },
    {
      title: intl.formatMessage({ id: 'dashboard.usage.export.user' }),
      dataIndex: ['user', 'label'],
      render: (text: string) => {
        return <AutoTooltip ghost>{text}</AutoTooltip>;
      }
    },
    {
      title: intl.formatMessage({ id: 'usage.filter.group.apikey' }),
      dataIndex: ['api_key', 'label'],
      render: (text: string, record: any) => {
        return <AutoTooltip ghost>{text}</AutoTooltip>;
      }
    },
    {
      title: intl.formatMessage({ id: 'usage.filter.inputTokens' }),
      dataIndex: 'input_tokens'
    },
    {
      title: intl.formatMessage({ id: 'usage.filter.outputTokens' }),
      dataIndex: 'output_tokens'
    },
    {
      title: intl.formatMessage({ id: 'usage.filter.totalTokens' }),
      dataIndex: 'total_tokens'
    },
    {
      title: intl.formatMessage({ id: 'usage.filter.apiRequests' }),
      dataIndex: 'api_requests'
    }
  ];

  const handleSubmit = () => {
    exportJsonToExcel({
      fileName: `usage_export_${commonFilters.start_date}_${commonFilters.end_date}.xlsx`,
      sheets: [
        {
          jsonData: (dataSource.dataList || []).map((item: any) => ({
            date: item?.date?.label,
            user: item?.user?.label,
            cluster: item?.model?.identity?.value?.cluster_name,
            model: item?.model?.identity?.value?.model_name,
            api_key: item?.api_key?.label,
            input_tokens: item?.input_tokens,
            output_tokens: item?.output_tokens,
            total_tokens: item?.total_tokens,
            api_requests: item?.api_requests
          })),
          sheetName: 'usage',
          fields: [
            'date',
            'user',
            'model',
            'api_key',
            'input_tokens',
            'output_tokens',
            'total_tokens',
            'api_requests'
          ],
          fieldLabels: {
            date: intl.formatMessage({ id: 'dashboard.usage.export.date' }),
            user: intl.formatMessage({ id: 'dashboard.usage.export.user' }),
            cluster: intl.formatMessage({ id: 'usage.table.cluster' }),
            model: intl.formatMessage({ id: 'dashboard.usage.export.model' }),
            api_key: intl.formatMessage({ id: 'usage.table.provider' }),
            input_tokens: intl.formatMessage({
              id: 'usage.filter.inputTokens'
            }),
            output_tokens: intl.formatMessage({
              id: 'usage.filter.outputTokens'
            }),
            total_tokens: intl.formatMessage({
              id: 'usage.filter.totalTokens'
            }),
            api_requests: intl.formatMessage({ id: 'usage.filter.apiRequests' })
          },
          formatMap: {}
        }
      ]
    });
  };

  const handlePageChange = (page: number, pageSize: number) => {
    setPageParams({ page, perPage: pageSize });
    fetchExportData({
      ...pageParams,
      page,
      perPage: pageSize,
      granularity: 'day',
      group_by: ['date', 'user', 'model', 'api_key'],
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
        granularity: 'day',
        group_by: ['date', 'user', 'model', 'api_key'],
        filters,
        sort_by: '-date',
        scope: initialScope,
        start_date: commonFilters.start_date,
        end_date: commonFilters.end_date
      });
    } else {
      cancelRequest();
    }
  }, [open]);

  return (
    <ScrollerModal
      title={intl.formatMessage({ id: 'dashboard.usage.export' })}
      open={open}
      centered={false}
      onCancel={handleOnCancel}
      destroyOnHidden={true}
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
          okText={intl.formatMessage({ id: 'common.button.export' })}
        ></ModalFooter>
      }
    >
      <FilterBar
        {...filterBar}
        pageType="modal"
        handlePickerChange={handlePickerChange}
      ></FilterBar>
      <Table
        columns={exportTableColumns}
        tableLayout={'auto'}
        style={{ width: '100%', marginTop: '16px', minHeight: 400 }}
        dataSource={dataSource.dataList || []}
        rowKey={getBreakdownRowKey}
        loading={{
          spinning: loading,
          size: 'middle'
        }}
        virtual
        scroll={{ y: 400 }}
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
