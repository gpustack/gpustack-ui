import { useCallback, useState } from 'react';

export default function useExpandedRowKeys() {
  const [expandedRowKeys, setExpandedRowKeys] = useState<React.Key[]>([]);

  const handleExpandChange = useCallback(
    (expanded: boolean, record: any, rowKey: any) => {
      if (expanded) {
        setExpandedRowKeys((keys) => [...keys, rowKey]);
      } else {
        setExpandedRowKeys((keys) => keys.filter((key) => key !== rowKey));
      }
    },
    []
  );

  const updateExpandedRowKeys = (keys: React.Key[]) => {
    setExpandedRowKeys(keys);
  };

  const removeExpandedRowKey = (keys: React.Key[]) => {
    // remove expanded row keys that are in the deleted keys
    const newExpandedRowKeys = expandedRowKeys.filter(
      (key) => !keys.includes(key)
    );
    setExpandedRowKeys(newExpandedRowKeys);
  };

  const clearExpandedRowKeys = () => {
    setExpandedRowKeys([]);
  };

  return {
    expandedRowKeys,
    clearExpandedRowKeys,
    updateExpandedRowKeys,
    removeExpandedRowKey,
    handleExpandChange
  };
}
