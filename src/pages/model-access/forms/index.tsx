import IconFont from '@/components/icon-font';
import { PageActionType } from '@/config/types';
import CollapsePanel from '@/pages/_components/collapse-panel';
import { useWrapperContext } from '@/pages/_components/column-wrapper/use-wrapper-context';
import ScrollSpyTabs from '@/pages/_components/scroll-spy-tabs';
import { useIntl } from '@umijs/max';
import { Form } from 'antd';
import { forwardRef, useImperativeHandle, useRef, useState } from 'react';
import { FormData, AccessItem as ListItem } from '../config/types';
import Basic from './basic';
import Endpoints from './endpoints';
import MetaData from './meta-data';

interface ProviderFormProps {
  ref?: any;
  action: PageActionType;
  currentData?: ListItem; // Used when action is EDIT
  onFinish: (values: FormData) => Promise<void>;
}

const TABKeysMap = {
  BASIC: 'basic',
  METADATA: 'metadata',
  ENDPOINTS: 'endpoints',
  ADVANCED: 'advanced'
};

const AccessForm: React.FC<ProviderFormProps> = forwardRef((props, ref) => {
  const { action, currentData, onFinish } = props;
  const intl = useIntl();
  const { getScrollElementScrollableHeight } = useWrapperContext();
  const [activeKey, setActiveKey] = useState<string[]>([TABKeysMap.BASIC]);
  const [form] = Form.useForm();
  const scrollTabsRef = useRef<any>(null);

  const segmentOptions = [
    {
      value: TABKeysMap.BASIC,
      label: 'Basic',
      icon: <IconFont type="icon-basic" />,
      field: 'name'
    },
    {
      value: TABKeysMap.METADATA,
      label: 'Metadata',
      icon: <IconFont type="icon-speed" />,
      field: 'metadata'
    },
    {
      value: TABKeysMap.ENDPOINTS,
      label: 'Endpoints',
      icon: <IconFont type="icon-settings" />,
      field: 'endpoints'
    }
  ];

  const handleActiveChange = (key: string[]) => {
    setActiveKey(key);
  };

  const handleOnCollapseChange = (keys: string | string[]) => {
    setActiveKey(Array.isArray(keys) ? keys : [keys]);
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
      defaultTarget="basic"
      segmentOptions={segmentOptions}
      activeKey={activeKey}
      setActiveKey={handleActiveChange}
      segmentedTop={{
        top: 0,
        offsetTop: 96
      }}
      getScrollElementScrollableHeight={getScrollElementScrollableHeight}
    >
      <Form form={form} onFinish={onFinish}>
        <Basic />
        <CollapsePanel
          activeKey={activeKey}
          accordion={false}
          onChange={handleOnCollapseChange}
          items={[
            {
              key: TABKeysMap.METADATA,
              label: 'Metadata',
              forceRender: true,
              children: <MetaData></MetaData>
            },
            {
              key: TABKeysMap.ENDPOINTS,
              label: 'Endpoints',
              forceRender: true,
              children: <Endpoints></Endpoints>
            }
          ]}
        ></CollapsePanel>
      </Form>
    </ScrollSpyTabs>
  );
});

export default AccessForm;
