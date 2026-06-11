import { PageAction } from '@/config';
import { PageActionType } from '@/config/types';
import {
  ceilMilliToCore,
  parseJsonSafe,
  parseQuantityToGi
} from '@/pages/gpu-service/utils';
import { PlusOutlined } from '@ant-design/icons';
import {
  CheckboxField,
  Input as CInput,
  CollapsePanel,
  IconFont,
  MultipleSelect,
  ScrollSpyTabs,
  useAppUtils,
  useFinishFailed,
  useScrollActiveChange,
  useWrapperContext
} from '@gpustack/core-ui';
import { useIntl } from '@umijs/max';
import { Button, Flex, Form } from 'antd';
import _ from 'lodash';
import {
  forwardRef,
  useEffect,
  useImperativeHandle,
  useMemo,
  useRef,
  useState
} from 'react';
import { FormData as PublicKeyFormData } from '../../public-keys/config/types';
import useQuerySshkeys from '../../public-keys/services/use-query-sshkeys';
import { DefaultImagePullPolicy } from '../../templates/config';
import TemplateBasicForm, {
  BasicResourceMax
} from '../../templates/forms/basic';
import { pickCandidateForAccelerator, StorageModeValueMap } from '../config';
import { FormContext } from '../config/form-context';
import { FormData, InstanceTypeItem, ListItem } from '../config/types';
import instanceStyles from '../styles/instances.module.less';
import Basic from './basic';
import InstanceTypeFormItem from './instance-type';
import PublicKeyOverlay from './public-key-overlay';
import StorageVolume from './storage-volume';

const SSH_PORT = 22;

type InstanceFormValues = FormData & {
  // ssh holder
  enable_ssh?: boolean;
};

interface InstanceFormProps {
  ref?: any;
  open: boolean;
  action: PageActionType;
  realAction?: PageActionType | string;
  currentData?: ListItem | null;
  namespace?: string;
  instanceTypeList?: InstanceTypeItem[];
  // True when the (org-scoped) instance-type list is empty and not loading —
  // surfaces a "no available instance type" message in the scheduling tab.
  noAvailableInstanceTypes?: boolean;
  disabled?: boolean;
  // Fired when the create-scope picker retargets the form to another
  // org (or Global). Only emitted on genuine changes — never on the
  // initial mount, and never in builds where the picker isn't mounted
  // (the watched field stays undefined). Lets the parent re-scope the
  // tenant-scoped instance-type / template offerings.
  onScopeChange?: (orgId: number | null | undefined) => void;
  onFinish: (values: FormData) => Promise<void>;
  onFinishFailed?: (errorInfo: any) => void;
}

const TABKeysMap = {
  BASIC: 'basic',
  INSTANCE_TYPE: 'instanceType',
  TEMPLATE: 'template',
  STORAGE: 'storage'
};

const requiredFields = {
  [TABKeysMap.BASIC]: {
    sort: 1,
    fields: ['name']
  },
  [TABKeysMap.INSTANCE_TYPE]: {
    sort: 2,
    fields: ['spec.type', 'spec.resources.accelerator']
  },
  [TABKeysMap.TEMPLATE]: {
    sort: 3,
    fields: ['spec.image', 'spec.ports', 'spec.env']
  },
  [TABKeysMap.STORAGE]: {
    sort: 4,
    fields: [
      'spec.volume.persistent.name',
      'spec.volume.ephemeral.capacity',
      'spec.sshPublicKeys'
    ]
  }
};

