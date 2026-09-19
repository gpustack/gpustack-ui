import { updatePassword } from '@/pages/login/apis';
import { ModalFooter, useSubmitLock } from '@gpustack/core-ui';
import { useIntl } from '@umijs/max';
import { Modal, message } from 'antd';
import React, { useRef } from 'react';
import { FormData } from '../config/types';
import ModifyPasswordForm from './modify-password-form';

interface ModifyPasswordModalProps {
  open: boolean;
  onCancel: () => void;
  onSuccess: () => void;
}

const ModifyPasswordModal: React.FC<ModifyPasswordModalProps> = ({
  open,
  onCancel,
  onSuccess
}) => {
  const intl = useIntl();
  const form = useRef<any>(null);
  const { loading, guard, run, release } = useSubmitLock();

  const handleSubmit = () => {
    guard(() => form.current?.submit());
  };

  const onFinish = async (values: FormData) => {
    await run(async () => {
      await updatePassword({
        new_password: values.new_password,
        current_password: values.current_password
      });
      message.success(intl.formatMessage({ id: 'common.message.success' }));
      onSuccess();
    });
  };

  return (
    <Modal
      title={intl.formatMessage({ id: 'users.form.updatepassword' })}
      open={open}
      onCancel={onCancel}
      width={520}
      // Half-typed credentials should not be thrown away by a stray click on
      // the backdrop or a reflex Esc. Cancel and the close button are the only
      // ways out, and both stay reachable by keyboard — this closes the two
      // accidental paths, it does not trap anyone.
      maskClosable={false}
      keyboard={false}
      destroyOnHidden
      // antd's 8 put the title 12px (optical) off the first field while the
      // fields sit 24 apart — the title read as a label for field one rather
      // than for the modal. 20 lands it at 24, level with the form's own
      // rhythm.
      styles={{ header: { marginBottom: 20 } }}
      footer={
        <ModalFooter
          onOk={handleSubmit}
          onCancel={onCancel}
          loading={loading}
          style={{
            // 8, not the 16 copied from edit-yaml-modal: the last field already
            // carries Form.Item's own 24 below it, so 16 made the gap to the
            // footer 40 — the widest in a modal whose title gap was 12. 8 makes
            // it 32, one step past the form's 24 instead of two.
            padding: '8px 0 8px',
            display: 'flex',
            justifyContent: 'flex-end'
          }}
        />
      }
    >
      <ModifyPasswordForm
        ref={form}
        onFinish={onFinish}
        onFinishFailed={release}
      />
    </Modal>
  );
};

ModifyPasswordModal.displayName = 'ModifyPasswordModal';

export default ModifyPasswordModal;
