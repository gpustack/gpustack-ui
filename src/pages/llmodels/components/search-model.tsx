import { BulbOutlined } from '@ant-design/icons';
import { useIntl } from '@umijs/max';
import { Button, Input, Select } from 'antd';
import _ from 'lodash';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { queryHuggingfaceModels } from '../apis';
import { ModelSortType, modelSourceMap, ollamaModelOptions } from '../config';
import SearchStyle from '../style/search-result.less';
import SearchInput from './search-input';
import SearchResult from './search-result';

interface SearchInputProps {
  modelSource: string;
  setLoadingModel?: (flag: boolean) => void;
  onSourceChange?: (source: string) => void;
  onSelectModel: (model: any) => void;
}

const SearchModel: React.FC<SearchInputProps> = (props) => {
  console.log('SearchModel======');
  const intl = useIntl();
  const { modelSource, setLoadingModel, onSourceChange, onSelectModel } = props;
  const [dataSource, setDataSource] = useState<{
    repoOptions: any[];
    loading: boolean;
    networkError: boolean;
    sortType: string;
  }>({
    repoOptions: [],
    loading: false,
    networkError: false,
    sortType: ModelSortType.trendingScore
  });
  const [current, setCurrent] = useState<string>('');
  const cacheRepoOptions = useRef<any[]>([]);
  const axiosTokenRef = useRef<any>(null);
  const customOllamaModelRef = useRef<any>(null);
  const searchInputRef = useRef<any>('');
  const modelFilesSortOptions = useRef<any[]>([
    {
      label: intl.formatMessage({ id: 'models.sort.trending' }),
      value: ModelSortType.trendingScore
    },
    {
      label: intl.formatMessage({ id: 'models.sort.likes' }),
      value: ModelSortType.likes
    },
    {
      label: intl.formatMessage({ id: 'models.sort.downloads' }),
      value: ModelSortType.downloads
    },
    {
      label: intl.formatMessage({ id: 'models.sort.updated' }),
      value: ModelSortType.lastModified
    }
  ]);

  const handleOnSelectModel = useCallback((item: any) => {
    onSelectModel(item);
    setCurrent(item.id);
  }, []);

  const handleOnSearchRepo = useCallback(
    async (sortType?: string) => {
      if (modelSource === modelSourceMap.ollama_library_value) {
        return;
      }
      axiosTokenRef.current?.abort?.();
      axiosTokenRef.current = new AbortController();
      if (dataSource.loading) return;
      const sort = sortType ?? dataSource.sortType;
      try {
        setDataSource((pre) => {
          pre.loading = true;
          return { ...pre };
        });
        setLoadingModel?.(true);
        cacheRepoOptions.current = [];
        const task: any = searchInputRef.current ? '' : 'text-generation';
        const params = {
          search: {
            query: searchInputRef.current || '',
            sort: sort,
            tags: ['gguf'],
            task
          }
        };
        const models = await queryHuggingfaceModels(params, {
          signal: axiosTokenRef.current.signal
        });
        let list = _.map(models || [], (item: any) => {
          return {
            ...item,
            value: item.name,
            label: item.name
          };
        });

        cacheRepoOptions.current = list;
        setDataSource({
          repoOptions: list,
          loading: false,
          networkError: false,
          sortType: sort
        });
        setLoadingModel?.(false);
        handleOnSelectModel(list[0]);
      } catch (error: any) {
        setDataSource({
          repoOptions: [],
          loading: false,
          sortType: sort,
          networkError: error?.message === 'Failed to fetch'
        });
        setLoadingModel?.(false);
        handleOnSelectModel({});
        cacheRepoOptions.current = [];
      }
    },
    [dataSource]
  );

  const handlerSearchModels = useCallback(
    async (e: any) => {
      searchInputRef.current = e.target.value;
      handleOnSearchRepo();
    },
    [handleOnSearchRepo]
  );

  const handleOnOpen = () => {
    if (
      !dataSource.repoOptions.length &&
      !cacheRepoOptions.current.length &&
      modelSource === modelSourceMap.huggingface_value
    ) {
      handleOnSearchRepo();
    }
    if (modelSourceMap.ollama_library_value === modelSource) {
      setDataSource({
        repoOptions: ollamaModelOptions,
        loading: false,
        networkError: false,
        sortType: dataSource.sortType
      });
      cacheRepoOptions.current = ollamaModelOptions;
      handleOnSelectModel(ollamaModelOptions[0]);
    }
  };

  const handleFilterModels = (e: any) => {
    const text = e.target.value;
    const list = _.filter(cacheRepoOptions.current, (item: any) => {
      return item.name.includes(text);
    });
    setDataSource({
      repoOptions: list,
      loading: false,
      networkError: false,
      sortType: dataSource.sortType
    });
  };

  const debounceFilter = _.debounce((e: any) => {
    handleFilterModels(e);
  }, 300);

  const handleSourceChange = (source: string) => {
    axiosTokenRef.current?.abort?.();
    onSourceChange?.(source);
    setDataSource({
      repoOptions: [],
      loading: false,
      networkError: false,
      sortType: dataSource.sortType
    });
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
    handleOnSearchRepo(value || '');
  };

  const renderHFSearch = () => {
    return (
      <>
        <SearchInput onSearch={handlerSearchModels}></SearchInput>
        <div className={SearchStyle.filter}>
          <span>
            <span className="value">
              {intl.formatMessage(
                { id: 'models.search.result' },
                { count: dataSource.repoOptions.length }
              )}
            </span>
          </span>
          <Select
            allowClear
            value={dataSource.sortType}
            onChange={handleSortChange}
            labelRender={({ label }) => {
              return (
                <span>
                  {intl.formatMessage({ id: 'model.deploy.sort' })}: {label}
                </span>
              );
            }}
            options={modelFilesSortOptions.current}
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
    console.log('SearchModel useEffect', modelSource);
  }, [modelSource]);

  useEffect(() => {
    return () => {
      axiosTokenRef.current?.abort?.();
    };
  }, []);

  return (
    <div style={{ flex: 1 }}>
      <div className={SearchStyle['search-bar']}>
        {modelSource === modelSourceMap.huggingface_value ? (
          renderHFSearch()
        ) : (
          <div style={{ lineHeight: '18px' }}>
            <BulbOutlined className="font-size-14 m-r-5" />
            {intl.formatMessage(
              { id: 'model.form.ollamatips' },
              { name: intl.formatMessage({ id: 'model.form.ollama.model' }) }
            )}
          </div>
        )}
      </div>
      {
        <SearchResult
          loading={dataSource.loading}
          resultList={dataSource.repoOptions}
          networkError={dataSource.networkError}
          current={current}
          source={modelSource}
          onSelect={handleOnSelectModel}
        ></SearchResult>
      }
    </div>
  );
};

export default React.memo(SearchModel);
