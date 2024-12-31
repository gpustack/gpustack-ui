import { setRouteCache } from '@/atoms/route-cache';
import AlertInfo from '@/components/alert-info';
import AudioAnimation from '@/components/audio-animation';
import AudioPlayer from '@/components/audio-player';
import CopyButton from '@/components/copy-button';
import IconFont from '@/components/icon-font';
import UploadAudio from '@/components/upload-audio';
import routeCachekey from '@/config/route-cachekey';
import useOverlayScroller from '@/hooks/use-overlay-scroller';
import { useCancelToken } from '@/hooks/use-request-token';
import { readAudioFile } from '@/utils/load-audio-file';
import { SendOutlined } from '@ant-design/icons';
import { useIntl, useSearchParams } from '@umijs/max';
import { Button, Spin, Tooltip } from 'antd';
import classNames from 'classnames';
import 'overlayscrollbars/overlayscrollbars.css';
import {
  forwardRef,
  memo,
  useCallback,
  useEffect,
  useImperativeHandle,
  useMemo,
  useRef,
  useState
} from 'react';
import { speechToText } from '../apis';
import { RealtimeParamsConfig as paramsConfig } from '../config/params-config';
import '../style/ground-left.less';
import '../style/speech-to-text.less';
import '../style/system-message-wrap.less';
import { speechToTextCode } from '../view-code/audio';
import AudioInput from './audio-input';
import DynamicParams from './dynamic-params';
import ViewCommonCode from './view-common-code';

interface MessageProps {
  modelList: Global.BaseOption<string>[];
  loaded?: boolean;
  ref?: any;
}

const initialValues = {
  language: 'auto'
};

const GroundLeft: React.FC<MessageProps> = forwardRef((props, ref) => {
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
  const [parameters, setParams] = useState<any>({});
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
      api: '/v1-openai/audio/transcriptions',
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
    await formRef.current?.form.validateFields();
    if (!parameters.model) return;
    try {
      setLoading(true);
      setMessageId();
      setTokenResult(null);
      setMessageList([]);

      cancelRequest();
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
          errorMessage:
            result?.data?.error?.message ||
            result?.error?.message ||
            result?.data?.message ||
            result?.detail ||
            ''
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
          errorMessage:
            res?.error?.message ||
            res?.data?.error?.message ||
            res?.data?.error ||
            res?.detail ||
            ''
        });
      }
    } finally {
      setLoading(false);
      setIsRecording(false);
      setRouteCache(routeCachekey['/playground/speech'], false);
    }
  };
  const handleClear = () => {
    if (!messageList.length) {
      return;
    }
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
      const res = await readAudioFile(data.file);
      setAudioData(res);
      setTokenResult(null);
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
  }, [messageList, loading]);

  return (
    <div
      className="ground-left-wrapper"
      style={{
        height: 'calc(100vh - 72px)'
      }}
    >
      <div className="ground-left">
        <div className="ground-left-footer" style={{ flex: 1 }}>
          <div className="speech-to-text">
            <div className="speech-box">
              {!isRecording && (
                <UploadAudio
                  type="default"
                  accept=".mp3,.mp4,.wav"
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
              <div
                className="flex-between flex-center justify-center relative"
                style={{ paddingInline: 80 }}
              >
                <div style={{ width: 600 }}>
                  <AudioPlayer
                    url={audioData.url}
                    name={audioData.name}
                    duration={audioData.duration}
                  ></AudioPlayer>
                </div>
                <div
                  style={{
                    padding: '16px',
                    textAlign: 'right',
                    position: 'absolute',
                    right: 0,
                    top: '50%',
                    transform: 'translateY(-50%)'
                  }}
                >
                  <Tooltip
                    title={
                      loading
                        ? intl.formatMessage({
                            id: 'playground.audio.generating'
                          })
                        : intl.formatMessage({
                            id: 'playground.audio.button.generate'
                          })
                    }
                  >
                    {
                      <Button
                        disabled={!audioData}
                        loading={loading}
                        type="primary"
                        shape="circle"
                        onClick={handleOnGenerate}
                        icon={<SendOutlined></SendOutlined>}
                      ></Button>
                    }
                  </Tooltip>
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
              position: 'relative',
              borderTop: '1px solid var(--ant-color-split)'
            }}
          >
            {messageList?.length > 0 && (
              <span
                style={{
                  position: 'absolute',
                  top: 0,
                  right: 2
                }}
              >
                <CopyButton text={messageList[0]?.content}></CopyButton>
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
                      justifyContent: 'center'
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
            setParams={setParams}
            paramsConfig={paramsConfig}
            initialValues={initialValues}
            params={parameters}
            selectedModel={selectModel as string}
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

export default memo(GroundLeft);
