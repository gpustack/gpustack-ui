import IconFont from '@/components/icon-font';
import { PageAction } from '@/config';
import { PageActionType } from '@/config/types';
import CollapsePanel from '@/pages/_components/collapse-panel';
import { useWrapperContext } from '@/pages/_components/column-wrapper/use-wrapper-context';
import ScrollSpyTabs from '@/pages/_components/scroll-spy-tabs';
import useFinishFailed from '@/pages/_components/scroll-spy-tabs/use-finish-failed';
import useScrollActiveChange from '@/pages/_components/scroll-spy-tabs/use-scroll-active-change';
import { modelCategoriesMap } from '@/pages/llmodels/config';
import { useIntl } from '@umijs/max';
import { Form } from 'antd';
import _ from 'lodash';
import { forwardRef, useEffect, useImperativeHandle, useRef } from 'react';
import FormContext from '../config/form-context';
import { FormData, RouteItem as ListItem } from '../config/types';
import useEditTargets from '../hooks/use-edit-targets';
import Basic from './basic';
import Targets from './targets';

interface ProviderFormProps {
  ref?: any;
  open: boolean;
  action: PageActionType;
  realAction?: string;
  currentData?: ListItem & {
    routeTargets?: {
      weight?: number;
      model_id?: number;
      provider_id?: number;
      provider_model_name?: string;
    }[];
  }; // Used when action is EDIT
  onFinish: (values: FormData) => Promise<void>;
  onFallbackChange?: (changed: boolean) => void;
}

const TABKeysMap = {
  BASIC: 'basic',
  TARGETS: 'targets'
};

const requiredFields = {
  [TABKeysMap.BASIC]: {
    sort: 1,
    fields: ['name']
  },
  [TABKeysMap.TARGETS]: {
    sort: 2,
    fields: ['targets']
  }
};

const AccessForm: React.FC<ProviderFormProps> = forwardRef((props, ref) => {
  const intl = useIntl();
  const { action, realAction, currentData, open, onFinish, onFallbackChange } =
    props;
  const { getScrollElementScrollableHeight } = useWrapperContext();
  const [form] = Form.useForm();
  const scrollTabsRef = useRef<any>(null);
  const targetsRef = useRef<any>(null);
  const { generateTargetData, fetchTargets } = useEditTargets();
  const {
    activeKey,
    collapseKeys,
    handleActiveChange,
    handleOnCollapseChange,
    updateActiveKey
  } = useScrollActiveChange({
    initalActiveKeys: [TABKeysMap.BASIC],
    initialCollapseKeys: [TABKeysMap.TARGETS]
  });

  const segmentOptions = [
    {
      value: TABKeysMap.BASIC,
      label: intl.formatMessage({ id: 'common.title.basicInfo' }),
      icon: <IconFont type="icon-basic" />,
      field: 'name'
    },
    {
      value: TABKeysMap.TARGETS,
      label: intl.formatMessage({ id: 'routes.form.target.title' }),
      icon: <IconFont type="icon-language" />,
      field: 'targets'
    }
  ];

  const formatTargets = (values: FormData) => {
    let targetList = [...(values.targets || [])];
    let fallbackTarget = values.fallback_target;

    if (fallbackTarget) {
      const exsitinged = targetList.find((ep) => {
        if (fallbackTarget!.model_id) {
          return ep.model_id === fallbackTarget!.model_id;
        }
        return (
          ep.provider_id === fallbackTarget!.provider_id &&
          ep.provider_model_name === fallbackTarget!.provider_model_name
        );
      });
      if (exsitinged) {
        targetList = targetList.map((ep) => {
          if (
            ep.model_id === fallbackTarget.model_id ||
            ep.provider_model_name === fallbackTarget.provider_model_name
          ) {
            return {
              ...ep,
              fallback_status_codes: ['4xx', '5xx']
            };
          }
          return ep;
        });
      }

      if (!exsitinged) {
        targetList.push({
          ...fallbackTarget,
          weight: 0,
          fallback_status_codes: ['4xx', '5xx']
        });
      }
    }

    return targetList;
  };

  const handleOnFinish = (values: FormData) => {
    const targets = formatTargets(values);
    const data = {
      ..._.omit(values, ['targets', 'fallback_target']),
      targets: targets
    };
    onFinish(data);
  };

  // init form values
  useEffect(() => {
    if (!open) {
      form.resetFields();
      return;
    }

    const initDataList = async (
      targets: {
        weight?: number;
        model_id?: number;
        provider_id?: number;
        provider_model_name?: string;
      }[]
    ) => {
      // init targets form list
      targetsRef.current?.initDataList(
        targets?.map((ep) => ({
          weight: ep.weight,
          value: ep.model_id
            ? ['deployments', ep.model_id]
            : [ep.provider_id, ep.provider_model_name]
        })) || []
      );
    };

    const initEditionForm = async () => {
      const targetList = await fetchTargets(currentData!.id);
      const { targets, fallbackTarget } = generateTargetData(targetList);

      // init form values
      form.setFieldsValue({
        ...currentData,
        targets: targets,
        fallback_target: fallbackTarget
      });

      initDataList(targets);

      // init fallback value
      if (fallbackTarget) {
        targetsRef.current?.initFallbackValues({
          value: fallbackTarget.model_id
            ? ['deployments', fallbackTarget.model_id]
            : [fallbackTarget.provider_id, fallbackTarget.provider_model_name]
        });
      }
    };

    const initRegisterForm = () => {
      form.setFieldsValue({
        ...currentData,
        targets: currentData?.routeTargets || []
      });
      initDataList(currentData?.routeTargets || []);
    };

    // --- register from provider page ---
    if (action === PageAction.EDIT && currentData) {
      initEditionForm();
    } else if (realAction === 'register' && currentData) {
      initRegisterForm();
    }
  }, [action, currentData, form, open, realAction]);

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
        value={{ onFallbackChange, action, realAction, currentData }}
      >
        <Form
          form={form}
          onFinish={handleOnFinish}
          onFinishFailed={handleOnFinishFailed}
          initialValues={{
            categories: [modelCategoriesMap.llm],
            meta: {}
          }}
        >
          <Basic />
          <CollapsePanel
            activeKey={collapseKeys}
            accordion={false}
            onChange={handleOnCollapseChange}
            items={[
              {
                key: TABKeysMap.TARGETS,
                label: intl.formatMessage({ id: 'routes.form.target.title' }),
                forceRender: true,
                children: <Targets ref={targetsRef}></Targets>
              }
            ]}
          ></CollapsePanel>
        </Form>
      </FormContext.Provider>
    </ScrollSpyTabs>
  );
});

export default AccessForm;
