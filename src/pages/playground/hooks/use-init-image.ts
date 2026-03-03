import {
  CustomSizeConfig,
  ImageCountConfig,
  ImageSizeConfig,
  ImageconstExtraConfig,
  SizeOption,
  imageSizeOptions as imageSizeList
} from '@/pages/playground/config/params-config';
import { generateRandomNumber } from '@/utils';
import { useSearchParams } from '@umijs/max';
import { useMemoizedFn } from 'ahooks';
import _ from 'lodash';
import React, { useEffect, useMemo, useRef, useState } from 'react';
import { ParamsSchema } from '../config/types';
import {
  IMG_METAKEYS,
  advancedFieldsDefaultValus,
  imgInitialValues,
  openaiCompatibleFieldsDefaultValus
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
  const { modelList } = props;
  const ImageAdvancedParamsConfig: ParamsSchema[] = [];

  const form = useRef<any>(null);
  const [searchParams] = useSearchParams();
  const [modelMeta, setModelMeta] = useState<any>({});
  const [isOpenaiCompatible, setIsOpenaiCompatible] = useState<boolean>(false);
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
    ...ImageSizeConfig,
    ...ImageAdvancedParamsConfig
  ]);

  const [parameters, setParams] = useState<any>({
    ...imgInitialValues,
    ...advancedFieldsDefaultValus,
    seed: initialSeed,
    model: ''
  });

  const defaultModel = useMemo(() => {
    return searchParams.get('model') || modelList?.[0]?.value || '';
  }, [modelList]);

  const cacheFormData = React.useRef<Record<string, any>>({
    ...imgInitialValues,
    ...openaiCompatibleFieldsDefaultValus,
    ...advancedFieldsDefaultValus
  });

  const getNewImageSizeOptions = (metaData: any) => {
    const { max_height, max_width } = metaData || {};
    if (!max_height || !max_width) {
      return imageSizeList;
    }
    const newImageSizeOptions = imageSizeList.filter((item) => {
      return (
        (item.width <= max_width && item.height <= max_height) ||
        item.value === 'custom'
      );
    });
    if (
      !newImageSizeOptions.find(
        (item) => item.width === max_width && item.height === max_height
      )
    ) {
      newImageSizeOptions.push({
        width: max_width,
        height: max_height,
        label: `${max_width}x${max_height}`,
        value: `${max_width}x${max_height}`
      });
    }
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
          ? ImageconstExtraConfig
          : ImageAdvancedParamsConfig)
      ];
    }
    return [
      ...basicParamsConfig,
      ...(values.isOpenaiCompatible
        ? ImageconstExtraConfig
        : ImageAdvancedParamsConfig)
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
          ...imgInitialValues,
          ...openaiCompatibleFieldsDefaultValus
        })
      );
    } else {
      values = _.pick(
        cacheFormData.current,
        _.keys({
          ...imgInitialValues,
          ...advancedFieldsDefaultValus
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

  const handleOnModelChange = useMemoizedFn((val: string) => {
    if (!val) return;
    const model = modelList.find((item) => item.value === val);
    const { form: initialData, sizeOptions } = extractIMGMeta(model?.meta);
    const newParamsConfig = generateImageParamsConfig(model, sizeOptions);

    if (!isOpenaiCompatible) {
      setParamsConfig([...newParamsConfig, ...ImageAdvancedParamsConfig]);
    } else {
      setParamsConfig(newParamsConfig);
    }
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
            ? ImageAdvancedParamsConfig
            : ImageconstExtraConfig)
        ]);
        setParams({
          ...allValues,
          width: modelMeta.default_width || 512,
          height: modelMeta.default_height || 512
        });
        form.current?.form?.setFieldsValue({
          width: modelMeta.default_width || 512,
          height: modelMeta.default_height || 512
        });
        updateCacheFormData(changeValues);
      } else if (changeValues.size && parameters.size === 'custom') {
        setParamsConfig([
          ...basicParamsConfig,
          ...(!isOpenaiCompatible
            ? ImageAdvancedParamsConfig
            : ImageconstExtraConfig)
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
    generateImageParamsConfig,
    setImageSizeOptions,
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
    paramsConfig,
    initialValues,
    parameters,
    isOpenaiCompatible,
    cacheFormData,
    basicParamsConfig,
    imageSizeOptions,
    openaiCompatibleFieldsDefaultValus,
    advancedFieldsDefaultValus,
    imgInitialValues,
    ImageCountConfig,
    ImageSizeConfig,
    CustomSizeConfig,
    ImageconstExtraConfig
  };
};
