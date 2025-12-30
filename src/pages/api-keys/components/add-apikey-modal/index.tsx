import AlertBlockInfo from '@/components/alert-info/block';
import CopyButton from '@/components/copy-button';
import ModalFooter from '@/components/modal-footer';
import GSDrawer from '@/components/scroller-modal/gs-drawer';
import SealInput from '@/components/seal-form/seal-input';
import { PageAction } from '@/config';
import { PageActionType } from '@/config/types';
import ColumnWrapper from '@/pages/_components/column-wrapper';
import { useIntl } from '@umijs/max';
import { Form, Tag } from 'antd';
import dayjs from 'dayjs';
import _ from 'lodash';
import { useEffect, useRef, useState } from 'react';
import { createApisKey, updateApisKey } from '../../apis';
import { expirationOptions } from '../../config';
import { FormData, ListItem } from '../../config/types';
import APIKeyForm from './form';

const ModalFooterStyle = {
  padding: '16px 24px 8px',
  display: 'flex',
  justifyContent: 'flex-end'
};

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
  const [isChanged, setIsChanged] = useState(false);
  const cacheFormRef = useRef<{
    allowed_type: string;
    allowed_model_names: string[];
  }>({} as any);

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

  // 7d, 1m, 6m, -1
  const parseExpireValue = (data: ListItem) => {
    const createdAt = dayjs(data.created_at);
    const expiresAt = dayjs(data.expires_at);

    if (!data.expires_at) {
      return -1;
    }

    const diffInDays = expiresAt.diff(createdAt, 'day');

    if (diffInDays < 10) {
      return 7;
    }

    if (diffInDays < 60) {
      return 1;
    }

    return 6;
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

  const handleOnOk = async (formdata: FormData) => {
    try {
      setLoading(true);
      const data = {
        ..._.omit(formdata, ['allowed_type']),
        allowed_model_names:
          formdata.allowed_type === 'all'
            ? []
            : formdata.allowed_model_names || []
      };
      if (action === PageAction.CREATE) {
        await createAPIKey(data);
      } else if (action === PageAction.EDIT && currentData?.id) {
        await updateAPIKey({
          ..._.omit(data, ['expires_in'])
        });
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

  const customEqual = (objValue: any, othValue: any) => {
    if (_.isArray(objValue) && _.isArray(othValue)) {
      return _.isEmpty(_.xor(objValue, othValue));
    }
    return undefined;
  };

  const handleOnValuesChange = async (changedValues: any, allValues: any) => {
    const initialValues = cacheFormRef.current;
    await new Promise((resolve) => {
      setTimeout(resolve, 100);
    });
    if (
      _.isEqualWith(
        initialValues,
        _.pick(allValues, Object.keys(initialValues)),
        customEqual
      )
    ) {
      setIsChanged(false);
    } else {
      setIsChanged(true);
    }
  };

  const initValues = () => {
    if (action === PageAction.CREATE && open) {
      form.setFieldsValue({
        expires_in: 1
      });
    }
    if (action === PageAction.EDIT && currentData && open) {
      parseExpireValue(currentData as ListItem);
      form.setFieldsValue({
        name: currentData.name,
        description: currentData.description,
        allowed_type: currentData.allowed_model_names?.length
          ? 'custom'
          : 'all',
        expires_in: parseExpireValue(currentData as ListItem),
        allowed_model_names: currentData.allowed_model_names || []
      });
    }

    cacheFormRef.current = {
      allowed_type: form.getFieldValue('allowed_type'),
      allowed_model_names: form.getFieldValue('allowed_model_names')
    };
  };

  useEffect(() => {
    initValues();
    if (!open) {
      setIsChanged(false);
      cacheFormRef.current = {} as any;
    }
  }, [open]);

  return (
    <GSDrawer
      title={
        !showKey ? title : intl.formatMessage({ id: 'apikeys.title.save' })
      }
      open={open}
      onClose={onCancel}
      afterOpenChange={handleAfterOpenChange}
      destroyOnHidden={true}
      closeIcon={false}
      maskClosable={false}
      keyboard={false}
      styles={{
        wrapper: { width: 600 }
      }}
      footer={false}
    >
      <ColumnWrapper
        styles={{
          container: { paddingBlock: 0 }
        }}
        footer={
          !showKey ? (
            <>
              {isChanged && (
                <div style={{ marginInline: 24, paddingTop: 8 }}>
                  <AlertBlockInfo
                    type="warning"
                    contentStyle={{ paddingInline: 0 }}
                    message={intl.formatMessage({
                      id: 'models.button.accessSettings.tips'
                    })}
                  ></AlertBlockInfo>
                </div>
              )}
              <ModalFooter
                onOk={handleSumit}
                onCancel={onCancel}
                loading={loading}
                style={ModalFooterStyle}
              ></ModalFooter>
            </>
          ) : (
            <>
              <ModalFooter
                onOk={handleDone}
                onCancel={onCancel}
                loading={loading}
                okText={intl.formatMessage({ id: 'common.button.done' })}
                showCancelBtn={false}
                style={ModalFooterStyle}
              ></ModalFooter>
            </>
          )
        }
      >
        <Form
          name="addAPIKey"
          form={form}
          onFinish={handleOnOk}
          preserve={false}
        >
          {!showKey && (
            <APIKeyForm
              action={action}
              currentData={currentData}
              onValuesChange={handleOnValuesChange}
            ></APIKeyForm>
          )}
          {showKey && action === PageAction.CREATE && (
            <Form.Item>
              <div>
                <Tag
                  variant="filled"
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
      </ColumnWrapper>
    </GSDrawer>
  );
};

export default AddModal;
