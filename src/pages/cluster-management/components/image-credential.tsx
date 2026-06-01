import { MetadataList, useAppUtils } from '@gpustack/core-ui';
import { useIntl } from '@umijs/max';
import { Form } from 'antd';
import React, { useEffect } from 'react';
import { useFormContext } from '../config/form-context';
import { ImageCredential as ImageCredentialType } from '../config/types';
import imgCredentialStyle from '../styles/img-credential.less';
import CredentialItem from './credential-item';

const FIELD_PATH = ['k8s_options', 'imageCredentials'];

const ImageCredential: React.FC = () => {
  const intl = useIntl();
  const { getRuleMessage } = useAppUtils();
  const { submitAttempted } = useFormContext();
  const validated = !!submitAttempted;
  const form = Form.useFormInstance();
  const credentials: ImageCredentialType[] =
    Form.useWatch(FIELD_PATH, form) || [];

  const updateList = (list: ImageCredentialType[]) => {
    form.setFieldValue(FIELD_PATH, list);
  };

  useEffect(() => {
    if (validated) {
      form.validateFields([FIELD_PATH]).catch(() => {});
    }
  }, [credentials, validated]);

  const handleAdd = () => {
    updateList([...credentials, { registry: '', username: '', password: '' }]);
  };

  const handleDelete = (index: number) => {
    const next = [...credentials];
    next.splice(index, 1);
    updateList(next);
  };

  const handleChange = (
    index: number,
    partial: Partial<ImageCredentialType>
  ) => {
    const next = [...credentials];
    next[index] = { ...next[index], ...partial };
    updateList(next);
  };

  return (
    <div className={imgCredentialStyle.container}>
      <Form.Item
        name={FIELD_PATH}
        style={{ marginTop: 24 }}
        rules={[
          {
            validator: async (_, value: ImageCredentialType[]) => {
              if (!value?.length) return;
              const hasMissingRegistry = value.some(
                (item) => !item?.registry?.trim()
              );
              if (hasMissingRegistry) {
                throw new Error(
                  getRuleMessage('input', 'clusters.imageCredentials.registry')
                );
              }
            }
          }
        ]}
      >
        <MetadataList
          label={intl.formatMessage({ id: 'clusters.imageCredentials.title' })}
          btnText={intl.formatMessage({ id: 'clusters.imageCredentials.add' })}
          dataList={credentials}
          onAdd={handleAdd}
          onDelete={handleDelete}
          styles={{
            delBtn: {
              marginTop: 44
            }
          }}
        >
          {(item: ImageCredentialType, index: number) => (
            <CredentialItem
              item={item}
              index={index}
              key={index}
              validated={validated}
              onChange={(partial) => handleChange(index, partial)}
            />
          )}
        </MetadataList>
      </Form.Item>
    </div>
  );
};

export default ImageCredential;
