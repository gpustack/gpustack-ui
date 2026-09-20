import { PageAction } from '@/config';
import { PageActionType } from '@/config/types';
import { modelCategoriesMap } from '@/pages/llmodels/config';
import {
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
import { queryModelRouteDetail } from '../apis';
import { LB_FORM_MODE } from '../config';
import FormContext from '../config/form-context';
import {
  FormData,
  LbMode,
  RouteItem as ListItem,
  RoutePlugins,
  RouteTargetFormItem
} from '../config/types';
import useEditTargets from '../hooks/use-edit-targets';
import { buildPluginsPayload, toFormPlugins } from '../utils/lb-plugins';
import Basic from './basic';
import LbPolicySection from './lb-policy';
import Targets from './targets';

const isSameTarget = (
  left?: RouteTargetFormItem | null,
  right?: RouteTargetFormItem | null
) => {
  if (!left || !right) {
    return false;
  }
  if (left.model_id && left.model_id === right.model_id) {
    return left.overridden_model_name === right.overridden_model_name;
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
    fallback_status_codes: target?.fallback_status_codes,
    max_running_requests: target?.max_running_requests ?? null
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
  onFinishFailed?: (errorInfo: any) => void;
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
    // The LB policy section has no segment of its own, so its errors (which
    // surface under the top-level field name `plugins`) route to this one.
    fields: ['targets', 'plugins']
  }
};

const AccessForm: React.FC<ProviderFormProps> = forwardRef((props, ref) => {
  const intl = useIntl();
  const {
    action,
    realAction,
    currentData,
    open,
    onFinish,
    onFinishFailed,
    onFallbackChange
  } = props;
  const { getScrollElementScrollableHeight } = useWrapperContext();
  const [form] = Form.useForm();
  const scrollTabsRef = useRef<any>(null);
  const targetsRef = useRef<any>(null);
  const { generateTargetData, fetchTargets } = useEditTargets();
  // Snapshot of the plugins section loaded from the detail endpoint; the
  // submit diff (unchanged = omit, cleared = null) is taken against it.
  const originalPluginsRef = useRef<RoutePlugins | undefined>(undefined);
  // Monotonic drawer-session token; guards the async edition init against
  // writing a stale response into a newer session.
  const initSessionRef = useRef(0);
  const { activeKey, handleActiveChange, updateActiveKey } =
    useScrollActiveChange({
      initalActiveKeys: [TABKeysMap.BASIC]
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
    // Round-robin and policy both hand every target to the gateway's
    // picker: all weights 0.
    const isSmartMode = values.lb_policy_mode !== LB_FORM_MODE.weighted;
    let targets = formatTargets(values);
    // Smart mode hands every target to scoring/round-robin: all weights 0.
    if (isSmartMode) {
      targets = targets.map((target) => ({ ...target, weight: 0 }));
    }
    const plugins = buildPluginsPayload(
      // Read the store, not `values.plugins`: getFieldsValue() only clones
      // currently-registered field paths (rc-field-form's
      // cloneByNamePathList), so a plugin weight whose Form.Item sits inside
      // a collapsed Advanced section, and enableOnPathSuffix (no Form.Item at
      // all), would silently drop out of `values` — PUT replaces the plugin
      // section wholesale, losing the stored keys. The store has them.
      // In weighted mode this is undefined on purpose: no plugin config is
      // expected, and buildPluginsPayload then nulls the stored one.
      isSmartMode ? (form.getFieldValue('plugins') as any) : undefined,
      originalPluginsRef.current
    );
    // `meta` never enters the payload: this drawer mounts no meta Form.Item,
    // so `values.meta` is always undefined, and the backend's
    // update_model_route (include=model_fields_set) already leaves the stored
    // meta untouched when the key is absent.
    const data = {
      ..._.omit(values, [
        'targets',
        'fallback_target',
        'plugins',
        'lb_policy_mode'
      ]),
      targets: targets,
      ...(plugins ? { plugins } : {})
    };
    onFinish(data);
  };

  // init form values
  useEffect(() => {
    if (!open) {
      form.resetFields();
      originalPluginsRef.current = undefined;
      // Invalidate any in-flight edition init: its response must not write
      // into a drawer session that has since closed or switched routes.
      initSessionRef.current += 1;
      return;
    }

    const initSession = ++initSessionRef.current;

    const initDataList = async (targets: RouteTargetFormItem[]) => {
      // init targets form list
      targetsRef.current?.initDataList(
        targets?.map((ep) => ({
          weight: ep.weight,
          value: ep.model_id
            ? [
                'deployments',
                ep.overridden_model_name
                  ? `${ep.model_id}_lora_${ep.overridden_model_name}`
                  : ep.model_id
              ]
            : [ep.provider_id, ep.overridden_model_name]
        })) || []
      );
    };

    const initEditionForm = async () => {
      const [targetList, detail] = await Promise.all([
        fetchTargets(currentData!.id),
        queryModelRouteDetail(currentData!.id).catch(() => null)
      ]);
      // The drawer may have closed or reopened for another route while the
      // requests were in flight; a stale write would poison the form AND the
      // original snapshots the next save diffs against.
      if (initSession !== initSessionRef.current) {
        return;
      }
      const { targets, fallbackTarget } = generateTargetData(targetList);
      const plugins = detail?.plugins;
      originalPluginsRef.current = plugins;

      // init form values
      // Prefer the server-derived `lb_mode` (persisted to meta at reconcile
      // time, never derived client-side per the API contract). Weight
      // derivation is only the fallback for a failed detail fetch / null
      // mode (no usable target). The detail response carries the key inside
      // `meta`; the top-level field is kept as a defensive fallback.
      const lbMode = (detail?.meta?.lb_mode ?? detail?.lb_mode) as
        | LbMode
        | null
        | undefined;
      form.setFieldsValue({
        ...currentData,
        targets: targets,
        fallback_target: fallbackTarget,
        lb_policy_mode:
          lbMode != null
            ? lbMode === 'weighted'
              ? LB_FORM_MODE.weighted
              : LB_FORM_MODE.policy
            : targets.some((target) => (target.weight ?? 0) > 0)
              ? LB_FORM_MODE.weighted
              : LB_FORM_MODE.policy,
        plugins: toFormPlugins(plugins) as any
      });

      initDataList(targets);

      // init fallback value
      if (fallbackTarget) {
        targetsRef.current?.initFallbackValues({
          value: fallbackTarget.model_id
            ? [
                'deployments',
                fallbackTarget.overridden_model_name
                  ? `${fallbackTarget.model_id}_lora_${fallbackTarget.overridden_model_name}`
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

  const handleFinishFailed = (errorInfo: any) => {
    handleOnFinishFailed(errorInfo);
    onFinishFailed?.(errorInfo);
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
      <FormContext.Provider
        value={{ onFallbackChange, action, realAction, currentData }}
      >
        <Form
          form={form}
          onFinish={handleOnFinish}
          onFinishFailed={handleFinishFailed}
          initialValues={{
            categories: [modelCategoriesMap.llm],
            meta: {},
            lb_policy_mode: LB_FORM_MODE.weighted
          }}
        >
          <Basic />
          <LbPolicySection />
          {/* Targets carries its own section heading; it is the last section
              of the form and holds a required field, so there is nothing to
              gain from collapsing it. */}
          <Targets ref={targetsRef}></Targets>
        </Form>
      </FormContext.Provider>
    </ScrollSpyTabs>
  );
});

export default AccessForm;
