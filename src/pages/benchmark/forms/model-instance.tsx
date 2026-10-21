import { PageAction } from '@/config';
import {
  InstanceStatusMap,
  InstanceStatusMapValue,
  isModelServable,
  isPDModel,
  modelCategoriesMap
} from '@/pages/llmodels/config';
import { useBenchmarkTargetInstance } from '@/pages/llmodels/hooks/use-run-benchmark';
import { useQueryModelInstancesList } from '@/pages/llmodels/services/use-query-model-instances';
import { useQueryModelList } from '@/pages/llmodels/services/use-query-model-list';
import { queryRouteTargets } from '@/pages/model-routes/apis';
import { TargetStatusValueMap } from '@/pages/model-routes/config';
import {
  Cascader as SealCascader,
  Select as SealSelect,
  TextAttribute,
  TooltipList,
  useAppUtils
} from '@gpustack/core-ui';
import { useIntl } from '@umijs/max';
import { useMemoizedFn } from 'ahooks';
import { App, Form, Tooltip } from 'antd';
import React, { useEffect } from 'react';
import {
  targetModeOptions,
  targetModeTips,
  TargetModeValueMap
} from '../config';
import { useFormContext } from '../config/form-context';
import { FormData } from '../config/types';

// benchmark.form.nonLlmModel.tips
const InstanceNode = (props: any) => {
  const { data: instance } = props;
  const intl = useIntl();

  // A group is a leaf too, but it is a MODEL leaf: it ends the selection
  // because it has no member to choose, not because it is one.
  if (instance.isLeaf && !instance.pd) {
    return (
      <span className="flex-center">
        {instance.label}
        {instance.disabled && (
          <span className="text-tertiary m-l-4">[{instance.state}]</span>
        )}
      </span>
    );
  }

  if (instance.disabled) {
    return (
      <Tooltip
        title={intl.formatMessage({ id: 'benchmark.form.nonLlmModel.tips' })}
      >
        <span>{instance.label}</span>
      </Tooltip>
    );
  }

  if (instance.pd) {
    // Says why this row does not expand, where the question is asked. Without
    // it a group looks like a model whose instances failed to load.
    return (
      <Tooltip
        title={intl.formatMessage({ id: 'benchmark.form.pdGroup.tips' })}
      >
        <span className="flex-center">
          {instance.label}
          <TextAttribute variant="outlined">PD</TextAttribute>
        </span>
      </Tooltip>
    );
  }

  return <span>{instance.label}</span>;
};

