import {
  CustomSizeConfig,
  SizeOption
} from '@/pages/playground/config/params-config';
import { generateRandomNumber } from '@/utils';
import { useSearchParams } from '@umijs/max';
import { useMemoizedFn } from 'ahooks';
import _ from 'lodash';
import React, { useEffect, useMemo, useRef, useState } from 'react';
import { ParamsSchema } from '../config/types';
import {
  videoParamsConfig,
  videoSizeOptions as videoSizeList
} from '../config/video-parameters';
import {
  openaiCompatibleFieldsDefaultValus,
  VIDEO_METAKEYS,
  videoAdvancedDefaultValues
} from './config';

const videoInitialValues = {
  size: '720x1280',
  seconds: '4'
};

interface MessageProps {
  modelList: Global.BaseOption<string>[];
  model?: string;
  loaded?: boolean;
  isChat?: boolean;
  ref?: any;
}

export const useInitVideoMeta = (
  props: MessageProps,
  options: { type: string }
) => {
  const { modelList } = props;
  const videoAdvancedParamsConfig: ParamsSchema[] = [];
  const videoExtraConfig: ParamsSchema[] = [];

  const form = useRef<any>(null);
  const [searchParams] = useSearchParams();
  const [modelMeta, setModelMeta] = useState<any>({});
  const [isOpenaiCompatible, setIsOpenaiCompatible] = useState<boolean>(false);
  const [videoSizeOptions, setVideoSizeOptions] = React.useState<SizeOption[]>(
    []
  );
  const [basicParamsConfig, setBasicParamsConfig] = React.useState<
    ParamsSchema[]
  >([...videoParamsConfig]);
  const initialSeed = generateRandomNumber();

  const [initialValues, setInitialValues] = useState<any>({
    ...videoInitialValues,
    ...videoAdvancedDefaultValues,
    seed: initialSeed,
    model: ''
  });
  const [paramsConfig, setParamsConfig] = useState<ParamsSchema[]>([
    ...videoParamsConfig,
    ...videoAdvancedParamsConfig
  ]);

  const [parameters, setParams] = useState<any>({
    ...videoInitialValues,
    ...videoAdvancedDefaultValues,
    seed: initialSeed,
    model: ''
  });

  const defaultModel = useMemo(() => {
    return searchParams.get('model') || modelList?.[0]?.value || '';
  }, [modelList]);

  const cacheFormData = React.useRef<Record<string, any>>({
    ...videoInitialValues,
    ...openaiCompatibleFieldsDefaultValus,
    ...videoAdvancedDefaultValues
  });

  const getNewSizeOptions = (metaData: any) => {
    const { max_height, max_width } = metaData || {};
    if (!max_height || !max_width) {
      return videoSizeList;
    }
    const newSizeOptions = videoSizeList.filter((item) => {
      return (
        (item.width <= max_width && item.height <= max_height) ||
        item.value === 'custom'
      );
    });
    if (
      !newSizeOptions.find(
        (item) => item.width === max_width && item.height === max_height
      )
    ) {
      newSizeOptions.push({
        width: max_width,
        height: max_height,
        label: `${max_width}x${max_height}`,
        value: `${max_width}x${max_height}`
      });
    }
    return newSizeOptions;
  };

  const generateParamsConfig = (
    currentModel: any,
    sizeOptions: SizeOption[]
  ) => {
    if (sizeOptions.length) {
      const sizeConfig = videoParamsConfig.map((item) => {
        return {
          ...item,
          options: sizeOptions
        };
      });
      return [...sizeConfig];
    }
    const { max_height, max_width } = currentModel.meta || {};
    // generate custom size config
    const customSizeConfig = _.cloneDeep(CustomSizeConfig).map((item: any) => {
      const max = item.name === 'height' ? max_height : max_width;
      return {
        ...item,
        attrs: {
          ...item.attrs,
          max: max || item.attrs.max
        }
      };
    });
    return [...customSizeConfig];
  };

  const extractIMGMeta = (meta: any) => {
    const sizeOptions = getNewSizeOptions(meta);
    return {
      form: _.merge(
        {},
        { ...videoInitialValues, ...videoAdvancedDefaultValues },
        {
          ..._.pick(meta, VIDEO_METAKEYS),
          size: sizeOptions.length
            ? `${meta?.default_width || 720}x${meta?.default_height || 1280}`
            : 'custom',
          width: meta?.default_width || 720,
          height: meta?.default_height || 1280
        }
      ),
      meta: meta,
      sizeOptions: sizeOptions
    };
  };

  const updateParamsConfig = (values: {
    size: string;
    isOpenaiCompatible: boolean;
  }) => {
    // update config
    if (values.size === 'custom') {
      return [
        ...basicParamsConfig,
        ...CustomSizeConfig,
        ...(values.isOpenaiCompatible
          ? videoExtraConfig
          : videoAdvancedParamsConfig)
      ];
    }
    return [
      ...basicParamsConfig,
      ...(values.isOpenaiCompatible
        ? videoExtraConfig
        : videoAdvancedParamsConfig)
    ];
  };

  const updateCacheFormData = (values: Record<string, any>) => {
    _.merge(cacheFormData.current, values);
  };
  const handleToggleParamsStyle = () => {
    // update values
    let values: any = {};
    if (!isOpenaiCompatible) {
      values = _.pick(
        cacheFormData.current,
        _.keys({
          ...videoInitialValues,
          ...openaiCompatibleFieldsDefaultValus
        })
      );
    } else {
      values = _.pick(
        cacheFormData.current,
        _.keys({
          ...videoInitialValues,
          ...videoAdvancedDefaultValues
        })
      );
    }

    // update config
    const newParamsConfig = updateParamsConfig({
      size: values.size,
      isOpenaiCompatible: !isOpenaiCompatible
    });
    form.current?.form?.setFieldsValue({
      ...values,
      model: parameters.model
    });
    setParamsConfig(newParamsConfig);
    setParams({
      ...values,
      model: parameters.model
    });
    setIsOpenaiCompatible(!isOpenaiCompatible);
    updateCacheFormData({
      ...values,
      model: parameters
    });
  };

  const formFields = useMemo(() => {
    const fields = paramsConfig?.map((item) => item.name);
    return fields?.join(',');
  }, [paramsConfig]);

  const handleOnModelChange = useMemoizedFn((val: string) => {
    if (!val) return;
    const model = modelList.find((item) => item.value === val);
    const { form: initialData, sizeOptions } = extractIMGMeta(model?.meta);
    const newParamsConfig = generateParamsConfig(model, sizeOptions);

    if (!isOpenaiCompatible) {
      setParamsConfig([...newParamsConfig, ...videoAdvancedParamsConfig]);
    } else {
      setParamsConfig(newParamsConfig);
    }
    setBasicParamsConfig(newParamsConfig);
    setVideoSizeOptions(sizeOptions);
    setModelMeta(model?.meta || {});
    setInitialValues({
      ...initialData,
      seed: parameters.seed,
      model: val
    });
    setParams({
      ...initialData,
      seed: parameters.seed,
      model: val
    });
    updateCacheFormData(initialData);
  });

  const handleOnValuesChange = useMemoizedFn(
    (changeValues: Record<string, any>, allValues: Record<string, any>) => {
      console.log('changeValues', changeValues);
      // model change will reset all values
      if (changeValues.model) {
        handleOnModelChange(changeValues.model);
        return;
      }

      if (changeValues.size && changeValues.size === 'custom') {
        setParamsConfig([
          ...basicParamsConfig,
          ...CustomSizeConfig,
          ...(!isOpenaiCompatible
            ? videoAdvancedParamsConfig
            : videoExtraConfig)
        ]);
        setParams({
          ...allValues,
          width: modelMeta.default_width || 720,
          height: modelMeta.default_height || 1280
        });
        form.current?.form?.setFieldsValue({
          width: modelMeta.default_width || 720,
          height: modelMeta.default_height || 1280
        });
        updateCacheFormData(changeValues);
      } else if (changeValues.size && parameters.size === 'custom') {
        setParamsConfig([
          ...basicParamsConfig,
          ...(!isOpenaiCompatible
            ? videoAdvancedParamsConfig
            : videoExtraConfig)
        ]);
        setParams(allValues);
        updateCacheFormData(changeValues);
      } else if (_.isBoolean(changeValues.random_seed)) {
        const seed = changeValues.random_seed
          ? generateRandomNumber()
          : parameters.seed;

        setParams({
          ...allValues,
          seed: seed
        });
        form.current?.form?.setFieldsValue({
          seed: seed
        });
        updateCacheFormData(changeValues);
      } else {
        setParams(allValues);
        updateCacheFormData(changeValues);
      }
    }
  );

  useEffect(() => {
    if (defaultModel && modelList.length) {
      handleOnModelChange(defaultModel);
    }
  }, [defaultModel, modelList.length]);

  return {
    extractIMGMeta,
    generateParamsConfig,
    setVideoSizeOptions,
    setBasicParamsConfig,
    updateCacheFormData,
    handleOnValuesChange,
    handleToggleParamsStyle,
    setParams,
    setInitialValues,
    updateParamsConfig,
    setParamsConfig,
    form,
    modelMeta,
    formFields,
    paramsConfig,
    initialValues,
    parameters,
    isOpenaiCompatible,
    cacheFormData,
    basicParamsConfig,
    videoSizeOptions,
    openaiCompatibleFieldsDefaultValus,
    videoAdvancedDefaultValues,
    videoAdvancedParamsConfig,
    videoInitialValues,
    CustomSizeConfig,
    videoExtraConfig
  };
};
