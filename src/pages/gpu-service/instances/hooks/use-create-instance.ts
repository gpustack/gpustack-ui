import { PageAction } from '@/config';
import type { PageActionType } from '@/config/types';
import useBodyScroll from '@/hooks/use-body-scroll';
import { useIntl } from '@umijs/max';
import { useState } from 'react';
import { InstanceStatusValueMap } from '../config';
import type { ListItem } from '../config/types';

const useCreateInstance = () => {
  const intl = useIntl();
  const { saveScrollHeight, restoreScrollHeight } = useBodyScroll();
  const [openModalStatus, setOpenModalStatus] = useState<{
    action: PageActionType;
    open: boolean;
    title: string;
    currentData?: ListItem | null;
    width?: number | string;
    realAction?: string;
  }>({
    action: PageAction.CREATE,
    title: '',
    open: false,
    width: undefined,
    currentData: null,
    realAction: undefined
  });

  const openModal = (
    action: PageActionType,
    title: string,
    currentData?: ListItem | null,
    width?: number | string,
    realAction?: string
  ) => {
    setOpenModalStatus({
      action,
      title,
      open: true,
      currentData,
      width,
      realAction
    });
    saveScrollHeight();
  };

  const openCreateInstanceModal = () => {
    openModal(
      PageAction.CREATE,
      intl.formatMessage({ id: 'gpuservice.instance.add' }),
      null,
      'calc(100vw - 220px)'
    );
  };

  const openEditInstanceModal = (row: ListItem) => {
    // A stopped instance can be re-typed, so it needs the two-column layout
    // (instance-type list + form); other statuses edit in a single column.
    const isStopped = row.status?.phase === InstanceStatusValueMap.Stopped;
    openModal(
      PageAction.EDIT,
      intl.formatMessage({ id: 'gpuservice.instance.edit' }),
      row,
      isStopped ? 'min(1040px, calc(100vw - 220px))' : 600
    );
  };

  const openViewInstanceModal = (row: ListItem) => {
    openModal(
      PageAction.VIEW,
      intl.formatMessage({ id: 'common.button.view' }),
      row,
      600
    );
  };

  const openRecreateInstanceModal = (row: ListItem) => {
    openModal(
      PageAction.EDIT,
      intl.formatMessage({ id: 'common.button.recreate' }),
      row,
      'calc(100vw - 220px)',
      PageAction.CREATE
    );
  };

  const closeModal = () => {
    setOpenModalStatus({
      ...openModalStatus,
      title: '',
      open: false,
      currentData: null,
      realAction: undefined
    });
    restoreScrollHeight();
  };

  return {
    openInstanceModalStatus: openModalStatus,
    setOpenInstanceModalStatus: setOpenModalStatus,
    openInstanceModal: openModal,
    openCreateInstanceModal,
    openEditInstanceModal,
    openViewInstanceModal,
    openRecreateInstanceModal,
    closeInstanceModal: closeModal
  };
};

export default useCreateInstance;
