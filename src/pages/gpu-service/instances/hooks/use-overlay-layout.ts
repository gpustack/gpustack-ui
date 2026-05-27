import { useCallback, useEffect, useState } from 'react';
import instanceStyles from '../styles/instances.module.less';

const FALLBACK_WIDTH = `calc((100vw - 220px) / 3 + 16px)`;

const useOverlayLayout = (open: boolean) => {
  const [drawerWidth, setDrawerWidth] = useState<number | string>(
    FALLBACK_WIDTH
  );

  useEffect(() => {
    if (!open) return;
    const formWrapper = document.querySelector<HTMLElement>(
      `.${instanceStyles.formWrapper}`
    );
    if (formWrapper) {
      setDrawerWidth(formWrapper.clientWidth);
    }
  }, [open]);

  const getOverlayContainer = useCallback(() => {
    const containers = document.querySelectorAll<HTMLElement>(
      '.ant-layout-content'
    );
    return containers[containers.length - 1] ?? null;
  }, []);

  return { drawerWidth, getOverlayContainer };
};

export default useOverlayLayout;
