import AutoTooltip from '@/components/auto-tooltip';
import ModalFooter from '@/components/modal-footer';
import ScrollerModal from '@/components/scroller-modal';
import { exportJsonToExcel } from '@/utils/excel-reader';
import { useIntl } from '@umijs/max';
import { Table, TableColumnType } from 'antd';
import dayjs from 'dayjs';
import React, { useEffect } from 'react';
import { DASHBOARD_USAGE_API } from '../../apis';
import { TableRow } from '../../config/types';
import FilterBar from './filter-bar';
import useUsageData from './use-usage-data';

const ExportData: React.FC<{
  open: boolean;
  onCancel: () => void;
}> = (props) => {
  const { open, onCancel } = props || {};
  const intl = useIntl();
  const {
    init,
    setResult,
    loading,
    result,
    userList,
    modelList,
    query,
    setQuery,
    handleExport,
    handleDateChange,
    handleUsersChange,
    handleModelsChange
  } = useUsageData<{
    items: TableRow[];
  }>({
    url: DASHBOARD_USAGE_API,
    disabledDate: false
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
      dataIndex: 'user_id',
      render: (text: string) => {
        return (
          <AutoTooltip ghost>
            {userList.find((item) => item.value === text)?.label}
          </AutoTooltip>
        );
      }
    },
    {
      title: intl.formatMessage({ id: 'dashboard.usage.export.model' }),
      dataIndex: 'model_id',
      render: (text: string) => {
        return (
          <AutoTooltip ghost>
            {modelList.find((item) => item.value === text)?.label || text}
          </AutoTooltip>
        );
      }
    },

    {
      title: 'Completion Tokens',
      dataIndex: 'completion_token_count',
      width: 170,
      align: 'right'
    },
    {
      title: 'Prompt Tokens',
      dataIndex: 'prompt_token_count',
      align: 'right',
      width: 150
    },
    {
      title: 'API Requests',
      dataIndex: 'request_count',
      align: 'right',
      width: 150
    }
  ];
  const handleSubmit = () => {
    const fileName = `usage-data_${query.start_date || ''}_${query.end_date || ''}.xlsx`;
    exportJsonToExcel({
      jsonData: result.data?.items || [],
      fileName: fileName,
      fields: exportTableColumns
        .map((col) => col.dataIndex)
        .filter(Boolean) as string[],
      fieldLabels: {
        user_id: 'User',
        model_id: 'Model',
        date: 'Date',
        prompt_token_count: 'Prompt Tokens',
        completion_token_count: 'Completion Tokens',
        request_count: 'API Requests'
      },
      formatMap: {
        user_id: (value: string) => {
          return userList.find((item) => item.value === value)?.label || value;
        },
        model_id: (value: string) => {
          return modelList.find((item) => item.value === value)?.label || value;
        }
      }
    });
  };

  useEffect(() => {
    if (open) {
      init();
    } else {
      setQuery({
        start_date: dayjs().subtract(29, 'days').format('YYYY-MM-DD'),
        end_date: dayjs().format('YYYY-MM-DD'),
        model_ids: [],
        user_ids: []
      });
      setResult({
        start_date: '',
        end_date: '',
        data: { items: [] }
      });
    }
  }, [open]);

  return (
    <ScrollerModal
      title={intl.formatMessage({ id: 'dashboard.usage.export' })}
      open={open}
      centered={false}
      onCancel={onCancel}
      destroyOnClose={true}
      closeIcon={true}
      maskClosable={false}
      keyboard={false}
      width={1000}
      style={{
        top: '10%'
      }}
      styles={{
        content: {
          padding: '0px'
        },
        header: {
          padding: 'var(--ant-modal-content-padding)',
          paddingBottom: '0'
        },
        body: {
          padding: '0 var(--ant-modal-content-padding)'
        },
        footer: {
          padding: '0 var(--ant-modal-content-padding)'
        }
      }}
      footer={
        <ModalFooter
          onOk={handleSubmit}
          onCancel={onCancel}
          okText={intl.formatMessage({ id: 'common.button.export' })}
        ></ModalFooter>
      }
    >
      <FilterBar
        disabledDate={false}
        url={DASHBOARD_USAGE_API}
        query={query}
        userList={userList}
        modelList={modelList}
        handleDateChange={handleDateChange}
        handleUsersChange={handleUsersChange}
        handleModelsChange={handleModelsChange}
      ></FilterBar>
      <Table
        columns={exportTableColumns}
        tableLayout={'auto'}
        style={{ width: '100%', marginTop: '16px' }}
        dataSource={result.data?.items || []}
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
