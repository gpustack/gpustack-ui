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
import React, {
  forwardRef,
  useEffect,
  useImperativeHandle,
  useState
} from 'react';
import { ProviderType, ProviderValueMap } from '../config';
import { FormContext } from '../config/form-context';
import {
  ClusterFormData as FormData,
  ClusterListItem as ListItem
} from '../config/types';
import AdvanceConfig from '../step-forms/advance-config';
import CloudProvider from './cloud-provider-form';
import K8sAdvancedOptions, {
  ClusterTypeSelector,
  K8sOptionsChangeWatcher
} from './k8s-pod-spec';

type AddModalProps = {
  action: PageActionType;
  currentData?: ListItem; // Used when action is EDIT
  provider: ProviderType;
  credentialList: Global.BaseOption<number>[];
  onFinish: (values: FormData) => void;
  onFinishFailed?: (errorInfo: any) => void;
  // Reports whether the user has changed any k8s_options field, so the parent
  // can show the "re-run registration" notice in the footer.
  onK8sOptionsChange?: (changed: boolean) => void;
  ref?: any;
};
const ClusterForm: React.FC<AddModalProps> = forwardRef(
  (
    {
      action,
      provider,
      currentData,
      credentialList,
      onFinish,
      onFinishFailed,
      onK8sOptionsChange
    },
    ref
  ) => {
    const [form] = Form.useForm();
    const intl = useIntl();
    const [activeKey, setActiveKey] = React.useState<string[]>([]);
    const [submitAttempted, setSubmitAttempted] = useState(false);
    // Single source of truth for the K8s cluster type, seeded from the cluster
    // being edited. Shared via FormContext so the type selector and the
    // GPU-only fields stay in sync deterministically (no cross-component watch).
    const [clusterType, setClusterType] = useState<'model' | 'gpu'>(() =>
      currentData?.k8s_options?.gpuInstanceOptions ? 'gpu' : 'model'
    );
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

    const normalizeOutgoing = (values: any): any => {
      const base: any = { ...values };

      const opts = base.k8s_options;
      if (!opts) return base;

      const next: any = { ...opts };

      // "model" clusters must not carry GPU-instance config. The field's UI is
      // unmounted when model is selected, but strip it here too so the payload
      // never keeps a stale gpuInstanceOptions shape from a prior "gpu" choice.
      if (clusterType === 'model') {
        delete next.gpuInstanceOptions;
      }

      const creds = opts.imageCredentials;
      if (Array.isArray(creds)) {
        next.imageCredentials = creds.map((c: any) => ({
          ...c,
          username: c?.username || null,
          password: c?.password || null
        }));
      }

      return { ...base, k8s_options: next };
    };

    const handleOnFinish = (values: FormData) => {
      const workerConfig = yaml2Json(advanceConfigRef.current?.getYamlValue());
      onFinish(
        normalizeOutgoing({
          ...values,
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
        try {
          await form.validateFields();
        } catch (e) {
          setSubmitAttempted(true);
          throw e;
        }
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

    const handleOnFinishFailed = (errorInfo: any) => {
      setSubmitAttempted(true);
      onFinishFailed?.(errorInfo);
    };

    return (
      <FormContext.Provider
        value={{ submitAttempted, clusterType, setClusterType }}
      >
        <Form
          name="clusterForm"
          form={form}
          onFinish={handleOnFinish}
          onFinishFailed={handleOnFinishFailed}
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
            style={{
              marginBottom:
                provider === ProviderValueMap.Kubernetes ? undefined : 8
            }}
          >
            <SealTextArea
              scaleSize
              label={intl.formatMessage({ id: 'common.table.description' })}
            ></SealTextArea>
          </Form.Item>

          {provider === ProviderValueMap.Kubernetes && <ClusterTypeSelector />}

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
                  <>
                    {provider === ProviderValueMap.Kubernetes && (
                      <K8sAdvancedOptions
                        key={currentData?.id ?? 'new'}
                        action={action}
                      ></K8sAdvancedOptions>
                    )}
                    <AdvanceConfig
                      action={action}
                      provider={provider}
                      currentData={currentData}
                      ref={advanceConfigRef}
                    ></AdvanceConfig>
                  </>
                )
              }
            ]}
          ></CollapsePanel>

          {provider === ProviderValueMap.Kubernetes && onK8sOptionsChange && (
            <K8sOptionsChangeWatcher
              action={action}
              currentData={currentData}
              onChange={onK8sOptionsChange}
            />
          )}
        </Form>
      </FormContext.Provider>
    );
  }
);

export default ClusterForm;
