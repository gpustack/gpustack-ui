import StatusTag from '@/components/status-tag';
import { PageAction } from '@/config';
import useSetChunkRequest from '@/hooks/use-chunk-request';
import useUpdateChunkedList from '@/hooks/use-update-chunk-list';
import {
  MODELS_API,
  MODEL_INSTANCE_API,
  createModel,
  queryCatalogList,
  queryModelInstancesList
} from '@/pages/llmodels/apis';
import DelopyBuiltInModal from '@/pages/llmodels/components/deploy-builtin-modal';
import DeployModal from '@/pages/llmodels/components/deploy-modal';
import {
  InstanceStatusMap,
  InstanceStatusMapValue,
  getSourceRepoConfigValue,
  modelCategoriesMap,
  modelSourceMap,
  status
} from '@/pages/llmodels/config';
import {
  CatalogItem as CatalogItemType,
  FormData
} from '@/pages/llmodels/config/types';
import { queryModelsList } from '@/pages/playground/apis';
import ModelParameters from '@/pages/playground/components/model-parameters';
import {
  ChatParamsConfig,
  ImageAdvancedParamsConfig,
  ImageCountConfig,
  ImageCustomSizeConfig
} from '@/pages/playground/config/params-config';
import useInitMeta from '@/pages/playground/hooks/use-init-meta';
import {
  LeftOutlined,
  PlusOutlined,
  SearchOutlined,
  SettingOutlined
} from '@ant-design/icons';
import { useIntl, useNavigate } from '@umijs/max';
import { Button, Popover, Select, message } from 'antd';
import _ from 'lodash';
import qs from 'query-string';
import React, {
  forwardRef,
  useCallback,
  useEffect,
  useImperativeHandle,
  useRef,
  useState
} from 'react';
import DropdownPanel from '../../../components/dropdown-render/dropdown-list';
import ModelContext from '../config/modal-context';
import '../styles/header.less';

type optionType = string | number;
interface HeaderProps {
  ref?: any;
  onModelChange: (value: string | number, item: any) => void;
  onValuesChange: (values: any) => void;
}

