import { setRouteCache } from '@/atoms/route-cache';
import AlertInfo from '@/components/alert-info';
import IconFont from '@/components/icon-font';
import FieldComponent from '@/components/seal-form/field-component';
import SealSelect from '@/components/seal-form/seal-select';
import routeCachekey from '@/config/route-cachekey';
import useOverlayScroller from '@/hooks/use-overlay-scroller';
import ThumbImg from '@/pages/playground/components/thumb-img';
import { generateRandomNumber } from '@/utils';
import {
  fetchChunkedData,
  readLargeStreamData as readStreamData
} from '@/utils/fetch-chunk-data';
import { FileImageOutlined, SwapOutlined } from '@ant-design/icons';
import { useIntl, useSearchParams } from '@umijs/max';
import { Button, Form, Tooltip } from 'antd';
import classNames from 'classnames';
import _ from 'lodash';
import 'overlayscrollbars/overlayscrollbars.css';
import React, {
  forwardRef,
  memo,
  useCallback,
  useEffect,
  useImperativeHandle,
  useMemo,
  useRef,
  useState
} from 'react';
import { CREAT_IMAGE_API } from '../apis';
import { promptList } from '../config';
import {
  ImageAdvancedParamsConfig,
  ImageCustomSizeConfig,
  ImageParamsConfig,
  ImageconstExtraConfig,
  imageSizeOptions
} from '../config/params-config';
import { MessageItem, ParamsSchema } from '../config/types';
import '../style/ground-left.less';
import '../style/system-message-wrap.less';
import { generateImageCode, generateOpenaiImageCode } from '../view-code/image';
import DynamicParams from './dynamic-params';
import MessageInput from './message-input';
import ViewCommonCode from './view-common-code';

interface MessageProps {
  modelList: Global.BaseOption<string>[];
  loaded?: boolean;
  ref?: any;
}

// for advanced fields
const METAKEYS = [
  'sample_method',
  'sampling_steps',
  'schedule_method',
  'cfg_scale',
  'guidance',
  'negative_prompt'
];

const advancedFieldsDefaultValus = {
  seed: null,
  sample_method: 'euler_a',
  cfg_scale: 4.5,
  guidance: 3.5,
  sampling_steps: 10,
  negative_prompt: null,
  schedule_method: 'discrete',
  preview: null
};

const openaiCompatibleFieldsDefaultValus = {
  quality: 'standard',
  style: null
};

const initialValues = {
  n: 1,
  size: '512x512',
  ...advancedFieldsDefaultValus
};

