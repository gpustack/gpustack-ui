import IconFont from '@/components/icon-font';
import { PageAction } from '@/config';
import { PageActionType } from '@/config/types';
import CollapsePanel from '@/pages/_components/collapse-panel';
import { useWrapperContext } from '@/pages/_components/column-wrapper/use-wrapper-context';
import ScrollSpyTabs from '@/pages/_components/scroll-spy-tabs';
import { useIntl } from '@umijs/max';
import { Form } from 'antd';
import {
  forwardRef,
  useEffect,
  useImperativeHandle,
  useRef,
  useState
} from 'react';
import { maasProviderType } from '../config';
import FormContext from '../config/form-context';
import { MaasProviderItem as ListItem } from '../config/types';
import AccessToken from './access-token';
import AdvanceConfig from './advance-config';
import Basic from './basic';
import SupportedModels from './supported-models';

interface ProviderFormProps {
  ref?: any;
  action: PageActionType;
  provider?: maasProviderType;
  currentData?: ListItem; // Used when action is EDIT
  onFinish: (values: FormData) => void;
}

const TABKeysMap = {
  BASIC: 'basic',
  SUPPORTEDMODELS: 'supportedModels',
  CUSTOMCONFIG: 'customConfig',
  ADVANCED: 'advanced'
};

const ProviderForm: React.FC<ProviderFormProps> = forwardRef((props, ref) => {
  const { action, provider, currentData, onFinish } = props;
  const intl = useIntl();
  const [form] = Form.useForm();
  const { getScrollElementScrollableHeight } = useWrapperContext();
  const [activeKey, setActiveKey] = useState<string[]>([TABKeysMap.BASIC]);
  const scrollTabsRef = useRef<any>(null);

  const segmentOptions = [
    {
      value: TABKeysMap.BASIC,
      label: 'Basic',
      icon: <IconFont type="icon-basic" />,
      field: 'name'
    },
    {
      value: TABKeysMap.SUPPORTEDMODELS,
      label: 'Supported Models',
      icon: <IconFont type="icon-speed" />,
      field: 'supportedModels'
    },
    {
      value: TABKeysMap.ADVANCED,
      label: intl.formatMessage({ id: 'resources.form.advanced' }),
      icon: <IconFont type="icon-settings" />,
      field: 'advanceConfig'
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

  useEffect(() => {
    if (action === PageAction.EDIT && currentData) {
      form.setFieldsValue({
        ...currentData,
        models: currentData.models || []
      });
    }
  }, [form, currentData, action]);

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
      <FormContext.Provider value={{ providerType: provider, action }}>
        <Form
          form={form}
          onFinish={onFinish}
          initialValues={{
            proxy_config: {
              enabled: false,
              url: '',
              timeout: 30
            }
          }}
        >
          <Basic />
          <AccessToken />
          <CollapsePanel
            activeKey={activeKey}
            accordion={false}
            onChange={handleOnCollapseChange}
            items={[
              {
                key: TABKeysMap.SUPPORTEDMODELS,
                label: 'Supported Models',
                forceRender: true,
                children: <SupportedModels></SupportedModels>
              },
              {
                key: TABKeysMap.ADVANCED,
                label: 'Advanced',
                forceRender: true,
                children: (
                  <AdvanceConfig
                    action={action}
                    provider={provider}
                  ></AdvanceConfig>
                )
              }
            ]}
          ></CollapsePanel>
        </Form>
      </FormContext.Provider>
    </ScrollSpyTabs>
  );
});

export default ProviderForm;
