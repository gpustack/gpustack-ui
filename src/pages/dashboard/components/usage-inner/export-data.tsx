import { exportJsonToExcel } from '@/utils/excel-reader';
import { AutoTooltip, ModalFooter, ScrollerModal } from '@gpustack/core-ui';
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
    selectedModels,
    query,
    setQuery,
    resetQuery,
    handleDateChange,
    handleUsersChange,
    handleModelsChange
  } = useUsageData<{
    items: TableRow[];
  }>({
    url: DASHBOARD_USAGE_API,
    disabledDate: false
  });

  const getModelName = (record: any) => {
    if (record.model_id) {
      const children =
        modelList.find((item) => item.value === 'deployments')?.children || [];
      return (
        children?.find((item) => item.value === record.model_id)?.label ||
        record.model_id
      );
    }
    const provider =
      modelList.find((item) => item.value === record.provider_id)?.label ||
      record.provider_id;
    return `${provider} / ${record.model_name}`;
  };

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
      render: (text: string, record: any) => {
        console.log('render model id: ', record, modelList);
        return <AutoTooltip ghost>{getModelName(record)}</AutoTooltip>;
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
      fileName: fileName,
      sheets: [
        {
          jsonData: result.data?.items || [],
          sheetName: 'usage_data',
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
              return (
                userList.find((item) => item.value === value)?.label || value
              );
            },
            model_id: (value: string, record: any) => {
              return getModelName(record);
            }
          }
        }
      ]
    });
  };

  const handleOnCancel = () => {
    onCancel?.();
    resetQuery();
  };

  useEffect(() => {
    if (open) {
      init();
    } else {
      setQuery({
        start_date: dayjs().subtract(29, 'days').format('YYYY-MM-DD'),
        end_date: dayjs().format('YYYY-MM-DD'),
        model_ids: [],
        provider_model_names: [],
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
      onCancel={handleOnCancel}
      destroyOnHidden={true}
      closeIcon={true}
      mask={{
        closable: false
      }}
      keyboard={false}
      width={1000}
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
        disabledDate={false}
        url={DASHBOARD_USAGE_API}
        query={query}
        userList={userList}
        modelList={modelList}
        selectedModels={selectedModels}
        cascaderWidth={360}
        handleDateChange={handleDateChange}
        handleUsersChange={handleUsersChange}
        handleModelsChange={handleModelsChange}
      ></FilterBar>
      <Table
        columns={exportTableColumns}
        tableLayout={'auto'}
        style={{ width: '100%', marginTop: '16px', minHeight: 300 }}
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