const GroundImages: React.FC<MessageProps> = forwardRef((props, ref) => {
  const { modelList } = props;
  const messageId = useRef<number>(0);
  const [isOpenaiCompatible, setIsOpenaiCompatible] = useState<boolean>(false);
  const [imageList, setImageList] = useState<
    {
      dataUrl: string;
      height: number | string;
      width: string | number;
      maxHeight: string | number;
      maxWidth: string | number;
      uid: number;
      span?: number;
      loading?: boolean;
      progress?: number;
    }[]
  >([]);

  const intl = useIntl();
  const [searchParams] = useSearchParams();
  const selectModel = searchParams.get('model') || '';
  const [parameters, setParams] = useState<any>({});
  const [show, setShow] = useState(false);
  const [loading, setLoading] = useState(false);
  const [tokenResult, setTokenResult] = useState<any>(null);
  const [collapse, setCollapse] = useState(false);
  const scroller = useRef<any>(null);
  const paramsRef = useRef<any>(null);
  const messageListLengthCache = useRef<number>(0);
  const requestToken = useRef<any>(null);
  const [currentPrompt, setCurrentPrompt] = useState<string>('');
  const [modelMeta, setModelMeta] = useState<any>({});
  const form = useRef<any>(null);
  const inputRef = useRef<any>(null);
  const cacheFormData = useRef<Record<string, any>>({});

  const size = Form.useWatch('size', form.current?.form);

  const { initialize, updateScrollerPosition } = useOverlayScroller();
  const { initialize: innitializeParams } = useOverlayScroller();

  useImperativeHandle(ref, () => {
    return {
      viewCode() {
        setShow(true);
      },
      setCollapse() {
        setCollapse(!collapse);
      },
      collapse: collapse
    };
  });

  const getNewImageSizeOptions = useCallback((metaData: any) => {
    const { max_height, max_width } = metaData || {};
    if (!max_height || !max_width) {
      return imageSizeOptions;
    }
    const newImageSizeOptions = imageSizeOptions.filter((item) => {
      return item.width <= max_width && item.height <= max_height;
    });
    if (
      !newImageSizeOptions.find(
        (item) => item.width === max_width && item.height === max_height
      )
    ) {
      newImageSizeOptions.push({
        width: max_width,
        height: max_height,
        label: `${max_width}x${max_height}`,
        value: `${max_width}x${max_height}`
      });
    }
    return newImageSizeOptions;
  }, []);

  const paramsConfig = useMemo(() => {
    const newImageSizeOptions = getNewImageSizeOptions(modelMeta);
    let result: ParamsSchema[] = ImageParamsConfig.map((item: ParamsSchema) => {
      if (item.name === 'size') {
        return {
          ...item,
          options: newImageSizeOptions
        };
      }
      return item;
    });
    if (!newImageSizeOptions.length) {
      result = result.filter((item) => item.name !== 'size');
    }
    return result;
  }, [modelMeta]);

  const generateNumber = (min: number, max: number) => {
    return Math.floor(Math.random() * (max - min + 1) + min);
  };

  const updateCacheFormData = (values: Record<string, any>) => {
    _.merge(cacheFormData.current, values);
  };

  const handleRandomPrompt = useCallback(() => {
    const randomIndex = generateNumber(0, promptList.length - 1);
    const randomPrompt = promptList[randomIndex];
    inputRef.current?.handleInputChange({
      target: {
        value: randomPrompt
      }
    });
  }, []);

  const setImageSize = useCallback(() => {
    let size: Record<string, string | number> = {
      span: 12
    };
    if (parameters.n === 1) {
      size.span = 24;
    }
    if (parameters.n === 2) {
      size.span = 12;
    }
    if (parameters.n === 3) {
      size.span = 12;
    }
    if (parameters.n === 4) {
      size.span = 12;
    }
    return size;
  }, [parameters.n]);

  const finalParameters = useMemo(() => {
    if (parameters.size === 'custom') {
      return {
        ..._.omit(parameters, ['width', 'height', 'preview']),
        size:
          parameters.width && parameters.height
            ? `${parameters.width}x${parameters.height}`
            : ''
      };
    }
    return {
      ..._.omit(parameters, ['width', 'height', 'random_seed', 'preview'])
    };
  }, [parameters]);

  const viewCodeContent = useMemo(() => {
    if (isOpenaiCompatible) {
      return generateOpenaiImageCode({
        api: '/v1-openai/images/generations',
        parameters: {
          ...finalParameters,
          prompt: currentPrompt
        }
      });
    }
    return generateImageCode({
      api: '/v1-openai/images/generations',
      parameters: {
        ...finalParameters,
        prompt: currentPrompt
      }
    });
  }, [finalParameters, currentPrompt, parameters.size]);

  const setMessageId = () => {
    messageId.current = messageId.current + 1;
    return messageId.current;
  };

  const handleStopConversation = () => {
    requestToken.current?.abort?.();
    setLoading(false);
  };

  const submitMessage = async (current?: { content: string }) => {
    try {
      await form.current?.form?.validateFields();
      if (!parameters.model) return;
      const size: any = setImageSize();
      setLoading(true);
      setMessageId();
      setTokenResult(null);
      setCurrentPrompt(current?.content || '');
      setRouteCache(routeCachekey['/playground/text-to-image'], true);
      const imgSize = _.split(finalParameters.size, 'x').map((item: number) =>
        _.toNumber(item)
      );

      // preview
      let stream_options: Record<string, any> = {
        chunk_size: 16 * 1024,
        chunk_results: true
      };
      if (parameters.preview === 'preview') {
        stream_options = {
          preview: true
        };
      }

      if (parameters.preview === 'preview_faster') {
        stream_options = {
          preview_faster: true
        };
      }

      let newImageList = Array(parameters.n)
        .fill({})
        .map((item, index: number) => {
          return {
            dataUrl: 'data:image/png;base64,',
            ...size,
            progress: 0,
            height: imgSize[1],
            width: imgSize[0],
            loading: true,
            progressType: 'dashboard',
            preview: false,
            uid: setMessageId()
          };
        });
      setImageList(newImageList);

      requestToken.current?.abort?.();
      requestToken.current = new AbortController();

      const params = {
        ..._.omitBy(finalParameters, (value: string) => !value),
        seed: parameters.random_seed ? generateRandomNumber() : parameters.seed,
        stream: true,
        stream_options: {
          ...stream_options
        },
        prompt: current?.content || currentPrompt || ''
      };
      setParams({
        ...parameters,
        seed: params.seed
      });
      form.current?.form?.setFieldValue('seed', params.seed);

      const result: any = await fetchChunkedData({
        data: params,
        url: `${CREAT_IMAGE_API}?t=${Date.now()}`,
        signal: requestToken.current.signal
      });
      if (result.error) {
        setTokenResult({
          error: true,
          errorMessage:
            result?.data?.error?.message || result?.data?.error || ''
        });
        setImageList([]);
        return;
      }

      const { reader, decoder } = result;

      await readStreamData(reader, decoder, (chunk: any) => {
        if (chunk?.error) {
          setTokenResult({
            error: true,
            errorMessage: chunk?.error?.message || chunk?.message || ''
          });
          return;
        }
        chunk?.data?.forEach((item: any) => {
          const imgItem = newImageList[item.index];
          if (item.b64_json && stream_options.chunk_results) {
            imgItem.dataUrl += item.b64_json;
          } else if (item.b64_json) {
            imgItem.dataUrl = `data:image/png;base64,${item.b64_json}`;
          }
          const progress = _.round(item.progress, 0);
          newImageList[item.index] = {
            dataUrl: imgItem.dataUrl,
            height: imgSize[1],
            width: imgSize[0],
            maxHeight: `${imgSize[1]}px`,
            maxWidth: `${imgSize[0]}px`,
            uid: imgItem.uid,
            span: imgItem.span,
            loading: stream_options.chunk_results ? progress < 100 : false,
            preview: progress >= 100,
            progress: progress
          };
        });
        setImageList([...newImageList]);
      });
    } catch (error) {
      console.log('error:', error);
      requestToken.current?.abort?.();
      setImageList([]);
    } finally {
      setLoading(false);
      setRouteCache(routeCachekey['/playground/text-to-image'], false);
    }
  };
  const handleClear = () => {
    setMessageId();
    setImageList([]);
    setTokenResult(null);
  };

  const handleInputChange = (e: any) => {
    setCurrentPrompt(e.target.value);
  };

  const handleSendMessage = (message: Omit<MessageItem, 'uid'>) => {
    const currentMessage = message.content ? message : undefined;
    submitMessage(currentMessage);
  };

  const handleCloseViewCode = () => {
    setShow(false);
  };

  const handleToggleParamsStyle = () => {
    if (isOpenaiCompatible) {
      form.current?.form?.setFieldsValue({
        ...advancedFieldsDefaultValus,
        ..._.pick(cacheFormData.current, _.keys(advancedFieldsDefaultValus))
      });
      setParams((pre: object) => {
        return {
          ..._.omit(pre, _.keys(openaiCompatibleFieldsDefaultValus)),
          ...advancedFieldsDefaultValus,
          ..._.pick(cacheFormData.current, _.keys(advancedFieldsDefaultValus))
        };
      });
    } else {
      form.current?.form?.setFieldsValue({
        ...openaiCompatibleFieldsDefaultValus
      });
      setParams((pre: object) => {
        return {
          ...openaiCompatibleFieldsDefaultValus,
          ..._.omit(pre, _.keys(advancedFieldsDefaultValus))
        };
      });
    }
    setIsOpenaiCompatible(!isOpenaiCompatible);
    updateCacheFormData(parameters);
  };

  const renderExtra = useMemo(() => {
    if (!isOpenaiCompatible) {
      return [];
    }
    return ImageconstExtraConfig.map((item: ParamsSchema) => {
      return (
        <Form.Item name={item.name} rules={item.rules} key={item.name}>
          <SealSelect
            {...item.attrs}
            options={item.options}
            label={
              item.label.isLocalized
                ? intl.formatMessage({ id: item.label.text })
                : item.label.text
            }
          ></SealSelect>
        </Form.Item>
      );
    });
  }, [ImageconstExtraConfig, isOpenaiCompatible, intl]);

  const handleFieldChange = (e: any) => {
    if (e.target.id.indexOf('random_seed') > -1) {
      form.current?.form?.setFieldValue('random_seed', e.target.checked);
      setParams((pre: object) => {
        return {
          ...pre,
          random_seed: e.target.checked
        };
      });
    }
  };
  const renderAdvanced = useMemo(() => {
    if (isOpenaiCompatible) {
      return [];
    }
    const formValues = form.current?.form?.getFieldsValue();
    return ImageAdvancedParamsConfig.map((item: ParamsSchema) => {
      if (item.name === 'strength') {
        return null;
      }
      return (
        <Form.Item
          name={item.name}
          rules={item.rules}
          key={item.name}
          noStyle={item.name === 'random_seed'}
        >
          <FieldComponent
            style={item.name === 'random_seed' ? { marginBottom: 20 } : {}}
            disabled={
              item.disabledConfig
                ? item.disabledConfig?.when?.(formValues)
                : item.disabled
            }
            description={
              item.description?.isLocalized
                ? intl.formatMessage({ id: item.description.text })
                : item.description?.text
            }
            onChange={item.name === 'random_seed' ? handleFieldChange : null}
            {..._.omit(item, [
              'name',
              'rules',
              'disabledConfig',
              'description'
            ])}
          ></FieldComponent>
        </Form.Item>
      );
    });
  }, [ImageAdvancedParamsConfig, isOpenaiCompatible, intl, form.current]);

  const renderCustomSize = useMemo(() => {
    if (size === 'custom') {
      return ImageCustomSizeConfig.map((item: ParamsSchema) => {
        return (
          <Form.Item
            name={item.name}
            rules={[
              {
                message: intl.formatMessage(
                  { id: 'common.form.rule.input' },
                  { name: intl.formatMessage({ id: item.label.text }) }
                ),
                required: true
              }
            ]}
            key={item.name}
          >
            <FieldComponent
              label={
                item.label.isLocalized
                  ? intl.formatMessage({ id: item.label.text })
                  : item.label.text
              }
              description={
                item.description?.isLocalized
                  ? intl.formatMessage({ id: item.description.text })
                  : item.description?.text
              }
              {..._.omit(item, [
                'name',
                'description',
                'rules',
                'disabledConfig',
                'attrs'
              ])}
              {...item.attrs}
              defaultValue={
                item.name === 'height'
                  ? modelMeta.default_height
                  : modelMeta.default_width
              }
              max={
                item.name === 'height'
                  ? modelMeta.max_height || item.attrs?.max
                  : modelMeta.max_width || item.attrs?.max
              }
            ></FieldComponent>
          </Form.Item>
        );
      });
    }
    return null;
  }, [size, intl, modelMeta]);

  const handleOnModelChange = useCallback(
    (val: string) => {
      if (!val) return;

      const model = modelList.find((item) => item.value === val);

      setModelMeta(model?.meta || {});
      const imageSizeOptions = getNewImageSizeOptions(model?.meta);
      const w = model?.meta?.default_width || 512;
      const h = model?.meta?.default_height || 512;
      const defaultSize = imageSizeOptions.length ? `${w}x${h}` : 'custom';
      if (!isOpenaiCompatible) {
        setParams((pre: object) => {
          const obj = _.merge({}, pre, _.pick(model?.meta, METAKEYS, {}));

          return {
            ...obj,
            size: defaultSize,
            width: w,
            height: h
          };
        });
        form.current?.form?.setFieldsValue({
          ..._.pick(model?.meta, METAKEYS, {}),
          size: defaultSize,
          width: w,
          height: h
        });
      }
      updateCacheFormData({
        ..._.pick(model?.meta, METAKEYS, {}),
        size: defaultSize,
        width: w,
        height: h
      });
    },
    [modelList, isOpenaiCompatible]
  );

  useEffect(() => {
    return () => {
      requestToken.current?.abort?.();
    };
  }, []);

  useEffect(() => {
    if (size === 'custom') {
      form.current?.form?.setFieldsValue({
        width: cacheFormData.current.width || 512,
        height: cacheFormData.current.height || 512
      });
      setParams((pre: object) => {
        return {
          ...pre,
          width: cacheFormData.current.width || 512,
          height: cacheFormData.current.height || 512
        };
      });
    }
  }, [size]);

  useEffect(() => {
    if (scroller.current) {
      initialize(scroller.current);
    }
  }, [scroller.current, initialize]);

  useEffect(() => {
    if (paramsRef.current) {
      innitializeParams(paramsRef.current);
    }
  }, [paramsRef.current, innitializeParams]);

  useEffect(() => {
    if (loading) {
      updateScrollerPosition();
    }
  }, [imageList, loading]);

  useEffect(() => {
    if (imageList.length > messageListLengthCache.current) {
      updateScrollerPosition();
    }
    messageListLengthCache.current = imageList.length;
  }, [imageList.length]);

  return (
    <div className="ground-left-wrapper">
      <div className="ground-left">
        <div
          className="message-list-wrap"
          ref={scroller}
          style={{ paddingBottom: 16 }}
        >
          <>
            <div className="content" style={{ height: '100%' }}>
              <ThumbImg
                style={{
                  padding: 0,
                  height: '100%',
                  justifyContent: 'center',
                  flexDirection: 'column',
                  flexWrap: 'unset',
                  alignItems: 'center'
                }}
                autoBgColor={false}
                editable={false}
                dataList={imageList}
                responseable={true}
                gutter={[8, 16]}
                autoSize={true}
              ></ThumbImg>
              {!imageList.length && (
                <div className="flex-column font-size-14 flex-center gap-20 justify-center hold-wrapper">
                  <span>
                    <FileImageOutlined className="font-size-32 text-secondary" />
                  </span>
                  <span>
                    {intl.formatMessage({ id: 'playground.params.empty.tips' })}
                  </span>
                </div>
              )}
            </div>
          </>
        </div>
        {tokenResult && (
          <div style={{ height: 40 }}>
            <AlertInfo
              type="danger"
              message={tokenResult?.errorMessage}
            ></AlertInfo>
          </div>
        )}
        <div className="ground-left-footer">
          <MessageInput
            ref={inputRef}
            placeholer={intl.formatMessage({
              id: 'playground.input.prompt.holder'
            })}
            actions={['clear']}
            defaultSize={{
              minRows: 5,
              maxRows: 5
            }}
            title={
              <span className="font-600">
                {intl.formatMessage({ id: 'playground.image.prompt' })}
              </span>
            }
            loading={loading}
            disabled={!parameters.model}
            isEmpty={!imageList.length}
            handleSubmit={handleSendMessage}
            handleAbortFetch={handleStopConversation}
            onInputChange={handleInputChange}
            shouldResetMessage={false}
            clearAll={handleClear}
            tools={
              <>
                <Tooltip
                  title={intl.formatMessage({
                    id: 'playground.image.prompt.random'
                  })}
                >
                  <Button
                    onClick={handleRandomPrompt}
                    size="middle"
                    type="text"
                    icon={<IconFont type="icon-random"></IconFont>}
                  ></Button>
                </Tooltip>
              </>
            }
          />
        </div>
      </div>
      <div
        className={classNames('params-wrapper', {
          collapsed: collapse
        })}
        ref={paramsRef}
      >
        <div className="box">
          <DynamicParams
            ref={form}
            parametersTitle={
              <div className="flex-between flex-center">
                <span>
                  {intl.formatMessage({ id: 'playground.parameters' })}
                </span>
                <Tooltip
                  title={intl.formatMessage({
                    id: 'playground.image.params.custom.tips'
                  })}
                >
                  <Button
                    size="middle"
                    type="text"
                    icon={<SwapOutlined />}
                    onClick={handleToggleParamsStyle}
                  >
                    {isOpenaiCompatible
                      ? intl.formatMessage({
                          id: 'playground.image.params.custom'
                        })
                      : intl.formatMessage({
                          id: 'playground.image.params.openai'
                        })}
                  </Button>
                </Tooltip>
              </div>
            }
            onModelChange={handleOnModelChange}
            setParams={setParams}
            paramsConfig={paramsConfig}
            initialValues={initialValues}
            params={parameters}
            selectedModel={selectModel}
            modelList={modelList}
            extra={[renderCustomSize, ...renderExtra, ...renderAdvanced]}
          />
        </div>
      </div>
      <ViewCommonCode
        open={show}
        viewCodeContent={viewCodeContent}
        onCancel={handleCloseViewCode}
        title={intl.formatMessage({ id: 'playground.viewcode' })}
      ></ViewCommonCode>
    </div>
  );
});

export default memo(GroundImages);
