import { PageAction } from '@/config';
import { PageActionType } from '@/config/types';
import { ceilMilliToCore, parseQuantityToGi } from '@/pages/gpu-service/utils';
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
  disabled?: boolean;
  onFinish: (values: FormData) => Promise<void>;
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
      onFinish
    } = props;
    const intl = useIntl();
    const { getRuleMessage } = useAppUtils();
    const [form] = Form.useForm<InstanceFormValues>();
    const scrollTabsRef = useRef<any>(null);
    const formAction =
      realAction === PageAction.CREATE ? PageAction.CREATE : action;
    const sshEnabled = Form.useWatch('enable_ssh', form);
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

    useEffect(() => {
      if (open) {
        fetchSSHData({ page: 1, perPage: 100 });
      }
    }, [open, action]);

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
      const acceleratable = instanceType?.spec?.acceleratable;
      const { count = 0 } = options;

      if (acceleratable) {
        return {
          accelerator: _.toString(count),
          cpu: unitResourcesParsed?.cpu?.cores
            ? count * unitResourcesParsed?.cpu?.cores
            : undefined,
          ram: unitResourcesParsed?.ram?.value
            ? count * unitResourcesParsed?.ram?.value
            : undefined
        };
      }
      return {};
    };

    const buildResourcesDataForSubmit = (values: FormData) => {
      const unitResourcesParsed = getUnitResources();
      const accelerator = _.toNumber(values.spec?.resources?.accelerator) || 0;

      const cpuNum = unitResourcesParsed?.cpu?.num;
      const ramNum = unitResourcesParsed?.ram?.num;

      return {
        cpu:
          accelerator > 0 && cpuNum
            ? `${accelerator * cpuNum}${unitResourcesParsed?.cpu?.unit || ''}`
            : `${values.spec?.resources?.cpu}`,
        ram:
          accelerator > 0 && ramNum
            ? `${accelerator * ramNum}${unitResourcesParsed?.ram?.unit || ''}`
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
        return;
      }
      const candidate = pickCandidateForAccelerator(
        instanceType.status?.acceleratorTiers,
        count
      );

      setSelectedInstanceType(instanceType);
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
      const errorFields = (errorInfo?.errorFields || []).map((field: any) => ({
        ...field,
        name: [
          Array.isArray(field.name) ? field.name.join('.') : String(field.name)
        ]
      }));
      rawHandleOnFinishFailed({ ...errorInfo, errorFields });
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
        form.setFieldsValue({
          ...currentData,
          spec: {
            ...currentData?.spec,
            resources: {
              ...currentData?.spec?.resources,
              ...buildResourcesData(
                JSON.parse(currentData?.description || '{}'),
                {
                  count:
                    _.toNumber(currentData?.spec?.resources?.accelerator) || 0
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
          JSON.parse(currentData?.description || '{}')?.spec
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
      applyInstanceType: (instanceType: InstanceTypeItem) => {
        const count = instanceType.spec?.acceleratable ? 1 : 0;
        resolveAndApply(instanceType, count);
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
      console.log('enable ssh change', checked);
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
                maxTagCount={1}
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
