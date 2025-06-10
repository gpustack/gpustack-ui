import { createAxiosToken } from '@/hooks/use-chunk-request';
import { QuestionCircleOutlined } from '@ant-design/icons';
import { useIntl } from '@umijs/max';
import { Checkbox, Pagination, Select, Tooltip } from 'antd';
import _ from 'lodash';
import React, { useEffect, useMemo, useRef, useState } from 'react';
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
import { handleRecognizeAudioModel } from '../config/audio-catalog';
import { checkCurrentbackend } from '../hooks';
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
  gpuOptions?: any[];
  setLoadingModel?: (flag: boolean) => void;
  onSourceChange?: (source: string) => void;
  onSelectModel: (model: any, evaluate?: boolean) => void;
  displayEvaluateStatus?: (data: {
    show?: boolean;
    flag: Record<string, boolean>;
  }) => void;
}

const SearchModel: React.FC<SearchInputProps> = (props) => {
  const intl = useIntl();
  const {
    modelSource,
    isDownload,
    hasLinuxWorker,
    gpuOptions,
    setLoadingModel,
    onSelectModel,
    displayEvaluateStatus
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
  const requestIdRef = useRef<number>(0);
  const [query, setQuery] = useState({
    page: 1,
    perPage: 10,
    total: 100
  });
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

  const updateRequestId = () => {
    requestIdRef.current += 1;
    return requestIdRef.current;
  };

  const checkIsGGUF = (item: any) => {
    const isGGUF = _.some(item.tags, (tag: string) => {
      return tag.toLowerCase() === 'gguf';
    });
    const isGGUFFromMs = _.some(item.libraries, (tag: string) => {
      return tag.toLowerCase() === 'gguf';
    });
    return isGGUF || isGGUFFromMs;
  };

  const handleOnSelectModel = (item: any, evaluate?: boolean) => {
    onSelectModel(item, evaluate);
    setCurrent(item.id);
    currentRef.current = item.id;
  };

  // huggeface
  const getModelsFromHuggingface = async (sort: string) => {
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
  };

  // modelscope, only modelscope has page and perPage
  const getModelsFromModelscope = async (queryParams: {
    sortType: string;
    page: number;
    perPage?: number;
  }) => {
    try {
      const params = {
        Name: `${searchInputRef.current}`,
        tags: filterGGUFRef.current ? ['gguf'] : [],
        tasks: filterTaskRef.current
          ? ([ModelscopeTaskMap[filterTaskRef.current]] as string[])
          : [],
        SortBy: ModelScopeSortType[queryParams.sortType],
        PageNumber: queryParams.page,
        PageSize: queryParams.perPage
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
          isGGUF: checkIsGGUF({
            tags: item.Tags,
            libraries: item.Libraries
          }),
          source: modelSource
        };
      });

      setQuery((prev) => {
        return {
          ...prev,
          page: queryParams.page,
          total: _.get(data, 'Data.Model.TotalCount', 0)
        };
      });
      return list;
    } catch (error) {
      return [];
    }
  };

  const getEvaluateResults = async (repoList: any[]) => {
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
      return evaluations.results;
    } catch (error) {
      return [];
    }
  };

  const handleEvaluate = async (list: any[]) => {
    if (isDownload) {
      return;
    }
    const currentRequestId = updateRequestId();
    try {
      const repoList = list.map((item) => {
        const res = handleRecognizeAudioModel(item, modelSource);

        let backendObj = {};
        const backend = checkCurrentbackend({
          isGGUF: item.isGGUF,
          isAudio: res.isAudio,
          gpuOptions: gpuOptions || []
        });

        if (backend) {
          backendObj = {
            backend: backend
          };
        }

        return {
          ...backendObj,
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
      if (requestIdRef.current !== currentRequestId) {
        return;
      }
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

      /**
       * if item is GGUF, the evaluating would be do after selecting the model file, Or the evaluate status of model would be overrided the
       * file evaluate status.
       */
      if (currentItem && !currentItem.isGGUF) {
        displayEvaluateStatus?.({
          show: false,
          flag: {
            model: false
          }
        });
      }

      if (currentItem) {
        handleOnSelectModel(currentItem, true);
      }
    } catch (error) {
      if (requestIdRef.current === currentRequestId) {
        setIsEvaluating(false);
      }
    }
  };

  const getCurrentPage = (page: number) => {
    const start = (page - 1) * query.perPage;
    const end = start + query.perPage;
    return cacheRepoOptions.current.slice(start, end);
  };

  const handleOnSearchRepo = async (params: {
    sortType: string;
    page: number;
    perPage: number;
  }) => {
    if (!SUPPORTEDSOURCE.includes(modelSource)) {
      return;
    }
    axiosTokenRef.current?.abort?.('new request');
    axiosTokenRef.current = new AbortController();
    checkTokenRef.current?.cancel?.();
    if (timer.current) {
      clearTimeout(timer.current);
    }
    const sort = params.sortType;
    try {
      setDataSource((pre) => {
        pre.loading = true;
        return { ...pre };
      });
      setLoadingModel?.(true);
      cacheRepoOptions.current = [];
      let list: any[] = [];
      if (modelSource === modelSourceMap.huggingface_value) {
        const resultList = await getModelsFromHuggingface(sort);
        cacheRepoOptions.current = resultList;

        // hf has no page and perPage, so we need to slice the resultList
        list = getCurrentPage(params.page);
        setQuery((prev) => {
          return {
            ...prev,
            page: params.page,
            total: resultList.length
          };
        });
      } else if (modelSource === modelSourceMap.modelscope_value) {
        list = await getModelsFromModelscope(params);
        cacheRepoOptions.current = list;
      }

      setDataSource({
        repoOptions: list,
        loading: false,
        networkError: false,
        sortType: sort
      });
      displayEvaluateStatus?.({
        show: true,
        flag: {
          model: true
        }
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
      displayEvaluateStatus?.({
        show: false,
        flag: {
          model: false
        }
      });
      handleOnSelectModel({});
      cacheRepoOptions.current = [];
    }
  };
  const handleSearchInputChange = (e: any) => {
    searchInputRef.current = e.target.value;
  };
  const handlerSearchModels = _.debounce(
    () =>
      handleOnSearchRepo({
        sortType: dataSource.sortType,
        page: 1,
        perPage: query.perPage
      }),
    100
  );

  const handleOnOpen = () => {
    if (
      !dataSource.repoOptions.length &&
      !cacheRepoOptions.current.length &&
      SUPPORTEDSOURCE.includes(modelSource)
    ) {
      handleOnSearchRepo({
        sortType: dataSource.sortType,
        page: 1,
        perPage: query.perPage
      });
    }
  };

  const handleSortChange = (value: string) => {
    handleOnSearchRepo({
      sortType: value,
      page: 1,
      perPage: query.perPage
    });
  };

  const handleFilterGGUFChange = (e: any) => {
    filterGGUFRef.current = e.target.checked;
    handleOnSearchRepo({
      sortType: dataSource.sortType,
      page: 1,
      perPage: query.perPage
    });
  };

  const handleOnPageChange = (page: number) => {
    if (modelSource === modelSourceMap.huggingface_value) {
      const currentList = getCurrentPage(page);
      setQuery((prev) => {
        return {
          ...prev,
          page: page
        };
      });
      setDataSource((pre) => {
        return {
          ...pre,
          repoOptions: currentList
        };
      });
      displayEvaluateStatus?.({
        show: true,
        flag: {
          model: true
        }
      });
      console.log('isEvaluating:', isEvaluating);
      handleOnSelectModel(currentList[0]);
      handleEvaluate(currentList);
    } else if (modelSource === modelSourceMap.modelscope_value) {
      handleOnSearchRepo({
        sortType: dataSource.sortType,
        page: page,
        perPage: query.perPage
      });
    }
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
            <Checkbox
              onChange={handleFilterGGUFChange}
              className="m-l-8"
              checked={filterGGUFRef.current}
            >
              {renderGGUFTips}
            </Checkbox>
          </span>
          <Pagination
            simple={{ readOnly: true }}
            total={query.total}
            current={query.page}
            pageSize={query.perPage}
            onChange={handleOnPageChange}
            showSizeChanger={false}
            hideOnSinglePage={query.total <= query.perPage}
          ></Pagination>
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
