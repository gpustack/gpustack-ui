// 全局共享数据示例
// import { DEFAULT_NAME } from '@/constants';
import { useState } from 'react';

const useGlobalState = () => {
  const [globalState, setGlobalState] = useState<any>({});
  return {
    globalState,
    setGlobalState
  };
};

export default useGlobalState;
