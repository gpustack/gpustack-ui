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
import { Form } from 'antd';
import { useAtomValue } from 'jotai';
import React, { forwardRef, useEffect, useImperativeHandle } from 'react';
import { ProviderType, ProviderValueMap } from '../config';
import {
  ClusterFormData as FormData,
  ClusterListItem as ListItem
} from '../config/types';
import AdvanceConfig from '../step-forms/advance-config';
import CloudProvider from './cloud-provider-form';
import K8sPodSpec from './k8s-pod-spec';

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
    // K8s deployment options is its own top-level section (sibling of Advanced),
    // open by default so the fields are visible without an extra click.
    const [k8sActiveKey, setK8sActiveKey] = React.useState<string[]>([
      'k8sOptions'
    ]);
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

    // The backend models the optional k8s_options string knobs as
    // Optional[str] and treats null/absent as "use the server default" or
    // "no auth". Coerce empty form values to null before sending so a blank
    // input is unambiguous rather than an empty string that defeats fallbacks.
    const normalizeOutgoing = (values: any): any => {
      const base: any = { ...values };
      // Top-level cluster field shared by Docker and K8s. Trim then coerce a
      // blank input to null so clearing it on edit (or a whitespace-only
      // value) falls back to the server default rather than persisting an
      // empty string.
      if (base.system_default_container_registry !== undefined) {
        base.system_default_container_registry =
          base.system_default_container_registry?.trim() || null;
      }

      const opts = base.k8s_options;
      if (!opts) return base;

      const next: any = { ...opts };

      const creds = opts.imageCredentials;
      if (Array.isArray(creds)) {
        next.imageCredentials = creds.map((c: any) => ({
          ...c,
          username: c?.username || null,
          password: c?.password || null
        }));
      }

      next.operatorImage = opts.operatorImage || null;
      next.namespace = opts.namespace || null;

      // Presence of gpuInstanceOptions is the enable flag; keep it only when
      // the toggle left an object behind, coercing a blank address to null.
      if (opts.gpuInstanceOptions) {
        next.gpuInstanceOptions = {
          gpuInstancesAccessStaticAddress:
            opts.gpuInstanceOptions.gpuInstancesAccessStaticAddress || null
        };
      }

      return { ...base, k8s_options: next };
    };

    const handleOnFinish = (_values: FormData) => {
      const workerConfig = yaml2Json(advanceConfigRef.current?.getYamlValue());
      // antd's onFinish only delivers values for registered Form.Items.
      // Spreading those on top of `getFieldsValue(true)` clobbers nested
      // objects (e.g. `k8s_options` would lose values set via setFieldValue),
      // so we go straight to the full store.
      const fullValues = form.getFieldsValue(true);

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
        // setFieldValue on non-registered paths are still included in what we
        // hand to the API.
        await form.validateFields();
        const values = form.getFieldsValue(true);

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

        {provider === ProviderValueMap.Kubernetes && (
          <CollapsePanel
            accordion={false}
            activeKey={k8sActiveKey}
            onChange={(keys) =>
              setK8sActiveKey(Array.isArray(keys) ? keys : [keys])
            }
            items={[
              {
                key: 'k8sOptions',
                label: intl.formatMessage({ id: 'clusters.k8sOptions.title' }),
                forceRender: true,
                children: (
                  // Key by cluster id so the section fully remounts when the
                  // active cluster changes. GpuInstanceOptionsForm seeds its
                  // local state from initialValue only once (initializedRef),
                  // so without a remount a reused form instance could carry a
                  // previous cluster's GPU instance config into the next one.
                  <K8sPodSpec
                    key={currentData?.id ?? 'new'}
                    action={action}
                    initialGpuInstanceOptions={
                      currentData?.k8s_options?.gpuInstanceOptions
                    }
                  ></K8sPodSpec>
                )
              }
            ]}
          ></CollapsePanel>
        )}

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
