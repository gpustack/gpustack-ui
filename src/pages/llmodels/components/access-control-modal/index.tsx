import ModalFooter from '@/components/modal-footer';
import ScrollerModal from '@/components/scroller-modal';
import { PageActionType } from '@/config/types';
import { useIntl } from '@umijs/max';
import { message } from 'antd';
import { useRef } from 'react';
import { updateModelAccessUser } from '../../apis';
import { AccessControlFormData, ListItem } from '../../config/types';
import AccessControlForm from './form';

const AccessControlModal: React.FC<
  Global.ScrollerModalProps<ListItem, AccessControlFormData>
> = ({ open, title, currentData, action, onCancel }) => {
  const intl = useIntl();
  const form = useRef<any>(null);

  const handleSumit = () => {
    form.current?.submit();
  };

  const handleOnFinish = async (values: AccessControlFormData) => {
    try {
      const data = {
        access_policy: values.access_policy,
        users:
          values.access_policy === 'allowed_users' ? values.users || [] : []
      };
      await updateModelAccessUser({
        id: currentData?.id as number,
        data: data
      });
      message.success(intl.formatMessage({ id: 'common.message.success' }));
      onCancel?.();
    } catch (error) {
      message.error(intl.formatMessage({ id: 'common.message.failed' }));
    }
  };

  return (
    <ScrollerModal
      title={title}
      open={open}
      centered={true}
      onCancel={onCancel}
      destroyOnHidden={true}
      closeIcon={true}
      maskClosable={false}
      keyboard={false}
      width={700}
      footer={
        <ModalFooter onOk={handleSumit} onCancel={onCancel}></ModalFooter>
      }
    >
      <AccessControlForm
        ref={form}
        currentData={currentData}
        action={action as PageActionType}
        onFinish={handleOnFinish}
      />
    </ScrollerModal>
  );
};

export default AccessControlModal;
