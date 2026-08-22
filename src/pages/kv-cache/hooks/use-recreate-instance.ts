import { deleteCacheServiceInstance } from '../apis';
import { CacheServiceInstanceItem, ListItem } from '../config/types';

// confirm-and-recreate flow shared by the list and detail pages;
// modalRef must point to a mounted DeleteModal
const useRecreateInstance = (options: {
  modalRef: React.MutableRefObject<any>;
  onSuccess?: () => void;
}) => {
  const { modalRef, onSuccess } = options;

  // deletes one instance; the controller recreates it right away with a
  // fresh restart budget, so this doubles as the crash-loop escape hatch
  const handleRecreateInstance = (
    service: ListItem,
    instance: CacheServiceInstanceItem,
    workerName?: string
  ) => {
    modalRef.current?.show({
      content: 'kvCache.detail.instances',
      okText: 'common.button.delrecreate',
      operation: 'common.delete.single.confirm',
      name: workerName ? `${service.name} · ${workerName}` : service.name,
      async onOk() {
        await deleteCacheServiceInstance(service.id, instance.id);
        onSuccess?.();
      }
    });
  };

  return {
    handleRecreateInstance
  };
};

export default useRecreateInstance;
