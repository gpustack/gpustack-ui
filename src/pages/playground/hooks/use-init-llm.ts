import { useSearchParams } from '@umijs/max';
import { useMemoizedFn } from 'ahooks';
import _ from 'lodash';
import { useEffect, useRef, useState } from 'react';
import { ParamsSchema } from '../config/types';
import { precisionTwoKeys } from './config';

interface MessageProps {
  modelList: Global.BaseOption<string>[];
  model?: string;
  loaded?: boolean;
  isChat?: boolean;
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
  const { modelList, model, isChat } = props;
  const {
    metaKeys = {},
    defaultValues = {},
    defaultParamsConfig = []
  } = options;
  const formRef = useRef<any>(null);
  const [searchParams] = useSearchParams();
  const [modelMeta, setModelMeta] = useState<any>({});
  const [parameters, setParams] = useState<any>({
    model: ''
  });
  const [paramsConfig, setParamsConfig] =
    useState<ParamsSchema[]>(defaultParamsConfig);
  const initializedRef = useRef(false);

  const getMaxTokens = (meta: any) => {
    const { max_model_len, n_ctx, n_slot, max_total_tokens } = meta || {};

    let max_tokens: number = 0;

    if (n_ctx && n_slot) {
      max_tokens = _.floor(_.divide(n_ctx, n_slot));
    } else if (max_model_len) {
      max_tokens = max_model_len;
    } else if (max_total_tokens) {
      max_tokens = max_total_tokens;
    }

    return {
      max_tokens: max_tokens || 16 * 1024,
      defaultFormValue: max_tokens ? _.floor(_.divide(max_tokens, 2)) : 1024
    };
  };

  const extractLLMMeta = (meta: any) => {
    const towKeys = new Set(precisionTwoKeys);
    const modelMeta = meta || {};
    const modelMetaValue = _.pick(modelMeta, _.keys(metaKeys));
    const obj = Object.entries(metaKeys).reduce((acc: any, [key, value]) => {
      const val = modelMetaValue[key];
      if (_.hasIn(modelMetaValue, key)) {
        acc[value] = towKeys.has(key) ? _.round(val, 2) : val;
      }
      return acc;
    }, {});

    const tokensRes = getMaxTokens(obj);

    return {
      form: _.merge({}, defaultValues, {
        ..._.omit(obj, [
          'n_ctx',
          'n_slot',
          'max_model_len',
          'max_total_tokens'
        ]),
        seed: obj.seed === -1 ? null : obj.seed,
        max_tokens: tokensRes.defaultFormValue
      }),
      meta: {
        ...obj,
        max_tokens: tokensRes.max_tokens
      }
    };
  };

  const setFormValues = (values: Record<string, any>) => {
    formRef.current?.setFieldsValue(values);
  };

  const handleOnModelChange = useMemoizedFn((val: string) => {
    if (!val) return;
    const model = modelList.find((item) => item.value === val);
    const { form: initialData, meta } = extractLLMMeta(model?.meta);
    setModelMeta(meta);
    setFormValues({
      ...initialData,
      model: val
    });
    setParams({
      ...initialData,
      model: val
    });

    // update max_tokens in paramsConfig when model change, because max_tokens value depend on model meta
    const hasMaxTokensField = defaultParamsConfig.some(
      (item) => item.name === 'max_tokens'
    );

    if (!hasMaxTokensField) {
      const config = defaultParamsConfig.map((item) => {
        return {
          ...item,
          attrs:
            item.name === 'max_tokens'
              ? { ...item.attrs, max: meta.max_tokens }
              : {
                  ...item.attrs
                }
        };
      });
      setParamsConfig(config);
    }
  });

  const handleOnValuesChange = useMemoizedFn(
    (changeValues: Record<string, any>, allValues: Record<string, any>) => {
      if (changeValues.model) {
        return;
      }
      setParams(allValues);
      setFormValues(allValues);
    }
  );

  useEffect(() => {
    if (initializedRef.current || !modelList.length) {
      return;
    }
    let defaultModel = model;
    if (isChat) {
      defaultModel =
        searchParams.get('model') || model || modelList?.[0]?.value;
    }

    if (defaultModel && modelList.length && !initializedRef.current) {
      handleOnModelChange(defaultModel);
      initializedRef.current = true;
    }
  }, [modelList, isChat, model]);

  return {
    extractLLMMeta,
    handleOnModelChange,
    handleOnValuesChange,
    setModelMeta,
    setParams,
    setParamsConfig,
    paramsConfig,
    formRef,
    parameters,
    modelMeta
  };
};
