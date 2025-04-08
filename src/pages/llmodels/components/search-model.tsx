import { createAxiosToken } from '@/hooks/use-chunk-request';
import { QuestionCircleOutlined } from '@ant-design/icons';
import { useIntl } from '@umijs/max';
import { Checkbox, Select, Tooltip } from 'antd';
import _ from 'lodash';
import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState
} from 'react';
import styled from 'styled-components';
import {
  evaluationsModelSpec,
  queryHuggingfaceModels,
  queryModelScopeModels
} from '../apis';
import {
  HuggingFaceTaskMap,
  ModelScopeSortType,
  ModelSortType,
  ModelscopeTaskMap,
  modelSourceMap
} from '../config';
import SearchStyle from '../style/search-result.less';
import SearchInput from './search-input';
import SearchResult from './search-result';

const UL = styled.ul`
  list-style: decimal;
  padding-left: 16px;
  margin: 0;
`;

interface SearchInputProps {
  hasLinuxWorker?: boolean;
  modelSource: string;
  isDownload?: boolean;
  setLoadingModel?: (flag: boolean) => void;
  onSourceChange?: (source: string) => void;
  onSelectModel: (model: any) => void;
}

const SearchModel: React.FC<SearchInputProps> = (props) => {
  const intl = useIntl();
  const {
    modelSource,
    isDownload,
    hasLinuxWorker,
    setLoadingModel,
    onSelectModel
  } = props;
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
  const [isEvaluating, setIsEvaluating] = useState<boolean>(false);
  const [current, setCurrent] = useState<string>('');
  const currentRef = useRef<string>('');
  const cacheRepoOptions = useRef<any[]>([]);
  const axiosTokenRef = useRef<any>(null);
  const checkTokenRef = useRef<any>(null);
  const searchInputRef = useRef<any>('');
  const filterGGUFRef = useRef<boolean | undefined>(!hasLinuxWorker);
  const filterTaskRef = useRef<string>('');
  const timer = useRef<any>(null);
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

  const checkIsGGUF = (item: any) => {
    const isGGUF = _.some(item.tags, (tag: string) => {
      return tag.toLowerCase() === 'gguf';
    });
    const isGGUFFromMs = _.some(item.libraries, (tag: string) => {
      return tag.toLowerCase() === 'gguf';
    });
    return isGGUF || isGGUFFromMs;
  };

  const handleOnSelectModel = (item: any) => {
    onSelectModel(item);
    setCurrent(item.id);
    currentRef.current = item.id;
  };

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
          label: item.name,
          isGGUF: checkIsGGUF(item),
          source: modelSource
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
          task: item.Tasks?.map((sItem: any) => sItem.Name).join(','),
          tags: item.Tags,
          libraries: item.Libraries,
          isGGUF: checkIsGGUF({ tags: item.Tags, libraries: item.Libraries }),
          source: modelSource
        };
      });

      return list;
    } catch (error) {
      return [];
    }
  }, []);

  const getEvaluateResults = useCallback(async (repoList: any[]) => {
    try {
      checkTokenRef.current?.cancel?.();
      checkTokenRef.current = createAxiosToken();
      const evaluations = await evaluationsModelSpec(
        {
          model_specs: repoList
        },
        {
          token: checkTokenRef.current?.token
        }
      );
      return evaluations.results || [];
    } catch (error) {
      return [];
    }
  }, []);

  const handleEvaluate = async (list: any[]) => {
    if (isDownload) {
      return;
    }
    try {
      const repoList = list.map((item) => {
        return {
          source: modelSource,
          ...(modelSource === modelSourceMap.huggingface_value
            ? {
                huggingface_repo_id: item.name
              }
            : {
                model_scope_model_id: item.name
              })
        };
      });
      setIsEvaluating(true);
      const evaluations = await getEvaluateResults(repoList);
      const resultList = list.map((item, index) => {
        return {
          ...item,
          evaluateResult: evaluations[index] || null
        };
      });
      setIsEvaluating(false);
      setDataSource((pre) => {
        return {
          ...pre,
          loading: false,
          repoOptions: resultList
        };
      });
      const currentItem = resultList.find(
        (item) => item.id === currentRef.current
      );
      if (currentItem) {
        handleOnSelectModel(currentItem);
      }
    } catch (error) {
      setIsEvaluating(false);
    }
  };

  const handleOnSearchRepo = async (sortType?: string) => {
    if (!SUPPORTEDSOURCE.includes(modelSource)) {
      return;
    }
    axiosTokenRef.current?.abort?.();
    axiosTokenRef.current = new AbortController();
    checkTokenRef.current?.cancel?.();
    if (timer.current) {
      clearTimeout(timer.current);
    }
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
      console.log('list=========', list);

      setDataSource({
        repoOptions: list,
        loading: false,
        networkError: false,
        sortType: sort
      });
      handleOnSelectModel(list[0]);
      setLoadingModel?.(false);

      handleEvaluate(list);
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
  };
  const handleSearchInputChange = useCallback((e: any) => {
    searchInputRef.current = e.target.value;
    console.log('change:', searchInputRef.current);
  }, []);

  const handlerSearchModels = _.debounce(() => handleOnSearchRepo(), 100);

  const handleOnOpen = () => {
    if (
      !dataSource.repoOptions.length &&
      !cacheRepoOptions.current.length &&
      SUPPORTEDSOURCE.includes(modelSource)
    ) {
      handleOnSearchRepo();
    }
  };

  const handleSortChange = (value: string) => {
    handleOnSearchRepo(value || '');
  };

  const handleFilterGGUFChange = (e: any) => {
    filterGGUFRef.current = e.target.checked;
    handleOnSearchRepo();
  };

  const renderGGUFTips = useMemo(() => {
    return (
      <Tooltip
        overlayInnerStyle={{ width: 'max-content' }}
        title={
          <UL>
            <li>{intl.formatMessage({ id: 'models.search.gguf.tips' })}</li>
            <li>{intl.formatMessage({ id: 'models.search.vllm.tips' })}</li>
            <li>
              {intl.formatMessage({
                id: 'models.search.voxbox.tips'
              })}
            </li>
          </UL>
        }
      >
        GGUF
        <QuestionCircleOutlined className="m-l-4" />
      </Tooltip>
    );
  }, [intl]);

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
                {renderGGUFTips}
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
  }, [modelSource]);

  useEffect(() => {
    return () => {
      axiosTokenRef.current?.abort?.();
      checkTokenRef.current?.cancel?.();
      // workerRef.current?.terminate();
      if (timer.current) {
        clearTimeout(timer.current);
      }
    };
  }, []);

  return (
    <div style={{ flex: 1 }}>
      <div className={SearchStyle['search-bar']}>{renderHFSearch()}</div>
      <SearchResult
        loading={dataSource.loading}
        resultList={dataSource.repoOptions}
        networkError={dataSource.networkError}
        current={current}
        source={modelSource}
        isEvaluating={isEvaluating}
        onSelect={handleOnSelectModel}
      ></SearchResult>
    </div>
  );
};

export default SearchModel;
