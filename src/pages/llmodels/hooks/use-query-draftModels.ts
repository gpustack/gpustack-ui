import { useIntl } from '@umijs/max';
import { useRequest } from 'ahooks';
import _ from 'lodash';
import { useEffect, useRef, useState } from 'react';
import {
  queryDraftModelList,
  queryHuggingfaceModels,
  queryModelScopeModels
} from '../apis';
import { modelSourceMap } from '../config';

export default function useQueryDraftModels({ source }: { source: string }) {
  const intl = useIntl();
  const presetDraftModelListRef = useRef<Global.BaseOptionGroup<string>[]>([]);
  const axiosTokenRef = useRef<AbortController | null>(null);
  const [loading, setLoading] = useState(false);
  const [draftModelList, setDraftModelList] = useState<
    Global.BaseOptionGroup<string>[]
  >([]);

  const fetchDraftModels = async () => {
    const response = await queryDraftModelList({
      page: -1
    });
    const options = response.items.map((item) => ({
      label: item.name,
      value: item.name
    }));
    presetDraftModelListRef.current = options;
    setDraftModelList(options);
  };

  const generateSourceLabel = (source: string) => {
    let label = '';
    const sourceLabel = intl.formatMessage({ id: 'models.form.source' });
    if (source === modelSourceMap.huggingface_value) {
      label = `${sourceLabel}: Hugging Face`;
    }

    if (source === modelSourceMap.modelscope_value) {
      label = `${sourceLabel}: ModelScope`;
    }

    if (source === 'catalog') {
      label = `${sourceLabel}: ${intl.formatMessage({ id: 'menu.models.modelCatalog' })}`;
    }

    return {
      label: label
    };
  };

  const getHuggingfaceModels = async (query: string) => {
    if (axiosTokenRef.current) {
      axiosTokenRef.current.abort();
    }
    axiosTokenRef.current = new AbortController();
    try {
      const params = {
        limit: 10,
        search: {
          query: query
        }
      };
      setLoading(true);
      const data = await queryHuggingfaceModels(params, {
        signal: axiosTokenRef.current.signal
      });
      const list = _.map(data || [], (item: any) => {
        return {
          value: item.name,
          label: item.name
        };
      });

      const catalogModelList =
        presetDraftModelListRef.current.length > 0
          ? [
              {
                ...generateSourceLabel('catalog'),
                options: presetDraftModelListRef.current || []
              }
            ]
          : [];

      setDraftModelList([
        ...catalogModelList,
        {
          ...generateSourceLabel(modelSourceMap.huggingface_value),
          options: list
        }
      ]);
    } catch (error) {
      setDraftModelList(presetDraftModelListRef.current);
    } finally {
      setLoading(false);
    }
  };

  const getModelScopeModels = async (query: string) => {
    if (axiosTokenRef.current) {
      axiosTokenRef.current.abort();
    }
    axiosTokenRef.current = new AbortController();
    try {
      const params = {
        Name: query,
        PageSize: 10,
        PageNumber: 1,
        tasks: []
      };
      setLoading(true);
      const data = await queryModelScopeModels(params, {
        signal: axiosTokenRef.current.signal
      });

      const list = _.map(
        _.get(data, 'Data.Model.Models') || [],
        (item: any) => {
          return {
            label: `${item.Path}/${item.Name}`,
            value: `${item.Path}/${item.Name}`
          };
        }
      );

      const catalogModelList =
        presetDraftModelListRef.current.length > 0
          ? [
              {
                ...generateSourceLabel('catalog'),
                options: presetDraftModelListRef.current || []
              }
            ]
          : [];

      setDraftModelList([
        ...catalogModelList,
        {
          ...generateSourceLabel(modelSourceMap.modelscope_value),
          options: list
        }
      ]);
    } catch (error) {
      setDraftModelList(presetDraftModelListRef.current);
    } finally {
      setLoading(false);
    }
  };

  // local path starts with /
  const handleOnSearch = async (value: string) => {
    if (!value || value?.trim?.().startsWith('/') || !source) {
      setDraftModelList(presetDraftModelListRef.current);
      return;
    }
    if (source === modelSourceMap.huggingface_value) {
      await getHuggingfaceModels(value);
    } else if (source === modelSourceMap.modelscope_value) {
      await getModelScopeModels(value);
    }
  };

  const { run: onSearch, cancel: cancelSearch } = useRequest(
    (value: string) => handleOnSearch(value),
    {
      manual: true,
      debounceWait: 300
    }
  );

  const resetDraftModels = () => {
    setDraftModelList(presetDraftModelListRef.current);
  };

  useEffect(() => {
    fetchDraftModels();
    return () => {
      if (axiosTokenRef.current) {
        axiosTokenRef.current.abort();
      }
      cancelSearch();
    };
  }, []);

  return {
    draftModelList,
    loading,
    fetchDraftModels,
    onSearch,
    resetDraftModels
  };
}
