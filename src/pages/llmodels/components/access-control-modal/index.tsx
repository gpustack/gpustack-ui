import ModalFooter from '@/components/modal-footer';
import ScrollerModal from '@/components/scroller-modal';
import { useIntl } from '@umijs/max';
import { message } from 'antd';
import { useRef } from 'react';
import { updateModelAccessUser } from '../../apis';
import { AccessControlFormData, ListItem } from '../../config/types';
import AccessControlForm from './form';

const AccessControlModal: React.FC<
  Global.ScrollerModalProps<ListItem, AccessControlFormData>
> = ({ open, title, currentData, action, onOk, onCancel }) => {
  const intl = useIntl();
  const form = useRef<any>(null);

  const handleSumit = () => {
    form.current?.submit();
  };

  const handleOnFinish = async (values: AccessControlFormData) => {
    console.log('onFinish', values);
    try {
      const data = {
        set_public: !values.set_public,
        users: values.users || []
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
      width={600}
      footer={
        <ModalFooter onOk={handleSumit} onCancel={onCancel}></ModalFooter>
      }
    >
      <AccessControlForm
        ref={form}
        currentData={currentData}
        onFinish={handleOnFinish}
      />
    </ScrollerModal>
  );
};

export default AccessControlModal;
