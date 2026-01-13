import { setRouteCache } from '@/atoms/route-cache';
import AlertInfo from '@/components/alert-info';
import routeCachekey from '@/config/route-cachekey';
import { VideoCameraOutlined } from '@ant-design/icons';
import { useIntl } from '@umijs/max';
import { Spin } from 'antd';
import classNames from 'classnames';
import _ from 'lodash';
import 'overlayscrollbars/overlayscrollbars.css';
import React, {
  forwardRef,
  useCallback,
  useImperativeHandle,
  useMemo,
  useRef,
  useState
} from 'react';
import { CREATE_VIDEO_API } from '../apis';
import { useInitVideoMeta } from '../hooks/use-init-video-meta';
import useTextVideo from '../hooks/use-text-video';
import '../style/ground-llm.less';
import '../style/system-message-wrap.less';
import { generateCode } from '../view-code/video';
import DynamicParams from './dynamic-params';
import MessageInput from './message-input';
import ViewCommonCode from './view-common-code';

interface MessageProps {
  modelList: Global.BaseOption<string>[];
  loaded?: boolean;
  ref?: any;
}

const GroundVideo: React.FC<MessageProps> = forwardRef((props, ref) => {
  const { modelList } = props;

  const intl = useIntl();
  const [show, setShow] = useState(false);
  const [collapse, setCollapse] = useState(false);
  const scroller = useRef<any>(null);
  const paramsRef = useRef<any>(null);
  const inputRef = useRef<any>(null);

  const {
    handleOnValuesChange,
    handleToggleParamsStyle,
    setParams,
    form,
    formFields,
    paramsConfig,
    initialValues,
    parameters,
    isOpenaiCompatible
  } = useInitVideoMeta(props, {
    type: 'create'
  });
  const {
    loading,
    tokenResult,
    videoList,
    promptList,
    currentPrompt,
    setCurrentPrompt,
    handleClear,
    handleStopConversation,
    submitMessage
  } = useTextVideo({
    scroller,
    paramsRef,
    API: CREATE_VIDEO_API
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

  const generateNumber = (min: number, max: number) => {
    return Math.floor(Math.random() * (max - min + 1) + min);
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

  const finalParameters = useMemo(() => {
    if (parameters.size === 'custom') {
      return {
        ..._.omit(parameters, ['width', 'height', 'random_seed', 'seed']),
        size:
          parameters.width && parameters.height
            ? `${parameters.width}x${parameters.height}`
            : ''
      };
    }
    return {
      ..._.omit(parameters, ['width', 'height', 'random_seed', 'seed'])
    };
  }, [parameters]);

  const viewCodeContent = useMemo(() => {
    return generateCode({
      api: CREATE_VIDEO_API,
      isFormdata: true,
      parameters: {
        ...finalParameters,
        prompt: currentPrompt
      }
    });
  }, [finalParameters, isOpenaiCompatible, currentPrompt]);

  const handleInputChange = (e: any) => {
    setCurrentPrompt(e.target.value);
  };

  const generateParams = () => {
    const params = {
      ..._.omitBy(finalParameters, (value: string) => !value),
      prompt: currentPrompt
    };
    return params;
  };

  const handleSendMessage = async () => {
    try {
      await form.current?.form?.validateFields();
      if (!parameters.model) return;
      const params = generateParams();
      console.log('generateParams:', params);
      setParams({
        ...parameters
      });

      console.log('params:', params, parameters);
      setRouteCache(routeCachekey['/playground/video'], true);
      await submitMessage(params);
    } catch (error) {
      // console.log('error:', error);
    } finally {
      console.log('finally---------');
      setRouteCache(routeCachekey['/playground/video'], false);
    }
  };

  const handleCloseViewCode = useCallback(() => {
    setShow(false);
  }, []);

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
              {videoList.length > 0 && (
                <div
                  style={{
                    width: '100%',
                    maxWidth: 720,
                    margin: '24px auto',
                    aspectRatio: '16 / 9',
                    background: '#000',
                    borderRadius: 8,
                    overflow: 'hidden',
                    boxShadow: '0 4px 24px rgba(0,0,0,0.12)'
                  }}
                >
                  <Spin spinning={loading}>
                    <video
                      src={videoList[0]?.dataUrl}
                      poster="https://placehold.co/640x360.png?text=GPUStack"
                      controls
                      disablePictureInPicture
                      style={{
                        width: '100%',
                        height: '100%',
                        objectFit: 'contain'
                      }}
                    />
                  </Spin>
                </div>
              )}
              {!videoList.length && (
                <div className="flex-column font-size-14 flex-center gap-20 justify-center hold-wrapper">
                  <VideoCameraOutlined className="font-size-32 text-secondary" />
                  <span>
                    {intl.formatMessage({
                      id: 'playground.video.empty.tips'
                    })}
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
            actions={[]}
            defaultSize={{
              minRows: 5,
              maxRows: 5
            }}
            title={intl.formatMessage({ id: 'playground.image.prompt' })}
            loading={loading}
            disabled={!parameters.model}
            isEmpty={!videoList.length}
            handleSubmit={handleSendMessage}
            handleAbortFetch={handleStopConversation}
            onInputChange={handleInputChange}
            shouldResetMessage={false}
            clearAll={handleClear}
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
            onValuesChange={handleOnValuesChange}
            paramsConfig={paramsConfig}
            initialValues={initialValues}
            modelList={modelList}
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

export default GroundVideo;
