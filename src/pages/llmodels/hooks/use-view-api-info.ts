import { useState } from 'react';

const useViewApIInfo = () => {
  const [apiAccessInfo, setAPIAccessInfo] = useState<any>({
    show: false,
    data: {}
  });

  const openViewAPIInfo = (row: any) => {
    setAPIAccessInfo({
      show: true,
      data: row
    });
  };

  const closeViewAPIInfo = () => {
    setAPIAccessInfo({
      show: false,
      data: {}
    });
  };

  return {
    apiAccessInfo,
    openViewAPIInfo,
    closeViewAPIInfo
  };
};

export default useViewApIInfo;
