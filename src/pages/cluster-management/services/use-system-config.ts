import { useEffect, useState } from 'react';
import { querySystemConfig } from '../apis';
import { SystemConfig } from '../config/types';

export default function useSystemConfig() {
  const [systemConfig, setSystemConfig] = useState<SystemConfig>(
    {} as SystemConfig
  );

  const fetchSystemConfig = async () => {
    try {
      const data = await querySystemConfig();
      setSystemConfig(data);
    } catch (error) {
      // handle error if needed
      setSystemConfig({} as SystemConfig);
    }
  };

  useEffect(() => {
    fetchSystemConfig();
  }, []);

  return { systemConfig };
}
