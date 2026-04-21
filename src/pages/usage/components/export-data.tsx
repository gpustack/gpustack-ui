import AutoTooltip from '@/components/auto-tooltip';
import ModalFooter from '@/components/modal-footer';
import ScrollerModal from '@/components/scroller-modal';
import { exportJsonToExcel } from '@/utils/excel-reader';
import { useIntl } from '@umijs/max';
import { Table, TableColumnType } from 'antd';
import React, { useEffect } from 'react';
import { useUsageFilters } from '../hooks/use-usage-filters';
import useQueryBreakdownList from '../services/use-query-breakdown-list';
import getBreakdownRowKey from '../utils/get-breakdown-row-key';
import FilterBar from './filter-bar';

type DateType = 'date' | 'week' | 'month' | 'quarter' | 'year';
type ValueType = string | number | null;

const ExportData: React.FC<{
  open: boolean;
  onCancel: () => void;
  initialScope: string;
  metaData: any;
  granularity: string;
  initialState: {
    activeModels: ValueType[][];
    activeApiKeys: ValueType[][];
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
  }>({
    page: 1,
    perPage: 100
  });

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
        granularity: nextChartFilters.granularity,
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
      title: 'Cluster',
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
      title: 'API Key',
      dataIndex: ['api_key', 'label'],
      render: (text: string, record: any) => {
        return <AutoTooltip ghost>{text}</AutoTooltip>;
      }
    },
    {
      title: 'Input Tokens',
      dataIndex: 'input_tokens'
    },
    {
      title: 'Output Tokens',
      dataIndex: 'output_tokens'
    },
    {
      title: 'Total Tokens',
      dataIndex: 'total_tokens'
    },
    {
      title: 'API Requests',
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
            cluster: 'Cluster',
            model: intl.formatMessage({ id: 'dashboard.usage.export.model' }),
            api_key: 'API Key',
            input_tokens: 'Input Tokens',
            output_tokens: 'Output Tokens',
            total_tokens: 'Total Tokens',
            api_requests: 'API Requests'
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
      granularity,
      group_by: ['date', 'user', 'model', 'api_key'],
      filters,
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
      fetchExportData({
        ...pageParams,
        granularity,
        group_by: ['date', 'user', 'model', 'api_key'],
        filters,
        scope: initialScope,
        start_date: commonFilters.start_date,
        end_date: commonFilters.end_date
      });
    } else {
      cancelRequest();
    }
  }, [open]);

  console.log('export dataSource', filterBar);

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
      width={1200}
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
        style={{ width: '100%', marginTop: '16px', minHeight: 300 }}
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
