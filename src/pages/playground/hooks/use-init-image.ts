import {
  CustomSizeConfig,
  ImageCountConfig,
  ImageSizeConfig,
  SizeOption,
  imageSizeOptions as imageSizeList
} from '@/pages/playground/config/params-config';
import { generateRandomNumber } from '@/utils';
import { useSearchParams } from '@umijs/max';
import { useMemoizedFn } from 'ahooks';
import _ from 'lodash';
import React, { useEffect, useRef, useState } from 'react';
import { ParamsSchema } from '../config/types';
import {
  IMG_METAKEYS,
  advancedFieldsDefaultValus,
  imgInitialValues
} from './config';

interface MessageProps {
  modelList: Global.BaseOption<string>[];
  model?: string;
  loaded?: boolean;
  isChat?: boolean;
  ref?: any;
}

export const useInitImageMeta = (
  props: MessageProps,
  options: { type: string }
) => {
  const { modelList, model } = props;

  const form = useRef<any>(null);
  const [searchParams] = useSearchParams();
  const [modelMeta, setModelMeta] = useState<any>({});
  const [imageSizeOptions, setImageSizeOptions] = React.useState<SizeOption[]>(
    []
  );
  const [basicParamsConfig, setBasicParamsConfig] = React.useState<
    ParamsSchema[]
  >([...ImageCountConfig, ...ImageSizeConfig]);
  const initialSeed = generateRandomNumber();

  const [initialValues, setInitialValues] = useState<any>({
    ...imgInitialValues,
    ...advancedFieldsDefaultValus,
    seed: initialSeed,
    model: ''
  });
  const [paramsConfig, setParamsConfig] = useState<ParamsSchema[]>([
    ...ImageCountConfig,
    ...ImageSizeConfig
  ]);

  const [parameters, setParams] = useState<any>({
    ...imgInitialValues,
    ...advancedFieldsDefaultValus,
    seed: initialSeed,
    model: ''
  });

  const defaultModel =
    model ?? (searchParams.get('model') || modelList?.[0]?.value || '');

  const ensureSizeOption = (
    options: SizeOption[],
    width?: number,
    height?: number
  ) => {
    if (
      width &&
      height &&
      !options.find((item) => item.width === width && item.height === height)
    ) {
      options.push({
        width,
        height,
        label: `${width}x${height}`,
        value: `${width}x${height}`
      });
    }
  };

  const getNewImageSizeOptions = (metaData: any) => {
    const { max_height, max_width, default_width, default_height } =
      metaData || {};
    if (!max_height && !max_width) {
      const newImageSizeOptions = [...imageSizeList];
      ensureSizeOption(newImageSizeOptions, default_width, default_height);
      return newImageSizeOptions;
    }
    const newImageSizeOptions = imageSizeList.filter((item) => {
      return (
        ((!max_width || item.width <= max_width) &&
          (!max_height || item.height <= max_height)) ||
        item.value === 'custom'
      );
    });
    ensureSizeOption(newImageSizeOptions, max_width, max_height);
    ensureSizeOption(newImageSizeOptions, default_width, default_height);
    return newImageSizeOptions;
  };

  const generateImageParamsConfig = (
    currentModel: any,
    sizeOptions: SizeOption[]
  ) => {
    if (sizeOptions.length) {
      const sizeConfig = ImageSizeConfig.map((item) => {
        if (item.name === 'size') {
          return {
            ...item,
            options: sizeOptions
          };
        }
        return item;
      });
      return [...ImageCountConfig, ...sizeConfig];
    }
    const { max_height, max_width } = currentModel.meta || {};
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
    return [...ImageCountConfig, ...customSizeConfig];
  };

  const extractIMGMeta = (meta: any) => {
    const sizeOptions = getNewImageSizeOptions(meta);
    return {
      form: _.merge(
        {},
        { ...imgInitialValues, ...advancedFieldsDefaultValus },
        {
          ..._.pick(meta, IMG_METAKEYS),
          seed: meta?.seed === -1 ? null : meta?.seed,
          size: sizeOptions.length
            ? `${meta?.default_width || 512}x${meta?.default_height || 512}`
            : 'custom',
          width: meta?.default_width || 512,
          height: meta?.default_height || 512
        }
      ),
      meta: meta,
      sizeOptions: sizeOptions
    };
  };

  const updateParamsConfig = (values: { size: string }) => {
    if (values.size === 'custom') {
      return [
        ...basicParamsConfig,
        ...CustomSizeConfig.map((field) => ({
          ...field,
          attrs: {
            ...field.attrs,
            max:
              modelMeta[`max_${field.name}`] ||
              Math.max(1024, modelMeta[`default_${field.name}`] || 0)
          }
        }))
      ];
    }
    return [...basicParamsConfig];
  };

  const applyParameters = (values: Record<string, any>) => {
    const next = { ...parameters, ...values, model: parameters.model };
    setParamsConfig(updateParamsConfig(next));
    setParams(next);
    setInitialValues(next);
    form.current?.form?.setFieldsValue(next);
  };

  const handleOnModelChange = useMemoizedFn((val: string) => {
    if (!val) return;
    const model = modelList.find((item) => item.value === val);
    const { form: initialData, sizeOptions } = extractIMGMeta(model?.meta);
    const newParamsConfig = generateImageParamsConfig(model, sizeOptions);

    setParamsConfig(newParamsConfig);
    setBasicParamsConfig(newParamsConfig);
    setImageSizeOptions(sizeOptions);
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
        setParamsConfig(updateParamsConfig({ size: 'custom' }));
        setParams({
          ...allValues,
          width: modelMeta.default_width || 512,
          height: modelMeta.default_height || 512
        });
        form.current?.form?.setFieldsValue({
          width: modelMeta.default_width || 512,
          height: modelMeta.default_height || 512
        });
      } else if (changeValues.size && parameters.size === 'custom') {
        setParamsConfig([...basicParamsConfig]);
        setParams(allValues);
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
      } else {
        setParams(allValues);
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
    generateImageParamsConfig,
    setImageSizeOptions,
    setBasicParamsConfig,
    handleOnValuesChange,
    handleOnModelChange,
    applyParameters,
    setParams,
    setInitialValues,
    updateParamsConfig,
    setParamsConfig,
    form,
    modelMeta,
    paramsConfig,
    initialValues,
    parameters,
    basicParamsConfig,
    imageSizeOptions,
    advancedFieldsDefaultValus,
    imgInitialValues,
    ImageCountConfig,
    ImageSizeConfig,
    CustomSizeConfig
  };
};
