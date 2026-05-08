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
import { forwardRef, useEffect, useImperativeHandle, useRef } from 'react';
import { mockStorageData } from '../../storage/config/mock-data';
import { mockTemplateData } from '../../templates/config/mock-data';
import TemplateBasicForm from '../../templates/forms/basic';
import { instanceTypeOptions, StorageModeValueMap } from '../config';
import { FormData, ListItem } from '../config/types';
import Basic from './basic';
import InstanceTypeFormItem from './instance-type';
import StorageVolume from './storage-volume';

interface InstanceFormProps {
  ref?: any;
  open: boolean;
  action: PageActionType;
  currentData?: ListItem | null;
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
    fields: ['instance_type_id']
  },
  [TABKeysMap.TEMPLATE]: {
    sort: 3,
    fields: ['template_id', 'gpu_count']
  },
  [TABKeysMap.STORAGE]: {
    sort: 4,
    fields: ['storage_mode', 'storage_id', 'local_storage_size_gb']
  }
};

const GPUServiceInstanceForm: React.FC<InstanceFormProps> = forwardRef(
  (props, ref) => {
    const { action, currentData, open, onFinish } = props;
    const [form] = Form.useForm<FormData>();
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

    const segmentOptions = [
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
        field: 'vendor'
      },
      {
        value: TABKeysMap.STORAGE,
        label: '存储卷',
        icon: <IconFont type="icon-storage-outlined" />,
        field: 'storage'
      }
    ];

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
        form.setFieldsValue({
          name: currentData.name,
          description: currentData.description,
          instance_type: currentData.instance_type,
          instance_type_id: currentData.instance_type_id,
          template_id: currentData.template_id,
          image: currentData.image,
          gpu_count: currentData.gpu_count,
          replicas: currentData.replicas,
          storage_mode: currentData.storage_mode,
          storage_id: currentData.storage_id,
          local_storage_size_gb: currentData.local_storage_size_gb
        });
        return;
      }

      const defaultInstanceType = instanceTypeOptions[0];
      const defaultTemplate = mockTemplateData[0];
      const defaultStorage = mockStorageData[0];

      form.setFieldsValue({
        instance_type: defaultInstanceType?.name,
        instance_type_id: defaultInstanceType?.id,
        template_id: defaultTemplate?.id,
        image: defaultTemplate?.image,
        gpu_count: 1,
        replicas: 1,
        storage_mode: StorageModeValueMap.Existing,
        storage_id: defaultStorage?.id,
        local_storage_size_gb: 50
      });
    }, [action, currentData, form, open]);

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
          onFinish={onFinish}
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
          <Form.Item<FormData>
            name="enable_ssh"
            valuePropName="checked"
            style={{ marginBottom: 8 }}
          >
            <CheckboxField label={'SSH Terminal Access'}></CheckboxField>
          </Form.Item>
          <Form.Item<FormData>
            data-field="name"
            hidden
            name={['spec', 'sshPublicKey', 'name']}
          >
            <CInput.Input />
          </Form.Item>
        </Form>
      </ScrollSpyTabs>
    );
  }
);

export default GPUServiceInstanceForm;
