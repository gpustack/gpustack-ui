import IconFont from '@/components/icon-font';
import { PageAction } from '@/config';
import { PageActionType } from '@/config/types';
import CollapsePanel from '@/pages/_components/collapse-panel';
import { useWrapperContext } from '@/pages/_components/column-wrapper/use-wrapper-context';
import ScrollSpyTabs from '@/pages/_components/scroll-spy-tabs';
import { useIntl } from '@umijs/max';
import { Form } from 'antd';
import _ from 'lodash';
import {
  forwardRef,
  useEffect,
  useImperativeHandle,
  useRef,
  useState
} from 'react';
import { FormData, AccessItem as ListItem } from '../config/types';
import useEditEndpoints from '../hooks/use-edit-endpoints';
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
  const endpointsRef = useRef<any>(null);
  const { generateEndpointData, fetchEndpoints } = useEditEndpoints();
  const segmentOptions = [
    {
      value: TABKeysMap.BASIC,
      label: intl.formatMessage({ id: 'common.title.basicInfo' }),
      icon: <IconFont type="icon-basic" />,
      field: 'name'
    },
    {
      value: TABKeysMap.METADATA,
      label: intl.formatMessage({ id: 'accesses.form.metadata.title' }),
      icon: <IconFont type="icon-database" />,
      field: 'metaSize'
    },
    {
      value: TABKeysMap.ENDPOINTS,
      label: intl.formatMessage({ id: 'accesses.form.endpoint.title' }),
      icon: <IconFont type="icon-language" />,
      field: 'endpoints'
    }
  ];

  const handleActiveChange = (key: string[]) => {
    setActiveKey(key);
  };

  const formatEndpoints = (values: FormData) => {
    console.log('formatEndpoints values:', values);
    let endPoints = [...values.endpoints];
    let fallbackEndpoint = values.fallback_endpoint;

    if (fallbackEndpoint && endPoints.length > 0) {
      endPoints = endPoints?.map((ep) => {
        if (ep.model_id === fallbackEndpoint.model_id && ep.model_id) {
          return {
            ...ep,
            fallback_status_codes: ['4xx', '5xx']
          };
        }
        if (
          ep.provider_id === fallbackEndpoint.provider_id &&
          ep.provider_model_name === fallbackEndpoint.provider_model_name &&
          !fallbackEndpoint.model_id
        ) {
          return {
            ...ep,
            fallback_status_codes: ['4xx', '5xx']
          };
        }
        return ep;
      });
    } else if (fallbackEndpoint) {
      endPoints.push({
        ...fallbackEndpoint,
        weight: null,
        fallback_status_codes: ['4xx', '5xx']
      });
    }

    return endPoints;
  };

  const handleOnFinish = (values: FormData) => {
    const endpoints = formatEndpoints(values);
    const data = {
      ..._.omit(values, ['endpoints', 'fallback_endpoint']),
      endpoints: endpoints
    };
    console.log('data=========', data);
    onFinish(data);
  };

  const handleOnCollapseChange = (keys: string | string[]) => {
    setActiveKey(Array.isArray(keys) ? keys : [keys]);
  };

  useEffect(() => {
    const initEditionForm = async () => {
      const endpointList = await fetchEndpoints(currentData!.id);
      const { endpoints, fallbackEndpoint } =
        generateEndpointData(endpointList);
      console.log(
        'endpoints:',
        endpoints,
        'fallbackEndpoint:',
        fallbackEndpoint
      );

      // init form values
      form.setFieldsValue({
        ...currentData,
        endpoints: endpoints,
        fallback_endpoint: fallbackEndpoint
      });

      // init endpoints form list
      endpointsRef.current?.initDataList(
        endpoints?.map((ep) => ({
          weight: ep.weight,
          value: ep.model_id
            ? ['deployments', ep.model_id]
            : [ep.provider_id, ep.provider_model_name]
        })) || []
      );

      // init fallback value
      if (fallbackEndpoint) {
        endpointsRef.current?.initFallbackValues({
          value: fallbackEndpoint.model_id
            ? ['deployments', fallbackEndpoint.model_id]
            : [
                fallbackEndpoint.provider_id,
                fallbackEndpoint.provider_model_name
              ]
        });
      }
    };
    if (action === PageAction.EDIT && currentData) {
      initEditionForm();
    } else {
      form.resetFields();
    }
  }, [action, currentData, form]);

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
      <Form
        form={form}
        onFinish={handleOnFinish}
        initialValues={{
          categories: [],
          meta: {}
        }}
      >
        <Basic />
        <CollapsePanel
          activeKey={activeKey}
          accordion={false}
          onChange={handleOnCollapseChange}
          items={[
            {
              key: TABKeysMap.METADATA,
              label: intl.formatMessage({ id: 'accesses.form.metadata.title' }),
              forceRender: true,
              children: <MetaData></MetaData>
            },
            {
              key: TABKeysMap.ENDPOINTS,
              label: intl.formatMessage({ id: 'accesses.form.endpoint.title' }),
              forceRender: true,
              children: <Endpoints ref={endpointsRef}></Endpoints>
            }
          ]}
        ></CollapsePanel>
      </Form>
    </ScrollSpyTabs>
  );
});

export default AccessForm;
