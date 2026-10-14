import { queryWorkersList } from '@/pages/resources/apis';
import { useIntl } from '@umijs/max';
import { message } from 'antd';
import {
  deleteCacheServiceInstance,
  queryCacheProviders,
  queryCacheServiceDetail,
  queryCacheServiceInstances
} from '../apis';
import { CacheServiceInstanceItem, ListItem } from '../config/types';
import { evaluatePlacement, ResourceCheckStatus } from './use-placement-check';

// confirm-and-recreate flow shared by the list and detail pages;
// modalRef must point to a mounted DeleteModal
const useRecreateInstance = (options: {
  modalRef: React.MutableRefObject<any>;
  onSuccess?: () => void;
}) => {
  const { modalRef, onSuccess } = options;
  const intl = useIntl();

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
      showSuccess: false,
      async onOk() {
        let checkStatus: ResourceCheckStatus;
        try {
          const [latestService, instances, providers] = await Promise.all([
            queryCacheServiceDetail(service.id, { skipErrorHandler: true }),
            queryCacheServiceInstances(service.id, { skipErrorHandler: true }),
            queryCacheProviders({ page: -1 }, { skipErrorHandler: true })
          ]);
          const { items: workers } = await queryWorkersList(
            {
              cluster_id: latestService.cluster_id,
              page: -1
            },
            { skipErrorHandler: true }
          );
          const latestInstance = instances.items.find(
            (item) => item.id === instance.id
          );
          const provider = providers.items.find(
            (item) => item.name === latestService.provider_name
          );
          if (!latestInstance || !provider) {
            throw new Error('Cache service recreation context is unavailable');
          }
          checkStatus = evaluatePlacement(
            {
              mode: 'recreate',
              provider,
              providerVersion: latestService.provider_version,
              fieldValues: latestService.config?.fields,
              workers,
              workerId: latestService.worker_id,
              workerSelector: latestService.worker_selector,
              existingInstances: instances.items,
              replacingInstances: [latestInstance],
              recreateInstance: latestInstance
            },
            intl
          );
        } catch (error) {
          message.warning(
            intl.formatMessage({ id: 'kvCache.check.recreate.unavailable' })
          );
          throw error;
        }
        if (checkStatus.type === 'warning') {
          message.warning(checkStatus.message);
          // ConfirmModal closes even on rejection; preserve the instance and
          // let the user retry after resolving the reported resource issue.
          throw new Error(checkStatus.message);
        }
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
