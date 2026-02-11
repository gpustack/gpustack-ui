import { PageAction } from '@/config';
import { PageActionType } from '@/config/types';
import { useIntl } from '@umijs/max';
import _ from 'lodash';
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

  const checkIsGGUF = (row: ListItem): boolean => {
    const huggingface_filename = row.huggingface_filename;
    const model_scope_file_path = row.model_scope_file_path;
    const local_path = row.local_path || '';

    if (local_path) {
      const isEndwithGGUF = _.endsWith(local_path, '.gguf');
      const isBlobFile = local_path.split('/').pop()?.includes('sha256');
      return isEndwithGGUF || isBlobFile;
    }

    return Boolean(huggingface_filename || model_scope_file_path);
  };

  const openEditModal = (formData: any, row: ListItem) => {
    setOpenModalStatus({
      open: true,
      action: PageAction.EDIT,
      currentData: {
        isGGUF: checkIsGGUF(row),
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
        isGGUF: checkIsGGUF(row),
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
