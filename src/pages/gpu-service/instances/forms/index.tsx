import { PageAction } from '@/config';
import { PageActionType } from '@/config/types';
import {
  CheckboxField,
  Input as CInput,
  CollapsePanel,
  IconFont,
  ScrollSpyTabs,
  useFinishFailed,
  useScrollActiveChange,
  useWrapperContext
} from '@gpustack/core-ui';
import { Form } from 'antd';
import {
  forwardRef,
  useEffect,
  useImperativeHandle,
  useMemo,
  useRef
} from 'react';
import { mockStorageData } from '../../storage/config/mock-data';
import { mockTemplateData } from '../../templates/config/mock-data';
import {
  EnvItem as TemplateEnvItem,
  PortItem as TemplatePortItem
} from '../../templates/config/types';
import TemplateBasicForm from '../../templates/forms/basic';
import { DEFAULT_SSH_PUBLIC_KEY_NAME, StorageModeValueMap } from '../config';
import { FormData, ListItem } from '../config/types';
import Basic from './basic';
import InstanceTypeFormItem from './instance-type';
import StorageVolume from './storage-volume';

const SSH_PORT = 22;

type InstanceFormValues = FormData & {
  // instance-type holders
  type?: string;
  gpu_count?: number;
  // template holders (mirrored into spec.* on submit)
  image?: string;
  command?: string[];
  ports?: TemplatePortItem[];
  env?: TemplateEnvItem[];
  volumeMount?: string;
  resources?: { cpu?: string; ram?: string };
  // storage holders
  storage_mode?: string;
  storage_name?: string;
  local_storage_size_gb?: number;
  // ssh holder
  enable_ssh?: boolean;
};

interface InstanceFormProps {
  ref?: any;
  open: boolean;
  action: PageActionType;
  currentData?: ListItem | null;
  namespace?: string;
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
    fields: ['type', 'gpu_count']
  },
  [TABKeysMap.TEMPLATE]: {
    sort: 3,
    fields: ['image', 'ports']
  },
  [TABKeysMap.STORAGE]: {
    sort: 4,
    fields: ['storage_mode', 'storage_name', 'local_storage_size_gb']
  }
};

