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
import FormContext from '../config/form-context';
import { FormData, MaasProviderItem as ListItem } from '../config/types';
import AccessToken from './access-token';
import AdvanceConfig from './advance-config';
import Basic from './basic';
import SupportedModels from './supported-models';

interface ProviderFormProps {
  ref?: any;
  action: PageActionType;
  currentData?: ListItem; // Used when action is EDIT
  onFinish: (values: FormData) => Promise<void>;
}

const TABKeysMap = {
  BASIC: 'basic',
  SUPPORTEDMODELS: 'supportedModels',
  CUSTOMCONFIG: 'customConfig',
  ADVANCED: 'advanced'
};

const ProviderForm: React.FC<ProviderFormProps> = forwardRef((props, ref) => {
  const { action, currentData, onFinish } = props;
  const intl = useIntl();
  const [form] = Form.useForm();
  const { getScrollElementScrollableHeight } = useWrapperContext();
  const [activeKey, setActiveKey] = useState<string[]>([TABKeysMap.BASIC]);
  const scrollTabsRef = useRef<any>(null);

  const segmentOptions = [
    {
      value: TABKeysMap.BASIC,
      label: intl.formatMessage({ id: 'common.title.basicInfo' }),
      icon: <IconFont type="icon-basic" />,
      field: 'name'
    },
    {
      value: TABKeysMap.SUPPORTEDMODELS,
      label: intl.formatMessage({ id: 'providers.table.models' }),
      icon: <IconFont type="icon-models" />,
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
    if (
      (action === PageAction.EDIT || action === PageAction.COPY) &&
      currentData
    ) {
      form.setFieldsValue({
        ...currentData,
        proxy_enabled: !!currentData.proxy_url
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
      <FormContext.Provider value={{ action }}>
        <Form
          form={form}
          onFinish={onFinish}
          initialValues={{
            proxy_enabled: false,
            proxy_url: '',
            proxy_timeout: 30
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
                label: intl.formatMessage({ id: 'providers.table.models' }),
                forceRender: true,
                children: <SupportedModels></SupportedModels>
              },
              {
                key: TABKeysMap.ADVANCED,
                label: intl.formatMessage({ id: 'resources.form.advanced' }),
                forceRender: true,
                children: <AdvanceConfig action={action}></AdvanceConfig>
              }
            ]}
          ></CollapsePanel>
        </Form>
      </FormContext.Provider>
    </ScrollSpyTabs>
  );
});

export default ProviderForm;
