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
      setSelectedRowKeys((keys) => keys.filter((key) => !rowKey.includes(key)));
      setSelectedRows((rows) => rows.filter((row) => !rowKey.includes(row.id)));
      return;
    }
    setSelectedRowKeys((keys) => keys.filter((key) => key !== rowKey));
    setSelectedRows((rows) => rows.filter((row) => row.id !== rowKey));
  };

  const removeSelectedKeys = (rowKeys: React.Key[]) => {
    setSelectedRowKeys((keys) => keys.filter((key) => !rowKeys.includes(key)));
    setSelectedRows((rows) => rows.filter((row) => !rowKeys.includes(row.id)));
  };

  const rowSelection = {
    selectedRowKeys,
    selectedRows,
    clearSelections,
    onChange: onSelectChange,
    removeSelectedKeys,
    removeSelectedKey
  };

  return rowSelection;
}
