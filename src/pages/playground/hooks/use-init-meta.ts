import useOverlayScroller from '@/hooks/use-overlay-scroller';
import {
  ImageAdvancedParamsConfig,
  ImageCountConfig,
  ImageCustomSizeConfig,
  ImageSizeConfig,
  ImageSizeItem,
  ImageconstExtraConfig,
  imageSizeOptions as imageSizeList
} from '@/pages/playground/config/params-config';
import { useSearchParams } from '@umijs/max';
import { Form } from 'antd';
import _ from 'lodash';
import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState
} from 'react';
import { ParamsSchema } from '../config/types';
import {
  IMG_METAKEYS,
  advancedFieldsDefaultValus,
  imgInitialValues,
  openaiCompatibleFieldsDefaultValus
} from './config';

interface MessageProps {
  modelList: Global.BaseOption<string>[];
  loaded?: boolean;
  ref?: any;
}

interface InitMetaOptions {
  metaKeys?: Record<string, any> | string[];
  defaultValues?: Record<string, any>;
  defaultParamsConfig?: ParamsSchema[];
}

// init not image meta, for params form
export const useInitLLmMeta = (
  props: MessageProps,
  options: InitMetaOptions
) => {
  const { modelList } = props;
  const {
    metaKeys = {},
    defaultValues = {},
    defaultParamsConfig = []
  } = options;
  const formRef = useRef<any>(null);
  const [searchParams] = useSearchParams();
  const defaultModel = searchParams.get('model') || modelList?.[0]?.value || '';
  const [modelMeta, setModelMeta] = useState<any>({});
  const [initialValues, setInitialValues] = useState<any>({
    ...defaultValues,
    model: defaultModel
  });
  const [parameters, setParams] = useState<any>({
    model: defaultModel
  });
  const [paramsConfig, setParamsConfig] =
    useState<ParamsSchema[]>(defaultParamsConfig);
  const paramsRef = useRef<any>(null);

  const { initialize: innitializeParams } = useOverlayScroller();

  const extractLLMMeta = (meta: any) => {
    const modelMeta = meta || {};
    const modelMetaValue = _.pick(modelMeta, _.keys(metaKeys));
    const obj = Object.entries(metaKeys).reduce((acc: any, [key, value]) => {
      const val = modelMetaValue[key];
      if (val && _.hasIn(modelMetaValue, key)) {
        acc[value] = val;
      }
      return acc;
    }, {});

    let defaultMaxTokens = 1024;

    if (obj.n_ctx && obj.n_slot) {
      defaultMaxTokens = _.divide(obj.n_ctx / 2, obj.n_slot);
    } else if (obj.max_model_len) {
      defaultMaxTokens = obj.max_model_len / 2;
    }

    return {
      form: _.merge({}, defaultValues, {
        ..._.omit(obj, ['n_ctx', 'n_slot', 'max_model_len']),
        seed: obj.seed === -1 ? null : obj.seed,
        max_tokens: defaultMaxTokens
      }),
      meta: {
        ...obj,
        max_tokens: obj.max_model_len || _.divide(obj.n_ctx, obj.n_slot)
      }
    };
  };

  const formFields = useMemo(() => {
    const fields = paramsConfig?.map((item) => item.name);
    return fields?.join(',');
  }, [paramsConfig]);

  const handleOnValuesChange = useCallback(
    (changeValues: Record<string, any>, allValues: Record<string, any>) => {
      setParams(allValues);
    },
    []
  );

  const handleOnModelChange = useCallback(
    (val: string) => {
      if (!val) return;
      const model = modelList.find((item) => item.value === val);
      const { form: initialData, meta } = extractLLMMeta(model?.meta);
      setModelMeta(meta || {});
      setInitialValues({
        ...initialData,
        model: val
      });
      setParams({
        ...initialData,
        model: val
      });
    },
    [modelList]
  );

  useEffect(() => {
    if (defaultModel) {
      handleOnModelChange(defaultModel);
    }
  }, [defaultModel, handleOnModelChange]);

  useEffect(() => {
    if (paramsRef.current) {
      innitializeParams(paramsRef.current);
    }
  }, [paramsRef.current, innitializeParams]);

  return {
    extractLLMMeta,
    handleOnModelChange,
    handleOnValuesChange,
    setModelMeta,
    setInitialValues,
    setParams,
    setParamsConfig,
    formRef,
    paramsConfig,
    initialValues,
    parameters,
    modelMeta,
    paramsRef,
    formFields
  };
};

