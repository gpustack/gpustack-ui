import { useState } from 'react';

export default function useTableRowSelection() {
  const [selectedRowKeys, setSelectedRowKeys] = useState<React.Key[]>([]);

  const onSelectChange = (selectedRowKeys: React.Key[]) => {
    setSelectedRowKeys(selectedRowKeys);
  };

  const clearSelections = () => {
    setSelectedRowKeys([]);
  };

  const removeSelectedKey = (rowKey: React.Key | React.Key[]) => {
    if (Array.isArray(rowKey)) {
      setSelectedRowKeys((keys) => keys.filter((key) => !rowKey.includes(key)));
      return;
    }
    setSelectedRowKeys((keys) => keys.filter((key) => key !== rowKey));
  };

  const removeSelectedKeys = (rowKeys: React.Key[]) => {
    setSelectedRowKeys((keys) => keys.filter((key) => !rowKeys.includes(key)));
  };

  const rowSelection = {
    selectedRowKeys,
    clearSelections,
    onChange: onSelectChange,
    removeSelectedKeys,
    removeSelectedKey
  };

  return rowSelection;
}
