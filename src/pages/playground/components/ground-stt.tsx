import { setRouteCache } from '@/atoms/route-cache';
import AlertInfo from '@/components/alert-info';
import AudioAnimation from '@/components/audio-animation';
import AudioPlayer from '@/components/audio-player';
import CopyButton from '@/components/copy-button';
import IconFont from '@/components/icon-font';
import UploadAudio from '@/components/upload-audio';
import routeCachekey from '@/config/route-cachekey';
import { HEADER_HEIGHT } from '@/config/settings';
import useOverlayScroller from '@/hooks/use-overlay-scroller';
import { useCancelToken } from '@/hooks/use-request-token';
import { readAudioFile } from '@/utils/load-audio-file';
import { SendOutlined } from '@ant-design/icons';
import { useIntl, useSearchParams } from '@umijs/max';
import { Button, Spin, Tooltip } from 'antd';
import classNames from 'classnames';
import _ from 'lodash';
import React, {
  forwardRef,
  useCallback,
  useEffect,
  useImperativeHandle,
  useMemo,
  useRef,
  useState
} from 'react';
import { AUDIO_SPEECH_TO_TEXT_API, speechToText } from '../apis';
import {
  SpeechToTextFormat,
  defaultLanguages,
  extractErrorMessage
} from '../config';
import { allLanguages } from '../config/languages';
import { RealtimeParamsConfig as paramsConfig } from '../config/params-config';
import { ParamsSchema } from '../config/types';
import '../style/ground-llm.less';
import '../style/speech-to-text.less';
import '../style/system-message-wrap.less';
import { speechToTextCode } from '../view-code/audio';
import AudioInput from './audio-input';
import DynamicParams from './dynamic-params';
import ViewCommonCode from './view-common-code';

interface MessageProps {
  modelList: Global.BaseOption<string>[];
  ref?: any;
}

