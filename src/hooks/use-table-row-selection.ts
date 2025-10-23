import { useState } from 'react';

export default function useTableRowSelection() {
  const [selectedRowKeys, setSelectedRowKeys] = useState<React.Key[]>([]);
  const [selectedRows, setSelectedRows] = useState<any[]>([]);

  const onSelectChange = (
    selectedRowKeys: React.Key[],
    selectedRows: any[]
  ) => {
    setSelectedRowKeys(selectedRowKeys);
    setSelectedRows(selectedRows);
  };

  const clearSelections = () => {
    setSelectedRowKeys([]);
    setSelectedRows([]);
  };

  const removeSelectedKey = (rowKey: React.Key | React.Key[]) => {
    if (Array.isArray(rowKey)) {
      const keys = selectedRowKeys.filter((key) => !rowKey.includes(key));
      setSelectedRowKeys(keys);
      setSelectedRows((rows) => rows.filter((row) => !rowKey.includes(row.id)));
      return keys;
    }
    const keys = selectedRowKeys.filter((key) => key !== rowKey);
    setSelectedRowKeys(keys);
    setSelectedRows((rows) => rows.filter((row) => row.id !== rowKey));
    return keys;
  };

  const removeSelectedKeys = (rowKeys: React.Key[]) => {
    const keys = selectedRowKeys.filter((key) => !rowKeys.includes(key));
    setSelectedRowKeys(keys);
    setSelectedRows((rows) => rows.filter((row) => !rowKeys.includes(row.id)));
    return keys;
  };

  const rowSelection = {
    selectedRowKeys,
    selectedRows,
    enableSelection: true,
    getCheckboxProps: (record: Record<string, any>) => ({
      disabled: record.disabled
    }),
    clearSelections,
    onChange: onSelectChange,
    removeSelectedKeys,
    removeSelectedKey
  };

  return rowSelection;
}
