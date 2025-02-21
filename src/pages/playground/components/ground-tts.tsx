import { setRouteCache } from '@/atoms/route-cache';
import AlertInfo from '@/components/alert-info';
import IconFont from '@/components/icon-font';
import SealSelect from '@/components/seal-form/seal-select';
import SpeechContent from '@/components/speech-content';
import routeCachekey from '@/config/route-cachekey';
import useOverlayScroller from '@/hooks/use-overlay-scroller';
import { SendOutlined } from '@ant-design/icons';
import { getLocale, useIntl, useSearchParams } from '@umijs/max';
import { Form, Spin } from 'antd';
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
import { AUDIO_TEXT_TO_SPEECH_API, CHAT_API, textToSpeech } from '../apis';
import { TTSParamsConfig as paramsConfig } from '../config/params-config';
import { MessageItem, ParamsSchema } from '../config/types';
import '../style/ground-left.less';
import '../style/system-message-wrap.less';
import { TextToSpeechCode } from '../view-code/audio';
import DynamicParams from './dynamic-params';
import MessageInput from './message-input';
import ViewCommonCode from './view-common-code';

interface MessageProps {
  modelList: Global.BaseOption<string>[];
  loaded?: boolean;
  ref?: any;
}

const GroundLeft: React.FC<MessageProps> = forwardRef((props, ref) => {
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
  const locale = getLocale();
  const intl = useIntl();
  const [searchParams] = useSearchParams();
  const modelType = searchParams.get('type') || '';
  const selectModel = searchParams.get('model')
    ? modelType === 'tts' && searchParams.get('model')
    : '';
  const [parameters, setParams] = useState<any>({
    model: selectModel,
    voice: '',
    response_format: 'mp3'
  });
  const [show, setShow] = useState(false);
  const [loading, setLoading] = useState(false);
  const [tokenResult, setTokenResult] = useState<any>(null);
  const [collapse, setCollapse] = useState(false);
  const controllerRef = useRef<any>(null);
  const scroller = useRef<any>(null);
  const paramsRef = useRef<any>(null);
  const checkvalueRef = useRef<any>(true);
  const [currentPrompt, setCurrentPrompt] = useState<string>('');
  const [voiceDataList, setVoiceList] = useState<Global.BaseOption<string>[]>(
    []
  );
  const formRef = useRef<any>(null);

  const { initialize } = useOverlayScroller();
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

  const viewCodeContent = useMemo(() => {
    return TextToSpeechCode({
      api: AUDIO_TEXT_TO_SPEECH_API,
      parameters: {
        ...parameters,
        input: currentPrompt
      }
    });
  }, [parameters, currentPrompt]);

  const sortVoiceList = useCallback(
    (locale: string, voiceDataList: Global.BaseOption<string>[]) => {
      const lang = locale === 'en-US' ? 'english' : 'chinese';

      const list = voiceDataList.sort((a, b) => {
        const aContains = a.value.toLowerCase().includes(lang) ? 1 : 0;
        const bContains = b.value.toLowerCase().includes(lang) ? 1 : 0;
        return bContains - aContains;
      });
      return list;
    },
    []
  );

  const voiceList = useMemo(() => {
    if (!voiceDataList.length) return [];
    const newList = sortVoiceList(locale, voiceDataList);
    return newList;
  }, [locale, voiceDataList, sortVoiceList]);

  useEffect(() => {
    const newList = sortVoiceList(locale, voiceDataList);
    setParams((pre: any) => {
      return {
        ...pre,
        voice: newList[0]?.value
      };
    });
    formRef.current?.form.setFieldValue('voice', newList[0]?.value);
  }, [locale, voiceDataList, sortVoiceList]);

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
    await formRef.current?.form.validateFields();
    if (!parameters.model) return;
    try {
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
        ...parameters,
        input: current?.content || currentPrompt
      };
      const res: any = await textToSpeech({
        data: params,
        url: CHAT_API,
        signal
      });

      console.log('result:', res);

      if ((res?.status_code && res?.status_code !== 200) || res?.error) {
        setTokenResult({
          error: true,
          errorMessage:
            res?.data?.error?.message ||
            res?.error?.message ||
            res?.data?.error ||
            res?.detail ||
            ''
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

  const handleSelectModel = useCallback(
    async (value: string) => {
      if (!value) {
        setVoiceList([]);
        setParams((pre: any) => {
          return {
            ...pre,
            voice: ''
          };
        });
        formRef.current?.form.setFieldValue('voice', '');
        return;
      }
      const model = modelList.find((item) => item.value === value);
      const list = _.map(model?.meta?.voices || [], (item: any) => {
        return {
          label: item,
          value: item
        };
      });

      const newList = sortVoiceList(locale, list);

      setVoiceList(newList);
      setParams((pre: any) => {
        return {
          ...pre,
          voice: newList[0]?.value
        };
      });
      formRef.current?.form.setFieldValue('voice', newList[0]?.value);
    },
    [modelList]
  );

  const handleOnValuesChange = useCallback(
    (changeValues: Record<string, any>, allValues: Record<string, any>) => {
      if (changeValues.model) {
        handleSelectModel(changeValues.model);
      } else {
        setParams(allValues);
      }
    },
    []
  );

  useEffect(() => {
    if (paramsRef.current) {
      innitializeParams(paramsRef.current);
    }
  }, [paramsRef.current, innitializeParams]);

  const handleOnCheckChange = (e: any) => {
    checkvalueRef.current = e.target.checked;
  };

  const renderExtra = useMemo(() => {
    return paramsConfig.map((item: ParamsSchema) => {
      return (
        <Form.Item name={item.name} rules={item.rules} key={item.name}>
          <SealSelect
            {...item.attrs}
            options={item.name === 'voice' ? voiceList : item.options}
            label={
              item.label.isLocalized
                ? intl.formatMessage({ id: item.label.text })
                : item.label.text
            }
          ></SealSelect>
        </Form.Item>
      );
    });
  }, [paramsConfig, intl, voiceList]);

  useEffect(() => {
    if (!parameters.model && modelList.length) {
      const model = modelList[0]?.value;
      handleSelectModel(model);
    }
  }, [modelList, parameters.model, handleSelectModel]);

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
            actions={['check', 'clear']}
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
            title={
              <span className="font-600">
                {intl.formatMessage({ id: 'playground.audio.textinput' })}
              </span>
            }
            onCheck={handleOnCheckChange}
            loading={loading}
            disabled={!parameters.model}
            isEmpty={true}
            handleSubmit={handleSendMessage}
            handleAbortFetch={handleStopConversation}
            onInputChange={handleInputChange}
            clearAll={handleClear}
            shouldResetMessage={false}
            submitIcon={<SendOutlined></SendOutlined>}
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
            ref={formRef}
            onValuesChange={handleOnValuesChange}
            initialValues={parameters}
            modelList={modelList}
            extra={[renderExtra]}
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