const GPUServiceInstanceForm: React.FC<InstanceFormProps> = forwardRef(
  (props, ref) => {
    const {
      action,
      realAction,
      currentData,
      disabled,
      open,
      instanceTypeList = [],
      noAvailableInstanceTypes,
      onScopeChange,
      onFinish,
      onFinishFailed
    } = props;
    const intl = useIntl();
    const { getRuleMessage } = useAppUtils();
    const [form] = Form.useForm<InstanceFormValues>();
    const scrollTabsRef = useRef<any>(null);
    const formAction =
      realAction === PageAction.CREATE ? PageAction.CREATE : action;
    const sshEnabled = Form.useWatch('enable_ssh', form);
    const description = Form.useWatch(['description'], form);
    // `organization_id` is owned by the create-scope picker slot; it only
    // exists/changes when a platform admin retargets the form. Watch it
    // so the parent can re-scope offerings (see onScopeChange).
    const scopeOrgId = Form.useWatch('organization_id', form);
    const scopeInitRef = useRef(true);
    // Keep the latest callback in a ref so the scope-change effect can call it
    // without depending on its identity (parent may pass a new fn each render).
    const onScopeChangeRef = useRef(onScopeChange);
    onScopeChangeRef.current = onScopeChange;
    const { sshkeyOptions, fetchData: fetchSSHData } = useQuerySshkeys();
    const [sshOverlayOpen, setSshOverlayOpen] = useState(false);
    const { getScrollElementScrollableHeight } = useWrapperContext();
    const {
      activeKey,
      collapseKeys,
      handleActiveChange,
      handleOnCollapseChange,
      updateActiveKey
    } = useScrollActiveChange({
      initalActiveKeys: [TABKeysMap.BASIC],
      initialCollapseKeys:
        action === PageAction.EDIT
          ? []
          : [TABKeysMap.INSTANCE_TYPE, TABKeysMap.TEMPLATE, TABKeysMap.STORAGE]
    });

    const isGPUType = useMemo(() => {
      const spec = parseJsonSafe(description || '{}', {} as any)?.spec;
      console.log('derived spec from description', spec);
      return spec?.acceleratable;
    }, [description]);

    useEffect(() => {
      if (open) {
        fetchSSHData({ page: 1, perPage: 100 });
      }
    }, [open, action]);

    // Skip the first run (initial mount value); thereafter notify the
    // parent whenever the chosen create scope changes so it can reload
    // the tenant-scoped instance-type / template lists.
    useEffect(() => {
      if (scopeInitRef.current) {
        scopeInitRef.current = false;
        return;
      }
      onScopeChangeRef.current?.(scopeOrgId);
    }, [scopeOrgId]);

    const ports = Form.useWatch(['spec', 'ports'], form) || [];

    const hasSSHPort = useMemo(
      () =>
        ports.some(
          (item: any) => item?.protocol === 'TCP' && item?.port === SSH_PORT
        ),
      [ports]
    );

    useEffect(() => {
      if (
        hasSSHPort &&
        !form.getFieldValue('enable_ssh') &&
        action === PageAction.CREATE
      ) {
        form.setFieldValue('enable_ssh', true);
      }
    }, [hasSSHPort, form, action]);

    const segmentOptions = useMemo(
      () => [
        {
          value: TABKeysMap.BASIC,
          label: intl.formatMessage({
            id: 'common.title.basicInfo'
          }),
          icon: <IconFont type="icon-basic" />,
          field: 'name'
        },
        {
          value: TABKeysMap.INSTANCE_TYPE,
          label: intl.formatMessage({ id: 'gpuservice.instance.section.type' }),
          icon: <IconFont type="icon-gpu1" />,
          field: 'instanceType'
        },
        {
          value: TABKeysMap.TEMPLATE,
          label: intl.formatMessage({
            id: 'gpuservice.instance.section.template'
          }),
          icon: <IconFont type="icon-model" />,
          field: 'template'
        },
        {
          value: TABKeysMap.STORAGE,
          label: intl.formatMessage({
            id: 'gpuservice.instance.section.storage'
          }),
          icon: <IconFont type="icon-storage-outlined" />,
          field: 'storage'
        }
      ],
      [intl]
    );

    const [selectedInstanceType, setSelectedInstanceType] = useState<
      InstanceTypeItem | undefined
    >(undefined);
    const [onceMaxRequest, setOnceMaxRequest] = useState<BasicResourceMax>({
      cpu: null,
      memory: null,
      localStorage: null
    });

    const buildResourcesData = (
      instanceType: InstanceTypeItem | undefined,
      options: {
        count: number;
      }
    ) => {
      const unitResourcesParsed = instanceType?.spec?.unitResourcesParsed;
      const { count = 0 } = options;

      console.log('building resources data with', {
        unitResourcesParsed,
        count
      });

      const result = {
        accelerator: _.toString(count),
        cpu: unitResourcesParsed?.cpu?.cores
          ? count * unitResourcesParsed?.cpu?.cores
          : null,
        ram: unitResourcesParsed?.ram?.value
          ? count * unitResourcesParsed?.ram?.value
          : null
      };
      console.log('built resources data', result);
      return result;
    };

    const buildResourcesDataForSubmit = (values: FormData) => {
      const unitResourcesParsed = getUnitResources();
      const accelerator = _.toNumber(values.spec?.resources?.accelerator) || 0;
      const cpuCount = _.toNumber(values.spec?.resources?.cpu) || 0;

      const cpuNum = unitResourcesParsed?.cpu?.num;
      const ramNum = unitResourcesParsed?.ram?.num;

      const fallbackCpu = values.spec?.resources?.cpu;

      const factor = isGPUType ? accelerator : cpuCount;

      return {
        cpu: cpuNum
          ? `${factor * cpuNum}${unitResourcesParsed?.cpu?.unit || ''}`
          : // Don't stringify an unset value — `${undefined}` becomes the
            // literal "undefined", which fails k8s quantity validation.
            fallbackCpu
            ? `${fallbackCpu}`
            : undefined,
        ram: ramNum
          ? `${factor * ramNum}${unitResourcesParsed?.ram?.unit || ''}`
          : values.spec?.resources?.ram
      };
    };

    const resolveAndApply = (
      instanceType: InstanceTypeItem | undefined,
      count: number
    ) => {
      if (!instanceType) {
        setSelectedInstanceType(undefined);
        setOnceMaxRequest({ cpu: null, memory: null, localStorage: null });
        const spec = form.getFieldValue('spec') || {};

        form.setFieldsValue({
          clusterId: null,
          spec: {
            ...spec,
            type: null,
            resources: {
              ...spec.resources,
              accelerator: null,
              cpu: null,
              ram: null
            }
          }
        });
        return;
      }

      setSelectedInstanceType(instanceType);

      const candidate = pickCandidateForAccelerator(
        instanceType.status?.tiers,
        {
          count,
          acceleratable: instanceType.spec?.acceleratable
        }
      );

      console.log('picked candidate', candidate, instanceType, count);

      setOnceMaxRequest({
        cpu: ceilMilliToCore(candidate?.cpu?.onceMaxRequest)?.cores,
        memory: parseQuantityToGi(candidate?.ram?.onceMaxRequest)?.value,
        localStorage: parseQuantityToGi(candidate?.localStorage?.onceMaxRequest)
          ?.value
      });

      form.setFieldsValue({
        clusterId: candidate?.cluster ? _.toNumber(candidate.cluster) : null,
        spec: {
          type: candidate?.name || '',
          resources: {
            ...buildResourcesData(instanceType, {
              count
            })
          }
        } as any
      });
    };

    const handleAcceleratorChange = (count: number) => {
      resolveAndApply(selectedInstanceType, count);
    };

    const onTargetChange = (key: string) => {
      scrollTabsRef.current?.handleTargetChange(key);
    };

    const { handleOnFinishFailed: rawHandleOnFinishFailed } = useFinishFailed({
      requiredFields,
      onTargetChange,
      updateActiveKey
    });

    const handleOnFinishFailed = (errorInfo: any) => {
      console.log('formvalues===', form.getFieldsValue());
      const errorFields = (errorInfo?.errorFields || []).map((field: any) => ({
        ...field,
        name: [
          Array.isArray(field.name) ? field.name.join('.') : String(field.name)
        ]
      }));
      rawHandleOnFinishFailed({ ...errorInfo, errorFields });
      onFinishFailed?.(errorInfo);
    };
    const detectMode = (volume?: FormData['spec']['volume']) => {
      if (volume?.persistent?.name || volume?.persistentTemplate?.name) {
        return StorageModeValueMap.Persistent;
      }
      return StorageModeValueMap.Temporary;
    };

    useEffect(() => {
      if (!open) {
        form.resetFields();
        return;
      }

      if (
        action === PageAction.EDIT ||
        action === PageAction.VIEW ||
        realAction === PageAction.CREATE
      ) {
        console.log('currentData', currentData);
        const currentSpec = parseJsonSafe(
          currentData?.description || '{}',
          {} as any
        )?.spec;

        const count = currentSpec?.acceleratable
          ? _.toNumber(currentData?.spec?.resources?.accelerator)
          : _.toNumber(currentData?.spec?.resources?.cpu) || 0;

        form.setFieldsValue({
          ...currentData,
          spec: {
            ...currentData?.spec,
            resources: {
              ...currentData?.spec?.resources,
              ...buildResourcesData(
                parseJsonSafe<any>(currentData?.description || '{}', {}),
                {
                  count
                }
              )
            }
          },
          enable_ssh: !!currentData?.spec?.sshPublicKeys?.length,
          storageMode: detectMode(currentData?.spec?.volume)
        });
      }
    }, [action, currentData, form, open, realAction, instanceTypeList]);

    const getUnitResources = () => {
      if (selectedInstanceType?.spec?.unitResourcesParsed) {
        return selectedInstanceType.spec.unitResourcesParsed;
      }
      try {
        return (
          parseJsonSafe<any>(currentData?.description || '{}', {})?.spec
            ?.unitResourcesParsed ?? undefined
        );
      } catch {
        return undefined;
      }
    };

    const handleFinish = async (values: InstanceFormValues) => {
      const submittedPorts = [...(values.spec?.ports ?? [])];
      const submittedHasSSHPort = submittedPorts.some(
        (item: any) => item?.protocol === 'TCP' && item?.port === SSH_PORT
      );

      if (!submittedHasSSHPort) {
        submittedPorts.push({
          protocol: 'TCP',
          port: SSH_PORT,
          name: 'SSH'
        });
      }

      await onFinish({
        ..._.omit(values, ['enable_ssh']),
        spec: {
          ...values.spec,
          ports: submittedPorts,
          resources: {
            ...values.spec?.resources,
            ...buildResourcesDataForSubmit(values)
          }
        }
      });
    };

    const segmentedTop =
      action === PageAction.EDIT
        ? {
            top: 0,
            offsetTop: 100
          }
        : {
            top: 40,
            offsetTop: 130
          };

    useImperativeHandle(ref, () => ({
      submit: () => {
        form.submit();
      },
      resetFields: () => {
        form.resetFields();
      },
      setFieldsValue: (values: Partial<InstanceFormValues>) => {
        form.setFieldsValue(values as any);
      },
      getFieldsValue: () => form.getFieldsValue(),
      applyInstanceType: (instanceType?: InstanceTypeItem) => {
        if (!instanceType) {
          resolveAndApply(undefined, 0);
          return;
        }

        // set default  to 1, for all instance types: GPU or non-GPU
        resolveAndApply(instanceType, 1);
      }
    }));

    const handleAddSSHKey = () => {
      setSshOverlayOpen(true);
    };

    const handleCreateSSHKey = async (values: PublicKeyFormData) => {
      try {
        await fetchSSHData({ page: -1 });
        const current: Array<{ name: string } | string> =
          form.getFieldValue(['spec', 'sshPublicKeys']) || [];
        form.setFieldValue(
          ['spec', 'sshPublicKeys'],
          [...current, { name: values.name }]
        );

        setSshOverlayOpen(false);
      } catch (error) {
        // it's handled in interceptor
      }
    };

    const handleOnEnableSSHChange = (e: any) => {
      const checked = e.target.checked;
      if (!checked) {
        form.setFieldValue(['spec', 'sshPublicKeys'], []);
      }
    };

    return (
      <ScrollSpyTabs
        ref={scrollTabsRef}
        defaultTarget={TABKeysMap.BASIC}
        segmentOptions={segmentOptions}
        activeKey={activeKey}
        setActiveKey={handleActiveChange}
        segmentedTop={segmentedTop}
        getScrollElementScrollableHeight={getScrollElementScrollableHeight}
      >
        <FormContext.Provider
          value={{
            action: formAction,
            currentData: currentData,
            isGPUType: isGPUType
          }}
        >
          <Form
            name="gpuServiceInstanceForm"
            form={form}
            disabled={disabled}
            onFinish={handleFinish}
            onFinishFailed={handleOnFinishFailed}
            preserve={false}
            initialValues={{
              spec: {
                description: '',
                displayName: '',
                image: '',
                imagePullPolicy: DefaultImagePullPolicy,
                command: [],
                ports: [],
                env: [],
                volumeMount: '',
                resources: {
                  accelerator: 1
                },
                volume: {
                  ephemeral: {
                    capacity: '50Gi'
                  },
                  persistent: {
                    name: ''
                  }
                }
              },
              enable_ssh: false,
              storageMode: StorageModeValueMap.Temporary
            }}
          >
            <Basic action={formAction} disabled={disabled} />
            <Form.Item name="clusterId" hidden>
              <CInput.Input />
            </Form.Item>
            <CollapsePanel
              activeKey={collapseKeys}
              accordion={false}
              onChange={handleOnCollapseChange}
              items={[
                {
                  key: TABKeysMap.INSTANCE_TYPE,
                  label: intl.formatMessage({
                    id: 'gpuservice.instance.section.type'
                  }),
                  forceRender: true,
                  children: (
                    <InstanceTypeFormItem
                      action={formAction}
                      disabled={disabled}
                      selectedInstanceType={selectedInstanceType}
                      currentData={currentData as any}
                      onceMaxRequest={onceMaxRequest}
                      noAvailableTypes={noAvailableInstanceTypes}
                      onGPUCountChange={handleAcceleratorChange}
                    />
                  )
                },
                {
                  key: TABKeysMap.TEMPLATE,
                  label: intl.formatMessage({
                    id: 'gpuservice.instance.section.template'
                  }),
                  forceRender: true,
                  children: (
                    <TemplateBasicForm
                      page="instance"
                      disabled={disabled || formAction === PageAction.EDIT}
                      onceMaxRequest={onceMaxRequest}
                    />
                  )
                },
                {
                  key: TABKeysMap.STORAGE,
                  label: intl.formatMessage({
                    id: 'gpuservice.instance.section.storage'
                  }),
                  forceRender: true,
                  children: (
                    <StorageVolume
                      disabled={disabled || formAction === PageAction.EDIT}
                      action={formAction}
                    />
                  )
                }
              ]}
            />

            <Flex align="center" justify="space-between">
              <Form.Item<FormData>
                name="enable_ssh"
                valuePropName="checked"
                style={{ marginBottom: 8 }}
              >
                <CheckboxField
                  onChange={handleOnEnableSSHChange}
                  disabled={disabled}
                  label={intl.formatMessage({
                    id: 'gpuservice.instance.ssh.enable'
                  })}
                ></CheckboxField>
              </Form.Item>
              <Button
                size="small"
                type="link"
                icon={<PlusOutlined />}
                onClick={handleAddSSHKey}
              >
                {intl.formatMessage({
                  id: 'gpuservice.instance.ssh.addKey'
                })}
              </Button>
            </Flex>

            <div className={instanceStyles.sshkeySelection}>
              <Form.Item<FormData>
                name={['spec', 'sshPublicKeys']}
                style={{
                  marginBottom: 12
                }}
                hidden={!sshEnabled}
                normalize={(value) =>
                  Array.isArray(value)
                    ? value?.map((item) => ({ name: item }))
                    : []
                }
                getValueProps={(value) => ({
                  value: Array.isArray(value)
                    ? value.map((item) => item?.name ?? item)
                    : []
                })}
                rules={[
                  {
                    required: sshEnabled,
                    message: getRuleMessage('select', 'gpuservice.publicKey')
                  }
                ]}
              >
                <MultipleSelect
                  required
                  disabled={disabled}
                  mode="multiple"
                  maxTagCount={'responsive'}
                  label={intl.formatMessage({
                    id: 'gpuservice.instance.ssh.assignKey'
                  })}
                  styles={{
                    wrapper: {
                      width: '100%'
                    }
                  }}
                  options={sshkeyOptions}
                ></MultipleSelect>
              </Form.Item>
            </div>
          </Form>
        </FormContext.Provider>
        <PublicKeyOverlay
          open={sshOverlayOpen}
          onCancel={() => setSshOverlayOpen(false)}
          onSubmit={handleCreateSSHKey}
        />
      </ScrollSpyTabs>
    );
  }
);

export default GPUServiceInstanceForm;
