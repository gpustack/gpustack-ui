import { useIntl } from '@umijs/max';
import { driver, type Config } from 'driver.js';
import { useEffect, useRef } from 'react';

export const useDriver = (config?: Config & { id: string }) => {
  const intl = useIntl();
  const driverRef = useRef<any>(null);

  const handleDoNotShowAgain = () => {};

  const init = () => {
    driverRef.current = driver({
      overlayOpacity: 0.2,
      animate: false,
      ...config
    });
  };

  const start = () => {
    if (!driverRef.current) {
      init();
    }
    driverRef.current.drive();
  };

  useEffect(() => {
    return () => {
      driverRef.current?.destroy();
    };
  }, []);

  return { start, initDriver: init, driver: driverRef.current };
};

export default useDriver;
