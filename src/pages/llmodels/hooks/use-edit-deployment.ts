import { PageAction } from '@/config';
import { PageActionType } from '@/config/types';
import { useIntl } from '@umijs/max';
import { useState } from 'react';
import { ListItem } from '../config/types';

const useEditDeployment = () => {
  const intl = useIntl();
  const [openModalStatus, setOpenModalStatus] = useState<{
    open: boolean;
    action: PageActionType;
    currentData: {
      isGGUF: boolean;
      data: any; // for form data
      row: ListItem;
      realAction?: PageActionType; // added action here for copy action
    };
    title: string;
  }>({
    open: false,
    action: PageAction.EDIT,
    currentData: {
      isGGUF: false,
      data: {},
      row: {} as ListItem
    },
    title: ''
  });

  const openEditModal = (formData: any, row: ListItem) => {
    setOpenModalStatus({
      open: true,
      action: PageAction.EDIT,
      currentData: {
        isGGUF: false,
        data: formData,
        row: row,
        realAction: PageAction.EDIT
      },
      title: intl.formatMessage({ id: 'models.title.edit' })
    });
  };

  const openDuplicateModal = (formData: any, row: ListItem) => {
    setOpenModalStatus({
      open: true,
      action: PageAction.EDIT,
      currentData: {
        isGGUF: false,
        data: {
          ...formData,
          name: `${formData.name}-copy`
        },
        row: row,
        realAction: PageAction.COPY
      },
      title: intl.formatMessage({ id: 'models.title.duplicate' })
    });
  };

  const closeModal = () => {
    setOpenModalStatus({
      open: false,
      action: PageAction.EDIT,
      currentData: {
        isGGUF: false,
        data: {},
        row: {} as ListItem
      },
      title: ''
    });
  };

  return {
    openEditModalStatus: openModalStatus,
    setOpenEditModalStatus: setOpenModalStatus,
    openEditModal: openEditModal,
    openDuplicateModal: openDuplicateModal,
    closeEditModal: closeModal
  };
};

export default useEditDeployment;
