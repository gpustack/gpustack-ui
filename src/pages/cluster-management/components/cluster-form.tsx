import SealInput from '@/components/seal-form/seal-input';
import SealTextArea from '@/components/seal-form/seal-textarea';
import { PageAction } from '@/config';
import { PageActionType } from '@/config/types';
import CollapsePanel from '@/pages/_components/collapse-panel';
import { json2Yaml, yaml2Json } from '@/pages/backends/config';
import { useIntl } from '@umijs/max';
import { Form } from 'antd';
import React, { forwardRef, useEffect, useImperativeHandle } from 'react';
import { ProviderType, ProviderValueMap } from '../config';
import {
  ClusterFormData as FormData,
  ClusterListItem as ListItem
} from '../config/types';
import AdvanceConfig from '../step-forms/advance-config';
import CloudProvider from './cloud-provider-form';

type AddModalProps = {
  action: PageActionType;
  currentData?: ListItem; // Used when action is EDIT
  provider: ProviderType;
  credentialList: Global.BaseOption<number>[];
  onFinish: (values: FormData) => void;
  ref?: any;
};
const ClusterForm: React.FC<AddModalProps> = forwardRef(
  ({ action, provider, currentData, credentialList, onFinish }, ref) => {
    const [form] = Form.useForm();
    const intl = useIntl();
    const [activeKey, setActiveKey] = React.useState<string[]>([]);
    const advanceConfigRef = React.useRef<any>(null);

    const handleOnCollapseChange = async (keys: string | string[]) => {
      setActiveKey(Array.isArray(keys) ? keys : [keys]);
    };

    useEffect(() => {
      if (
        activeKey?.includes?.('advanceConfig') &&
        action === PageAction.EDIT
      ) {
        const el = document.querySelector('.scroller-to-holder');
        if (!el) return;
        setTimeout(() => {
          el.scrollIntoView({ behavior: 'smooth' });
        }, 300);
      }
    }, [activeKey, action]);

    const handleOnFinish = (values: FormData) => {
      const workerConfig = yaml2Json(advanceConfigRef.current?.getYamlValue());

      onFinish({
        ...values,
        worker_config: {
          ...workerConfig
        }
      });
    };

    useEffect(() => {
      if (currentData) {
        form.setFieldsValue(currentData);
      }
    }, [currentData]);

    useEffect(() => {
      if (currentData) {
        if (advanceConfigRef.current) {
          const workerConfigYaml = json2Yaml(currentData.worker_config || {});
          advanceConfigRef.current?.setYamlValue(workerConfigYaml);
        }
      }
    }, [currentData, advanceConfigRef.current]);

    useImperativeHandle(ref, () => ({
      resetFields: () => {
        form.resetFields();
      },
      submit: () => {
        form.submit();
      },
      setFieldsValue: (values: any) => {
        form.setFieldsValue({
          ...values,
          worker_config: undefined
        });
        const workerConfigYaml = json2Yaml(values.worker_config || {});
        advanceConfigRef.current?.setYamlValue(workerConfigYaml);
      },
      getFieldsValue: () => {
        const workerConfig = yaml2Json(
          advanceConfigRef.current?.getYamlValue()
        );
        return {
          ...form.getFieldsValue(),
          worker_config: {
            ...workerConfig
          }
        };
      },
      validateFields: async () => {
        const values = await form.validateFields();
        const workerConfig = yaml2Json(
          advanceConfigRef.current?.getYamlValue()
        );

        return {
          ...values,
          worker_config: {
            ...workerConfig
          }
        };
      }
    }));

    return (
      <Form
        name="clusterForm"
        form={form}
        onFinish={handleOnFinish}
        preserve={false}
        scrollToFirstError={true}
        initialValues={currentData}
      >
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
            trim={false}
          ></SealInput.Input>
        </Form.Item>
        {provider === ProviderValueMap.DigitalOcean && (
          <CloudProvider
            provider={provider}
            action={action}
            credentialID={currentData?.credential_id}
            credentialList={credentialList}
          ></CloudProvider>
        )}
        <Form.Item<FormData>
          name="description"
          rules={[{ required: false }]}
          style={{ marginBottom: 8 }}
        >
          <SealTextArea
            autoSize={{ minRows: 2, maxRows: 4 }}
            label={intl.formatMessage({ id: 'common.table.description' })}
          ></SealTextArea>
        </Form.Item>
        <CollapsePanel
          accordion={false}
          activeKey={activeKey}
          onChange={handleOnCollapseChange}
          items={[
            {
              key: 'advanceConfig',
              label: intl.formatMessage({ id: 'resources.form.advanced' }),
              forceRender: true,
              children: (
                <AdvanceConfig
                  action={action}
                  provider={provider}
                  ref={advanceConfigRef}
                ></AdvanceConfig>
              )
            }
          ]}
        ></CollapsePanel>
      </Form>
    );
  }
);

export default ClusterForm;
