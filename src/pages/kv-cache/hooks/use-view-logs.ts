import { PageSize } from '@gpustack/core-ui';
import { useState } from 'react';
import { CACHE_SERVICES_API } from '../apis';
import { ServiceStateValueMap } from '../config';
import { CacheServiceInstanceItem, ListItem } from '../config/types';

// While the service is starting the log is streamed from the beginning;
// for settled states only the latest page is tailed.
const realtimeLogStates: string[] = [ServiceStateValueMap.Starting];

const useViewLogs = () => {
  const [openModalStatus, setOpenModalStatus] = useState<{
    open: boolean;
    url: string;
    name: string;
    tail?: number;
  }>({
    open: false,
    url: '',
    name: ''
  });

  // single-instance services only; multi-instance ones use the
  // per-instance endpoint below
  const openViewLogsModal = (row: ListItem) => {
    setOpenModalStatus({
      open: true,
      url: `${CACHE_SERVICES_API}/${row.id}/logs`,
      name: row.name,
      tail: realtimeLogStates.includes(row.state) ? undefined : PageSize - 1
    });
  };

  const openInstanceLogsModal = (
    service: ListItem,
    instance: CacheServiceInstanceItem
  ) => {
    setOpenModalStatus({
      open: true,
      url: `${CACHE_SERVICES_API}/${service.id}/instances/${instance.id}/logs`,
      name: instance.name || service.name,
      tail: realtimeLogStates.includes(instance.state)
        ? undefined
        : PageSize - 1
    });
  };

  const closeViewLogsModal = () => {
    setOpenModalStatus({
      open: false,
      url: '',
      name: ''
    });
  };

  return {
    openViewLogsModalStatus: openModalStatus,
    openViewLogsModal,
    openInstanceLogsModal,
    closeViewLogsModal
  };
};

export default useViewLogs;
