import { getRequestId, setRquestId } from '@/atoms/models';
import BaseSelect from '@/components/seal-form/base/select';
import { createAxiosToken } from '@/hooks/use-chunk-request';
import ColumnWrapper from '@/pages/_components/column-wrapper';
import { useIntl } from '@umijs/max';
import { Pagination } from 'antd';
import _ from 'lodash';
import React, { useEffect, useRef, useState } from 'react';
import styled from 'styled-components';
import {
  evaluationsModelSpec,
  queryHuggingfaceModels,
  queryModelScopeModels
} from '../apis';
import { ModelScopeSortType, ModelSortType, modelSourceMap } from '../config';
import { MessageStatus, WarningStausOptions } from '../hooks';
import useCheckBackend from '../hooks/use-check-backend';
import useRecognizeAudio from '../hooks/use-recognize-audio';
import SearchStyle from '../style/search-result.less';
import SearchInput from './search-input';
import SearchResult from './search-result';

const filterOptions = [
  { label: 'FP8', value: 'fp8' },
  { label: 'AWQ', value: 'awq' },
  { label: 'GPTQ', value: 'gptq' }
];
const PaginationMain = styled(Pagination)`
  .ant-pagination-slash {
    margin-inline: 5px;
  }
`;

interface SearchInputProps {
  hasLinuxWorker?: boolean;
  modelSource: string;
  isDownload?: boolean;
  gpuOptions?: any[];
  clusterId?: number;
  setLoadingModel?: (flag: boolean) => void;
  onSourceChange?: (source: string) => void;
  onSelectModel: (model: any, manul?: boolean) => void;
  onSelectModelAfterEvaluate?: (model: any, manual?: boolean) => void;
  displayEvaluateStatus?: (
    data: MessageStatus,
    options?: WarningStausOptions
  ) => void;
}

