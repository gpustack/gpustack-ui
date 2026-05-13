import { currentClusterAtom } from '@/atoms/gpuservice';
import { getCurrentOrganizationId } from '@/atoms/user';
import { useAtomValue } from 'jotai';
import { useState } from 'react';
import { GPU_SERVICE_INSTANCES_API } from '../apis';
import { ListItem } from '../config/types';

const useViewLogs = () => {
  const namespace = getCurrentOrganizationId();
  const currentCluster = useAtomValue(currentClusterAtom);
  const clusterID = currentCluster?.id;

  const [openModalStatus, setOpenModalStatus] = useState<{
    open: boolean;
    url: string;
    tail?: number;
    status?: string;
  }>({
    open: false,
    url: '',
    tail: 1000,
    status: undefined
  });

  const openModal = (row?: ListItem) => {
    const name = row?.metadata?.name;
    const rowNamespace = row?.metadata?.namespace || namespace;
    setOpenModalStatus({
      open: true,
      url:
        name && clusterID
          ? `${GPU_SERVICE_INSTANCES_API({
              namespace: rowNamespace,
              clusterID
            })}/${name}/log`
          : '',
      tail: 1000,
      status: row?.status?.phase || undefined
    });
  };

  const closeModal = () => {
    setOpenModalStatus({
      open: false,
      url: '',
      tail: 1000,
      status: undefined
    });
  };

  return {
    openViewLogsModalStatus: openModalStatus,
    setOpenViewLogsModalStatus: setOpenModalStatus,
    openViewLogsModal: openModal,
    closeViewLogsModal: closeModal
  };
};

export default useViewLogs;
