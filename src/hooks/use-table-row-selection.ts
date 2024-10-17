import { useState } from 'react';

export default function useTableRowSelection() {
  const [selectedRowKeys, setSelectedRowKeys] = useState<React.Key[]>([]);

  const onSelectChange = (selectedRowKeys: React.Key[]) => {
    setSelectedRowKeys(selectedRowKeys);
  };

  const clearSelections = () => {
    setSelectedRowKeys([]);
  };

  const removeSelectedKey = (rowKey: React.Key) => {
    setSelectedRowKeys((keys) => keys.filter((key) => key !== rowKey));
  };

  const rowSelection = {
    selectedRowKeys,
    clearSelections,
    onChange: onSelectChange,
    removeSelectedKey
  };

  return rowSelection;
}
