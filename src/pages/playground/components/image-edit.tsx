import { setRouteCache } from '@/atoms/route-cache';
import AlertInfo from '@/components/alert-info';
import SingleImage from '@/components/auto-image/single-image';
import IconFont from '@/components/icon-font';
import CanvasImageEditor from '@/components/image-editor';
import { processImage } from '@/components/image-editor/extract-image-colors';
import routeCachekey from '@/config/route-cachekey';
import UploadImg from '@/pages/playground/components/upload-img';
import { base64ToFile, generateRandomNumber } from '@/utils';
import { useIntl } from '@umijs/max';
import { Divider } from 'antd';
import classNames from 'classnames';
import _ from 'lodash';
import 'overlayscrollbars/overlayscrollbars.css';
import React, {
  forwardRef,
  useCallback,
  useEffect,
  useImperativeHandle,
  useMemo,
  useRef,
  useState
} from 'react';
import { EDIT_IMAGE_API } from '../apis';
import { EDIT_IMAGE_ACCEPT, scaleImageSize } from '../config';
import { useInitImageMeta } from '../hooks/use-init-meta';
import useTextImage from '../hooks/use-text-image';
import '../style/ground-llm.less';
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

const GroundImages: React.FC<MessageProps> = forwardRef((props, ref) => {
  const { modelList } = props;

  const intl = useIntl();
  const [show, setShow] = useState(false);
  const [collapse, setCollapse] = useState(false);
  const scroller = useRef<any>(null);
  const paramsRef = useRef<any>(null);
  const inputRef = useRef<any>(null);
  const [image, setImage] = useState<string>('');
  const [mask, setMask] = useState<string | null>(null);
  const [uploadList, setUploadList] = useState<any[]>([]);
  const [maskUpload, setMaskUpload] = useState<any[]>([]);
  const [imageStatus, setImageStatus] = useState<{
    isOriginal: boolean;
    isResetNeeded: boolean;
    width: number;
    height: number;
  }>({
    isOriginal: false,
    isResetNeeded: false,
    width: 512,
    height: 512
  });
  const doneImage = useRef<boolean>(false);
  const [activeImgUid, setActiveImgUid] = useState<number>(0);
  const imageEditorRef = useRef<any>(null);

  const {
    handleOnValuesChange,
    handleToggleParamsStyle,
    setParams,
    updateCacheFormData,
    setInitialValues,
    updateParamsConfig,
    setParamsConfig,
    form,
    modelMeta,
    formFields,
    paramsConfig,
    initialValues,
    parameters,
    isOpenaiCompatible
  } = useInitImageMeta(props, {
    type: 'edit'
  });
  const {
    loading,
    tokenResult,
    imageList,
    currentPrompt,
    setImageList,
    setCurrentPrompt,
    handleStopConversation,
    submitMessage
  } = useTextImage({
    scroller,
    paramsRef,
    chunkFields: ['stream_options_chunk_result'],
    API: EDIT_IMAGE_API
  });

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

  const finalParameters = useMemo(() => {
    if (parameters.size === 'custom') {
      return {
        ..._.omit(parameters, ['width', 'height', 'preview', 'random_seed']),
        image: null,
        mask: null,
        size:
          parameters.width && parameters.height
            ? `${parameters.width}x${parameters.height}`
            : ''
      };
    }
    return {
      image: null,
      mask: null,
      ..._.omit(parameters, ['width', 'height', 'random_seed', 'preview'])
    };
  }, [parameters]);

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
  }, [finalParameters, currentPrompt, isOpenaiCompatible]);

  const handleClear = () => {
    setCurrentPrompt('');
  };

  const handleInputChange = (e: any) => {
    setCurrentPrompt(e.target.value);
  };

  const generateParams = () => {
    const params = {
      ..._.omitBy(finalParameters, (value: string) => !value),
      seed: parameters.random_seed
        ? generateRandomNumber()
        : parameters.seed || null,
      stream: false,
      prompt: currentPrompt
    };
    return params;
  };

  const handleSendMessage = async () => {
    try {
      await form.current?.form?.validateFields();
      if (!parameters.model) return;
      const params = generateParams();
      setParams({
        ...parameters,
        seed: params.seed
      });

      form.current?.form?.setFieldValue('seed', params.seed);

      setRouteCache(routeCachekey['/playground/text-to-image'], true);

      await submitMessage({
        ...params,
        image: base64ToFile(_.get(uploadList, '0.dataUrl'), 'image'),
        mask: mask ? base64ToFile(mask, 'mask') : null
      });
    } catch (error) {
      // console.log('error:', error);
    } finally {
      console.log('finally---------');
      setRouteCache(routeCachekey['/playground/text-to-image'], false);
    }
  };

  const handleCloseViewCode = () => {
    setShow(false);
  };

  const handleOnScaleImageSize = useCallback(
    (data: { rawWidth: number; rawHeight: number }) => {
      let { width, height } = scaleImageSize({
        width: data.rawWidth,
        height: data.rawHeight
      });
      const { max_width: maxWidth, max_height: maxHeight } = modelMeta;

      // update width, height
      if (maxWidth) {
        width = Math.max(Math.min(width, maxWidth), 512);
      }

      if (maxHeight) {
        height = Math.max(Math.min(height, maxHeight), 512);
      }

      const newParamsConfig = updateParamsConfig({
        size: 'custom',
        isOpenaiCompatible
      });
      setParamsConfig(newParamsConfig);
      const newParameters = {
        ...parameters,
        size: 'custom',
        width: width || 512,
        height: height || 512
      };
      setParams(newParameters);
      updateCacheFormData({
        size: 'custom',
        width: width || 512,
        height: height || 512
      });
      setInitialValues(newParameters);
    },
    [parameters, modelMeta, isOpenaiCompatible]
  );

  const handleUpdateImageList = useCallback(
    (base64List: any[]) => {
      const currentImg = _.get(base64List, '[0]', {});
      const img = _.get(currentImg, 'dataUrl', '');
      handleOnScaleImageSize(currentImg);
      setUploadList(base64List);
      setImage(img);
      setActiveImgUid(_.get(base64List, '[0].uid', ''));
      setImageStatus({
        isOriginal: true,
        isResetNeeded: true,
        width: _.get(currentImg, 'width', 512),
        height: _.get(currentImg, 'height', 512)
      });
      setImageList([]);
    },
    [handleOnScaleImageSize]
  );

  const handleUpdateMaskList = useCallback(async (base64List: any[]) => {
    const mask = _.get(base64List, '[0].dataUrl', '');
    const maskColors = await processImage(mask);
    console.log('maskColors:', maskColors);
    imageEditorRef.current?.loadMaskPixs(maskColors || []);
  }, []);

  const handleClearUploadMask = useCallback(() => {
    setMaskUpload([]);
    setMask(null);
    imageEditorRef.current?.clearMask();
  }, []);

  const handleOnSave = useCallback(
    (data: { img: string; mask: string | null }) => {
      setImageStatus((pre) => {
        return {
          ...pre,
          isResetNeeded: false
        };
      });
      setMask(data.mask || maskUpload[0]?.dataUrl || null);
      setImage(data.img);
    },
    []
  );

  const renderImageEditor = useMemo(() => {
    if (image) {
      return (
        <CanvasImageEditor
          ref={imageEditorRef}
          imguid={activeImgUid}
          imageStatus={imageStatus}
          imageSrc={image}
          loading={loading}
          disabled={loading || !imageStatus.isOriginal}
          onSave={handleOnSave}
          clearUploadMask={handleClearUploadMask}
          handleUpdateImageList={handleUpdateImageList}
          handleUpdateMaskList={handleUpdateMaskList}
          maskUpload={maskUpload}
          accept={EDIT_IMAGE_ACCEPT}
        ></CanvasImageEditor>
      );
    }
    return (
      <>
        <UploadImg
          accept={EDIT_IMAGE_ACCEPT}
          drag={true}
          multiple={false}
          handleUpdateImgList={handleUpdateImageList}
        >
          <div
            className="flex-column flex-center gap-10 justify-center"
            style={{ width: 155, height: 155 }}
          >
            <IconFont
              type="icon-upload_image"
              className="font-size-24"
            ></IconFont>
            <span>
              {intl.formatMessage({ id: 'playground.image.edit.tips' })}
            </span>
          </div>
        </UploadImg>
      </>
    );
  }, [
    intl,
    image,
    loading,
    maskUpload,
    imageStatus,
    handleOnSave,
    handleUpdateImageList
  ]);

  const handleOnImgClick = useCallback(
    (item: any, isOrigin: boolean) => {
      if (item.progress < 100 && !isOrigin) {
        return;
      }
      if (item.uid === activeImgUid) {
        return;
      }
      setActiveImgUid(item.uid);
      setImage(item.dataUrl);
      setImageStatus({
        isOriginal: isOrigin,
        isResetNeeded: false,
        width: item.width,
        height: item.height
      });
    },
    [activeImgUid]
  );

  useEffect(() => {
    if (imageList.length > 0) {
      const doneImg = imageList.find((item) => item.progress === 100);
      if (doneImg && !doneImage.current) {
        doneImage.current = true;
        handleOnImgClick(doneImg, false);
      }
    }
  }, [imageList, handleOnImgClick]);

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
          preview={false}
          loading={false}
          autoSize={false}
          editable={false}
          autoBgColor={false}
          onClick={() => handleOnImgClick(uploadList[0], true)}
          label={
            <span>{intl.formatMessage({ id: 'playground.image.origin' })}</span>
          }
        ></SingleImage>
      </>
    );
  }, [uploadList, intl, handleOnImgClick]);

  const renderMaskImage = useMemo(() => {
    if (!maskUpload.length) {
      return null;
    }
    return (
      <>
        <SingleImage
          {...maskUpload[0]}
          height={125}
          maxHeight={125}
          preview={false}
          loading={false}
          autoSize={false}
          editable={true}
          autoBgColor={false}
          onDelete={() => handleClearUploadMask()}
          label={
            <span>{intl.formatMessage({ id: 'playground.image.mask' })}</span>
          }
        ></SingleImage>
      </>
    );
  }, [maskUpload, intl]);

  return (
    <div className="ground-left-wrapper">
      <div className="ground-left">
        <div className="message-list-wrap" style={{ paddingBottom: 16 }}>
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
            <div className="m-r-10">{renderMaskImage}</div>
            {renderOriginImage}
            {imageList.length > 0 && (
              <>
                <Divider
                  orientation="vertical"
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
                          width: 125,
                          maxHeight: 125
                        }}
                        key={item.uid}
                      >
                        <SingleImage
                          {...item}
                          height={125}
                          width={125}
                          maxHeight={125}
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
        <div
          style={{ flex: 1, overflow: 'auto' }}
          ref={paramsRef}
          data-overlayscrollbars-initialize
        >
          <div className="box">
            <DynamicParams
              ref={form}
              formFields={formFields}
              onValuesChange={handleOnValuesChange}
              paramsConfig={paramsConfig}
              initialValues={initialValues}
              modelList={modelList}
            />
          </div>
        </div>
        <div style={{ width: 389 }}>
          <MessageInput
            actions={[]}
            defaultSize={{
              minRows: 5,
              maxRows: 5
            }}
            ref={inputRef}
            placeholer={intl.formatMessage({
              id: 'playground.input.prompt.holder'
            })}
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

export default GroundImages;
