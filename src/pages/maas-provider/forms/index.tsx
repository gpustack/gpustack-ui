import IconFont from '@/components/icon-font';
import { PageAction } from '@/config';
import { PageActionType } from '@/config/types';
import CollapsePanel from '@/pages/_components/collapse-panel';
import { useWrapperContext } from '@/pages/_components/column-wrapper/use-wrapper-context';
import ScrollSpyTabs from '@/pages/_components/scroll-spy-tabs';
import useFinishFailed from '@/pages/_components/scroll-spy-tabs/use-finish-failed';
import useScrollActiveChange from '@/pages/_components/scroll-spy-tabs/use-scroll-active-change';
import { json2Yaml, yaml2Json } from '@/pages/backends/config';
import { useIntl } from '@umijs/max';
import { Form } from 'antd';
import _ from 'lodash';
import { forwardRef, useEffect, useImperativeHandle, useRef } from 'react';
import FormContext from '../config/form-context';
import { FormData, MaasProviderItem as ListItem } from '../config/types';
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
  ADVANCED: 'advanced'
};

const requiredFields = {
  [TABKeysMap.BASIC]: {
    sort: 1,
    fields: ['name', 'config', 'api_key']
  },
  [TABKeysMap.SUPPORTEDMODELS]: {
    sort: 2,
    fields: ['models']
  }
};

const ProviderForm: React.FC<ProviderFormProps> = forwardRef((props, ref) => {
  const { action, currentData, onFinish } = props;
  const intl = useIntl();
  const [form] = Form.useForm();
  const { getScrollElementScrollableHeight } = useWrapperContext();
  const scrollTabsRef = useRef<any>(null);
  const advanceRef = useRef<any>(null);
  const {
    activeKey,
    collapseKeys,
    handleActiveChange,
    handleOnCollapseChange,
    updateActiveKey
  } = useScrollActiveChange({
    initalActiveKeys: [TABKeysMap.BASIC],
    initialCollapseKeys: [TABKeysMap.SUPPORTEDMODELS]
  });

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

  const formatAPIKeys = (values: FormData) => {
    const apiTokens = values.api_tokens?.filter?.(
      (item) => item && item.trim() !== ''
    );
    const apiTokenList = _.concat([], values.api_key, apiTokens || []);
    if (action === PageAction.CREATE) {
      return apiTokenList.map((item: string) => ({ input: item }));
    }

    const existingTokens = new Set(
      (currentData?.api_tokens || []).map((item: { hash: string }) => item.hash)
    );
    return apiTokenList.map((item: string) =>
      existingTokens.has(item) ? { hash: item } : { input: item }
    );
  };

  const getCustomConfig = () => {
    const customConfig = yaml2Json(advanceRef.current?.getYamlValue() || '');
    return customConfig;
  };

  const handleOnFinish = (values: FormData) => {
    const data = {
      ..._.omit(values, ['api_key']),
      api_tokens: formatAPIKeys(values),
      config: {
        type: values.config.type,
        openaiCustomUrl: values.config.openaiCustomUrl || undefined,
        ...yaml2Json(advanceRef.current?.getYamlValue() || '')
      },
      models: _.uniqBy(values.models, 'name'),
      clone_from_id: action === PageAction.COPY ? currentData?.id : undefined
    };
    onFinish(data);
  };

  const onTargetChange = (key: string) => {
    scrollTabsRef.current?.handleTargetChange(key);
  };

  const { handleOnFinishFailed } = useFinishFailed({
    requiredFields,
    onTargetChange,
    updateActiveKey
  });

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
      const apiTokensList = _.get(currentData, 'api_tokens', []).map(
        (item: any) => item.hash || ''
      );
      const customConfigYaml = json2Yaml(
        _.omit(currentData.config, ['type', 'openaiCustomUrl']) || {}
      );
      form.setFieldsValue({
        ...currentData,
        models: (currentData.models || []).map((item) => ({
          ...item,
          category: item.category || null
        })),
        api_key: apiTokensList?.[0] || '',
        api_tokens: apiTokensList?.slice(1) || [],
        proxy_enabled: !!currentData.proxy_url,
        custom_config: customConfigYaml
      });
      advanceRef.current?.setYamlValue?.(customConfigYaml);
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
          id: currentData?.id,
          currentData,
          getCustomConfig: getCustomConfig
        }}
      >
        <Form
          form={form}
          onFinish={handleOnFinish}
          onFinishFailed={handleOnFinishFailed}
          initialValues={{
            proxy_enabled: false,
            proxy_url: '',
            proxy_timeout: 30
          }}
        >
          <Basic />
          <CollapsePanel
            activeKey={collapseKeys}
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
                children: (
                  <AdvanceConfig
                    action={action}
                    ref={advanceRef}
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
