import IconFont from '@/components/icon-font';
import SealSelect from '@/components/seal-form/seal-select';
import SpeechContent from '@/components/speech-content';
import useOverlayScroller from '@/hooks/use-overlay-scroller';
import { SendOutlined } from '@ant-design/icons';
import { useIntl, useSearchParams } from '@umijs/max';
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
import { CHAT_API, queryModelVoices, textToSpeech } from '../apis';
import { TTSParamsConfig as paramsConfig } from '../config/params-config';
import { MessageItem, ParamsSchema } from '../config/types';
import '../style/ground-left.less';
import '../style/system-message-wrap.less';
import DynamicParams from './dynamic-params';
import MessageInput from './message-input';
import ReferenceParams from './reference-params';
import ViewCodeModal from './view-code-modal';

interface MessageProps {
  modelList: Global.BaseOption<string>[];
  loaded?: boolean;
  ref?: any;
}

const initialValues = {
  voice: '',
  response_format: 'mp3',
  speed: 1
};

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
  const checkvalueRef = useRef<any>(true);
  const [currentPrompt, setCurrentPrompt] = useState<string>('');
  const [voiceList, setVoiceList] = useState<Global.BaseOption<string>[]>([]);
  const formRef = useRef<any>(null);

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
    await formRef.current?.form.validateFields();
    if (!parameters.model) return;
    try {
      setLoading(true);
      setMessageId();
      setTokenResult(null);
      setCurrentPrompt(current?.content || '');

      controllerRef.current?.abort?.();
      controllerRef.current = new AbortController();
      const signal = controllerRef.current.signal;

      const params = {
        ...parameters,
        input: current?.content || currentPrompt
      };
      const audioUrl: any = await textToSpeech({
        data: params,
        url: CHAT_API,
        signal
      });

      console.log('result:', parameters, audioUrl);

      setMessageList([
        {
          input: current?.content || currentPrompt,
          voice: parameters.voice,
          format: parameters.response_format,
          speed: parameters.speed,
          uid: messageId.current,
          autoplay: checkvalueRef.current,
          audioUrl: audioUrl
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

  const handleSendMessage = (message: Omit<MessageItem, 'uid'>) => {
    submitMessage(message);
  };

  const handleCloseViewCode = () => {
    setShow(false);
  };

  const handleSelectModel = useCallback(
    async (value: string) => {
      if (!value) return;
      try {
        const res = await queryModelVoices({
          model: value
        });
        const voiceList = _.map(res.voices || [], (item: any) => {
          return {
            label: item,
            value: item
          };
        });
        setVoiceList(voiceList);
        setParams((pre: any) => {
          return {
            ...pre,
            voice: voiceList[0]?.value
          };
        });
        formRef.current?.form.setFieldValue('voice', voiceList[0]?.value);
      } catch (error) {
        setVoiceList([]);
        formRef.current?.form.setFieldValue('voice', '');
        setParams((pre: any) => {
          return {
            ...pre,
            voice: ''
          };
        });
      }
    },
    [modelList]
  );

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
    handleSelectModel(parameters.model);
  }, [parameters.model, handleSelectModel]);

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
        <div className="message-list-wrap" ref={scroller}>
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
            <ReferenceParams usage={tokenResult}></ReferenceParams>
          </div>
        )}
        <div className="ground-left-footer">
          <MessageInput
            actions={['check']}
            checkLabel={intl.formatMessage({
              id: 'playground.toolbar.autoplay'
            })}
            onCheck={handleOnCheckChange}
            loading={loading}
            disabled={!parameters.model}
            isEmpty={true}
            handleSubmit={handleSendMessage}
            handleAbortFetch={handleStopConversation}
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
            setParams={setParams}
            initialValues={initialValues}
            params={parameters}
            selectedModel={selectModel}
            modelList={modelList}
            extra={renderExtra}
          />
        </div>
      </div>

      <ViewCodeModal
        open={show}
        payLoad={{
          input: currentPrompt
        }}
        api="audio/speech"
        clientType="audio.speech"
        parameters={parameters}
        onCancel={handleCloseViewCode}
        title={intl.formatMessage({ id: 'playground.viewcode' })}
      ></ViewCodeModal>
    </div>
  );
});

export default memo(GroundLeft);
