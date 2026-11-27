import { generateRandomNumber } from '@/utils';
import { useSearchParams } from '@umijs/max';
import { useMemoizedFn } from 'ahooks';
import { useEffect, useRef, useState } from 'react';
import { CustomSizeConfig } from '../config/params-config';
import { ParamsSchema } from '../config/types';
import {
  VIDEO_DEFAULT_SECONDS,
  VIDEO_MAX_SECONDS,
  videoAspectRatioOptions,
  videoParamsConfig,
  videoTaskLabels
} from '../config/video-parameters';
import { restoreVideoAdvancedParameters } from '../video/advanced-parameters';
import { emptyVideoMedia, getVideoMediaRules } from '../video/media-inputs';
import {
  getDefaultVideoSize,
  getSizesForVideoRatio,
  getVideoAspectRatio,
  getVideoSizeOptions,
  parseVideoSize,
  selectVideoSize
} from '../video/resolutions';

const videoInitialValues = {
  aspectRatio: '16:9',
  size: '832x480',
  width: 832,
  height: 480,
  seconds: VIDEO_DEFAULT_SECONDS,
  advancedParameters: '',
  random_seed: true,
  ...emptyVideoMedia,
  task: undefined
};

function getDurationRange(meta: Record<string, any>) {
  const duration = meta.video?.duration;
  const max = Math.min(
    VIDEO_MAX_SECONDS,
    Math.floor(duration?.max ?? VIDEO_MAX_SECONDS)
  );
  const min = Math.max(1, Math.ceil(duration?.min ?? 1));
  return { min, max };
}

function getSizeValues(meta: Record<string, any>) {
  const options = getVideoSizeOptions(meta);
  const dimensions = getDefaultVideoSize(meta) ||
    options.find((option) => option.value === '832x480') ||
    options[0] || {
      width: Math.min(meta.max_width || 832, 832),
      height: Math.min(meta.max_height || 480, 480)
    };
  const value = `${dimensions.width}x${dimensions.height}`;
  const isPreset = options.some((option) => option.value === value);
  return {
    width: dimensions.width,
    height: dimensions.height,
    aspectRatio: isPreset
      ? getVideoAspectRatio(dimensions.width, dimensions.height)
      : 'custom',
    size: isPreset ? value : 'custom'
  };
}

interface MessageProps {
  modelList: Global.BaseOption<string>[];
  model?: string;
  initialParameters?: Record<string, unknown>;
  loaded?: boolean;
  isChat?: boolean;
  ref?: any;
}

