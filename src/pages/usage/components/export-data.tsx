import AutoTooltip from '@/components/auto-tooltip';
import ModalFooter from '@/components/modal-footer';
import ScrollerModal from '@/components/scroller-modal';
import { useIntl } from '@umijs/max';
import { Table, TableColumnType } from 'antd';
import React, { useEffect } from 'react';
import { useUsageFilters } from '../hooks/use-usage-filters';
import FilterBar from './filter-bar';

const ExportData: React.FC<{
  open: boolean;
  onCancel: () => void;
  initialScope: string;
  metaData: any;
}> = (props) => {
  const { open, onCancel, initialScope, metaData } = props || {};
  const intl = useIntl();

  const {
    filters,
    commonFilters,
    fetchData,
    loading,
    timeSeriesData,
    filterBar
  } = useUsageFilters({
    initialScope: initialScope,
    metaData,
    chartFilters: {},
    summaryColumns: {}
  });

  const exportTableColumns: TableColumnType[] = [
    {
      title: intl.formatMessage({ id: 'resources.table.index' }),
      width: 80,
      render(text: any, row: any, index: number) {
        return index + 1;
      }
    },
    {
      title: intl.formatMessage({ id: 'dashboard.usage.export.date' }),
      dataIndex: 'date'
    },
    {
      title: intl.formatMessage({ id: 'dashboard.usage.export.user' }),
      dataIndex: 'user_name',
      render: (text: string) => {
        return <AutoTooltip ghost>{text}</AutoTooltip>;
      }
    },
    {
      title: intl.formatMessage({ id: 'dashboard.usage.export.model' }),
      dataIndex: 'model_id',
      render: (text: string, record: any) => {
        return <AutoTooltip ghost>{text}</AutoTooltip>;
      }
    },

    {
      title: 'API Key',
      dataIndex: 'api_key',
      render: (text: string, record: any) => {
        return <AutoTooltip ghost>{text}</AutoTooltip>;
      }
    }
  ];

  const handleSubmit = () => {
    filterBar.onExportChart();
  };

  const handleOnCancel = () => {
    onCancel?.();
  };

  useEffect(() => {
    if (open) {
      fetchData(commonFilters, {});
    } else {
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
      <FilterBar {...filterBar} pageType="modal"></FilterBar>
      <Table
        columns={exportTableColumns}
        tableLayout={'auto'}
        style={{ width: '100%', marginTop: '16px', minHeight: 300 }}
        dataSource={timeSeriesData.series || []}
        loading={loading}
        rowKey="id"
        virtual
        scroll={{ y: 400 }}
        pagination={false}
      ></Table>
    </ScrollerModal>
  );
};

export default ExportData;