const Header: React.FC<HeaderProps> = forwardRef((props, ref) => {
  const { onModelChange, onValuesChange } = props;
  const intl = useIntl();
  const navigate = useNavigate();
  const { setChunkRequest: setModelInstanceChunkRequest } =
    useSetChunkRequest();
  const { setChunkRequest, createAxiosToken } = useSetChunkRequest();
  const { extractIMGMeta, extractLLMMeta } = useInitMeta();
  const [modelList, setModelList] = useState<Global.BaseOption<string>[]>([]);
  const [catalogList, setCatalogList] = useState<
    Global.BaseOption<optionType & CatalogItemType>[]
  >([]);
  const [optionList, setOptionList] = useState<Global.BaseOption<optionType>[]>(
    []
  );
  const [model, setModel] = useState<string | number>('');
  const [currentModel, setCurrentModel] = useState<any>({});
  const selectRef = React.useRef<any>(null);
  const cacheData = React.useRef<CatalogItemType[]>([]);
  const [paramsConfig, setParamsConfig] = useState<any>(ChatParamsConfig);
  const [initValues, setInitValues] = useState<any>({});
  const form = React.useRef<any>(null);
  const [searchValue, setSearchValue] = useState<string>('');
  const [openDeployModal, setOpenDeployModal] = useState<any>({
    show: false,
    width: 600,
    source: modelSourceMap.huggingface_value
  });
  const [downloadList, setDownloadList] = useState<any[]>([]);
  const [modelCacheList, setCacheModelList] = useState<
    Global.BaseOption<string>[]
  >([]);

  const chunkInstanceRequedtRef = useRef<any>();

  const [openCatalogDeployModal, setCatalogOpenDeployModal] = useState<any>({
    show: false,
    width: 600,
    current: {},
    source: modelSourceMap.huggingface_value
  });
  const [modelInstances, setModelInstances] = useState<any[]>([]);
  const chunkRequedtRef = useRef<any>();

  const { updateChunkedList, cacheDataListRef } = useUpdateChunkedList({
    events: ['UPDATE'],
    dataList: optionList,
    setDataList(list, opts?: any) {
      const data = _.filter(list, (item: any) => {
        const flag =
          item.categories?.[0] === modelCategoriesMap.image ||
          item.categories?.[0] === modelCategoriesMap.llm;
        return flag && item.ready_replicas > 0;
      });
      if (data.length) {
        setOptionList(
          _.map(data, (item: any) => {
            return {
              value: item.name,
              label: item.name,
              categories: item.categories,
              meta: item.meta
            };
          })
        );
      }
    }
  });

  const {
    updateChunkedList: updateInstanceChunkedList,
    cacheDataListRef: cacheInsDataListRef
  } = useUpdateChunkedList({
    dataList: [],
    limit: 100,
    setDataList: setModelInstances
  });

  useEffect(() => {
    const dataList = _.filter(modelInstances, (item: any) =>
      downloadList.some(
        (dItem) => dItem.id === item.id && item.download_progress < 100
      )
    );
    if (dataList.length) {
      setDownloadList(() => {
        return _.map(dataList, (item: any) => {
          return {
            label: item.model_name,
            value: item.model_name,
            ...item
          };
        });
      });
    }
  }, [modelInstances]);

  const handleBack = () => {
    navigate(-1);
  };

  useImperativeHandle(ref, () => ({
    form: form.current
  }));

  const generateParamsConfig = (currentModel: any) => {
    if (currentModel.categories?.[0] === modelCategoriesMap.llm) {
      return ChatParamsConfig;
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
    return [
      ...ImageCountConfig,
      ...customSizeConfig,
      ...ImageAdvancedParamsConfig
    ];
  };

  const filterData = (data: { search: string; categories: string[] }) => {
    const { search } = data;
    if (!search) {
      return [];
    }

    const dataList = cacheData.current.filter((item) => {
      return _.toLower(item.name).includes(_.toLower(search));
    });
    const result = _.differenceBy(dataList, modelList, (item: any) =>
      _.toLower(item.label)
    );
    return result;
  };

  const fetchCatalogList = async () => {
    if (cacheData.current.length > 0) {
      return;
    }
    try {
      const params = {
        page: 1,
        perPage: 100,
        search: '',
        categories: [modelCategoriesMap.image, modelCategoriesMap.llm]
      };
      const res: any = await queryCatalogList(params);
      const list = _.map(res.items || [], (item: any) => {
        return {
          ...item,
          label: item.name,
          value: item.id
        };
      });
      cacheData.current = list;
    } catch (error) {
      cacheData.current = [];
    }
  };

  const handleOnSearch = async (value: string) => {
    await fetchCatalogList();

    const filterCatalogList = filterData({ search: value, categories: [] });
    const optionModels = modelList.filter((item) => item.label.includes(value));

    setOptionList(optionModels);
    setCatalogList(filterCatalogList);
    setSearchValue(value);
  };

  const getInitialValues = (currentModel: any) => {
    if (currentModel.categories?.[0] === modelCategoriesMap.llm) {
      return extractLLMMeta(currentModel.meta || {});
    }
    return extractIMGMeta(currentModel.meta || {});
  };

  const handleModelChange = (value: string | number, item: any) => {
    const pConfig = generateParamsConfig(item);
    const initialValues = getInitialValues(item);
    setModel(value);
    onModelChange(value, item);
    setCurrentModel(item);
    setParamsConfig(pConfig);
    setInitValues(initialValues.form);
    onValuesChange({
      ...initialValues.form,
      model: value
    });

    setTimeout(() => {
      selectRef.current?.blur?.();
    }, 50);
  };

  const handleSelectReadyModel = (value: string | number, item: any) => {};

  const updateInstanceHandler = (list: any) => {
    // filter the data
    _.each(list, (data: any) => {
      updateInstanceChunkedList(data);
    });
  };

  const updateHandler = (list: any) => {
    _.each(list, (data: any) => {
      updateChunkedList(data);
    });
  };

  const createModelsChunkRequest = useCallback(async () => {
    chunkRequedtRef.current?.current?.cancel?.();
    try {
      const query = {
        categories: [modelCategoriesMap.image, modelCategoriesMap.llm]
      };
      chunkRequedtRef.current = setChunkRequest({
        url: `${MODELS_API}?${qs.stringify(query)}`,
        handler: updateHandler
      });
    } catch (error) {
      // ignore
    }
  }, []);

  const createModelsInstanceChunkRequest = useCallback(async () => {
    chunkInstanceRequedtRef.current?.current?.cancel?.();
    try {
      chunkInstanceRequedtRef.current = setModelInstanceChunkRequest({
        url: `${MODEL_INSTANCE_API}`,
        params: {},
        handler: updateInstanceHandler
      });
    } catch (error) {
      // ignore
    }
  }, [updateInstanceHandler]);

  // fetch models
  const fetchData = async () => {
    try {
      const [imageModels, llmModels] = await Promise.all([
        queryModelsList({
          categories: modelCategoriesMap.image,
          with_meta: true
        }),
        queryModelsList({
          categories: modelCategoriesMap.llm,
          with_meta: true
        })
      ]);

      const list = _.map(imageModels.data || [], (item: any) => {
        return {
          value: item.id,
          label: item.id,
          categories: [modelCategoriesMap.image],
          meta: item.meta
        };
      }) as Global.BaseOption<string>[];

      const llmList = _.map(llmModels.data || [], (item: any) => {
        return {
          value: item.id,
          label: item.id,
          categories: [modelCategoriesMap.llm],
          meta: item.meta
        };
      }) as Global.BaseOption<string>[];

      setModelList([...list, ...llmList]);
      setOptionList([...list, ...llmList]);
      const current = list[0] || llmList[0];
      setModel(current.value);
      setCurrentModel(current);
      handleModelChange(current.value, current);
    } catch (error) {
      console.error(error);
      setModelList([]);
    }
  };

  const handleClickCatalog = (value: string | number, item: any) => {};

  const debounceFilterData = _.debounce(handleOnSearch, 200);

  const handleSearchMore = () => {
    setOpenDeployModal({
      show: true,
      width: 'calc(100vw - 220px)',
      source: modelSourceMap.huggingface_value
    });
  };

  const handleOnDeploy = useCallback((item: CatalogItemType) => {
    console.log('catalog item:', catalogList, searchValue);
    setCatalogOpenDeployModal({
      show: true,
      source: modelSourceMap.huggingface_value,
      current: item,
      width: 600
    });
  }, []);

  const handleOnValuesChange = useCallback(
    (values: any, allValues: any) => {
      onValuesChange({
        ...allValues,
        model: model
      });
    },
    [onValuesChange]
  );

  const handleCreateModel = useCallback(
    async (data: FormData) => {
      try {
        console.log('data:', data, openDeployModal);

        const result = getSourceRepoConfigValue(openDeployModal.source, data);

        const modelData = await createModel({
          data: {
            ...result.values,
            ..._.omit(data, result.omits)
          }
        });
        const instances = await queryModelInstancesList({
          id: modelData.id,
          page: 1
        });
        createModelsInstanceChunkRequest();
        createModelsChunkRequest();
        setOpenDeployModal({
          ...openDeployModal,
          show: false
        });

        setDownloadList((pre) => {
          return [
            ...pre,
            {
              label: modelData.name,
              value: modelData.name,
              ...instances.items?.[0]
            }
          ];
        });

        message.success(intl.formatMessage({ id: 'common.message.success' }));
      } catch (error) {}
    },
    [openDeployModal]
  );

  const handleCreateCatalogModel = useCallback(
    async (data: FormData) => {
      try {
        console.log('data:', data, openDeployModal);

        const modelData = await createModel({
          data: {
            ..._.omit(data, ['size', 'quantization'])
          }
        });
        const instances = await queryModelInstancesList({
          id: modelData.id,
          page: 1
        });
        createModelsInstanceChunkRequest();
        createModelsChunkRequest();
        setDownloadList((pre) => {
          return [
            ...pre,
            {
              label: modelData.name,
              value: modelData.name,
              ...instances.items?.[0]
            }
          ];
        });
        setCatalogOpenDeployModal({
          ...openCatalogDeployModal,
          show: false
        });
        message.success(intl.formatMessage({ id: 'common.message.success' }));
      } catch (error) {}
    },
    [openDeployModal]
  );

  const handleDeployModalCancel = () => {
    setOpenDeployModal({
      ...openDeployModal,
      show: false
    });
    setCatalogOpenDeployModal({
      ...openDeployModal,
      show: false
    });
  };

  const renderLabel = useCallback(
    (item: any) => {
      const { value } = item;
      const data: any = modelList.find((item) => item.value === value);

      return (
        <span>
          {/* <Tag bordered={false} className="font-700">
            {data?.categories?.[0] === modelCategoriesMap.llm ? 'LLM' : 'Image'}
          </Tag> */}
          <span className="font-700">{value}</span>
        </span>
      );
    },
    [optionList]
  );

  useEffect(() => {
    fetchData();
    return () => {
      chunkInstanceRequedtRef.current?.current?.cancel?.();
    };
  }, []);

  return (
    <div className="chat-header">
      <Button
        className="button"
        onClick={handleBack}
        icon={<LeftOutlined className="font-size-14 back-icon" />}
        type="text"
      >
        <span className="font-700">Back to Control Center</span>
      </Button>
      <Select
        ref={selectRef}
        labelRender={renderLabel}
        onSearch={debounceFilterData}
        value={model}
        placeholder="select a model"
        className="title"
        style={{ width: 360 }}
        variant="borderless"
        dropdownRender={() => {
          return (
            <div
              style={{ maxHeight: '260px', overflow: 'auto' }}
              className="custome-scrollbar"
            >
              <DropdownPanel
                options={optionList}
                onChange={handleModelChange}
              ></DropdownPanel>
              {downloadList.length > 0 && (
                <div>
                  <div
                    className="font-size-12 text-tertiary font-500"
                    style={{
                      padding: '8px',
                      borderBottom: '1px solid var(--ant-color-split)'
                    }}
                  >
                    Downloading
                  </div>
                  <DropdownPanel
                    options={downloadList}
                    onChange={handleSelectReadyModel}
                    renderLabel={(item) => {
                      return (
                        <div className="flex-between flex-1">
                          <span>{item.label}</span>
                          {item.state && (
                            <StatusTag
                              download={
                                item.state === InstanceStatusMap.Downloading
                                  ? { percent: item.download_progress }
                                  : undefined
                              }
                              statusValue={{
                                status:
                                  item.state ===
                                    InstanceStatusMap.Downloading &&
                                  item.download_progress === 100
                                    ? status[InstanceStatusMap.Running]
                                    : (status[item.state] as any),
                                text: InstanceStatusMapValue[item.state],
                                message:
                                  item.state ===
                                    InstanceStatusMap.Downloading &&
                                  item.download_progress === 100
                                    ? ''
                                    : item.state_message
                              }}
                            ></StatusTag>
                          )}
                        </div>
                      );
                    }}
                  ></DropdownPanel>
                </div>
              )}
              {catalogList.length > 0 && (
                <div>
                  <div
                    className="font-size-12 text-tertiary font-500"
                    style={{
                      padding: '8px',
                      borderBottom: '1px solid var(--ant-color-split)'
                    }}
                  >
                    from catalog
                  </div>
                  <DropdownPanel
                    options={catalogList}
                    onChange={handleClickCatalog}
                    renderLabel={(item) => {
                      return (
                        <div className="flex-between flex-1">
                          <span>{item.label}</span>
                          <Button
                            onClick={() => handleOnDeploy(item)}
                            size="small"
                            icon={<PlusOutlined></PlusOutlined>}
                          >
                            Add
                          </Button>
                        </div>
                      );
                    }}
                  ></DropdownPanel>
                </div>
              )}
              {optionList.length === 0 && catalogList.length === 0 && (
                <div
                  style={{
                    display: 'flex',
                    width: '100%',
                    gap: 10,
                    flexDirection: 'column',
                    alignItems: 'center',
                    padding: '10px 0'
                  }}
                >
                  <span>No results found</span>
                  <div>
                    <Button
                      className="font-500"
                      size="middle"
                      block
                      onClick={handleSearchMore}
                      icon={<SearchOutlined></SearchOutlined>}
                    >
                      Search more for{' '}
                      <span className="font-700">{searchValue}</span>
                    </Button>
                  </div>
                </div>
              )}
            </div>
          );
        }}
        showSearch
      ></Select>

      <Popover
        placement="bottomRight"
        overlayClassName="custome-scrollbar"
        overlayStyle={{
          maxHeight: 500,
          overflow: 'auto',
          borderRadius: 'var(--border-radius-base)',
          boxShadow: 'var(--ant-box-shadow-secondary)'
        }}
        overlayInnerStyle={{
          boxShadow: 'none'
        }}
        content={
          <ModelParameters
            ref={form}
            style={{ width: 360 }}
            initialValues={initValues}
            paramsConfig={paramsConfig}
            onValuesChange={handleOnValuesChange}
          />
        }
        trigger={['click']}
        arrow={false}
        fresh={true}
      >
        <Button
          className="settings"
          icon={<SettingOutlined></SettingOutlined>}
          type="text"
        >
          <span className="font-700">Settings</span>
        </Button>
      </Popover>
      <ModelContext.Provider value={{ search: searchValue }}>
        <DeployModal
          open={openDeployModal.show}
          action={PageAction.CREATE}
          title={intl.formatMessage({ id: 'models.button.deploy' })}
          source={openDeployModal.source}
          width={openDeployModal.width}
          onCancel={handleDeployModalCancel}
          onOk={handleCreateModel}
        ></DeployModal>
        <DelopyBuiltInModal
          open={openCatalogDeployModal.show}
          action={PageAction.CREATE}
          title={intl.formatMessage({ id: 'models.button.deploy' })}
          source={openCatalogDeployModal.source}
          width={openCatalogDeployModal.width}
          current={openCatalogDeployModal.current}
          onCancel={handleDeployModalCancel}
          onOk={handleCreateCatalogModel}
        ></DelopyBuiltInModal>
      </ModelContext.Provider>
    </div>
  );
});

export default React.memo(Header);
