import ModalFooter from '@/components/modal-footer';
import ScrollerModal from '@/components/scroller-modal/index';
import SealInput from '@/components/seal-form/seal-input';
import { PageActionType } from '@/config/types';
import ContainerInstall from '@/pages/resources/components/container-install';
import { CheckCircleFilled } from '@ant-design/icons';
import { useIntl } from '@umijs/max';
import { Form } from 'antd';
import React, { useMemo } from 'react';
import { ProviderValueMap } from '../config';
import {
  ClusterFormData as FormData,
  ClusterListItem as ListItem
} from '../config/types';
import CloudProvider from './cloud-provider-form';
import RegisterClusterInner from './resiter-cluster-inner';

type AddModalProps = {
  title: string;
  action: PageActionType;
  open: boolean;
  provider: string; // 'kubernetes' | 'custom' | 'digitalocean';
  onOk: (values: FormData) => void;
  onCancel: () => void;
};
const AddCluster: React.FC<AddModalProps> = ({
  title,
  action,
  open,
  provider,
  onOk,
  onCancel
}) => {
  const [form] = Form.useForm();
  const intl = useIntl();
  const [submissionStatus, setSubmissionStatus] = React.useState<{
    success: boolean;
    data: ListItem;
  }>({ success: true, data: {} as ListItem });

  const handleSubmit = () => {
    form.submit();
  };

  const handleCancel = () => {
    form.resetFields();
    onCancel();
  };

  const renderAddWorkerContent = () => {
    if (provider === ProviderValueMap.Custom) {
      return <ContainerInstall token="${token}" />;
    }
    if (provider === ProviderValueMap.Kubernetes) {
      return (
        <RegisterClusterInner
          data={submissionStatus.data}
        ></RegisterClusterInner>
      );
    }
    return null;
  };
  const modalTitle = useMemo(() => {
    if (submissionStatus.success) {
      return (
        <div className="flex-center">
          <CheckCircleFilled
            className="text-success font-size-20"
            style={{ marginRight: '8px' }}
          />
          <span>Cluster added! Now you can register a worker.</span>
        </div>
      );
    }
    return title;
  }, [submissionStatus.success, title]);

  const renderFooter = () => {
    if (submissionStatus.success) {
      return (
        <ModalFooter
          onOk={onCancel}
          onCancel={onCancel}
          showCancelBtn={false}
          okText="Skip for Now"
          okBtnProps={{
            style: {
              width: 'auto'
            }
          }}
        ></ModalFooter>
      );
    }
    return <ModalFooter onOk={handleSubmit} onCancel={onCancel}></ModalFooter>;
  };

  return (
    <ScrollerModal
      title={modalTitle}
      open={open}
      onCancel={handleCancel}
      destroyOnClose={true}
      closeIcon={true}
      maskClosable={false}
      keyboard={false}
      width={680}
      footer={renderFooter()}
    >
      {submissionStatus.success ? (
        renderAddWorkerContent()
      ) : (
        <Form form={form} onFinish={onOk} preserve={false}>
          <Form.Item<FormData>
            name="display_name"
            rules={[
              {
                required: true,
                message: intl.formatMessage(
                  { id: 'common.form.rule.input' },
                  {
                    name: intl.formatMessage({ id: 'common.table.name' })
                  }
                )
              }
            ]}
          >
            <SealInput.Input
              label={intl.formatMessage({ id: 'common.table.name' })}
              required
            ></SealInput.Input>
          </Form.Item>
          {provider === 'digitalocean' && (
            <CloudProvider provider={provider}></CloudProvider>
          )}
          <Form.Item<FormData> name="description" rules={[{ required: false }]}>
            <SealInput.TextArea
              label={intl.formatMessage({ id: 'common.table.description' })}
            ></SealInput.TextArea>
          </Form.Item>
        </Form>
      )}
    </ScrollerModal>
  );
};

export default AddCluster;
