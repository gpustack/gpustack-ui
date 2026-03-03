import { setRouteCache } from '@/atoms/route-cache';
import AlertInfo from '@/components/alert-info';
import IconFont from '@/components/icon-font';
import SpeechContent from '@/components/speech-content';
import routeCachekey from '@/config/route-cachekey';
import { useIntl } from '@umijs/max';
import { Spin } from 'antd';
import _ from 'lodash';
import 'overlayscrollbars/overlayscrollbars.css';
import React, {
  forwardRef,
  useImperativeHandle,
  useMemo,
  useRef,
  useState
} from 'react';
import { AUDIO_TEXT_TO_SPEECH_API, CHAT_API, textToSpeech } from '../apis';
import MessageInput from '../components/message-input';
import RightContainer from '../components/right-container';
import ViewCommonCode from '../components/view-common-code';
import { extractErrorMessage } from '../config';
import { MessageItem } from '../config/types';
import '../style/ground-llm.less';
import '../style/system-message-wrap.less';
import { TextToSpeechCode } from '../view-code/audio';
import TTSDataForm from './forms/tts-form';

interface MessageProps {
  modelList: Global.BaseOption<string>[];
  loaded?: boolean;
  ref?: any;
}

const GroundTTS: React.FC<MessageProps> = forwardRef((props, ref) => {
  const { modelList } = props;
  const messageId = useRef<number>(0);
  const [messageList, setMessageList] = useState<
    {
      input: string;
      voice: string;
      format: string;
      speed: number;
      uid: number;
      autoplay: boolean;
      audioUrl: string;
    }[]
  >([]);
  const intl = useIntl();
  const [parameters, setParams] = useState<any>({
    model: '',
    voice: '',
    response_format: 'mp3'
  });
  const [show, setShow] = useState(false);
  const [loading, setLoading] = useState(false);
  const [tokenResult, setTokenResult] = useState<any>(null);
  const [collapse, setCollapse] = useState(false);
  const controllerRef = useRef<any>(null);
  const checkvalueRef = useRef<any>(true);
  const [currentPrompt, setCurrentPrompt] = useState<string>('');
  const formRef = useRef<any>(null);

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

  const dropEmptyFields = (parameters: Record<string, any>) => {
    const fields = [
      'task_type',
      'instructions',
      'max_new_tokens',
      'ref_audio',
      'ref_text',
      'language',
      'x_vector_only_mode'
    ];
    const newParams = { ...parameters };

    return _.omitBy(newParams, (value: any, key: string) => {
      return fields.includes(key) && !value;
    });
  };

  const viewCodeContent = useMemo(() => {
    return TextToSpeechCode({
      api: AUDIO_TEXT_TO_SPEECH_API,
      parameters: {
        ...dropEmptyFields(parameters),
        input: currentPrompt
      }
    });
  }, [parameters, currentPrompt]);

  const setMessageId = () => {
    messageId.current = messageId.current + 1;
  };

  const handleStopConversation = () => {
    controllerRef.current?.abort?.();
    setLoading(false);
  };

  const handleInputChange = (e: any) => {
    setCurrentPrompt(e.target.value);
  };

  const submitMessage = async (current?: { role: string; content: string }) => {
    try {
      await formRef.current?.form.validateFields();
      if (!parameters.model) return;
      setLoading(true);
      setMessageId();
      setTokenResult(null);
      setCurrentPrompt(current?.content || '');
      setMessageList([]);

      setRouteCache(routeCachekey['/playground/speech'], true);

      controllerRef.current?.abort?.();
      controllerRef.current = new AbortController();
      const signal = controllerRef.current.signal;

      const params = {
        ...dropEmptyFields(parameters),
        input: current?.content || currentPrompt
      };
      const res: any = await textToSpeech({
        data: params,
        url: CHAT_API,
        signal
      });

      setParams(params);

      console.log('result:', res);

      if ((res?.status_code && res?.status_code !== 200) || res?.error) {
        setTokenResult({
          error: true,
          errorMessage: extractErrorMessage(res)
        });
        setMessageList([]);
        return;
      }

      setMessageList([
        {
          input: current?.content || currentPrompt,
          voice: parameters.voice,
          format: parameters.response_format,
          speed: parameters.speed,
          uid: messageId.current,
          autoplay: checkvalueRef.current,
          audioUrl: res.url
        }
      ]);
    } catch (error: any) {
      const res = error?.response?.data;
      console.log('error:', error);
      if (res?.error) {
        setTokenResult({
          error: true,
          errorMessage: extractErrorMessage(res)
        });
      }
    } finally {
      setLoading(false);
      setRouteCache(routeCachekey['/playground/speech'], false);
    }
  };
  const handleClear = () => {
    setMessageId();
    setMessageList([]);
    setTokenResult(null);
  };

  const handleSendMessage = (message: Omit<MessageItem, 'uid'>) => {
    submitMessage(message);
  };

  const handleCloseViewCode = () => {
    setShow(false);
  };

  const updatateParams = (values: Record<string, any>) => {
    setParams((pre: any) => {
      return {
        ...pre,
        ...values
      };
    });
  };

  const handleOnCheckChange = (e: any) => {
    checkvalueRef.current = e.target.checked;
  };

  return (
    <div className="ground-left-wrapper">
      <div className="ground-left">
        <div className="message-list-wrap">
          <div
            style={{
              height: '100%',
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center'
            }}
          >
            <div className="content" style={{ maxWidth: 1000 }}>
              {messageList.length ? (
                <SpeechContent dataList={messageList} loading={loading} />
              ) : (
                <div className="flex-column font-size-14 flex-center gap-20">
                  <span>
                    <IconFont
                      type="icon-audio "
                      className="font-size-32 text-secondary"
                    ></IconFont>
                  </span>
                  <span>
                    {intl.formatMessage({
                      id: 'playground.audio.texttospeech.tips'
                    })}
                  </span>
                </div>
              )}
              {loading && (
                <Spin size="small">
                  <div style={{ height: '46px' }}></div>
                </Spin>
              )}
            </div>
          </div>
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
            actions={['check']}
            checkLabel={intl.formatMessage({
              id: 'playground.toolbar.autoplay'
            })}
            placeholer={intl.formatMessage({
              id: 'playground.input.text.holder'
            })}
            defaultSize={{
              minRows: 5,
              maxRows: 5
            }}
            title={intl.formatMessage({ id: 'playground.audio.textinput' })}
            onCheck={handleOnCheckChange}
            loading={loading}
            disabled={!parameters.model}
            isEmpty={true}
            handleSubmit={handleSendMessage}
            handleAbortFetch={handleStopConversation}
            onInputChange={handleInputChange}
            clearAll={handleClear}
            shouldResetMessage={false}
          />
        </div>
      </div>
      <RightContainer collapsed={collapse}>
        <TTSDataForm
          ref={formRef}
          modelList={modelList}
          updatateParams={updatateParams}
        />
      </RightContainer>
      <ViewCommonCode
        open={show}
        viewCodeContent={viewCodeContent}
        onCancel={handleCloseViewCode}
        title={intl.formatMessage({ id: 'playground.viewcode' })}
      ></ViewCommonCode>
    </div>
  );
});

export default GroundTTS;
