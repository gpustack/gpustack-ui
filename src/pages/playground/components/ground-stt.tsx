import AudioAnimation from '@/components/audio-animation';
import AudioPlayer from '@/components/audio-player';
import IconFont from '@/components/icon-font';
import UploadAudio from '@/components/upload-audio';
import useOverlayScroller from '@/hooks/use-overlay-scroller';
import { readAudioFile } from '@/utils/load-audio-file';
import { AudioOutlined, ThunderboltOutlined } from '@ant-design/icons';
import { useIntl, useSearchParams } from '@umijs/max';
import { Button, Spin, Tag, Tooltip } from 'antd';
import classNames from 'classnames';
import 'overlayscrollbars/overlayscrollbars.css';
import {
  forwardRef,
  memo,
  useCallback,
  useEffect,
  useImperativeHandle,
  useRef,
  useState
} from 'react';
import { CHAT_API, speechToText } from '../apis';
import { RealtimeParamsConfig as paramsConfig } from '../config/params-config';
import { MessageItem } from '../config/types';
import '../style/ground-left.less';
import '../style/speech-to-text.less';
import '../style/system-message-wrap.less';
import AudioInput from './audio-input';
import DynamicParams from './dynamic-params';
import MessageContent from './multiple-chat/message-content';
import ViewCodeModal from './view-code-modal';

interface MessageProps {
  modelList: Global.BaseOption<string>[];
  loaded?: boolean;
  ref?: any;
}

const initialValues = {
  language: 'auto'
};