export const useInitImageMeta = (props: MessageProps) => {
  const { modelList } = props;
  const form = useRef<any>(null);
  const [searchParams] = useSearchParams();
  const defaultModel = searchParams.get('model') || modelList?.[0]?.value || '';
  const [modelMeta, setModelMeta] = useState<any>({});
  const [isOpenaiCompatible, setIsOpenaiCompatible] = useState<boolean>(false);
  const [imageSizeOptions, setImageSizeOptions] = React.useState<
    ImageSizeItem[]
  >([]);
  const [basicParamsConfig, setBasicParamsConfig] = React.useState<
    ParamsSchema[]
  >([...ImageCountConfig, ...ImageSizeConfig]);

  const [initialValues, setInitialValues] = useState<any>({
    ...imgInitialValues,
    ...advancedFieldsDefaultValus,
    model: defaultModel
  });
  const [paramsConfig, setParamsConfig] = useState<ParamsSchema[]>([
    ...ImageCountConfig,
    ...ImageSizeConfig,
    ...ImageAdvancedParamsConfig
  ]);

  const [parameters, setParams] = useState<any>({
    ...imgInitialValues,
    ...advancedFieldsDefaultValus,
    model: defaultModel
  });

  const cacheFormData = React.useRef<Record<string, any>>({
    ...imgInitialValues,
    ...openaiCompatibleFieldsDefaultValus,
    ...advancedFieldsDefaultValus
  });
  const randomSeed = Form.useWatch('random_seed', form.current?.form);

  const watchFields = useMemo(() => {
    return ['random_seed'];
  }, [randomSeed]);

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
    sizeOptions: ImageSizeItem[]
  ) => {
    if (sizeOptions.length) {
      const sizeConfig = ImageSizeConfig.map((item) => {
        return {
          ...item,
          options: sizeOptions
        };
      });
      return [...ImageCountConfig, ...sizeConfig];
    }
    const { max_height, max_width } = currentModel.meta || {};
    const customSizeConfig = _.cloneDeep(ImageCustomSizeConfig).map(
      (item: any) => {
        const max = item.name === 'height' ? max_height : max_width;
        return {
          ...item,
          attrs: {
            ...item.attrs,
            max: max || item.attrs.max
          }
        };
      }
    );
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
    if (values.size === 'custom') {
      const config = [
        ...basicParamsConfig,
        ...ImageCustomSizeConfig,
        ...(isOpenaiCompatible
          ? ImageAdvancedParamsConfig
          : ImageconstExtraConfig)
      ];
      setParamsConfig(config);
    } else {
      const config = [
        ...basicParamsConfig,
        ...(isOpenaiCompatible
          ? ImageAdvancedParamsConfig
          : ImageconstExtraConfig)
      ];
      setParamsConfig(config);
    }
    form.current?.form?.setFieldsValue({
      ...values,
      model: parameters.model
    });
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

  const handleOnModelChange = useCallback(
    (val: string) => {
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
        model: val
      });
      setParams({
        ...initialData,
        model: val
      });
      updateCacheFormData(initialData);
    },
    [modelList, isOpenaiCompatible]
  );

  const handleOnValuesChange = useCallback(
    (changeValues: Record<string, any>, allValues: Record<string, any>) => {
      // model change will reset all values
      if (changeValues.model) {
        handleOnModelChange(changeValues.model);
        return;
      }

      if (changeValues.size && changeValues.size === 'custom') {
        setParamsConfig([
          ...basicParamsConfig,
          ...ImageCustomSizeConfig,
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
      } else {
        setParams(allValues);
        updateCacheFormData(changeValues);
      }
    },
    [
      handleOnModelChange,
      parameters.size,
      basicParamsConfig,
      isOpenaiCompatible
    ]
  );

  useEffect(() => {
    if (defaultModel) {
      handleOnModelChange(defaultModel);
    }
  }, [defaultModel, handleOnModelChange]);

  return {
    extractIMGMeta,
    generateImageParamsConfig,
    setImageSizeOptions,
    setBasicParamsConfig,
    updateCacheFormData,
    handleOnValuesChange,
    handleToggleParamsStyle,
    setParams,
    form,
    watchFields,
    paramsConfig,
    initialValues,
    parameters,
    isOpenaiCompatible,
    cacheFormData,
    basicParamsConfig,
    imageSizeOptions,
    openaiCompatibleFieldsDefaultValus,
    advancedFieldsDefaultValus,
    ImageAdvancedParamsConfig,
    imgInitialValues,
    ImageCountConfig,
    ImageSizeConfig,
    ImageCustomSizeConfig,
    ImageconstExtraConfig
  };
};
