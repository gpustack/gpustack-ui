import IconFont from '@/components/icon-font';
import { PageAction } from '@/config';
import useBodyScroll from '@/hooks/use-body-scroll';
import { ListItem } from '../config/types';
import useCommunityBackend from './use-community-backend';
import useCustomBackend from './use-custom-backend';

const useCreateBackend = () => {
  const { saveScrollHeight, restoreScrollHeight } = useBodyScroll();
  const { openCommunityModal, closeCommunityModal, openCommunityModalStatus } =
    useCommunityBackend();
  const { openCustomModal, closeCustomModal, openCustomModalStatus } =
    useCustomBackend();

  const addItems = [
    {
      label: 'backend.add.community',
      locale: true,
      key: 'community',
      value: 'community',
      icon: <IconFont type="icon-public" />
    },
    {
      label: 'backend.add.custom',
      locale: true,
      key: 'custom',
      value: 'custom',
      icon: <IconFont type="icon-person" />
    }
  ];

  const handleEditBackend = (
    action: PageAction,
    title: string,
    row: ListItem
  ) => {
    openCustomModal(action, title, row);
    saveScrollHeight();
  };

  const handleCloseModal = (type: 'community' | 'custom') => {
    if (type === 'community') {
      closeCommunityModal();
    } else {
      closeCustomModal();
    }
    restoreScrollHeight();
  };

  const handleAddBackend = (type: 'community' | 'custom') => {
    if (type === 'community') {
      openCommunityModal(PageAction.CREATE, 'Add Community Backend');
    } else {
      openCustomModal(PageAction.CREATE, 'Add Custom Backend');
    }
    saveScrollHeight();
  };

  return {
    closeBackendModal: handleCloseModal,
    addBackend: handleAddBackend,
    editBackend: handleEditBackend,
    openBackendModalStatus: openCustomModalStatus, // for create custom backend and edit custom/builtin/community backend
    openCommunityModalStatus: openCommunityModalStatus, // for create community backend
    addActions: addItems
  };
};

export default useCreateBackend;
