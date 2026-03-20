import { PageSize } from '@/components/logs-viewer/config';
import useBodyScroll from '@/hooks/use-body-scroll';
import { useState } from 'react';
import { MODEL_INSTANCE_API } from '../apis';
import { InstanceRealtimeLogStatus } from '../config';
import { ModelInstanceListItem as ListItem } from '../config/types';

const useViewInstanceLogs = () => {
  const { saveScrollHeight, restoreScrollHeight } = useBodyScroll();
  const [openModalStatus, setOpenModalStatus] = useState<{
    open: boolean;
    currentData: {
      url: string;
      status: string;
      id?: number | string;
      modelId?: number | string;
      tail?: number;
    };
  }>({
    open: false,
    currentData: {
      url: '',
      status: ''
    }
  });

  const openModal = (row: ListItem) => {
    setOpenModalStatus({
      open: true,
      currentData: {
        url: `${MODEL_INSTANCE_API}/${row.id}/logs`,
        status: row.state,
        id: row.id,
        modelId: row.model_id,
        tail: InstanceRealtimeLogStatus.includes(row.state)
          ? undefined
          : PageSize - 1
      }
    });
    saveScrollHeight();
  };

  const closeModal = () => {
    setOpenModalStatus({
      open: false,
      currentData: {
        url: '',
        status: ''
      }
    });
    restoreScrollHeight();
  };

  return {
    openViewLogsModalStatus: openModalStatus,
    setOpenViewLogsModalStatus: setOpenModalStatus,
    openViewLogsModal: openModal,
    closeViewLogsModal: closeModal
  };
};

export default useViewInstanceLogs;