const GroundLeft: React.FC<MessageProps> = forwardRef((props, ref) => {
  const { modelList } = props;
  const messageId = useRef<number>(0);
  const [messageList, setMessageList] = useState<MessageItem[]>([
    {
      content: 'Generating text content...',
      title: '',
      role: '',
      uid: messageId.current
    }
  ]);
  const intl = useIntl();
  const [searchParams] = useSearchParams();
  const selectModel = searchParams.get('model') || '';
  const [parameters, setParams] = useState<any>({});
  const [show, setShow] = useState(false);
  const [loading, setLoading] = useState(false);
  const [tokenResult, setTokenResult] = useState<any>(null);
  const [collapse, setCollapse] = useState(false);
  const controllerRef = useRef<any>(null);
  const scroller = useRef<any>(null);
  const paramsRef = useRef<any>(null);
  const messageListLengthCache = useRef<number>(0);
  const [audioPermissionOn, setAudioPermissionOn] = useState(true);
  const [audioData, setAudioData] = useState<any>(null);
  const [audioChunks, setAudioChunks] = useState<any>({
    data: [],
    analyser: null
  });
  const [isRecording, setIsRecording] = useState(false);
  const [recordEnd, setRecordEnd] = useState(false);

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

  const handleStopConversation = () => {
    controllerRef.current?.abort?.();
    setLoading(false);
  };

  const submitMessage = async (current?: { role: string; content: string }) => {
    if (!parameters.model) return;
    try {
      setLoading(true);
      setMessageId();
      setTokenResult(null);

      controllerRef.current?.abort?.();
      controllerRef.current = new AbortController();
      const signal = controllerRef.current.signal;

      const chatParams = {
        ...parameters,
        stream: true,
        stream_options: {
          include_usage: true
        }
      };
      const result: any = await speechToText({
        data: chatParams,
        url: CHAT_API,
        signal
      });

      if (result?.error) {
        setTokenResult({
          error: true,
          errorMessage:
            result?.data?.error?.message || result?.data?.message || ''
        });
        return;
      }
      setMessageList([
        {
          content: 'Generating text content...',
          title: '',
          role: '',
          uid: messageId.current
        }
      ]);
    } catch (error) {
      // console.log('error:', error);
    } finally {
      setLoading(false);
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
    (data: { chunks: Blob[]; url: string; name: string; duration: number }) => {
      setAudioData(() => {
        return {
          url: data.url,
          name: data.name,
          duration: data.duration
        };
      });
      setTimeout(() => {
        setRecordEnd(true);
      }, 200);
    },
    []
  );

  const handleOnAudioPermission = useCallback((permission: boolean) => {
    setAudioPermissionOn(permission);
  }, []);

  const handleUploadChange = useCallback(
    async (data: { file: any; fileList: any }) => {
      const res = await readAudioFile(data.file.originFileObj);
      console.log('res=======', res);
      setAudioData(res);
      setRecordEnd(true);
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
  }, []);

  const handleOnGenerate = useCallback(() => {
    setMessageList([
      {
        content: 'Generating text content...',
        title: '',
        role: '',
        uid: messageId.current
      }
    ]);
    setRecordEnd(false);
    setIsRecording(false);
  }, []);

  const handleOnDiscard = useCallback(() => {
    setRecordEnd(false);
    setAudioData(null);
    setIsRecording(false);
  }, []);

  const renderAniamtion = () => {
    if (!audioPermissionOn) {
      return null;
    }
    if (isRecording) {
      return (
        <AudioAnimation
          height={66}
          width={200}
          analyserData={audioChunks}
        ></AudioAnimation>
      );
    }
    return (
      <div className="tips-text">
        <IconFont type={'icon-audio'} style={{ fontSize: 20 }}></IconFont>
        <span>
          {intl.formatMessage({ id: 'playground.audio.speechtotext.tips' })}
        </span>
      </div>
    );
  };

  useEffect(() => {}, [messageList]);
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

  useEffect(() => {
    if (messageList.length > messageListLengthCache.current) {
      updateScrollerPosition();
    }
    messageListLengthCache.current = messageList.length;
  }, [messageList.length]);

  return (
    <div className="ground-left-wrapper">
      <div className="ground-left">
        <div className="ground-left-footer" style={{ flex: 1 }}>
          <div className="speech-to-text">
            <div className="speech-box">
              {isRecording ? (
                <>
                  <AudioInput
                    type="default"
                    voiceActivity={true}
                    onAudioData={handleOnAudioData}
                    onAudioPermission={handleOnAudioPermission}
                    onAnalyse={handleOnAnalyse}
                    onRecord={handleOnRecord}
                  ></AudioInput>
                </>
              ) : (
                <>
                  {/* <Tooltip title="discard">
                    <Button
                      onClick={handleOnDiscard}
                      icon={<DeleteRowOutlined />}
                      shape="circle"
                    ></Button>
                  </Tooltip>
                  <Tooltip title="generate text content">
                    <Button
                      type="primary"
                      onClick={handleOnGenerate}
                      shape="circle"
                      icon={<ThunderboltOutlined></ThunderboltOutlined>}
                    ></Button>
                  </Tooltip> */}
                  <Tooltip title="Upload an audio file">
                    <UploadAudio
                      type="default"
                      accept=".mp3,.mp4,.wav"
                      onChange={handleUploadChange}
                    ></UploadAudio>
                  </Tooltip>
                  <AudioInput
                    type="default"
                    voiceActivity={true}
                    onAudioData={handleOnAudioData}
                    onAudioPermission={handleOnAudioPermission}
                    onAnalyse={handleOnAnalyse}
                    onRecord={handleOnRecord}
                  ></AudioInput>
                </>
              )}
            </div>

            {audioData ? (
              <div className="flex-between flex-center justify-center">
                <div style={{ width: 600 }}>
                  <AudioPlayer
                    url={audioData.url}
                    name={audioData.name}
                    duration={audioData.duration}
                  ></AudioPlayer>
                  {/* <div
                    style={{
                      paddingRight: 5,
                      display: 'flex',
                      justifyContent: 'flex-end',
                      marginTop: 30
                    }}
                  >
                    <Tooltip title="generate text content">
                      <Button
                        size="middle"
                        type="primary"
                        icon={<ThunderboltOutlined></ThunderboltOutlined>}
                      >
                        Generata Text Content
                      </Button>
                    </Tooltip>
                  </div> */}
                </div>
              </div>
            ) : (
              renderAniamtion()
            )}
          </div>
          {!audioPermissionOn && (
            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'center',
                alignItems: 'center',
                height: '100%'
              }}
            >
              <span>
                <Tag
                  style={{
                    width: 36,
                    height: 36,
                    lineHeight: '36px',
                    textAlign: 'center'
                  }}
                  bordered={false}
                  color="error"
                  icon={
                    <AudioOutlined className="font-size-16"></AudioOutlined>
                  }
                ></Tag>
              </span>
              <span
                style={{
                  marginTop: 10,
                  fontSize: 14,
                  fontWeight: 500
                }}
              >
                {intl.formatMessage({ id: 'playground.audio.enablemic' })}
              </span>
            </div>
          )}
        </div>
        <div
          style={{
            flex: 1,
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between'
          }}
        >
          <div
            className="message-list-wrap"
            ref={scroller}
            style={{
              borderTop: messageList.length
                ? '1px solid var(--ant-color-split)'
                : '1px solid var(--ant-color-split)'
            }}
          >
            <div className="content" style={{ height: '100%' }}>
              <>
                <MessageContent
                  actions={[]}
                  messageList={messageList[0] ? [messageList[0]] : []}
                  editable={false}
                  showTitle={false}
                  loading={true}
                />
                {loading && (
                  <Spin size="small">
                    <div style={{ height: '46px' }}></div>
                  </Spin>
                )}
              </>
            </div>
          </div>
          <div style={{ padding: '16px 32px', textAlign: 'right' }}>
            <Tooltip title="generate text content">
              <Button
                disabled={!audioData}
                type="primary"
                onClick={handleOnGenerate}
                icon={<ThunderboltOutlined></ThunderboltOutlined>}
              ></Button>
            </Tooltip>
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
            setParams={setParams}
            paramsConfig={paramsConfig}
            initialValues={initialValues}
            params={parameters}
            selectedModel={selectModel}
            modelList={modelList}
          />
        </div>
      </div>

      <ViewCodeModal
        open={show}
        payLoad={{}}
        api="audio/transcriptions"
        clientType="audio.transcriptions"
        parameters={parameters}
        onCancel={handleCloseViewCode}
        title={intl.formatMessage({ id: 'playground.viewcode' })}
      ></ViewCodeModal>
    </div>
  );
});

export default memo(GroundLeft);
