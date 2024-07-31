import IconFont from '@/components/icon-font';
import RadioButtons from '@/components/radio-buttons';
import { SearchOutlined } from '@ant-design/icons';
import { Input } from 'antd';
import _ from 'lodash';
import React, { useRef, useState } from 'react';
import { queryHuggingfaceModels } from '../apis';
import { modelSourceMap, ollamaModelOptions } from '../config';
import SearchStyle from '../style/search-result.less';
import SearchResult from './search-result';

interface SearchInputProps {
  modelSource: string;
  onSourceChange: (source: string) => void;
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

const SearchInput: React.FC<SearchInputProps> = (props) => {
  const { modelSource, onSourceChange, onSelectModel } = props;
  const [showSearch, setShowSearch] = useState(false);
  const [repoOptions, setRepoOptions] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const cacheRepoOptions = useRef<any[]>([]);
  const axiosTokenRef = useRef<any>(null);

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
        (item: any) => item.downloads
      ).reverse();
      cacheRepoOptions.current = sortedList;
      setRepoOptions(sortedList);
    } catch (error) {
      setRepoOptions([]);
      cacheRepoOptions.current = [];
    } finally {
      setLoading(false);
    }
  };

  const handlerSearchModels = async (e: any) => {
    const text = e.target.value;
    handleOnSearchRepo(text);
  };

  const handleOnFocus = () => {
    setShowSearch(true);
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
    }
  };

  const handleOnSelectModel = (item: any) => {
    onSelectModel(item);
    setShowSearch(false);
  };

  const handleOnBlur = () => {
    setTimeout(() => {
      setShowSearch(false);
    }, 200);
  };

  const handleFilterModels = (e: any) => {
    const text = e.target.value;
    const list = _.filter(cacheRepoOptions.current, (item: any) => {
      return item.name.includes(text);
    });
    setRepoOptions(list);
    console.log('handleFilterModels', text);
  };

  const debounceFilter = _.debounce((e: any) => {
    handleFilterModels(e);
  }, 300);

  const handleSourceChange = (source: string) => {
    axiosTokenRef.current?.abort?.();
    onSourceChange(source);
    setRepoOptions([]);
    cacheRepoOptions.current = [];
  };

  return (
    <>
      <div className={SearchStyle['search-bar']}>
        <RadioButtons
          options={sourceList}
          value={modelSource}
          onChange={handleSourceChange}
        ></RadioButtons>
        <Input
          onPressEnter={handlerSearchModels}
          onChange={debounceFilter}
          allowClear
          onFocus={handleOnFocus}
          onBlur={() => handleOnBlur()}
          className="m-l-20"
          placeholder={
            modelSource === 'huggingface'
              ? 'Search models from hugging face '
              : ''
          }
          prefix={
            <SearchOutlined
              style={{
                fontSize: '16px',
                color: 'var(--ant-color-text-quaternary)'
              }}
            />
          }
        ></Input>
      </div>
      {showSearch && (
        <SearchResult
          loading={loading}
          resultList={repoOptions}
          current=""
          source={modelSource}
          onSelect={handleOnSelectModel}
        ></SearchResult>
      )}
      <div style={{ height: '81px' }}></div>
    </>
  );
};

export default React.memo(SearchInput);