const ModelInstanceForm: React.FC = () => {
  const intl = useIntl();
  const form = Form.useFormInstance();
  // Through `App`, not the static import: the static one renders in a detached
  // root outside this app's ConfigProvider, which in dark mode leaves it
  // painting dark text on a light background.
  const { message } = App.useApp();
  const { getRuleMessage } = useAppUtils();
  const { action, open, currentData, applyAutoName } = useFormContext();
  const clusterId = Form.useWatch('cluster_id', form);
  const initializationVersion = React.useRef(0);
  const previousClusterId = React.useRef<number>();
  const [modelList, setModelList] = React.useState<any[]>([]);
  const {
    loading: modelLoading,
    fetchData: fetchModelList,
    cancelRequest: cancelModelRequest
  } = useQueryModelList();
  const {
    loading: instanceLoading,
    fetchInstanceList,
    cancelRequest: cancelInstanceRequest
  } = useQueryModelInstancesList();
  const { benchmarkTargetInstance, clearBenchmarkTargetInstance } =
    useBenchmarkTargetInstance();
  const [routeOptions, setRouteOptions] = React.useState<any[]>([]);
  const [routeLoading, setRouteLoading] = React.useState(false);
  const targetMode = Form.useWatch('target_mode', form);
  const routeMode = targetMode === TargetModeValueMap.Route;

  // One definition of "a model this run could measure", read by both modes:
  // the instance picker lists them, and the route picker keeps only the routes
  // that front one.
  const buildModelOptions = (list: any[]) =>
    list
      .filter((model: any) => model.replicas > 0)
      .map((model: any) => ({
        label: model.name,
        value: model.name,
        disabled: modelCategoriesMap.llm !== model.categories?.[0],
        id: model.id,
        // A group has no second level. Every member serves an OpenAI-shaped API
        // on its own port, so offering them would offer three wrong answers
        // that all return 200: a prefill stops after one token and a decode
        // runs without the prefix its KV was meant to carry. A group is
        // measured through its router, which is not a choice the user makes —
        // it is the only way in.
        isLeaf: isPDModel(model),
        pd: isPDModel(model),
        // Whether the model can actually answer, which under PD is no longer
        // implied by a running-instance count: a group whose router is down
        // has RUNNING members and serves nothing, and benchmarking it would
        // measure a connection error.
        servable: isModelServable(model),
        children: []
      }));

  // The routes that actually front something this run could measure: an ACTIVE
  // target, on a model of this cluster that can answer. A route whose only
  // target is UNAVAILABLE resolves to nothing at request time, so offering it
  // would offer a run that measures a 503.
  const loadRoutes = useMemoizedFn(
    async (models: any[], isCurrent: () => boolean) => {
      setRouteLoading(true);
      try {
        const { items } = await queryRouteTargets({});
        const modelById = new Map(
          models
            .filter((model: any) => !model.disabled && model.servable)
            .map((model: any) => [model.id, model])
        );
        const byRoute = new Map<string, any>();
        (items || []).forEach((target: any) => {
          const model = modelById.get(target.model_id);
          if (target.state !== TargetStatusValueMap.Active || !model) {
            return;
          }
          const current = byRoute.get(target.route_name);
          // The model recorded against the run is the route's principal target:
          // a canary splits the load, and the report has to name the deployment
          // the numbers mostly describe rather than whichever target sorted
          // first.
          const heavier =
            !current ||
            (target.weight ?? 0) > current.weight ||
            ((target.weight ?? 0) === current.weight && target.id < current.id);
          if (heavier) {
            byRoute.set(target.route_name, {
              label: target.route_name,
              value: target.route_name,
              weight: target.weight ?? 0,
              id: target.id,
              model_id: model.id,
              model_name: model.value
            });
          }
        });
        const options = Array.from(byRoute.values());
        if (isCurrent()) setRouteOptions(options);
        return options;
      } catch (error) {
        // Without this the rejection escapes an async `onChange` as an unhandled
        // one, and the picker shows its empty state — which says «no route fronts
        // a servable LLM here», a sentence about the cluster, for what is
        // actually a failed request. Say which it was, and hand back an empty
        // list so the caller's single-route auto-select cannot read `undefined`.
        if (isCurrent()) {
          setRouteOptions([]);
          message.error(
            (error as any)?.response?.data?.message ||
              (error as any)?.message ||
              intl.formatMessage({ id: 'common.text.error' })
          );
        }
        return [];
      } finally {
        if (isCurrent()) setRouteLoading(false);
      }
    }
  );

  const handleRouteChange = (value: string | undefined, option: any) => {
    initializationVersion.current += 1;
    setRouteLoading(false);
    // A route is the whole target: the model behind it is bookkeeping (the
    // snapshot, the placement worker), not something the user picked.
    form.setFieldsValue({
      route_name: value,
      model_name: option?.model_name,
      model_id: option?.model_id,
      model_instance_name: undefined,
      model_instance: undefined,
      dataset_worker_id: undefined,
      dataset_worker_name: undefined
    });
    applyAutoName?.();
  };

  // Switching the mode switches what the target IS, so the other mode's
  // selection has to go with it — a stale `model_instance` under route mode
  // would ride the submit and name a member the server must ignore.
  const handleTargetModeChange = useMemoizedFn(async (mode: string) => {
    const version = ++initializationVersion.current;
    setRouteLoading(false);
    const isCurrent = () =>
      initializationVersion.current === version &&
      form.getFieldValue('cluster_id') === clusterId &&
      form.getFieldValue('target_mode') === mode;
    form.setFieldsValue({
      route_name: undefined,
      model_name: undefined,
      model_id: undefined,
      model_instance: undefined,
      model_instance_name: undefined,
      dataset_worker_id: undefined,
      dataset_worker_name: undefined
    });
    if (mode === TargetModeValueMap.Route) {
      // Fetch this cluster's models: a cached list may still belong to the
      // previous cluster when the user switches modes while it is loading.
      const list = await fetchModelList({ page: -1, cluster_id: clusterId });
      if (!isCurrent()) return;
      const models = buildModelOptions(list);
      setModelList(models);
      const options = await loadRoutes(models, isCurrent);
      if (!isCurrent()) return;
      if (options.length === 1) {
        handleRouteChange(options[0].value, options[0]);
      }
      return;
    }
    initModelInstance(false);
  });

  const handleOnChange = (value: any, selectedOptions: any) => {
    initializationVersion.current += 1;
    // Clearing the Cascader fires this with both arguments undefined, so nothing
    // here may index blind — the whole selection has to null out together.
    const options = selectedOptions || [];
    // A group stops at the model: it has no second level, so the last option is
    // the model itself and there is no member to name. The server resolves the
    // endpoint (the router) and the worker the run is placed on.
    const instanceOption =
      value?.length > 1 ? options[options.length - 1] : null;
    form.setFieldsValue({
      model_name: value?.[0],
      model_id: options[0]?.id,
      model_instance_name: value?.[1],
      model_instance: value,
      // The selected instance's worker — used to co-locate the custom benchmark
      // dataset (the picker filters datasets to this worker). Not part of the
      // benchmark payload; stripped before submit.
      dataset_worker_id: instanceOption?.worker_id,
      dataset_worker_name: instanceOption?.worker_name
    });
    applyAutoName?.();
  };

  const renderInstance = (instance: any) => {
    return {
      label: instance.name,
      value: instance.name,
      id: instance.id,
      worker_id: instance.worker_id,
      worker_name: instance.worker_name,
      isLeaf: true,
      disabled: instance.state !== InstanceStatusMap.Running,
      state: InstanceStatusMapValue[instance.state]
    };
  };

  const clearModelInstance = () => {
    setModelList([]);
    handleOnChange(undefined, []);
  };

  const loadInstances = async (selectedOptions: any[]) => {
    const targetOption = selectedOptions[selectedOptions.length - 1];
    if (targetOption && targetOption.children.length === 0) {
      const list = await fetchInstanceList({ id: targetOption.id });
      const instanceOptions = list.map((instance: any) =>
        renderInstance(instance)
      );
      targetOption.children = [...instanceOptions];

      setModelList((prevModelList) => {
        const newModelList = prevModelList.map((model) => {
          if (model.id === targetOption.id) {
            return {
              ...model,
              children: [...instanceOptions]
            };
          }
          return model;
        });
        return newModelList;
      });
    }
  };
  const initModelInstance = useMemoizedFn(async (preserveSource = true) => {
    const version = ++initializationVersion.current;
    const clusterChanged =
      previousClusterId.current != null &&
      previousClusterId.current !== clusterId;
    previousClusterId.current = clusterId;
    // Also cover programmatic cluster changes. Keep the initial clone/handoff
    // prefill, but invalidate an old cluster's target before loading a new one.
    if (clusterChanged) {
      form.setFieldsValue({
        route_name: undefined,
        model_name: undefined,
        model_id: undefined,
        model_instance: undefined,
        model_instance_name: undefined,
        dataset_worker_id: undefined,
        dataset_worker_name: undefined
      });
    }
    setModelList([]);
    setRouteOptions([]);
    setRouteLoading(false);
    if (!clusterId) {
      return;
    }
    const mode =
      form.getFieldValue('target_mode') || TargetModeValueMap.Instance;
    const cloneSource =
      preserveSource &&
      currentData &&
      currentData.cluster_id === clusterId &&
      (currentData.target_mode || TargetModeValueMap.Instance) === mode
        ? currentData
        : undefined;
    const isCurrent = () =>
      initializationVersion.current === version &&
      form.getFieldValue('cluster_id') === clusterId &&
      (form.getFieldValue('target_mode') || TargetModeValueMap.Instance) ===
        mode;
    const source =
      cloneSource ||
      (preserveSource && benchmarkTargetInstance.cluster_id === clusterId
        ? benchmarkTargetInstance
        : undefined);

    const list = await fetchModelList({ page: -1, cluster_id: clusterId });
    if (!isCurrent()) return;
    const modelOptions = buildModelOptions(list);
    setModelList(modelOptions);

    if (mode === TargetModeValueMap.Route) {
      const routes = await loadRoutes(modelOptions, isCurrent);
      if (!isCurrent()) return;
      const sourceRouteName =
        cloneSource?.snapshot?.route_name ?? cloneSource?.route_name;
      const selectedRoute = cloneSource
        ? routes.find((route) => route.value === sourceRouteName)
        : routes.length === 1
          ? routes[0]
          : undefined;
      handleRouteChange(selectedRoute?.value, selectedRoute);
      return;
    }

    if (modelOptions.length === 0) {
      clearModelInstance();
      return;
    }

    // Cloning keeps the source deployment, even when another model sorts first.
    // Match its id so a replacement with the same name cannot inherit the run.
    const selectedModel = source?.model_name
      ? modelOptions.find((model) =>
          source.model_id != null
            ? model.id === source.model_id
            : model.value === source.model_name
        )
      : modelOptions.find((model) => !model.disabled && model.servable);
    if (!selectedModel || selectedModel.disabled || !selectedModel.servable) {
      handleOnChange(undefined, []);
      return;
    }

    // PD is measured through its router, without selecting a member instance.
    if (selectedModel.pd) {
      handleOnChange([selectedModel.value], [selectedModel]);
      return;
    }

    const instances = (await fetchInstanceList({ id: selectedModel.id })).map(
      (instance: any) => renderInstance(instance)
    );
    if (!isCurrent()) return;
    selectedModel.children = instances as never[];
    setModelList([...modelOptions]);
    // A clone needs the exact replica. Only a fresh create or a deployment-level
    // handoff may choose a default; an unavailable source requires a new choice.
    const selectedInstance = source?.model_instance_name
      ? instances.find(
          (instance: any) => instance.value === source.model_instance_name
        )
      : cloneSource
        ? undefined
        : instances.find((instance: any) => !instance.disabled);
    if (selectedInstance && !selectedInstance.disabled) {
      handleOnChange(
        [selectedModel.value, selectedInstance.value],
        [selectedModel, selectedInstance]
      );
    } else {
      handleOnChange(undefined, []);
    }
  });

  useEffect(() => {
    if (open && action === PageAction.CREATE) {
      initModelInstance();
    }
    if (!open) {
      cancelModelRequest();
      cancelInstanceRequest();
      clearBenchmarkTargetInstance();
      setRouteLoading(false);
    }
    return () => {
      initializationVersion.current += 1;
    };
  }, [open, action, clusterId, currentData]);

  return (
    <>
      {/* Above the target, because it decides what the target IS: under a
          route the thing to pick is a route, under instance it is a model (or
          one of its members). Same component as the picker so switching modes
          can clear the other side in the same handler, rather than an effect
          elsewhere watching for it. */}
      <Form.Item<FormData> name="target_mode">
        <SealSelect
          disabled={action === PageAction.EDIT}
          options={targetModeOptions}
          label={intl.formatMessage({ id: 'benchmark.form.targetMode' })}
          description={<TooltipList list={targetModeTips} />}
          onChange={handleTargetModeChange}
        ></SealSelect>
      </Form.Item>
      {routeMode ? (
        <Form.Item<FormData>
          name={'route_name'}
          rules={[
            {
              required: true,
              message: getRuleMessage('select', 'benchmark.form.target.route')
            }
          ]}
        >
          <SealSelect
            required
            showSearch
            disabled={action === PageAction.EDIT}
            loading={modelLoading || routeLoading}
            options={routeOptions}
            label={intl.formatMessage({ id: 'benchmark.form.target.route' })}
            notFoundContent={intl.formatMessage({
              id: 'benchmark.form.target.route.empty'
            })}
            onChange={handleRouteChange}
          ></SealSelect>
        </Form.Item>
      ) : (
        <Form.Item<FormData>
          name={'model_instance'}
          rules={[
            {
              required: true,
              // Not "select an instance": a group is selected at the model
              // level, because it has no member a client can name correctly.
              message: getRuleMessage('select', 'benchmark.form.target')
            }
          ]}
        >
          <SealCascader
            required
            showSearch
            disabled={action === PageAction.EDIT}
            loading={modelLoading || instanceLoading}
            changeOnSelect={false}
            expandTrigger="hover"
            multiple={false}
            classNames={{
              popup: {
                root: 'cascader-popup-wrapper gpu-selector'
              }
            }}
            maxTagCount={1}
            label={intl.formatMessage({ id: 'benchmark.form.target' })}
            options={modelList}
            getPopupContainer={(triggerNode) => triggerNode.parentNode}
            optionNode={InstanceNode}
            loadData={loadInstances}
            onChange={handleOnChange}
          ></SealCascader>
        </Form.Item>
      )}
    </>
  );
};

export default ModelInstanceForm;
