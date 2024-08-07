import IconFont from '@/components/icon-font';
import { useIntl } from '@umijs/max';
import { Button, Input, Select } from 'antd';
import _ from 'lodash';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { queryHuggingfaceModels } from '../apis';
import {
  modelFilesSortOptions,
  modelSourceMap,
  ollamaModelOptions
} from '../config';
import SearchStyle from '../style/search-result.less';
import SearchInput from './search-input';
import SearchResult from './search-result';

interface SearchInputProps {
  modelSource: string;
  onSourceChange?: (source: string) => void;
  onSelectModel: (model: any) => void;
}

const sourceList = [
  {
    label: (
      <IconFont type="icon-huggingface" className="font-size-14"></IconFont>
    ),
    value: 'huggingface',
    key: 'huggingface'
  },
  {
    label: <IconFont type="icon-ollama" className="font-size-14"></IconFont>,
    value: 'ollama_library',
    key: 'ollama_library'
  }
];

const SearchModel: React.FC<SearchInputProps> = (props) => {
  const intl = useIntl();
  const { modelSource, onSourceChange, onSelectModel } = props;
  const [repoOptions, setRepoOptions] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [current, setCurrent] = useState<string>('');
  const [sortType, setSortType] = useState<string>('downloads');
  const cacheRepoOptions = useRef<any[]>([]);
  const axiosTokenRef = useRef<any>(null);
  const customOllamaModelRef = useRef<any>(null);

  const handleOnSelectModel = (item: any) => {
    onSelectModel(item);
    setCurrent(item.id);
  };

  const handleOnSearchRepo = async (text: string) => {
    axiosTokenRef.current?.abort?.();
    axiosTokenRef.current = new AbortController();
    if (loading) return;
    try {
      setLoading(true);
      cacheRepoOptions.current = [];
      const params = {
        search: {
          query: text,
          tags: ['gguf']
        }
      };
      const models = await queryHuggingfaceModels(params, {
        signal: axiosTokenRef.current.signal
      });
      const list = _.map(models || [], (item: any) => {
        return {
          ...item,
          value: item.name,
          label: item.name
        };
      });
      const sortedList = _.sortBy(
        list,
        (item: any) => item[sortType]
      ).reverse();
      cacheRepoOptions.current = sortedList;
      setRepoOptions(sortedList);
      handleOnSelectModel(sortedList[0]);
    } catch (error) {
      setRepoOptions([]);
      handleOnSelectModel({});
      cacheRepoOptions.current = [];
    } finally {
      setLoading(false);
    }
  };

  const handlerSearchModels = useCallback(async (e: any) => {
    const text = e.target.value;
    handleOnSearchRepo(text);
  }, []);

  const handleOnOpen = () => {
    if (
      !repoOptions.length &&
      !cacheRepoOptions.current.length &&
      modelSource === modelSourceMap.huggingface_value
    ) {
      handleOnSearchRepo('');
    }
    if (modelSourceMap.ollama_library_value === modelSource) {
      setRepoOptions(ollamaModelOptions);
      cacheRepoOptions.current = ollamaModelOptions;
      handleOnSelectModel(ollamaModelOptions[0]);
    }
  };

  const handleFilterModels = (e: any) => {
    const text = e.target.value;
    const list = _.filter(cacheRepoOptions.current, (item: any) => {
      return item.name.includes(text);
    });
    setRepoOptions(list);
  };

  const debounceFilter = _.debounce((e: any) => {
    handleFilterModels(e);
  }, 300);

  const handleSourceChange = (source: string) => {
    axiosTokenRef.current?.abort?.();
    onSourceChange?.(source);
    setRepoOptions([]);
    cacheRepoOptions.current = [];
  };

  const handleInputChange = (e: any) => {
    const value = e.target.value;
    customOllamaModelRef.current = value;
  };

  const handleConfirm = () => {
    const model = {
      label: customOllamaModelRef.current,
      value: customOllamaModelRef.current,
      name: customOllamaModelRef.current,
      id: ''
    };
    onSelectModel(model);
    setCurrent('');
  };

  const handleSortChange = (value: string) => {
    const sortedList = _.sortBy(
      repoOptions,
      (item: any) => item[value]
    ).reverse();
    setSortType(value);
    setRepoOptions(sortedList);
  };

  const renderHFSearch = () => {
    return (
      <>
        <SearchInput onSearch={handlerSearchModels}></SearchInput>
        <div className={SearchStyle.filter}>
          <span>
            <span className="value">{repoOptions.length}</span>results
          </span>
          <Select
            value={sortType}
            onChange={handleSortChange}
            labelRender={({ label }) => {
              return <span>Sort: {label}</span>;
            }}
            options={modelFilesSortOptions}
            size="middle"
            style={{ width: '150px' }}
          ></Select>
        </div>
      </>
    );
  };

  const renderOllamaCustom = () => {
    return (
      <>
        <Input
          allowClear
          placeholder="Input ollama model name"
          onChange={handleInputChange}
        ></Input>
        <div className={SearchStyle.filter}>
          <Button type="primary" onClick={handleConfirm}>
            {intl.formatMessage({ id: 'common.button.confirm' })}
          </Button>
        </div>
      </>
    );
  };

  useEffect(() => {
    handleOnOpen();
    return () => {
      axiosTokenRef.current?.abort?.();
    };
  }, [modelSource]);

  return (
    <div style={{ flex: 1 }}>
      <div className={SearchStyle['search-bar']}>
        {/* <RadioButtons
          options={sourceList}
          value={modelSource}
          onChange={handleSourceChange}
        ></RadioButtons> */}
        {modelSource === modelSourceMap.huggingface_value ? (
          renderHFSearch()
        ) : (
          <div style={{ lineHeight: '18px' }}>
            {intl.formatMessage(
              { id: 'model.form.ollamatips' },
              { name: intl.formatMessage({ id: 'model.form.ollama.model' }) }
            )}
          </div>
        )}
      </div>
      {
        <SearchResult
          loading={loading}
          resultList={repoOptions}
          current={current}
          source={modelSource}
          onSelect={handleOnSelectModel}
        ></SearchResult>
      }
    </div>
  );
};

export default React.memo(SearchModel);
