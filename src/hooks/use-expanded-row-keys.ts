import { useCallback, useState } from 'react';

export default function useExpandedRowKeys(defaultKeys: React.Key[] = []) {
  const [expandedRowKeys, setExpandedRowKeys] =
    useState<React.Key[]>(defaultKeys);
  const [currentExpand, setCurrentExpand] = useState<React.Key | null>(null);

  const handleExpandChange = useCallback(
    (expanded: boolean, record: any, rowKey: any) => {
      if (expanded) {
        setExpandedRowKeys((keys) => [...keys, rowKey]);
        setCurrentExpand(rowKey);
      } else {
        setExpandedRowKeys((keys) => keys.filter((key) => key !== rowKey));
        setCurrentExpand(null);
      }
    },
    []
  );

  const handleExpandAll = useCallback(
    (expanded: boolean, keys: React.Key[] = []) => {
      if (!expanded) {
        setExpandedRowKeys([]);
        setCurrentExpand(null);
      }
      if (expanded) {
        setExpandedRowKeys((prevKeys) => [...new Set([...prevKeys, ...keys])]);
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
    setCurrentExpand(null);
  };

  return {
    expandedRowKeys,
    currentExpand,
    setCurrentExpand,
    clearExpandedRowKeys,
    updateExpandedRowKeys,
    removeExpandedRowKey,
    handleExpandChange,
    handleExpandAll
  };
}
