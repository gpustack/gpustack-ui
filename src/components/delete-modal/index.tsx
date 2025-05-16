import useBodyScroll from '@/hooks/use-body-scroll';
import { ExclamationCircleFilled } from '@ant-design/icons';
import { useIntl } from '@umijs/max';
import {
  Button,
  Checkbox,
  Modal,
  Space,
  message,
  type ModalFuncProps
} from 'antd';
import { FC, forwardRef, useImperativeHandle, useState } from 'react';
import styled from 'styled-components';
import Styles from './index.less';

const CheckboxWrapper = styled.div`
  margin-top: 20px;
  margin-left: 30px;
  display: flex;
  justify-content: flex-start;
  align-items: center;
  .check-text {
    font-weight: 700;
    color: var(--ant-color-warning);
  }
`;

interface DeleteModalProps {
  ref: any;
}

interface DataOptions {
  content: string;
  selection?: boolean;
  name?: string;
  okText?: string;
  cancelText?: string;
  title?: string;
  operation: string;
  checkConfig?: {
    checkText: string;
    defautlChecked: boolean;
  };
}

const DeleteModal: FC<DeleteModalProps> = forwardRef((props, ref) => {
  const intl = useIntl();
  const { saveScrollHeight, restoreScrollHeight } = useBodyScroll();
  const [visible, setVisible] = useState(false);
  const [checked, setChecked] = useState(false);
  const [config, setConfig] = useState<ModalFuncProps & DataOptions>({} as any);

  useImperativeHandle(ref, () => ({
    show: (data: ModalFuncProps & DataOptions) => {
      saveScrollHeight();
      setConfig(data);
      setChecked(data.checkConfig?.defautlChecked || false);
      setVisible(true);
    },
    hide: () => {
      setVisible(false);
      restoreScrollHeight();
    },
    configuration: {
      checked: checked
    }
  }));

  const handleCancel = () => {
    setVisible(false);
    config.onCancel?.();
    restoreScrollHeight();
  };

  const handleOk = async () => {
    try {
      const res = await config.onOk?.();
      const isArray = Array.isArray(res);
      if (isArray) {
        const allSuccess = res.every(
          (item: any) => item?.status === 'fulfilled'
        );
        if (allSuccess) {
          message.success(intl.formatMessage({ id: 'common.message.success' }));
        }
      } else {
        message.success(intl.formatMessage({ id: 'common.message.success' }));
      }
    } catch (error) {
      // Handle error if needed
    } finally {
      setVisible(false);
      restoreScrollHeight();
    }
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
            {config.cancelText
              ? intl.formatMessage({ id: config.cancelText })
              : intl.formatMessage({ id: 'common.button.cancel' })}
          </Button>
          <Button type="primary" onClick={handleOk} size="middle">
            {config.okText
              ? intl.formatMessage({ id: config.okText })
              : intl.formatMessage({ id: 'common.button.delete' })}
          </Button>
        </Space>
      }
    >
      <div className={Styles['delete-modal-content']}>
        <span className="title">
          <ExclamationCircleFilled />
          <span>
            {config.title
              ? intl.formatMessage({ id: config.title })
              : intl.formatMessage({ id: 'common.title.delete.confirm' })}
          </span>
        </span>
      </div>
      <div
        className={Styles['content']}
        dangerouslySetInnerHTML={{
          __html:
            config.content &&
            intl.formatMessage(
              {
                id: config.operation || ''
              },
              {
                type: intl.formatMessage({ id: config.content }),
                name: config.name
              }
            )
        }}
      ></div>
      {config.checkConfig && (
        <CheckboxWrapper>
          <Checkbox
            checked={checked}
            onChange={(e) => setChecked(e.target.checked)}
          >
            <span className="check-text">
              {intl.formatMessage({ id: config.checkConfig?.checkText })}
            </span>
          </Checkbox>
        </CheckboxWrapper>
      )}
    </Modal>
  );
});

export default DeleteModal;
