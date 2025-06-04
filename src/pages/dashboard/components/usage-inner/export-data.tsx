import ModalFooter from '@/components/modal-footer';
import ScrollerModal from '@/components/scroller-modal';
import useTableFetch from '@/hooks/use-table-fetch';
import { useIntl } from '@umijs/max';
import { DatePicker, Select, Space, Table } from 'antd';
import React from 'react';
import { queryDashboardUsageData } from '../../apis';
import { exportTableColumns } from '../../config';

const ExportData: React.FC<{
  open: boolean;
  onCancel: () => void;
}> = (props) => {
  const {
    dataSource,
    rowSelection,
    queryParams,
    modalRef,
    handleDelete,
    handleDeleteBatch,
    fetchData,
    handlePageChange,
    handleTableChange,
    handleSearch,
    handleNameChange
  } = useTableFetch({
    fetchAPI: queryDashboardUsageData
  });
  const { open, onCancel } = props || {};
  const intl = useIntl();

  const handleSubmit = () => {};

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
      width={800}
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
      <Space>
        <DatePicker.RangePicker style={{ width: 240 }}></DatePicker.RangePicker>
        <Select
          mode="multiple"
          maxTagCount={1}
          placeholder={intl.formatMessage({
            id: 'dashboard.usage.selectuser'
          })}
          style={{ width: 160 }}
        ></Select>
        <Select
          mode="multiple"
          maxTagCount={1}
          placeholder={intl.formatMessage({
            id: 'dashboard.usage.selectmodel'
          })}
          style={{ width: 160 }}
        ></Select>
      </Space>
      <Table
        columns={exportTableColumns}
        tableLayout={dataSource.loadend ? 'auto' : 'fixed'}
        style={{ width: '100%', marginTop: '16px' }}
        dataSource={dataSource.dataList}
        loading={dataSource.loading}
        rowKey="id"
        onChange={handleTableChange}
        pagination={{
          showSizeChanger: true,
          pageSize: queryParams.perPage,
          current: queryParams.page,
          total: dataSource.total,
          hideOnSinglePage: queryParams.perPage === 10,
          onChange: handlePageChange
        }}
      >
        {' '}
      </Table>
    </ScrollerModal>
  );
};

export default ExportData;
