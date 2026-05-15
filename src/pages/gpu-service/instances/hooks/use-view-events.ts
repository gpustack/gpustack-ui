import { currentClusterAtom } from '@/atoms/gpuservice';
import { getCurrentOrgNamespace } from '@/atoms/user';
import { useAtomValue } from 'jotai';
import { useState } from 'react';
import { ListItem } from '../config/types';

const useViewEvents = () => {
  const currentCluster = useAtomValue(currentClusterAtom);
  const clusterID = currentCluster?.id;
  const namespace = getCurrentOrgNamespace(currentCluster?.owner_principal_id);

  const [openModalStatus, setOpenModalStatus] = useState<{
    open: boolean;
    name: string;
    namespace: string;
    clusterID?: number;
  }>({
    open: false,
    name: '',
    namespace: '',
    clusterID: undefined
  });

  const openModal = (row?: ListItem) => {
    const name = row?.metadata?.name || '';
    const rowNamespace = row?.metadata?.namespace || namespace;
    setOpenModalStatus({
      open: true,
      name,
      namespace: rowNamespace,
      clusterID
    });
  };

  const closeModal = () => {
    setOpenModalStatus({
      open: false,
      name: '',
      namespace: '',
      clusterID: undefined
    });
  };

  return {
    openViewEventsModalStatus: openModalStatus,
    openViewEventsModal: openModal,
    closeViewEventsModal: closeModal
  };
};

export default useViewEvents;