const SearchModel: React.FC<SearchInputProps> = (props) => {
  const intl = useIntl();
  const {
    modelSource,
    isDownload,
    gpuOptions,
    clusterId,
    setLoadingModel,
    onSelectModel,
    onSelectModelAfterEvaluate,
    displayEvaluateStatus
  } = props;

  const { recognizeAudioModel } = useRecognizeAudio();
  const { checkCurrentbackend } = useCheckBackend();
  const [dataSource, setDataSource] = useState<{
    dataList: any[];
    loading: boolean;
    networkError: boolean;
    sortType: string;
    filters: Record<string, any>;
  }>({
    dataList: [],
    loading: false,
    networkError: false,
    sortType: ModelSortType.trendingScore,
    filters: {
      tag: null
    }
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
  const timer = useRef<any>(null);
  const requestIdRef = useRef<number>(0);
  const searchRepoRequestIdRef = useRef<number>(0);
  const [paginationInfo, setPaginationInfo] = useState({
    page: 1,
    perPage: 10,
    total: 0
  });
  const modelFilesSortOptions = [
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
  ];

  const updateSearchRepoRequestId = () => {
    searchRepoRequestIdRef.current += 1;
    return searchRepoRequestIdRef.current;
  };

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

  const handleOnSelectModel = (model: any, manual?: boolean) => {
    const item = model || {};
    // because need cancel the fetch file request when select another model, so check the empty model in the parent level handler.
    if (!item.evaluated || item.isGGUF) {
      onSelectModel(item, manual);
    } else {
      onSelectModelAfterEvaluate?.(item, manual);
    }
    setCurrent(item.id);
    currentRef.current = item.id;
  };

  // huggeface
  const getModelsFromHuggingface = async (query: {
    sort: string;
    filters?: Record<string, any>;
  }) => {
    const currentSearchId = setRquestId();
    const task: any = searchInputRef.current ? '' : 'text-generation';
    const params = {
      search: {
        query: searchInputRef.current || '',
        sort: query.sort,
        tags: query.filters?.tag ? [query.filters.tag] : [],
        task: task
      }
    };
    const data = await queryHuggingfaceModels(params, {
      signal: axiosTokenRef.current.signal
    });
    if (getRequestId() !== currentSearchId) {
      throw 'new request has been sent';
    }
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
  };

  // modelscope, only modelscope has page and perPage
  const getModelsFromModelscope = async (queryParams: {
    sortType: string;
    page: number;
    perPage?: number;
    filters?: Record<string, any>;
  }) => {
    const currentSearchId = setRquestId();
    try {
      const params = {
        Name: `${searchInputRef.current}`,
        tags: queryParams.filters?.tag ? [queryParams.filters.tag] : [],
        SortBy: ModelScopeSortType[queryParams.sortType],
        PageNumber: queryParams.page,
        PageSize: queryParams.perPage,
        tasks: []
      };
      const data = await queryModelScopeModels(params, {
        signal: axiosTokenRef.current.signal
      });

      if (getRequestId() !== currentSearchId) {
        throw 'new request has been sent';
      }

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
          avatar: item.Avatar,
          isGGUF: checkIsGGUF({
            tags: item.Tags,
            libraries: item.Libraries
          }),
          source: modelSource
        };
      });

      setPaginationInfo((prev) => {
        return {
          ...prev,
          page: queryParams.page,
          total: _.get(data, 'Data.Model.TotalCount', 0)
        };
      });
      return list;
    } catch (error) {
      setPaginationInfo((prev) => {
        return {
          ...prev,
          page: queryParams.page
        };
      });
      throw error;
    }
  };

  const getEvaluateResults = async (repoList: any[]) => {
    checkTokenRef.current?.cancel?.();
    checkTokenRef.current = createAxiosToken();
    const evaluations = await evaluationsModelSpec(
      {
        cluster_id: clusterId!,
        model_specs: repoList
      },
      {
        token: checkTokenRef.current?.token
      }
    );
    return evaluations.results;
  };

  const handleEvaluate = async (list: any[]) => {
    if (isDownload) {
      return;
    }
    const currentRequestId = updateRequestId();
    const currentSearchId = getRequestId();
    try {
      const repoList = list.map((item) => {
        const res = recognizeAudioModel(item, modelSource);

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
          cluster_id: clusterId,
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
      // bind the requestId to the current request and searchId
      if (
        requestIdRef.current !== currentRequestId &&
        currentSearchId !== getRequestId()
      ) {
        return;
      }
      const resultList = list.map((item, index) => {
        return {
          ...item,
          evaluated: true,
          evaluateResult: evaluations[index] || null
        };
      });
      setIsEvaluating(false);

      setDataSource((pre) => {
        return {
          ...pre,
          loading: false,
          dataList: resultList
        };
      });
      // current selected item
      const currentItem = resultList.find(
        (item) => item.id === currentRef.current
      );

      // if it is gguf, would trigger a evaluation after select a model file
      if (currentItem && !currentItem.isGGUF) {
        onSelectModelAfterEvaluate?.(currentItem);
      }
    } catch (error) {
      // cancel the corrponding request
      if (requestIdRef.current === currentRequestId) {
        setIsEvaluating(false);
      }
    }
  };

  const getCurrentPage = (page: number) => {
    const start = (page - 1) * paginationInfo.perPage;
    const end = start + paginationInfo.perPage;
    return cacheRepoOptions.current.slice(start, end);
  };

  const handleOnSearchRepo = async (params: {
    sortType: string;
    page: number;
    perPage: number;
    filters: Record<string, any>;
  }) => {
    if (!SUPPORTEDSOURCE.includes(modelSource)) {
      return;
    }
    const currentSearchId = updateSearchRepoRequestId();
    axiosTokenRef.current?.abort?.('cancel previous request');
    axiosTokenRef.current = new AbortController();
    checkTokenRef.current?.cancel?.();
    if (timer.current) {
      clearTimeout(timer.current);
    }
    try {
      setDataSource((pre) => {
        pre.loading = true;
        return { ...pre };
      });
      setLoadingModel?.(true);
      cacheRepoOptions.current = [];
      let list: any[] = [];
      if (modelSource === modelSourceMap.huggingface_value) {
        const resultList = await getModelsFromHuggingface({
          sort: params.sortType,
          filters: params.filters
        });

        cacheRepoOptions.current = resultList;

        // hf has no page and perPage, so we need to slice the resultList
        list = getCurrentPage(params.page);
        setPaginationInfo((prev) => {
          return {
            ...prev,
            page: params.page,
            total: resultList.length
          };
        });
      } else if (modelSource === modelSourceMap.modelscope_value) {
        list = await getModelsFromModelscope(params);
        console.log('list:', list);
        cacheRepoOptions.current = list;
      }

      setDataSource({
        dataList: list,
        loading: false,
        networkError: false,
        sortType: params.sortType,
        filters: params.filters
      });

      handleOnSelectModel(list[0]);
      setLoadingModel?.(false);

      handleEvaluate(list);
    } catch (error: any) {
      console.log('error:', error);
      setDataSource({
        dataList: [],
        loading: currentSearchId !== searchRepoRequestIdRef.current,
        sortType: params.sortType,
        filters: params.filters,
        networkError: error?.message === 'Failed to fetch'
      });

      setLoadingModel?.(currentSearchId !== searchRepoRequestIdRef.current);
      displayEvaluateStatus?.({
        show: false,
        message: ''
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
        perPage: paginationInfo.perPage,
        filters: dataSource.filters
      }),
    100
  );

  const handleOnOpen = () => {
    if (
      !dataSource.dataList.length &&
      !cacheRepoOptions.current.length &&
      SUPPORTEDSOURCE.includes(modelSource)
    ) {
      handleOnSearchRepo({
        sortType: dataSource.sortType,
        page: 1,
        perPage: paginationInfo.perPage,
        filters: dataSource.filters
      });
    }
  };

  const handleSortChange = (value: string) => {
    handleOnSearchRepo({
      sortType: value,
      page: 1,
      perPage: paginationInfo.perPage,
      filters: dataSource.filters
    });
  };

  const handleFilterChange = (value: string) => {
    handleOnSearchRepo({
      sortType: dataSource.sortType,
      page: 1,
      perPage: paginationInfo.perPage,
      filters: {
        ...dataSource.filters,
        tag: value
      }
    });
  };

  const handleOnPageChange = (page: number) => {
    if (modelSource === modelSourceMap.huggingface_value) {
      const currentList = getCurrentPage(page);
      setPaginationInfo((prev) => {
        return {
          ...prev,
          page: page
        };
      });
      setDataSource((pre) => {
        return {
          ...pre,
          dataList: currentList
        };
      });
      handleOnSelectModel(currentList[0]);
      handleEvaluate(currentList);
    } else if (modelSource === modelSourceMap.modelscope_value) {
      setPaginationInfo((prev) => {
        return {
          ...prev,
          page: page
        };
      });
      handleOnSearchRepo({
        sortType: dataSource.sortType,
        page: page,
        perPage: paginationInfo.perPage,
        filters: dataSource.filters
      });
    }
  };

  const handleSelectModelManually = (model: any) => {
    if (model.id === currentRef.current) {
      return;
    }
    setRquestId();
    handleOnSelectModel(model, true);
  };

  const renderHFSearch = () => {
    return (
      <>
        <SearchInput
          onSearch={handlerSearchModels}
          onChange={handleSearchInputChange}
          modelSource={modelSource}
        ></SearchInput>
        <div className={SearchStyle.filter}>
          <span className="flex-center gap-8">
            <BaseSelect
              value={dataSource.sortType}
              onChange={handleSortChange}
              prefix={
                <span>{intl.formatMessage({ id: 'model.deploy.sort' })}:</span>
              }
              options={modelFilesSortOptions}
              size="middle"
              style={{ width: '150px' }}
            ></BaseSelect>
            <BaseSelect
              allowClear
              value={dataSource.filters.tag}
              onChange={handleFilterChange}
              options={filterOptions}
              size="middle"
              placeholder={intl.formatMessage({
                id: 'models.form.quantization'
              })}
              style={{ width: 130 }}
            ></BaseSelect>
          </span>
          <PaginationMain
            simple={{ readOnly: true }}
            total={paginationInfo.total}
            current={paginationInfo.page}
            pageSize={paginationInfo.perPage}
            onChange={handleOnPageChange}
            showSizeChanger={false}
            hideOnSinglePage={paginationInfo.total <= paginationInfo.perPage}
          ></PaginationMain>
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
    <div style={{ width: '100%' }}>
      <div className={SearchStyle['search-bar']}>{renderHFSearch()}</div>
      <ColumnWrapper
        maxHeight={'calc(100vh - 210px)'}
        styles={{
          container: {
            paddingTop: 0
          }
        }}
      >
        <SearchResult
          loading={dataSource.loading}
          resultList={dataSource.dataList}
          networkError={dataSource.networkError}
          current={current}
          source={modelSource}
          isEvaluating={isEvaluating}
          onSelect={handleSelectModelManually}
        ></SearchResult>
      </ColumnWrapper>
    </div>
  );
};

export default SearchModel;
