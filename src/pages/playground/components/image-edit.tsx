import AlertInfo from '@/components/alert-info';
import SingleImage from '@/components/auto-image/single-image';
import IconFont from '@/components/icon-font';
import CanvasImageEditor from '@/components/image-editor';
import FieldComponent from '@/components/seal-form/field-component';
import SealSelect from '@/components/seal-form/seal-select';
import useOverlayScroller from '@/hooks/use-overlay-scroller';
import UploadImg from '@/pages/playground/components/upload-img';
import { base64ToFile, generateRandomNumber } from '@/utils';
import {
  fetchChunkedDataPostFormData as fetchChunkedData,
  readLargeStreamData as readStreamData
} from '@/utils/fetch-chunk-data';
import { SwapOutlined } from '@ant-design/icons';
import { useIntl, useSearchParams } from '@umijs/max';
import { Button, Divider, Form, Tooltip } from 'antd';
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
import { EDIT_IMAGE_API } from '../apis';
import {
  ImageAdvancedParamsConfig,
  ImageCustomSizeConfig,
  ImageconstExtraConfig,
  ImageEidtParamsConfig as paramsConfig
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
const advancedFieldsDefaultValus = {
  seed: 1,
  sample_method: 'euler_a',
  cfg_scale: 4.5,
  sampling_steps: 10,
  negative_prompt: null,
  preview: null,
  schedule_method: 'discrete'
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
      preview?: boolean;
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
  const form = useRef<any>(null);
  const inputRef = useRef<any>(null);
  const [image, setImage] = useState<string>('');
  const [mask, setMask] = useState<string>('');
  const [uploadList, setUploadList] = useState<any[]>([]);
  const [imageStatus, setImageStatus] = useState<{
    isOriginal: boolean;
    isResetNeeded: boolean;
  }>({
    isOriginal: false,
    isResetNeeded: false
  });

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
      size.span = 8;
    }
    if (parameters.n === 4) {
      size.span = 6;
    }
    return size;
  }, [parameters.n]);

  const imageFile = useMemo(() => {
    return base64ToFile(image, 'image');
  }, [image]);

  const maskFile = useMemo(() => {
    return base64ToFile(mask, 'mask');
  }, [mask]);

  const finalParameters = useMemo(() => {
    if (parameters.size === 'custom') {
      return {
        ..._.omit(parameters, ['width', 'height', 'preview']),
        image: imageFile,
        mask: maskFile,
        size:
          parameters.width && parameters.height
            ? `${parameters.width}x${parameters.height}`
            : ''
      };
    }
    return {
      image: imageFile,
      mask: maskFile,
      ..._.omit(parameters, ['width', 'height', 'random_seed', 'preview'])
    };
  }, [parameters, maskFile, imageFile]);

  const viewCodeContent = useMemo(() => {
    if (isOpenaiCompatible) {
      return generateOpenaiImageCode({
        api: EDIT_IMAGE_API,
        edit: true,
        isFormdata: true,
        parameters: {
          ...finalParameters,
          prompt: currentPrompt
        }
      });
    }
    return generateImageCode({
      api: EDIT_IMAGE_API,
      isFormdata: true,
      edit: true,
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

      const imgSize = _.split(finalParameters.size, 'x');

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
            progressType: stream_options.chunk_results ? 'dashboard' : 'line',
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
        url: `http://192.168.50.4:40325/v1/images/edits?t=${Date.now()}`,
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
    }
  };
  const handleClear = () => {
    setMessageId();
    setImageList([]);
    setTokenResult(null);
    setMask('');
    setImage('');
    setUploadList([]);
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
        ...advancedFieldsDefaultValus
      });
      setParams((pre: object) => {
        return {
          ..._.omit(pre, _.keys(openaiCompatibleFieldsDefaultValus)),
          ...advancedFieldsDefaultValus
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
            onChange={item.name === 'random_seed' ? handleFieldChange : null}
            {..._.omit(item, ['name', 'rules', 'disabledConfig'])}
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
              {...item.attrs}
              {..._.omit(item, [
                'name',
                'description',
                'rules',
                'disabledConfig'
              ])}
            ></FieldComponent>
          </Form.Item>
        );
      });
    }
    return null;
  }, [size, intl]);

  const handleUpdateImageList = useCallback((base64List: any) => {
    const img = _.get(base64List, '[0].dataUrl', '');
    setUploadList(base64List);
    setImage(img);
    setImageStatus({
      isOriginal: false,
      isResetNeeded: true
    });
    setImageList([]);
  }, []);

  const handleOnSave = useCallback((url: string) => {
    setImageStatus({
      isOriginal: true,
      isResetNeeded: false
    });
    setMask(url);
  }, []);

  const renderImageEditor = useMemo(() => {
    console.log('image:', image);
    if (image) {
      return (
        <CanvasImageEditor
          imageStatus={imageStatus}
          imageSrc={image}
          disabled={loading}
          onSave={handleOnSave}
          uploadButton={
            <Tooltip title="Upload Image">
              <UploadImg
                disabled={loading}
                handleUpdateImgList={handleUpdateImageList}
                size="middle"
              ></UploadImg>
            </Tooltip>
          }
        ></CanvasImageEditor>
      );
    }
    return (
      <UploadImg
        drag={true}
        multiple={false}
        handleUpdateImgList={handleUpdateImageList}
      >
        <div
          className="flex-column flex-center gap-10 justify-center"
          style={{ width: 150, height: 150 }}
        >
          <IconFont
            type="icon-upload_image"
            className="font-size-24"
          ></IconFont>
          <h3>Click or drag image to this area to upload</h3>
        </div>
      </UploadImg>
    );
  }, [image, loading, imageStatus, handleOnSave, handleUpdateImageList]);

  const handleOnImgClick = useCallback((item: any, isOrigin: boolean) => {
    setImage(item.dataUrl);
    setImageStatus({
      isOriginal: isOrigin,
      isResetNeeded: false
    });
  }, []);

  const renderOriginImage = useMemo(() => {
    if (!uploadList.length) {
      return null;
    }
    return (
      <>
        <SingleImage
          {...uploadList[0]}
          height={125}
          maxHeight={125}
          preview={true}
          loading={false}
          autoSize={false}
          editable={false}
          autoBgColor={false}
          onClick={() => handleOnImgClick(uploadList[0], true)}
        ></SingleImage>
      </>
    );
  }, [uploadList, handleOnImgClick]);

  useEffect(() => {
    return () => {
      requestToken.current?.abort?.();
    };
  }, []);

  useEffect(() => {
    if (size === 'custom') {
      form.current?.form?.setFieldsValue({
        width: 512,
        height: 512
      });
      setParams((pre: object) => {
        return {
          ...pre,
          width: 512,
          height: 512
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
              {
                <div className="flex-column font-size-14 flex-center gap-20 justify-center hold-wrapper">
                  {renderImageEditor}
                </div>
              }
            </div>
          </>
        </div>
        <div className="ground-left-footer" style={{ padding: 10 }}>
          {tokenResult && (
            <div style={{ height: 40 }}>
              <AlertInfo
                type="danger"
                message={tokenResult?.errorMessage}
              ></AlertInfo>
            </div>
          )}
          <div
            style={{
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center'
            }}
          >
            {renderOriginImage}
            {imageList.length > 0 && (
              <>
                <Divider
                  type="vertical"
                  style={{
                    margin: '0 30px',
                    height: 80
                  }}
                ></Divider>
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'center',
                    alignItems: 'center',
                    gap: 10
                  }}
                >
                  {_.map(imageList, (item: any, index: number) => {
                    return (
                      <div
                        style={{
                          height: 125,
                          minWidth: 125,
                          maxHeight: 125
                        }}
                        key={item.uid}
                      >
                        <SingleImage
                          {...item}
                          height={125}
                          maxHeight={125}
                          key={item.uid}
                          preview={item.preview}
                          loading={item.loading}
                          autoSize={false}
                          editable={false}
                          autoBgColor={false}
                          onClick={() => handleOnImgClick(item, false)}
                        ></SingleImage>
                      </div>
                    );
                  })}
                </div>
              </>
            )}
          </div>
        </div>
      </div>
      <div
        className={classNames('params-wrapper', {
          collapsed: collapse
        })}
        style={{
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden'
        }}
      >
        <div style={{ flex: 1, overflow: 'auto' }} ref={paramsRef}>
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
        <div style={{ width: 389 }}>
          <MessageInput
            defaultSize={{
              minRows: 5,
              maxRows: 5
            }}
            ref={inputRef}
            placeholer={intl.formatMessage({
              id: 'playground.input.prompt.holder'
            })}
            actions={['clear']}
            title={
              <span className="font-600">
                {intl.formatMessage({ id: 'playground.image.prompt' })}
              </span>
            }
            loading={loading}
            disabled={!parameters.model || mask === ''}
            isEmpty={!imageList.length}
            handleSubmit={handleSendMessage}
            handleAbortFetch={handleStopConversation}
            onInputChange={handleInputChange}
            shouldResetMessage={false}
            clearAll={handleClear}
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