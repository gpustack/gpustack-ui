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
import { FormData, BenchmarkListItem as ListItem } from '../config/types';
import Basic from './basic';
import DatasetForm from './dataset';

interface ProviderFormProps {
  ref?: any;
  action: PageActionType;
  currentData?: ListItem; // Used when action is EDIT
  open?: boolean;
  clusterList?: Global.BaseOption<number>[];
  datasetList: Global.BaseOption<number | string>[];
  profilesOptions: Global.BaseOption<string>[];
  onFinish: (values: FormData) => Promise<void>;
}

const TABKeysMap = {
  BASIC: 'basic',
  PROFILE: 'profile',
  ADVANCED: 'advanced'
};

const ProviderForm: React.FC<ProviderFormProps> = forwardRef((props, ref) => {
  const {
    action,
    currentData,
    onFinish,
    open,
    clusterList,
    profilesOptions,
    datasetList
  } = props;
  const intl = useIntl();
  const [form] = Form.useForm();
  const { getScrollElementScrollableHeight } = useWrapperContext();
  const [activeKey, setActiveKey] = useState<string[]>([TABKeysMap.PROFILE]);
  const scrollTabsRef = useRef<any>(null);

  const segmentOptions = [
    {
      value: TABKeysMap.BASIC,
      label: intl.formatMessage({ id: 'common.title.basicInfo' }),
      icon: <IconFont type="icon-basic" />,
      field: 'name'
    },
    {
      value: TABKeysMap.PROFILE,
      label: intl.formatMessage({ id: 'common.title.config' }),
      icon: <IconFont type="icon-settings" />,
      field: 'profile'
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
        model_instance: [
          currentData.model_name,
          currentData.model_instance_name
        ]
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
      <FormContext.Provider
        value={{
          action,
          open,
          clusterList: clusterList,
          profilesOptions: profilesOptions,
          datasetList: datasetList
        }}
      >
        <Form
          form={form}
          onFinish={onFinish}
          initialValues={{
            dataset_input_tokens: null,
            dataset_output_tokens: null,
            total_requests: null,
            request_rate: null,
            dataset_seed: null
          }}
        >
          <Basic />
          <CollapsePanel
            activeKey={activeKey}
            accordion={false}
            onChange={handleOnCollapseChange}
            items={[
              {
                key: TABKeysMap.PROFILE,
                label: intl.formatMessage({ id: 'common.title.config' }),
                forceRender: true,
                children: <DatasetForm />
              }
            ]}
          ></CollapsePanel>
        </Form>
      </FormContext.Provider>
    </ScrollSpyTabs>
  );
});

export default ProviderForm;
