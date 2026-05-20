import { addSSHKeyPageAtom } from '@/atoms/gpuservice';
import { PageAction } from '@/config';
import { PageActionType } from '@/config/types';
import { PlusOutlined } from '@ant-design/icons';
import {
  CheckboxField,
  CollapsePanel,
  IconFont,
  MultipleSelect,
  ScrollSpyTabs,
  useAppUtils,
  useFinishFailed,
  useScrollActiveChange,
  useWrapperContext
} from '@gpustack/core-ui';
import { useIntl, useNavigate } from '@umijs/max';
import { Button, Empty, Form } from 'antd';
import { useSetAtom } from 'jotai';
import {
  forwardRef,
  useEffect,
  useImperativeHandle,
  useMemo,
  useRef
} from 'react';
import useGetSshkey from '../../public-keys/services/use-get-sshkey';
import { DefaultImagePullPolicy } from '../../templates/config';
import TemplateBasicForm, {
  BasicResourceMax
} from '../../templates/forms/basic';
import { FormData, InstanceTypeItem, ListItem } from '../config/types';
import instanceStyles from '../styles/instances.module.less';
import Basic from './basic';
import InstanceTypeFormItem from './instance-type';
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

const parseQuantityToNumber = (value?: string): number | null => {
  if (!value) return null;
  const match = /^(-?\d+(?:\.\d+)?)/.exec(String(value));
  if (!match) return null;
  const num = Number(match[1]);
  return Number.isFinite(num) && num > 0 ? num : null;
};

const TABKeysMap = {
  BASIC: 'basic',
  INSTANCE_TYPE: 'instanceType',
  TEMPLATE: 'template',
  STORAGE: 'storage'
};

const requiredFields = {
  [TABKeysMap.BASIC]: {
    sort: 1,
    fields: ['metadata.name']
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
    fields: ['spec.volume.persistent.name', 'spec.volume.ephemeral.capacity']
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
      namespace = 'default',
      instanceTypeList = [],
      onFinish
    } = props;
    const intl = useIntl();
    const navigate = useNavigate();
    const setAddSSHKeyPage = useSetAtom(addSSHKeyPageAtom);
    const { getRuleMessage } = useAppUtils();
    const [form] = Form.useForm<InstanceFormValues>();
    const scrollTabsRef = useRef<any>(null);
    const formAction =
      realAction === PageAction.CREATE ? PageAction.CREATE : action;
    const sshEnabled = Form.useWatch('enable_ssh', form);
    const { detailData: sshKeyData, fetchData: fetchSSHData } = useGetSshkey();
    const { getScrollElementScrollableHeight } = useWrapperContext();
    const {
      activeKey,
      collapseKeys,
      handleActiveChange,
      handleOnCollapseChange,
      updateActiveKey
    } = useScrollActiveChange({
      initalActiveKeys: [TABKeysMap.BASIC],
      initialCollapseKeys: [
        TABKeysMap.INSTANCE_TYPE,
        TABKeysMap.TEMPLATE,
        TABKeysMap.STORAGE
      ]
    });

    useEffect(() => {
      if (open) {
        fetchSSHData({});
      }
    }, [open, action]);

    const handleSSHEnableChange = (e: any) => {
      if (!e?.target?.checked) {
        return;
      }
      const currentPorts = form.getFieldValue(['spec', 'ports']) || [];
      const hasSSHPort = currentPorts.some(
        (item: any) => item?.protocol === 'TCP' && item?.port === SSH_PORT
      );
      if (!hasSSHPort) {
        form.setFieldValue(
          ['spec', 'ports'],
          [...currentPorts, { protocol: 'TCP', port: SSH_PORT, name: 'SSH' }]
        );
      }
    };

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

    const ports = Form.useWatch(['spec', 'ports'], form) || [];

    const selectedTypeName = Form.useWatch(['spec', 'type'], form) as
      | string
      | undefined;

    const onceMaxRequest = useMemo<BasicResourceMax>(() => {
      const selected = instanceTypeList.find(
        (item) => (item.metadata?.name || '') === selectedTypeName
      );
      const status = selected?.status;
      return {
        cpu: parseQuantityToNumber(status?.cpu?.onceMaxRequest),
        memory: parseQuantityToNumber(status?.ram?.onceMaxRequest),
        localStorage: parseQuantityToNumber(
          status?.localStorage?.onceMaxRequest
        )
      };
    }, [instanceTypeList, selectedTypeName]);

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

    useEffect(() => {
      if (!open) {
        form.resetFields();
        return;
      }

      if (
        currentData &&
        (action === PageAction.EDIT ||
          action === PageAction.VIEW ||
          realAction === PageAction.CREATE)
      ) {
        form.setFieldsValue({
          metadata: {
            name: currentData.metadata?.name,
            namespace: currentData.metadata?.namespace
          },
          spec: {
            ...currentData.spec,
            imagePullPolicy:
              currentData.spec?.imagePullPolicy || DefaultImagePullPolicy
          },
          enable_ssh: !!currentData.spec?.sshPublicKey?.name
        });
        return;
      }
    }, [action, currentData, form, open, namespace, realAction]);

    const handleFinish = async (values: InstanceFormValues) => {
      await onFinish({
        ...values,
        spec: {
          ...values.spec,
          sshPublicKey: { name: sshKeyData?.name }
        }
      });
    };

    const segmentedTop =
      action === PageAction.VIEW
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
      getFieldsValue: () => form.getFieldsValue()
    }));

    const handleAddSSHKey = () => {
      setAddSSHKeyPage({ create: true });
      // to go ssh key page
      navigate('/gpu-service/public-keys');
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
                accelerator: '1'
              },
              volume: {
                ephemeral: {
                  capacity: '20Gi'
                },
                persistent: {
                  name: ''
                }
              }
            },
            enable_ssh: false
          }}
        >
          <Basic action={formAction} disabled={disabled} />
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

          <Form.Item<FormData>
            name="enable_ssh"
            valuePropName="checked"
            style={{ marginBottom: 8 }}
          >
            <CheckboxField
              disabled={disabled}
              label={intl.formatMessage({
                id: 'gpuservice.instance.ssh.enable'
              })}
              onChange={handleSSHEnableChange}
            ></CheckboxField>
          </Form.Item>
          {sshEnabled && (
            <div className={instanceStyles.sshkeySelection}>
              <Form.Item<FormData>
                name={['spec', 'sshPublicKey', 'name']}
                style={{
                  marginBottom: 12
                }}
                rules={[
                  {
                    required: true,
                    message: getRuleMessage(
                      'select',
                      'gpuservice.instance.ssh.assignKey'
                    )
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
                  options={[]}
                  notFoundContent={
                    <Empty
                      image={Empty.PRESENTED_IMAGE_SIMPLE}
                      description={intl.formatMessage({
                        id: 'noresult.gpuservice.sshkey.title'
                      })}
                      styles={{
                        image: {
                          height: 32
                        },
                        root: {
                          margin: 0
                        }
                      }}
                    >
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
                    </Empty>
                  }
                ></MultipleSelect>
              </Form.Item>
            </div>
          )}
        </Form>
      </ScrollSpyTabs>
    );
  }
);

export default GPUServiceInstanceForm;
