import { useState } from 'react';

const useScrollActiveChange = (options: {
  initalActiveKeys: string[];
  initialCollapseKeys?: string[];
}) => {
  const [activeKey, setActiveKey] = useState<string[]>(
    options.initalActiveKeys
  );
  const [collapseKeys, setCollapseKeys] = useState<string[]>(
    options.initialCollapseKeys || options.initalActiveKeys
  );

  const handleActiveChange = (key: string[]) => {
    setActiveKey(key);
    setCollapseKeys(key);
  };

  const handleOnCollapseChange = (keys: string | string[]) => {
    const keysArray = Array.isArray(keys) ? keys : [keys];
    setActiveKey(keysArray);
    setCollapseKeys(keysArray);
  };

  const updateActiveKey = (keys: string[]) => {
    setActiveKey((prev: string[]) => [...new Set([...prev, ...keys])]);
    setCollapseKeys((prev) => [...new Set([...prev, ...keys])]);
  };

  return {
    activeKey,
    collapseKeys,
    handleActiveChange,
    handleOnCollapseChange,
    updateActiveKey
  };
};

export default useScrollActiveChange;
