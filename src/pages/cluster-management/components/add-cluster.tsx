import { PageAction } from '@/config';
import { PageActionType } from '@/config/types';
import { ExclamationCircleFilled } from '@ant-design/icons';
import {
  AlertBlockInfo,
  FormDrawer,
  ModalFooter,
  useSubmitLock
} from '@gpustack/core-ui';
import { useIntl } from '@umijs/max';
import React, { useRef, useState } from 'react';
import { ProviderType, ProviderValueMap } from '../config';
import {
  ClusterFormData as FormData,
  ClusterListItem as ListItem
} from '../config/types';
import {
  extractHelmValuesError,
  isHelmValuesError
} from '../utils/helm-values';
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
  const { loading, guard, run, release } = useSubmitLock();
  // Whether the user has changed any field that is only applied while a worker
  // registers. Lifted from ClusterForm so the "re-run registration" notice can
  // sit in the drawer footer, above the Save/Cancel buttons (mirrors the model
  // edit interaction).
  const [k8sOptionsChanged, setK8sOptionsChanged] = useState<boolean>(false);

  const handleSubmit = () => {
    guard(() => form.current?.submit());
  };

  const handleOk = async (data: FormData) => {
    try {
      await run(() =>
        onOk({
          ...data,
          provider
        })
      );
    } catch (error) {
      // A rejected `onFinish` would otherwise be an unhandled rejection. The
      // global handler already toasts the message; park it under the Chart
      // Values editor too when that is the field the server blamed.
      if (isHelmValuesError(error)) {
        form.current?.setChartValuesError(extractHelmValuesError(error));
      }
    }
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
                  id: 'clusters.edit.registration.changed.tip'
                })}
              ></AlertBlockInfo>
            )}
          <ModalFooter
            onOk={handleSubmit}
            onCancel={handleCancel}
            loading={loading}
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
        onFinishFailed={release}
        onK8sOptionsChange={setK8sOptionsChanged}
      />
    </FormDrawer>
  );
};

export default AddCluster;
