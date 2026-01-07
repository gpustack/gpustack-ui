import { PageActionType } from '@/config/types';
import FormDrawer from '@/pages/_components/form-drawer';
import React, { useEffect, useRef } from 'react';
import { ProviderType } from '../config';
import {
  ClusterListItem,
  NodePoolFormData as FormData,
  NodePoolListItem as ListItem
} from '../config/types';
import { useProviderRegions } from '../hooks/use-provider-regions';
import PoolForm from './pool-form';

type AddModalProps = {
  title: string;
  action: PageActionType;
  open: boolean;
  provider: ProviderType; // 'kubernetes' | 'custom' | 'digitalocean';
  currentData?: ListItem | null;
  clusterData?: ClusterListItem | null;
  onOk: (values: FormData) => void;
  onCancel: () => void;
};
const AddPool: React.FC<AddModalProps> = ({
  title,
  action,
  open,
  provider,
  onOk,
  currentData,
  clusterData,
  onCancel
}) => {
  const { getInstanceTypes, getOSImages, updateInstanceTypes, updateOSImages } =
    useProviderRegions();
  const formRef = useRef<any>(null);

  const handleSubmit = async () => {
    formRef.current?.submit?.();
  };

  const handleOnFinish = async (data: FormData) => {
    onOk(data);
  };

  const handleCancel = () => {
    formRef.current?.reset?.();
    onCancel();
  };

  useEffect(() => {
    const init = async (clusterData: ClusterListItem) => {
      const allTyps = await getInstanceTypes(clusterData.credential_id);
      const allImages = await getOSImages(clusterData.credential_id);
      updateInstanceTypes(clusterData.region, allTyps);
      updateOSImages(clusterData.region, allImages);
    };
    if (open && clusterData && clusterData.credential_id) {
      init(clusterData);
    }
  }, [clusterData, open]);

  return (
    <FormDrawer
      title={title}
      open={open}
      onCancel={handleCancel}
      onSubmit={handleSubmit}
    >
      <PoolForm
        ref={formRef}
        action={action}
        provider={provider}
        currentData={currentData}
        onFinish={handleOnFinish}
      ></PoolForm>
    </FormDrawer>
  );
};

export default AddPool;