const GPUServiceInstanceForm: React.FC<InstanceFormProps> = forwardRef(
  (props, ref) => {
    const {
      action,
      currentData,
      open,
      namespace = 'default',
      onFinish
    } = props;
    const [form] = Form.useForm<InstanceFormValues>();
    const scrollTabsRef = useRef<any>(null);
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

    const segmentOptions = useMemo(
      () => [
        {
          value: TABKeysMap.BASIC,
          label: '基础信息',
          icon: <IconFont type="icon-basic" />,
          field: 'name'
        },
        {
          value: TABKeysMap.INSTANCE_TYPE,
          label: '实例类型',
          icon: <IconFont type="icon-gpu1" />,
          field: 'instanceType'
        },
        {
          value: TABKeysMap.TEMPLATE,
          label: '实例模板',
          icon: <IconFont type="icon-model" />,
          field: 'template'
        },
        {
          value: TABKeysMap.STORAGE,
          label: '存储卷',
          icon: <IconFont type="icon-storage-outlined" />,
          field: 'storage'
        }
      ],
      []
    );

    const ports = (Form.useWatch('ports', form) || []) as TemplatePortItem[];
    const hasSshPort = useMemo(
      () => ports.some((p) => Number(p?.port) === SSH_PORT),
      [ports]
    );

    const onTargetChange = (key: string) => {
      scrollTabsRef.current?.handleTargetChange(key);
    };

    const { handleOnFinishFailed } = useFinishFailed({
      requiredFields,
      onTargetChange,
      updateActiveKey
    });

    useEffect(() => {
      if (!open) {
        form.resetFields();
        return;
      }

      if (action === PageAction.EDIT && currentData) {
        const persistentName = currentData.spec?.volume?.persistent?.name;
        const ephemeralCapacity = currentData.spec?.volume?.ephemeral?.capacity;
        const isExisting = !!persistentName;
        const isTemporary = !!ephemeralCapacity;
        const localSizeGb = ephemeralCapacity
          ? Number(String(ephemeralCapacity).replace(/Gi$/i, '')) || undefined
          : undefined;

        form.setFieldsValue({
          metadata: {
            name: currentData.metadata?.name,
            namespace: currentData.metadata?.namespace
          },
          spec: { ...currentData.spec },
          type: currentData.spec?.type,
          gpu_count: currentData.spec?.resources?.accelerator
            ? Number(currentData.spec.resources.accelerator) || 1
            : 1,
          // template holders mirrored from spec.*
          image: currentData.spec?.image,
          command: currentData.spec?.command || [],
          ports: (currentData.spec?.ports || []) as TemplatePortItem[],
          env: (currentData.spec?.env || []) as TemplateEnvItem[],
          volumeMount: currentData.spec?.volumeMount,
          resources: {
            cpu: currentData.spec?.resources?.cpu,
            ram: currentData.spec?.resources?.ram
          },
          storage_mode: isExisting
            ? StorageModeValueMap.Existing
            : isTemporary
              ? StorageModeValueMap.Temporary
              : StorageModeValueMap.Existing,
          storage_name: persistentName,
          local_storage_size_gb: localSizeGb,
          enable_ssh: !!currentData.spec?.sshPublicKey?.name
        });
        return;
      }

      const defaultTemplate = mockTemplateData[0];
      const defaultStorage = mockStorageData[0];

      form.setFieldsValue({
        metadata: {
          namespace
        },
        spec: {
          description: '',
          displayName: ''
        } as FormData['spec'],
        gpu_count: 1,
        // template holders seeded from default template
        image: defaultTemplate?.image || '',
        command: defaultTemplate?.command || [],
        ports: (defaultTemplate?.ports || []) as TemplatePortItem[],
        env: (defaultTemplate?.env || []) as TemplateEnvItem[],
        volumeMount: defaultTemplate?.volumeMount || '',
        resources: {
          cpu: defaultTemplate?.resources?.cpu,
          ram: defaultTemplate?.resources?.ram
        },
        storage_mode: StorageModeValueMap.Existing,
        storage_name: defaultStorage?.metadata?.name,
        local_storage_size_gb: 50,
        enable_ssh: false
      });
    }, [action, currentData, form, open, namespace]);

    const buildPayload = (values: InstanceFormValues): FormData => {
      const acceleratorStr = values.gpu_count
        ? String(values.gpu_count)
        : undefined;

      const spec: FormData['spec'] = {
        ...values.spec,
        type: values.type || values.spec?.type,
        image: values.image ?? values.spec?.image,
        command: values.command ?? values.spec?.command,
        ports: (values.ports ??
          values.spec?.ports) as FormData['spec']['ports'],
        env: (values.env ?? values.spec?.env) as FormData['spec']['env'],
        volumeMount: values.volumeMount ?? values.spec?.volumeMount,
        resources: {
          ...values.spec?.resources,
          cpu: values.resources?.cpu ?? values.spec?.resources?.cpu,
          ram: values.resources?.ram ?? values.spec?.resources?.ram,
          accelerator: acceleratorStr
        }
      } as FormData['spec'];

      // Storage volume mapping
      if (values.storage_mode === StorageModeValueMap.Existing) {
        spec.volume = { persistent: { name: values.storage_name || '' } };
      } else if (values.storage_mode === StorageModeValueMap.Temporary) {
        spec.volume = {
          ephemeral: {
            capacity: values.local_storage_size_gb
              ? `${values.local_storage_size_gb}Gi`
              : ''
          }
        };
      }

      // SSH public key — include only when checkbox is checked AND port 22 is in ports
      const portsList = (values.ports || []) as TemplatePortItem[];
      const has22 = portsList.some((p) => Number(p?.port) === SSH_PORT);
      if (values.enable_ssh && has22) {
        spec.sshPublicKey = { name: DEFAULT_SSH_PUBLIC_KEY_NAME };
      } else {
        delete (spec as any).sshPublicKey;
      }

      return {
        metadata: {
          name: values.metadata?.name,
          namespace: values.metadata?.namespace || namespace
        },
        spec
      } as FormData;
    };

    const handleFinish = async (values: InstanceFormValues) => {
      const payload = buildPayload(values);
      await onFinish(payload);
    };

    useImperativeHandle(ref, () => ({
      submit: () => {
        form.submit();
      },
      resetFields: () => {
        form.resetFields();
      }
    }));

    return (
      <ScrollSpyTabs
        ref={scrollTabsRef}
        defaultTarget={TABKeysMap.BASIC}
        segmentOptions={segmentOptions}
        activeKey={activeKey}
        setActiveKey={handleActiveChange}
        segmentedTop={{
          top: 40,
          offsetTop: 130
        }}
        getScrollElementScrollableHeight={getScrollElementScrollableHeight}
      >
        <Form
          name="gpuServiceInstanceForm"
          form={form}
          onFinish={handleFinish}
          onFinishFailed={handleOnFinishFailed}
          preserve={false}
        >
          <Basic />
          <CollapsePanel
            activeKey={collapseKeys}
            accordion={false}
            onChange={handleOnCollapseChange}
            items={[
              {
                key: TABKeysMap.INSTANCE_TYPE,
                label: '实例类型',
                forceRender: true,
                children: <InstanceTypeFormItem />
              },
              {
                key: TABKeysMap.TEMPLATE,
                label: '实例模板',
                forceRender: true,
                children: <TemplateBasicForm page="instance" />
              },
              {
                key: TABKeysMap.STORAGE,
                label: '存储卷',
                forceRender: true,
                children: <StorageVolume />
              }
            ]}
          />
          {hasSshPort && (
            <Form.Item
              name="enable_ssh"
              valuePropName="checked"
              style={{ marginBottom: 8 }}
            >
              <CheckboxField label="SSH Terminal Access" />
            </Form.Item>
          )}
          <Form.Item<FormData> hidden name={['spec', 'sshPublicKey', 'name']}>
            <CInput.Input />
          </Form.Item>
        </Form>
      </ScrollSpyTabs>
    );
  }
);

export default GPUServiceInstanceForm;
