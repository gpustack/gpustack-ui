import { useState } from 'react';

export default function useTableRowSelection() {
  const [selectedRowKeys, setSelectedRowKeys] = useState<React.Key[]>([]);

  const onSelectChange = (selectedRowKeys: React.Key[]) => {
    setSelectedRowKeys(selectedRowKeys);
  };

  const clearSelections = () => {
    setSelectedRowKeys([]);
  };

  const rowSelection = {
    selectedRowKeys,
    clearSelections,
    onChange: onSelectChange
  };

  return rowSelection;
}