export const useInitVideoMeta = (
  props: MessageProps,
  _options: { type: string }
) => {
  const { modelList } = props;
  const form = useRef<any>(null);
  const [searchParams] = useSearchParams();
  const [modelMeta, setModelMeta] = useState<any>({});
  const [initialValues, setInitialValues] = useState<any>(() => ({
    ...videoInitialValues,
    seed: generateRandomNumber(),
    model: ''
  }));
  const [parameters, setParams] = useState<any>(initialValues);
  const [paramsConfig, setParamsConfig] = useState<ParamsSchema[]>(() =>
    generateParamsConfig({}, initialValues)
  );
  const cacheFormData = useRef<Record<string, any>>({ ...initialValues });
  const restored = useRef<Record<string, unknown>>();
  const videoSizeOptions = getVideoSizeOptions(modelMeta);
  const defaultModel =
    props.model || searchParams.get('model') || modelList[0]?.value || '';

  function generateParamsConfig(
    currentModel: { meta?: Record<string, any> },
    values: Record<string, any>,
    sizeOptions = getVideoSizeOptions(currentModel.meta)
  ): ParamsSchema[] {
    const meta = currentModel.meta || {};
    const video = meta.video;
    const ratioOptions = videoAspectRatioOptions.filter(
      ({ value }) =>
        value === 'custom' ||
        getSizesForVideoRatio(sizeOptions, value).length > 0
    );
    const config: ParamsSchema[] = videoParamsConfig
      .filter(({ name }) => name !== 'size')
      .map((item) => {
        if (item.name === 'aspectRatio') {
          return {
            ...item,
            disabled: false,
            options: ratioOptions
          };
        }
        if (item.name === 'seconds') {
          const range = getDurationRange(meta);
          return {
            ...item,
            required: true,
            attrs: { ...range, step: 1, precision: 0 },
            rules: [
              {
                required: true,
                type: 'integer',
                ...range
              }
            ]
          };
        }
        return item;
      });
    if (video) {
      config.unshift({
        type: 'Select',
        name: 'task',
        label: { text: 'playground.params.taskType', isLocalized: true },
        options: (video.playground_tasks || []).map((task: string) => {
          const localized = Object.hasOwn(videoTaskLabels, task);
          return {
            label: localized ? videoTaskLabels[task] : task,
            value: task,
            locale: localized
          };
        }),
        disabled: !video.playground_tasks?.length,
        description: !video.playground_tasks?.length
          ? { text: 'playground.video.taskUnsupported', isLocalized: true }
          : values.task === 'fl2va'
            ? { text: 'playground.video.keyframes.required', isLocalized: true }
            : undefined,
        rules: [{ required: true }]
      });
    }
    if (values.aspectRatio === 'custom') {
      for (const name of ['width', 'height']) {
        const rules = [
          {
            required: true,
            type: 'integer' as const,
            min: 1,
            max: meta['max_' + name]
          }
        ];
        config.push({
          ...CustomSizeConfig.find((item) => item.name === name)!,
          type: 'Slider',
          name,
          label: { text: 'playground.params.' + name, isLocalized: true },
          attrs: {
            ...CustomSizeConfig.find((item) => item.name === name)?.attrs,
            min: 1,
            max: meta['max_' + name] || 4096,
            step: 1
          },
          rules
        });
      }
    } else {
      const sizes = getSizesForVideoRatio(sizeOptions, values.aspectRatio);
      const field = videoParamsConfig.find(({ name }) => name === 'size')!;
      config.push({
        ...field,
        type: 'Select',
        options: sizes,
        rules: [{ required: true }]
      });
    }
    return config;
  }

  const extractIMGMeta = (meta: Record<string, any> = {}) => {
    const video = meta.video;
    const { min, max } = getDurationRange(meta);
    const task = video?.playground_tasks?.includes(video.default_task)
      ? video.default_task
      : video?.playground_tasks?.length === 1
        ? video.playground_tasks[0]
        : undefined;
    return {
      form: {
        ...videoInitialValues,
        ...getSizeValues(meta),
        task,
        seconds: Math.min(max, Math.max(min, VIDEO_DEFAULT_SECONDS))
      },
      meta,
      sizeOptions: getVideoSizeOptions(meta)
    };
  };

  const updateCacheFormData = (values: Record<string, any>) => {
    Object.assign(cacheFormData.current, values);
  };

  const applyValues = (values: Record<string, any>, meta = modelMeta) => {
    form.current?.form?.setFieldsValue(values);
    setParamsConfig(generateParamsConfig({ meta }, values));
    setParams(values);
    updateCacheFormData(values);
  };

  const handleOnModelChange = useMemoizedFn((value: string) => {
    if (!value) return;
    const model = modelList.find((item) => item.value === value);
    const meta = model?.meta || {};
    const { form: defaults } = extractIMGMeta(meta);
    const values = {
      ...defaults,
      seed: parameters.seed,
      random_seed: parameters.random_seed,
      model: value
    };
    cacheFormData.current = { ...values };
    setModelMeta(meta);
    setInitialValues(values);
    applyValues(values, meta);
  });

  const handleOnValuesChange = useMemoizedFn(
    (changed: Record<string, any>, allValues: Record<string, any>) => {
      if (changed.model) {
        handleOnModelChange(changed.model);
        return;
      }
      const values = { ...parameters, ...allValues, ...changed };
      if (Object.hasOwn(changed, 'task')) {
        Object.assign(values, emptyVideoMedia, getSizeValues(modelMeta));
      } else if (Object.hasOwn(changed, 'aspectRatio')) {
        if (values.aspectRatio === 'custom') {
          const dimensions = parseVideoSize(parameters.size);
          Object.assign(
            values,
            dimensions || {
              width: parameters.width,
              height: parameters.height
            },
            cacheFormData.current.customSize
          );
          values.size = 'custom';
        } else {
          const size = selectVideoSize(
            getSizesForVideoRatio(videoSizeOptions, values.aspectRatio),
            parseVideoSize(parameters.size) || parameters
          );
          values.size = size?.value;
          values.width = size?.width;
          values.height = size?.height;
        }
      } else if (Object.hasOwn(changed, 'size')) {
        Object.assign(values, parseVideoSize(values.size));
      } else if (changed.random_seed === true) {
        values.seed = generateRandomNumber();
      }
      if (values.aspectRatio === 'custom') {
        updateCacheFormData({
          customSize: { width: values.width, height: values.height }
        });
      }
      applyValues(values);
    }
  );

  const prepareParameters = (parametersToSubmit = parameters) => {
    if (!parametersToSubmit.random_seed) return parametersToSubmit;
    const values = { ...parametersToSubmit, seed: generateRandomNumber() };
    form.current?.form?.setFieldsValue({ seed: values.seed });
    setParams((current: Record<string, any>) => ({
      ...current,
      seed: values.seed
    }));
    updateCacheFormData({ seed: values.seed });
    return values;
  };

  const restoreParameters = (saved: Record<string, unknown>) => {
    const model = modelList.find((item) => item.value === saved.model);
    if (!model) return false;
    const meta = model.meta || {};
    const { form: defaults } = extractIMGMeta(meta);
    const task = typeof saved.task === 'string' ? saved.task : defaults.task;
    if (task && !meta.video?.playground_tasks?.includes(task)) return false;
    const rules = getVideoMediaRules(meta, task);
    const values: Record<string, any> = {
      ...defaults,
      ...getSizeValues(meta),
      ...emptyVideoMedia,
      model: model.value,
      task,
      advancedParameters: restoreVideoAdvancedParameters(saved),
      seed: generateRandomNumber(),
      random_seed: true
    };
    if (
      typeof saved.seconds === 'number' ||
      typeof saved.seconds === 'string'
    ) {
      const seconds = Number(saved.seconds);
      if (Number.isFinite(seconds) && seconds > 0) {
        const { min, max } = getDurationRange(meta);
        values.seconds = Math.min(max, Math.max(min, Math.round(seconds)));
      }
    }
    if (
      (typeof saved.seed === 'number' ||
        (typeof saved.seed === 'string' && saved.seed.trim())) &&
      Number.isSafeInteger(Number(saved.seed)) &&
      Number(saved.seed) >= 0
    ) {
      values.seed = Number(saved.seed);
      values.random_seed = false;
    }
    const dimensions =
      typeof saved.size === 'string' ? parseVideoSize(saved.size) : undefined;
    if (dimensions) {
      const preset = getVideoSizeOptions(meta).some(
        (option) => option.value === saved.size
      );
      Object.assign(values, dimensions, {
        size: preset ? saved.size : 'custom',
        aspectRatio: preset
          ? getVideoAspectRatio(dimensions.width, dimensions.height)
          : 'custom'
      });
    }
    // IndexedDB retains the current request's uploaded media as Blob/File.
    const mediaSource = (item: Record<string, any>) => {
      const value = item.upload_field ? saved[item.upload_field] : item.uri;
      if (typeof value === 'string') return value;
      if (value instanceof File) return value;
      if (value instanceof Blob)
        return new File([value], 'reference', { type: value.type });
      return undefined;
    };
    let media: Record<string, any>[] = [];
    try {
      const parsed =
        typeof saved.media_inputs === 'string'
          ? JSON.parse(saved.media_inputs)
          : saved.media_inputs;
      if (Array.isArray(parsed))
        media = parsed.filter((item) => item && typeof item === 'object');
    } catch {
      /* Scalar parameters can still restore if optional media is malformed. */
    }
    if (rules.keyframes) {
      values.firstFrame = mediaSource(
        media.find((item) => item.frame_index === 0) || {}
      );
      values.lastFrame = mediaSource(
        media.find((item) => item.frame_index === -1) || {}
      );
    } else if (rules.max_items) {
      values.references = media
        .filter((item) => rules[item.type as 'image' | 'video' | 'audio'])
        .slice(0, 1)
        .map((item) => ({ type: item.type, source: mediaSource(item) }));
    } else if (!meta.video) {
      values.referenceImage =
        mediaSource({ upload_field: 'input_reference' }) || saved.reference_url;
    }
    cacheFormData.current = {
      ...values,
      ...(values.aspectRatio === 'custom'
        ? { customSize: { width: values.width, height: values.height } }
        : {})
    };
    setModelMeta(meta);
    setInitialValues(values);
    applyValues(values, meta);
    return {
      mediaRequired: Boolean(
        rules.keyframes ||
        rules.max_items ||
        (!meta.video &&
          (saved.input_reference || saved.reference_url || saved.media_inputs))
      )
    };
  };

  useEffect(() => {
    if (defaultModel && modelList.length) {
      if (
        props.initialParameters &&
        restored.current !== props.initialParameters
      ) {
        restored.current = props.initialParameters;
        if (restoreParameters(props.initialParameters)) return;
      }
      handleOnModelChange(defaultModel);
    }
  }, [defaultModel, modelList.length, props.initialParameters]);

  return {
    extractIMGMeta,
    generateParamsConfig,
    handleOnValuesChange,
    prepareParameters,
    restoreParameters,
    setParams,
    form,
    modelMeta,
    paramsConfig,
    initialValues,
    parameters,
    cacheFormData,
    videoSizeOptions
  };
};
