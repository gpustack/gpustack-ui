import { ExclamationCircleFilled } from '@ant-design/icons';
import { useIntl } from '@umijs/max';
import { Button, Modal, Space, message, type ModalFuncProps } from 'antd';
import { forwardRef, useImperativeHandle, useState } from 'react';
import Styles from './index.less';

const DeleteModal = forwardRef((props, ref) => {
  const intl = useIntl();
  const [visible, setVisible] = useState(false);
  const [config, setConfig] = useState<ModalFuncProps & { content: string }>(
    {}
  );

  useImperativeHandle(ref, () => ({
    show: (data: ModalFuncProps & { content: string }) => {
      setConfig(data);
      setVisible(true);
    },
    hide: () => {
      setVisible(false);
    }
  }));

  const handleCancel = () => {
    setVisible(false);
    config.onCancel?.();
  };

  const handleOk = async () => {
    await config.onOk?.();
    message.success(intl.formatMessage({ id: 'common.message.success' }));
    setVisible(false);
  };

  return (
    <Modal
      style={{
        top: '20%'
      }}
      open={visible}
      onOk={handleOk}
      onCancel={handleCancel}
      destroyOnClose={true}
      closeIcon={false}
      maskClosable={false}
      keyboard={false}
      width={460}
      styles={{}}
      footer={
        <Space size={20}>
          <Button onClick={handleCancel} size="middle">
            {intl.formatMessage({ id: 'common.button.cancel' })}
          </Button>
          <Button type="primary" onClick={handleOk} size="middle">
            {intl.formatMessage({ id: 'common.button.delete' })}
          </Button>
        </Space>
      }
    >
      <div className={Styles['delete-modal-content']}>
        <span className="title">
          <ExclamationCircleFilled />
          <span>
            {intl.formatMessage({ id: 'common.title.delete.confirm' })}
          </span>
        </span>
      </div>
      <div className={Styles['content']}>
        {config.content &&
          intl.formatMessage(
            { id: 'common.delete.confirm' },
            { type: intl.formatMessage({ id: config.content }) }
          )}
      </div>
    </Modal>
  );
});

export default DeleteModal;
