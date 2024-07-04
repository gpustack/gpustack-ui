import CopyButton from '@/components/copy-button';
import ModalFooter from '@/components/modal-footer';
import SealInput from '@/components/seal-form/seal-input';
import SealSelect from '@/components/seal-form/seal-select';
import { PageAction } from '@/config';
import { PageActionType } from '@/config/types';
import { useIntl } from '@umijs/max';
import { Button, Form, Modal, Select, Tag } from 'antd';
import dayjs from 'dayjs';
import { useState } from 'react';
import { createApisKey } from '../apis';
import { expirationOptions } from '../config';
import { FormData } from '../config/types';

type AddModalProps = {
  title: string;
  action: PageActionType;
  open: boolean;
  onOk: () => void;
  onCancel: () => void;
};

const AddModal: React.FC<AddModalProps> = ({
  title,
  action,
  open,
  onOk,
  onCancel
}) => {
  const [form] = Form.useForm();
  const intl = useIntl();
  const [showKey, setShowKey] = useState(false);
  const [apikeyValue, setAPIKeyValue] = useState('');
  const [loading, setLoading] = useState(false);

  if (action === PageAction.CREATE && open) {
    form.setFieldsValue({
      expires_in: 1
    });
  }

  const getExpireValue = (val: number | null) => {
    const expires_in = val;
    if (expires_in === -1) {
      return 0;
    }
    const selected = expirationOptions.find(
      (item) => expires_in === item.value
    );

    const d1 = dayjs().add(
      selected?.value as number,
      `${selected?.type}` as never
    );
    const d2 = dayjs();
    const res = d1.diff(d2, 'second');
    return res;
  };

  const handleOnOk = async (data: FormData) => {
    try {
      setLoading(true);
      const params = {
        ...data,
        expires_in: getExpireValue(data.expires_in)
      };
      const res = await createApisKey({ data: params });
      setAPIKeyValue(res.value);
      setShowKey(true);
      setLoading(false);
    } catch (error) {
      setLoading(false);
    }
  };

  const handleSumit = () => {
    form.submit();
  };

  const handleDone = () => {
    onOk();
  };

  const handleAfterOpenChange = (isOpen: boolean) => {
    setShowKey(false);
  };

  return (
    <Modal
      title={title}
      open={open}
      onOk={handleSumit}
      onCancel={onCancel}
      afterOpenChange={handleAfterOpenChange}
      destroyOnClose={true}
      closeIcon={false}
      maskClosable={false}
      keyboard={false}
      width={600}
      styles={{}}
      footer={
        !showKey ? (
          <ModalFooter
            onOk={handleSumit}
            onCancel={onCancel}
            loading={loading}
          ></ModalFooter>
        ) : (
          <Button type="primary" onClick={handleDone}>
            {intl.formatMessage({ id: 'common.button.done' })}
          </Button>
        )
      }
    >
      <Form name="addAPIKey" form={form} onFinish={handleOnOk} preserve={false}>
        {!showKey ? (
          <>
            <Form.Item<FormData>
              name="name"
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
            <Form.Item<FormData>
              name="expires_in"
              rules={[
                {
                  required: true,
                  message: intl.formatMessage(
                    { id: 'common.form.rule.select' },
                    {
                      name: intl.formatMessage({
                        id: 'apikeys.form.expiretime'
                      })
                    }
                  )
                }
              ]}
            >
              <SealSelect
                label={intl.formatMessage({ id: 'apikeys.form.expiretime' })}
                required
              >
                {expirationOptions.map((option) => {
                  return (
                    <Select.Option key={option.value} value={option.value}>
                      {intl.formatMessage({ id: option.label })}
                    </Select.Option>
                  );
                })}
              </SealSelect>
            </Form.Item>
            <Form.Item<FormData>
              name="description"
              rules={[{ required: false }]}
            >
              <SealInput.TextArea
                label={intl.formatMessage({ id: 'common.table.description' })}
              ></SealInput.TextArea>
            </Form.Item>
          </>
        ) : (
          <Form.Item
            extra={
              <Tag color="error" style={{ padding: '6px 8px', marginTop: 10 }}>
                {intl.formatMessage({ id: 'apikeys.table.save.tips' })}
              </Tag>
            }
          >
            <SealInput.Input
              label={intl.formatMessage({ id: 'apikeys.form.apikey' })}
              value={apikeyValue}
              addAfter={<CopyButton text={apikeyValue}></CopyButton>}
            ></SealInput.Input>
          </Form.Item>
        )}
      </Form>
    </Modal>
  );
};

export default AddModal;
