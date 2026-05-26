import { systemConfigAtom } from '@/atoms/system';
import PluginExtraFields from '@/components/plugin-extra-fields';
import { PageAction } from '@/config';
import { PageActionType } from '@/config/types';
import { json2Yaml, yaml2Json } from '@/pages/backends/config';
import {
  Input as CInput,
  CollapsePanel,
  Textarea as SealTextArea
} from '@gpustack/core-ui';
import { useIntl } from '@umijs/max';
import { Form, message } from 'antd';
import { useAtomValue } from 'jotai';
import _ from 'lodash';
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
    const systemConfig = useAtomValue(systemConfigAtom);

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

    // Mirror the backend's `_validate_multi_vendor_overrides` check so the
    // user sees the problem at save time instead of as a 400 when they
    // run the register command. Returns the i18n'd message of the first
    // problem found, or null when clean.
    const validateGpuVendorOverrides = (values: any): string | null => {
      const opts = values?.k8s_options;
      const overrides = opts?.gpuVendorOverrides;
      if (!overrides) return null;
      const entries = Object.entries(overrides) as [string, any][];
      if (entries.length === 0) return null;

      // 1. Every override entry must declare a non-empty nodeSelector,
      //    otherwise it can't actually pin its DaemonSet to anything.
      for (const [vendor, override] of entries) {
        const sel = override?.nodeSelector;
        if (!sel || Object.keys(sel).length === 0) {
          return intl.formatMessage(
            { id: 'clusters.gpuVendorOverrides.validate.emptySelector' },
            { vendor }
          );
        }
      }

      // 2. Two vendors with the same selector would fight for the same
      //    nodes — backend rejects this at manifest render.
      for (let i = 0; i < entries.length; i++) {
        for (let j = i + 1; j < entries.length; j++) {
          const [v1, o1] = entries[i];
          const [v2, o2] = entries[j];
          if (_.isEqual(o1?.nodeSelector, o2?.nodeSelector)) {
            return intl.formatMessage(
              { id: 'clusters.gpuVendorOverrides.validate.duplicate' },
              { v1, v2 }
            );
          }
        }
      }

      // 3. Base nodeSelector keys can't be reused in any override —
      //    the CPU worker would require AND forbid the same key.
      const baseKeys = Object.keys(opts?.nodeSelector || {});
      if (baseKeys.length > 0) {
        for (const [vendor, override] of entries) {
          const overrideKeys = Object.keys(override?.nodeSelector || {});
          const clash = overrideKeys.filter((k) => baseKeys.includes(k));
          if (clash.length > 0) {
            return intl.formatMessage(
              { id: 'clusters.gpuVendorOverrides.validate.keyConflict' },
              { vendor, keys: clash.join(', ') }
            );
          }
        }
      }

      return null;
    };

    // Empty username/password aren't meaningful as credentials — the backend
    // models them as Optional[str] and treats null as "no auth". Coerce
    // before sending so a public registry placeholder stays unambiguous.
    const normalizeOutgoing = (values: any): any => {
      const creds = values?.k8s_options?.imageCredentials;
      if (!Array.isArray(creds)) return values;
      const fixed = creds.map((c: any) => ({
        ...c,
        username: c?.username ? c.username : null,
        password: c?.password ? c.password : null
      }));
      return {
        ...values,
        k8s_options: { ...values.k8s_options, imageCredentials: fixed }
      };
    };

    const handleOnFinish = (_values: FormData) => {
      const workerConfig = yaml2Json(advanceConfigRef.current?.getYamlValue());
      // antd's onFinish only delivers values for registered Form.Items.
      // Spreading those on top of `getFieldsValue(true)` clobbers nested
      // objects (e.g. `k8s_options` would lose `gpuVendorOverrides`, which is
      // only set via setFieldValue), so we go straight to the full store.
      const fullValues = form.getFieldsValue(true);

      const overridesErr = validateGpuVendorOverrides(fullValues);
      if (overridesErr) {
        message.error(overridesErr);
        return;
      }

      onFinish(
        normalizeOutgoing({
          ...fullValues,
          worker_config: {
            ...workerConfig
          }
        })
      );
    };

    useEffect(() => {
      if (currentData) {
        const volumeMounts = currentData?.k8s_options?.volumeMounts || [];
        const realVolumeList = (volumeMounts || []).map(
          (item: any, index: number) => ({
            ...item,
            sourceType: Object.keys(item.volumeSource || {})[0] || 'hostPath'
          })
        );
        form.setFieldsValue({
          ...currentData,
          k8s_options: {
            ...(currentData?.k8s_options || {}),
            volumeMounts: realVolumeList
          }
        });
      } else {
        const defaultRegistry = systemConfig?.system_default_container_registry;
        form.setFieldsValue({
          k8s_options: {
            volumeMounts: [
              {
                name: 'gpustack-data-dir',
                mountPath: '/var/lib/gpustack',
                readOnly: false,
                sourceType: 'hostPath',
                volumeSource: {
                  hostPath: {
                    path: '/var/lib/gpustack',
                    type: 'DirectoryOrCreate'
                  }
                }
              }
            ],
            ...(defaultRegistry
              ? {
                  imageCredentials: [
                    { registry: defaultRegistry, username: '', password: '' }
                  ]
                }
              : {})
          }
        });
      }
    }, [currentData, systemConfig?.system_default_container_registry]);

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
        // Run validation first to display any field errors. Then read the
        // FULL store via `getFieldsValue(true)` so values that were set via
        // setFieldValue on non-registered paths (e.g. gpuVendorOverrides)
        // are still included in what we hand to the API.
        await form.validateFields();
        const values = form.getFieldsValue(true);

        // Mirror the backend invariants for gpuVendorOverrides so the user
        // sees the same constraint before submit instead of at register time.
        const overridesErr = validateGpuVendorOverrides(values);
        if (overridesErr) {
          message.error(overridesErr);
          // Reject so the step-flow's Promise.allSettled marks this form
          // as failed and the outer onNext skips the submit callback.
          throw new Error(overridesErr);
        }

        const workerConfig = yaml2Json(
          advanceConfigRef.current?.getYamlValue()
        );

        return normalizeOutgoing({
          ...values,
          worker_config: {
            ...workerConfig
          }
        });
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
          <CInput.Input
            label={intl.formatMessage({ id: 'common.table.name' })}
            required
            trim={false}
          ></CInput.Input>
        </Form.Item>
        <PluginExtraFields name="CreateOrgScopeField" context={{ action }} />
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
                  currentData={currentData}
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
