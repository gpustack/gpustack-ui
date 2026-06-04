import { PageAction } from '@/config';
import { PageActionType } from '@/config/types';
import { ExclamationCircleFilled } from '@ant-design/icons';
import { AlertBlockInfo, FormDrawer, ModalFooter } from '@gpustack/core-ui';
import { useIntl } from '@umijs/max';
import React, { useRef, useState } from 'react';
import { ProviderType, ProviderValueMap } from '../config';
import {
  ClusterFormData as FormData,
  ClusterListItem as ListItem
} from '../config/types';
import ClusterForm from './cluster-form';

const ModalFooterStyle = {
  padding: '16px 24px 8px',
  display: 'flex',
  justifyContent: 'flex-end'
};

type AddModalProps = {
  title: string;
  action: PageActionType;
  open: boolean;
  currentData?: ListItem; // Used when action is EDIT
  provider: ProviderType;
  credentialList: Global.BaseOption<number>[];
  onOk: (values: FormData) => void;
  onCancel: () => void;
};
const AddCluster: React.FC<AddModalProps> = ({
  title,
  action,
  open,
  provider,
  currentData,
  credentialList,
  onOk,
  onCancel
}) => {
  const intl = useIntl();
  const form = useRef<any>(null);
  // Whether the user has changed any k8s_options field. Lifted from ClusterForm
  // so the "re-run registration" notice can sit in the drawer footer, above the
  // Save/Cancel buttons (mirrors the model edit interaction).
  const [k8sOptionsChanged, setK8sOptionsChanged] = useState<boolean>(false);

  const handleSubmit = () => {
    form.current?.submit();
  };

  const handleOk = async (data: FormData) => {
    onOk({
      ...data,
      provider
    });
  };

  const handleCancel = () => {
    form.current?.resetFields();
    onCancel();
  };

  return (
    <FormDrawer
      title={title}
      open={open}
      onCancel={handleCancel}
      onSubmit={handleSubmit}
      width={710}
      footer={
        <>
          {action === PageAction.EDIT &&
            provider === ProviderValueMap.Kubernetes &&
            k8sOptionsChanged && (
              <AlertBlockInfo
                type="warning"
                style={{ margin: '8px 24px 0' }}
                icon={<ExclamationCircleFilled />}
                message={intl.formatMessage({
                  id: 'clusters.edit.k8sOptions.changed.tip'
                })}
              ></AlertBlockInfo>
            )}
          <ModalFooter
            onOk={handleSubmit}
            onCancel={handleCancel}
            style={ModalFooterStyle}
          ></ModalFooter>
        </>
      }
    >
      <ClusterForm
        ref={form}
        provider={provider}
        credentialList={credentialList}
        action={action}
        currentData={currentData}
        onFinish={handleOk}
        onK8sOptionsChange={setK8sOptionsChanged}
      />
    </FormDrawer>
  );
};

export default AddCluster;
