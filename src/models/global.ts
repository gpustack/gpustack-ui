import { useState } from 'react';

const useGlobalState = () => {
  const [globalState, setGlobalState] = useState<any>({});
  return {
    globalState,
    setGlobalState
  };
};

export default useGlobalState;
