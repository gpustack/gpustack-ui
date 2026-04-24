import { INPUT_WIDTH } from '@/constants';
import { Textarea } from '@gpustack/core-ui';
import { useIntl } from '@umijs/max';
import { Button, Form } from 'antd';
import React from 'react';

interface PublicKeyFormData {
  public_key?: string;
}

const PublicKey: React.FC = () => {
  const intl = useIntl();
  const [form] = Form.useForm<PublicKeyFormData>();

  return (
    <Form style={{ width: '524px' }} name="publicKeyForm" form={form}>
      <Form.Item<PublicKeyFormData> name="public_key">
        <Textarea
          label="SSH 公钥"
          placeholder="将您的 SSH 公钥粘贴到此处"
          trim={false}
          alwaysFocus
          autoSize={{ minRows: 4, maxRows: 8 }}
          style={{ width: INPUT_WIDTH.default }}
        ></Textarea>
      </Form.Item>
      <Button type="primary" style={{ width: 120, marginTop: 100 }}>
        {intl.formatMessage({ id: 'common.button.save' })}
      </Button>
    </Form>
  );
};

PublicKey.displayName = 'PublicKey';

export default PublicKey;
