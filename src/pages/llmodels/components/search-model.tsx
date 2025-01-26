import { BulbOutlined, QuestionCircleOutlined } from '@ant-design/icons';
import { useIntl } from '@umijs/max';
import { Checkbox, Select, Tooltip } from 'antd';
import _ from 'lodash';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { queryHuggingfaceModels, queryModelScopeModels } from '../apis';
import {
  HuggingFaceTaskMap,
  ModelScopeSortType,
  ModelSortType,
  ModelscopeTaskMap,
  modelSourceMap,
  ollamaModelOptions
} from '../config';
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
  const intl = useIntl();

  const { modelSource, setLoadingModel, onSelectModel } = props;
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
  const SUPPORTEDSOURCE = [
    modelSourceMap.huggingface_value,
    modelSourceMap.modelscope_value
  ];
  const [current, setCurrent] = useState<string>('');
  const cacheRepoOptions = useRef<any[]>([]);
  const axiosTokenRef = useRef<any>(null);
  const searchInputRef = useRef<any>('');
  const filterGGUFRef = useRef<boolean | undefined>();
  const filterTaskRef = useRef<string>('');
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

  // huggeface
  const getModelsFromHuggingface = useCallback(async (sort: string) => {
    try {
      const task: any = searchInputRef.current ? '' : 'text-generation';
      const params = {
        search: {
          query: searchInputRef.current || '',
          sort: sort,
          tags: filterGGUFRef.current ? ['gguf'] : [],
          task: HuggingFaceTaskMap[filterTaskRef.current] || task
        }
      };
      const data = await queryHuggingfaceModels(params, {
        signal: axiosTokenRef.current.signal
      });
      let list = _.map(data || [], (item: any) => {
        return {
          ...item,
          value: item.name,
          label: item.name
        };
      });
      return list;
    } catch (error) {
      return [];
    }
  }, []);

  // modelscope
  const getModelsFromModelscope = useCallback(async (sort: string) => {
    try {
      const params = {
        Name: `${searchInputRef.current}`,
        tags: filterGGUFRef.current ? ['gguf'] : [],
        tasks: filterTaskRef.current
          ? ([ModelscopeTaskMap[filterTaskRef.current]] as string[])
          : [],
        SortBy: ModelScopeSortType[sort]
      };
      const data = await queryModelScopeModels(params, {
        signal: axiosTokenRef.current.signal
      });
      let list = _.map(_.get(data, 'Data.Model.Models') || [], (item: any) => {
        return {
          path: item.Path,
          name: `${item.Path}/${item.Name}`,
          downloads: item.Downloads,
          id: `${item.Path}/${item.Name}`,
          updatedAt: item.LastUpdatedTime * 1000,
          likes: item.Stars,
          value: item.Name,
          label: item.Name,
          revision: item.Revision,
          task: item.Tasks?.map((sItem: any) => sItem.Name).join(',')
        };
      });

      return list;
    } catch (error) {
      return [];
    }
  }, []);

  const handleOnSearchRepo = useCallback(
    async (sortType?: string) => {
      if (!SUPPORTEDSOURCE.includes(modelSource)) {
        return;
      }
      axiosTokenRef.current?.abort?.();
      axiosTokenRef.current = new AbortController();
      const sort = sortType ?? dataSource.sortType;
      try {
        setDataSource((pre) => {
          pre.loading = true;
          return { ...pre };
        });
        setLoadingModel?.(true);
        cacheRepoOptions.current = [];
        let list: any[] = [];
        if (modelSource === modelSourceMap.huggingface_value) {
          list = await getModelsFromHuggingface(sort);
        } else if (modelSource === modelSourceMap.modelscope_value) {
          list = await getModelsFromModelscope(sort);
        }
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
  const handleSearchInputChange = useCallback((e: any) => {
    searchInputRef.current = e.target.value;
    console.log('change:', searchInputRef.current);
  }, []);
  const handlerSearchModels = useCallback(
    async (e: any) => {
      setTimeout(() => {
        handleOnSearchRepo();
      }, 100);
    },
    [handleOnSearchRepo]
  );

  const handleOnOpen = () => {
    if (
      !dataSource.repoOptions.length &&
      !cacheRepoOptions.current.length &&
      SUPPORTEDSOURCE.includes(modelSource)
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

  const handleSortChange = (value: string) => {
    handleOnSearchRepo(value || '');
  };

  const handleFilterGGUFChange = (e: any) => {
    filterGGUFRef.current = e.target.checked;
    handleOnSearchRepo();
  };

  const handleFilterTaskChange = useCallback((value: string) => {
    filterTaskRef.current = value;
    handleOnSearchRepo();
  }, []);

  const renderHFSearch = () => {
    return (
      <>
        <SearchInput
          onSearch={handlerSearchModels}
          onChange={handleSearchInputChange}
          modelSource={modelSource}
        ></SearchInput>
        <div className="gguf-tips">
          <span>
            {intl.formatMessage({ id: 'models.form.search.gguftips' })}
          </span>
        </div>
        <div className={SearchStyle.filter}>
          <span>
            <span className="value">
              {intl.formatMessage(
                { id: 'models.search.result' },
                { count: dataSource.repoOptions.length }
              )}
            </span>
          </span>
          <span>
            <span id="filterGGUF">
              <Checkbox
                onChange={handleFilterGGUFChange}
                className="m-r-5"
                checked={filterGGUFRef.current}
              >
                <Tooltip
                  overlayInnerStyle={{ width: 'max-content' }}
                  title={
                    <ul className="tips-desc-list">
                      <li>
                        {intl.formatMessage({ id: 'models.search.gguf.tips' })}
                      </li>
                      <li>
                        {intl.formatMessage({ id: 'models.search.vllm.tips' })}
                      </li>
                      <li>
                        {intl.formatMessage({
                          id: 'models.search.voxbox.tips'
                        })}
                      </li>
                    </ul>
                  }
                >
                  GGUF
                  <QuestionCircleOutlined className="m-l-4" />
                </Tooltip>
              </Checkbox>
            </span>
            <Select
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
          </span>
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
        {SUPPORTEDSOURCE.includes(modelSource) ? (
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
