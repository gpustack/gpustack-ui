import { PageAction } from '@/config';
import { PageActionType } from '@/config/types';
import { modelCategoriesMap } from '@/pages/llmodels/config';
import {
  CollapsePanel,
  IconFont,
  ScrollSpyTabs,
  useFinishFailed,
  useScrollActiveChange,
  useWrapperContext
} from '@gpustack/core-ui';
import { useIntl } from '@umijs/max';
import { Form } from 'antd';
import _ from 'lodash';
import { forwardRef, useEffect, useImperativeHandle, useRef } from 'react';
import FormContext from '../config/form-context';
import {
  FormData,
  RouteItem as ListItem,
  RouteTargetFormItem
} from '../config/types';
import useEditTargets from '../hooks/use-edit-targets';
import Basic from './basic';
import Targets from './targets';

const isSameTarget = (
  left?: RouteTargetFormItem | null,
  right?: RouteTargetFormItem | null
) => {
  if (!left || !right) {
    return false;
  }
  if (left.model_id && left.model_id === right.model_id) {
    return left.lora_module_name === right.lora_module_name;
  }
  if (left.provider_id && left.provider_id === right.provider_id) {
    return left.overridden_model_name === right.overridden_model_name;
  }
  return false;
};

const normalizeTarget = (
  target: RouteTargetFormItem | null | undefined
): RouteTargetFormItem => {
  const normalizedTarget = {
    id: target?.id,
    weight: target?.weight ?? 0,
    model_id: target?.model_id,
    provider_id: target?.provider_id,
    overridden_model_name: target?.overridden_model_name,
    lora_module_name: target?.lora_module_name,
    fallback_status_codes: target?.fallback_status_codes
  };

  return _.omitBy(normalizedTarget, _.isUndefined) as RouteTargetFormItem;
};

interface ProviderFormProps {
  ref?: any;
  open: boolean;
  action: PageActionType;
  realAction?: string;
  currentData?: ListItem & {
    routeTargets?: RouteTargetFormItem[];
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
    const fallbackTarget = values.fallback_target;

    if (fallbackTarget) {
      const existingTarget = targetList.find((target) =>
        isSameTarget(target, fallbackTarget)
      );
      if (existingTarget) {
        targetList = targetList.map((ep) => {
          if (isSameTarget(ep, fallbackTarget)) {
            return {
              ...ep,
              fallback_status_codes: ['4xx', '5xx']
            };
          }
          return ep;
        });
      }

      if (!existingTarget) {
        targetList.push({
          ...fallbackTarget,
          weight: 0,
          fallback_status_codes: ['4xx', '5xx']
        });
      }
    }

    return targetList.map((target) => normalizeTarget(target));
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

    const initDataList = async (targets: RouteTargetFormItem[]) => {
      // init targets form list
      targetsRef.current?.initDataList(
        targets?.map((ep) => ({
          weight: ep.weight,
          value: ep.model_id
            ? [
                'deployments',
                ep.lora_module_name
                  ? `${ep.model_id}_lora_${ep.lora_module_name}`
                  : ep.model_id
              ]
            : [ep.provider_id, ep.overridden_model_name]
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
            ? [
                'deployments',
                fallbackTarget.lora_module_name
                  ? `${fallbackTarget.model_id}_lora_${fallbackTarget.lora_module_name}`
                  : fallbackTarget.model_id
              ]
            : [fallbackTarget.provider_id, fallbackTarget.overridden_model_name]
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
