import AudioAnimation from '@/components/audio-animation';
import AudioPlayer from '@/components/audio-player';
import IconFont from '@/components/icon-font';
import UploadAudio from '@/components/upload-audio';
import useOverlayScroller from '@/hooks/use-overlay-scroller';
import { fetchChunkedData, readStreamData } from '@/utils/fetch-chunk-data';
import { readAudioFile } from '@/utils/load-audio-file';
import { AudioOutlined, ThunderboltOutlined } from '@ant-design/icons';
import { useIntl, useSearchParams } from '@umijs/max';
import { Button, Spin, Tag, Tooltip } from 'antd';
import classNames from 'classnames';
import _ from 'lodash';
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
import { CHAT_API } from '../apis';
import { Roles, generateMessages } from '../config';
import { RealtimeParamsConfig as paramsConfig } from '../config/params-config';
import { MessageItem } from '../config/types';
import '../style/ground-left.less';
import '../style/speech-to-text.less';
import '../style/system-message-wrap.less';
import AudioInput from './audio-input';
import MessageContent from './multiple-chat/message-content';
import RerankerParams from './reranker-params';
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
  const [messageList, setMessageList] = useState<MessageItem[]>([]);

  const intl = useIntl();
  const [searchParams] = useSearchParams();
  const selectModel = searchParams.get('model') || '';
  const [parameters, setParams] = useState<any>({});
  const [systemMessage, setSystemMessage] = useState('');
  const [show, setShow] = useState(false);
  const [loading, setLoading] = useState(false);
  const [tokenResult, setTokenResult] = useState<any>(null);
  const [collapse, setCollapse] = useState(false);
  const contentRef = useRef<any>('');
  const controllerRef = useRef<any>(null);
  const scroller = useRef<any>(null);
  const currentMessageRef = useRef<any>(null);
  const paramsRef = useRef<any>(null);
  const messageListLengthCache = useRef<number>(0);
  const [audioPermissionOn, setAudioPermissionOn] = useState(true);
  const [audioData, setAudioData] = useState<any>(null);
  const [audioChunks, setAudioChunks] = useState<any>({
    data: [],
    analyser: null
  });
  const [isRecording, setIsRecording] = useState(false);

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

  const viewCodeMessage = useMemo(() => {
    return generateMessages([
      { role: Roles.System, content: systemMessage },
      ...messageList
    ]);
  }, [messageList, systemMessage]);

  const setMessageId = () => {
    messageId.current = messageId.current + 1;
  };

  const joinMessage = (chunk: any) => {
    setTokenResult({
      ...(chunk?.usage ?? {})
    });

    if (!chunk || !_.get(chunk, 'choices', []).length) {
      return;
    }
    contentRef.current =
      contentRef.current + _.get(chunk, 'choices.0.delta.content', '');
    setMessageList([
      ...messageList,
      ...currentMessageRef.current,
      {
        role: Roles.Assistant,
        content: contentRef.current,
        uid: messageId.current
      }
    ]);
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
      currentMessageRef.current = current
        ? [
            {
              ...current,
              uid: messageId.current
            }
          ]
        : [];

      contentRef.current = '';
      setMessageList((pre) => {
        return [...pre, ...currentMessageRef.current];
      });

      const messageParams = [
        { role: Roles.System, content: systemMessage },
        ...messageList,
        ...currentMessageRef.current
      ];

      const messages = generateMessages(messageParams);

      const chatParams = {
        messages: messages,
        ...parameters,
        stream: true,
        stream_options: {
          include_usage: true
        }
      };
      const result: any = await fetchChunkedData({
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
      setMessageId();
      const { reader, decoder } = result;
      await readStreamData(reader, decoder, (chunk: any) => {
        if (chunk?.error) {
          setTokenResult({
            error: true,
            errorMessage: chunk?.error?.message || chunk?.message || ''
          });
          return;
        }
        joinMessage(chunk);
      });
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

  const renderTitle = useCallback((role: string) => {
    return (
      <span>
        {intl.formatMessage({ id: `playground.${role}` })}
        <span className="text-tertiary m-l-5">00:10</span>
      </span>
    );
  }, []);

  const handleSendMessage = (message: Omit<MessageItem, 'uid'>) => {
    setLoading(true);
    setMessageList([
      ...messageList,
      {
        role: Roles.User,
        title: renderTitle(Roles.User),
        content: 'test data test data',
        uid: messageId.current
      }
    ]);

    setTimeout(() => {
      setMessageList([
        ...messageList,
        {
          role: Roles.Assistant,
          title: renderTitle(Roles.Assistant),
          content: 'generate by assistant',
          uid: messageId.current
        }
      ]);
      setLoading(false);
    }, 1000);
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
        <span>Upload an audio file or start recording</span>
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
            </div>

            {audioData ? (
              <div className="flex-between flex-center">
                <div style={{ flex: 1 }}>
                  <AudioPlayer
                    url={audioData.url}
                    name={audioData.name}
                    duration={audioData.duration}
                  ></AudioPlayer>
                  <div
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
                  </div>
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
                Enable microphone access in your browser&rsquo;s settings.
              </span>
            </div>
          )}
        </div>
        <div className="message-list-wrap" ref={scroller}>
          <>
            <div className="content" style={{ height: '100%' }}>
              <>
                <MessageContent
                  actions={['copy']}
                  messageList={messageList[0] ? [messageList[0]] : []}
                  setMessageList={setMessageList}
                  editable={false}
                  loading={loading}
                />
                {loading && (
                  <Spin size="small">
                    <div style={{ height: '46px' }}></div>
                  </Spin>
                )}
              </>
            </div>
          </>
        </div>
      </div>
      <div
        className={classNames('params-wrapper', {
          collapsed: collapse
        })}
        ref={paramsRef}
      >
        <div className="box">
          <RerankerParams
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
        payLoad={{
          messages: viewCodeMessage
        }}
        parameters={parameters}
        onCancel={handleCloseViewCode}
        title={intl.formatMessage({ id: 'playground.viewcode' })}
      ></ViewCodeModal>
    </div>
  );
});

export default memo(GroundLeft);
