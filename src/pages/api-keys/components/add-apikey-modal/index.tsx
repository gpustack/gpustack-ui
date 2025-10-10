import CopyButton from '@/components/copy-button';
import ModalFooter from '@/components/modal-footer';
import ScrollerModal from '@/components/scroller-modal';
import SealInput from '@/components/seal-form/seal-input';
import { PageAction } from '@/config';
import { PageActionType } from '@/config/types';
import { useIntl } from '@umijs/max';
import { Button, Form, Tag } from 'antd';
import dayjs from 'dayjs';
import { useEffect, useState } from 'react';
import { createApisKey, updateApisKey } from '../../apis';
import { expirationOptions } from '../../config';
import { FormData, ListItem } from '../../config/types';
import AllowModelsForm from './allow-models';
import APIKeyForm from './form';

type AddModalProps = {
  title: string;
  action: PageActionType;
  open: boolean;
  currentData?: Partial<ListItem> | null;
  onOk: () => void;
  onCancel: () => void;
};

const AddModal: React.FC<AddModalProps> = ({
  title,
  action,
  open,
  currentData,
  onOk,
  onCancel
}) => {
  const [form] = Form.useForm();
  const intl = useIntl();
  const [showKey, setShowKey] = useState(false);
  const [apikeyValue, setAPIKeyValue] = useState('');
  const [loading, setLoading] = useState(false);

  const initValues = () => {
    if (action === PageAction.CREATE && open) {
      form.setFieldsValue({
        expires_in: 1
      });
    }
    if (action === PageAction.EDIT && currentData && open) {
      form.setFieldsValue({
        name: currentData.name,
        description: currentData.description,
        allowed_model_names: currentData.allowed_model_names || []
      });
    }
  };

  useEffect(() => {
    initValues();
  }, [open]);

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

  const createAPIKey = async (data: FormData) => {
    const params = {
      ...data,
      expires_in: getExpireValue(data.expires_in)
    };
    const res = await createApisKey({ data: params });
    setAPIKeyValue(res.value);
    setShowKey(true);
  };

  const updateAPIKey = async (data: FormData) => {
    await updateApisKey(currentData?.id as number, { data });
    onOk();
  };

  const handleOnOk = async (data: FormData) => {
    try {
      setLoading(true);
      if (action === PageAction.CREATE) {
        await createAPIKey(data);
      } else if (action === PageAction.EDIT && currentData?.id) {
        await updateAPIKey(data);
      }
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
    <ScrollerModal
      title={
        !showKey ? title : intl.formatMessage({ id: 'apikeys.title.save' })
      }
      open={open}
      centered={true}
      onOk={handleSumit}
      onCancel={onCancel}
      afterOpenChange={handleAfterOpenChange}
      destroyOnHidden={true}
      closeIcon={false}
      maskClosable={false}
      keyboard={false}
      width={700}
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
        {action === PageAction.EDIT && <AllowModelsForm></AllowModelsForm>}
        {!showKey && action === PageAction.CREATE && <APIKeyForm></APIKeyForm>}
        {showKey && action === PageAction.CREATE && (
          <Form.Item>
            <div>
              <Tag
                bordered={false}
                color="error"
                style={{ padding: '6px 8px', marginBottom: 16 }}
              >
                {intl.formatMessage({ id: 'apikeys.table.save.tips' })}
              </Tag>
            </div>
            <SealInput.Input
              label={intl.formatMessage({ id: 'apikeys.form.apikey' })}
              value={apikeyValue}
              addAfter={
                <CopyButton
                  text={apikeyValue}
                  shape="default"
                  size="middle"
                  type="text"
                ></CopyButton>
              }
            ></SealInput.Input>
          </Form.Item>
        )}
      </Form>
    </ScrollerModal>
  );
};

export default AddModal;