const GroundSTT: React.FC<MessageProps> = forwardRef((props, ref) => {
  const intl = useIntl();
  const { modelList } = props;
  const messageId = useRef<number>(0);
  const [messageList, setMessageList] = useState<
    { uid: number; content: string }[]
  >([]);
  const [searchParams] = useSearchParams();
  const modelType = searchParams.get('type') || '';
  const selectModel = searchParams.get('model')
    ? modelType === 'stt' && searchParams.get('model')
    : '';
  const defaultModel = selectModel || modelList[0]?.value || '';
  const [parameters, setParams] = useState<any>({
    model: defaultModel,
    language: 'auto'
  });
  const [show, setShow] = useState(false);
  const [loading, setLoading] = useState(false);
  const [tokenResult, setTokenResult] = useState<any>(null);
  const [collapse, setCollapse] = useState(false);
  const scroller = useRef<any>(null);
  const paramsRef = useRef<any>(null);
  const [audioPermissionOn, setAudioPermissionOn] = useState(true);
  const [audioData, setAudioData] = useState<any>(null);
  const [audioChunks, setAudioChunks] = useState<any>({
    data: [],
    analyser: null
  });
  const [isRecording, setIsRecording] = useState(false);
  const formRef = useRef<any>(null);
  const { updateCancelToken, getCanceltToken, cancelRequest } =
    useCancelToken();

  const { initialize, updateScrollerPosition } = useOverlayScroller();
  const { initialize: innitializeParams } = useOverlayScroller();
  const [modelMeta, setModelMeta] = useState<any>(null);
  const [fieldsConfig, setFieldsConfig] =
    useState<ParamsSchema[]>(paramsConfig);

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

  const setMessageId = () => {
    messageId.current = messageId.current + 1;
  };

  const viewCodeContent = useMemo(() => {
    return speechToTextCode({
      api: AUDIO_SPEECH_TO_TEXT_API,
      parameters: {
        ...parameters
      }
    });
  }, [parameters]);

  const handleStopConversation = () => {
    cancelRequest();
    setLoading(false);
  };

  const submitMessage = async () => {
    try {
      await formRef.current?.form.validateFields();
      if (!parameters.model) return;
      setLoading(true);
      setMessageId();
      setTokenResult(null);
      setMessageList([]);

      updateCancelToken();

      setRouteCache(routeCachekey['/playground/speech'], true);
      const params = {
        ...parameters,
        file: new File([audioData.data], audioData.name, {
          type: audioData.type
        })
      };
      const result: any = await speechToText(
        {
          data: params
        },
        {
          cancelToken: getCanceltToken()
        }
      );

      if (
        (result?.status_code && result?.status_code !== 200) ||
        result?.error
      ) {
        setTokenResult({
          error: true,
          errorMessage: extractErrorMessage(result)
        });
        return;
      }
      setMessageList([
        {
          content: result.text,
          uid: messageId.current
        }
      ]);
    } catch (error: any) {
      console.log('error:', error);
      const res = error?.response?.data;
      if (res?.error || (res?.status_code && res?.status_code !== 200)) {
        setTokenResult({
          error: true,
          errorMessage: extractErrorMessage(res)
        });
      }
    } finally {
      setLoading(false);
      setIsRecording(false);
      setRouteCache(routeCachekey['/playground/speech'], false);
    }
  };
  const handleClear = () => {
    setMessageId();
    setMessageList([]);
    setTokenResult(null);
  };

  const handleCloseViewCode = () => {
    setShow(false);
  };

  const handleOnAudioData = useCallback(
    (data: {
      chunks: Blob[];
      url: string;
      name: string;
      duration: number;
      type: string;
    }) => {
      setAudioData(() => {
        return {
          url: data.url,
          name: data.name,
          data: data.chunks,
          type: data.type,
          duration: data.duration
        };
      });
    },
    []
  );

  const handleOnAudioPermission = useCallback((permission: boolean) => {
    setAudioPermissionOn(permission);
  }, []);

  const handleUploadChange = useCallback(
    async (data: { file: any; fileList: any }) => {
      try {
        const res = await readAudioFile(data.file);
        setAudioData(res);
        setTokenResult(null);
      } catch (error) {}
    },
    []
  );

  const handleOnAnalyse = useCallback((data: any, analyser: any) => {
    setAudioChunks((pre: any) => {
      return {
        data: data,
        analyser: analyser
      };
    });
  }, []);
  const handleOnRecord = useCallback((val: boolean) => {
    setIsRecording(val);
    setAudioData(null);
    setTokenResult(null);
    setMessageList([]);
  }, []);

  const handleOnGenerate = async () => {
    if (loading) {
      handleStopConversation();
      return;
    }
    submitMessage();
  };

  const renderAniamtion = () => {
    if (!audioPermissionOn) {
      return (
        <div className="tips-text">
          <IconFont type={'icon-audio'} style={{ fontSize: 20 }}></IconFont>
          <span>
            {intl.formatMessage({ id: 'playground.audio.enablemic' })}
          </span>
        </div>
      );
    }
    if (isRecording) {
      return (
        <AudioAnimation
          fixedHeight={true}
          height={82}
          width={500}
          analyserData={audioChunks}
        ></AudioAnimation>
      );
    }

    return (
      <div className="tips-text">
        <IconFont type={'icon-audio'} style={{ fontSize: 18 }}></IconFont>
        <span>
          {intl.formatMessage({ id: 'playground.audio.speechtotext.tips' })}
        </span>
      </div>
    );
  };

  const handleSelectModel = (model: string) => {
    if (!model) return;
    const selected = modelList.find((item) => item.value === model);
    setModelMeta(selected?.meta || {});
    const languages = selected?.meta?.languages || [];
    let currentLanguage = [...defaultLanguages];
    if (languages.length > 0) {
      // sort languages based on the order in the model meta
      currentLanguage = [];

      languages.forEach((langCode: string) => {
        const langItem = allLanguages.find((item) => item.value === langCode);
        if (langItem) {
          currentLanguage.push(langItem);
        }
      });

      const newConfig = paramsConfig.map((item) => {
        const oItem = _.cloneDeep(item);
        if (item.name === 'language') {
          return {
            ...oItem,
            options: currentLanguage
          };
        }
        return oItem;
      });
      setFieldsConfig(newConfig);
    }
    setParams((pre: any) => {
      return {
        ...pre,
        language:
          selected?.meta?.language || currentLanguage[0]?.value || 'auto',
        model: model
      };
    });
  };

  const handleOnValuesChange = (changedValues: any, allValues: any) => {
    if (changedValues.model) {
      handleSelectModel(changedValues.model);
    } else {
      setParams(allValues);
    }
  };

  useEffect(() => {
    if (scroller.current) {
      initialize(scroller.current);
    }
  }, [initialize]);

  useEffect(() => {
    if (paramsRef.current) {
      innitializeParams(paramsRef.current);
    }
  }, [innitializeParams]);

  useEffect(() => {
    if (loading) {
      updateScrollerPosition();
    }
  }, [messageList, loading]);

  useEffect(() => {
    const defaultModel = selectModel || modelList[0]?.value || '';
    handleSelectModel(defaultModel);
  }, [modelList, selectModel]);

  return (
    <div
      className="ground-left-wrapper"
      style={{
        height: `calc(100vh - ${HEADER_HEIGHT}px)`
      }}
    >
      <div className="ground-left">
        <div className="ground-left-footer" style={{ flex: 1 }}>
          <div className="speech-to-text">
            <div className="speech-box">
              {!isRecording && (
                <UploadAudio
                  type="default"
                  accept={SpeechToTextFormat.join(', ')}
                  onChange={handleUploadChange}
                ></UploadAudio>
              )}
              <AudioInput
                type="default"
                voiceActivity={true}
                onAudioData={handleOnAudioData}
                onAudioPermission={handleOnAudioPermission}
                onAnalyse={handleOnAnalyse}
                onRecord={handleOnRecord}
              ></AudioInput>
            </div>

            {audioData ? (
              <div className="flex-between flex-center justify-center relative">
                <div style={{ width: 600 }}>
                  <AudioPlayer
                    url={audioData.url}
                    name={audioData.name}
                    duration={audioData.duration}
                    extra={
                      <Tooltip
                        title={
                          loading
                            ? intl.formatMessage({
                                id: 'common.button.stop'
                              })
                            : intl.formatMessage({
                                id: 'playground.audio.button.generate'
                              })
                        }
                      >
                        {
                          <Button
                            disabled={!audioData}
                            type="primary"
                            size="middle"
                            shape="circle"
                            onClick={handleOnGenerate}
                            icon={
                              loading ? (
                                <IconFont
                                  type="icon-stop1"
                                  className="font-size-14"
                                ></IconFont>
                              ) : (
                                <SendOutlined></SendOutlined>
                              )
                            }
                          ></Button>
                        }
                      </Tooltip>
                    }
                  ></AudioPlayer>
                </div>
              </div>
            ) : (
              renderAniamtion()
            )}
          </div>
        </div>
        <div
          style={{
            flex: 1,
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            overflow: 'auto'
          }}
        >
          <div
            className="message-list-wrap"
            style={{
              flex: 1,
              position: 'relative'
            }}
          >
            {messageList?.length > 0 && (
              <span
                style={{
                  position: 'absolute',
                  top: 20,
                  right: 32,
                  zIndex: 10
                }}
              >
                <CopyButton
                  text={messageList[0]?.content}
                  type="link"
                ></CopyButton>
              </span>
            )}
            <div
              className="content"
              style={{ height: '100%', overflow: 'auto' }}
              ref={scroller}
            >
              <div>
                {!tokenResult && (
                  <div
                    style={{
                      padding: '8px 14px',
                      lineHeight: '20px',
                      display: 'flex',
                      justifyContent: 'center',
                      wordBreak: 'break-word'
                    }}
                  >
                    {messageList.length ? (
                      messageList[0]?.content
                    ) : (
                      <span className="text-tertiary">
                        {intl.formatMessage({
                          id: 'playground.audio.generating.tips'
                        })}
                      </span>
                    )}
                  </div>
                )}
                {tokenResult && (
                  <div style={{ height: 40 }}>
                    <AlertInfo
                      type="danger"
                      message={tokenResult?.errorMessage}
                    ></AlertInfo>
                  </div>
                )}
              </div>
            </div>
            {loading && (
              <div style={{ width: '100%', flex: 1 }}>
                <Spin size="small">
                  <div style={{ height: '46px' }}></div>
                </Spin>
              </div>
            )}
          </div>
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
            ref={formRef}
            onValuesChange={handleOnValuesChange}
            paramsConfig={fieldsConfig}
            initialValues={parameters}
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

export default GroundSTT;
