import { useIntl } from '@umijs/max';
import { Spin } from 'antd';
import classNames from 'classnames';
import 'overlayscrollbars/overlayscrollbars.css';
import React, {
  forwardRef,
  useImperativeHandle,
  useMemo,
  useRef,
  useState
} from 'react';
import { CHAT_API } from '../apis';
import { Roles, generateMessagesByListContent } from '../config';
import { ChatParamsConfig } from '../config/params-config';
import { MessageItem, MessageItemAction } from '../config/types';
import { LLM_METAKEYS, llmInitialValues } from '../hooks/config';
import useChatCompletion from '../hooks/use-chat-completion';
import { useInitLLmMeta } from '../hooks/use-init-meta';
import '../style/ground-left.less';
import '../style/system-message-wrap.less';
import { generateLLMCode } from '../view-code/llm';
import DynamicParams from './dynamic-params';
import MessageInput from './message-input';
import MessageContent from './multiple-chat/message-content';
import SystemMessage from './multiple-chat/system-message';
import ReferenceParams from './reference-params';
import ViewCommonCode from './view-common-code';

interface MessageProps {
  modelList: Global.BaseOption<string>[];
  loaded?: boolean;
  ref?: any;
}

const GroundLeft: React.FC<MessageProps> = forwardRef((props, ref) => {
  const { modelList } = props;
  const intl = useIntl();
  const [systemMessage, setSystemMessage] = useState('');
  const [show, setShow] = useState(false);
  const [collapse, setCollapse] = useState(false);
  const scroller = useRef<any>(null);
  const [actions, setActions] = useState<MessageItemAction[]>([
    'upload',
    'delete',
    'copy',
    'edit'
  ]);

  const {
    submitMessage,
    handleStopConversation,
    handleAddNewMessage,
    handleClear,
    setMessageList,
    tokenResult,
    messageList,
    loading
  } = useChatCompletion(scroller);
  const {
    handleOnValuesChange,
    formRef,
    paramsRef,
    paramsConfig,
    initialValues,
    parameters
  } = useInitLLmMeta(
    { modelList, isChat: true },
    {
      defaultValues: {
        ...llmInitialValues,
        model: modelList[0]?.value
      },
      defaultParamsConfig: ChatParamsConfig,
      metaKeys: LLM_METAKEYS
    }
  );

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
    const resultList = systemMessage
      ? [{ role: Roles.System, content: systemMessage }]
      : [];
    const list = generateMessagesByListContent([...messageList]);
    return generateLLMCode({
      api: CHAT_API,
      parameters: {
        ...parameters,
        messages: [...resultList, ...list]
      }
    });
  }, [messageList, systemMessage, parameters]);

  const generateValidMessage = (message: Omit<MessageItem, 'uid'>) => {
    if (!message.content && !message.imgs?.length && !message.audio?.length) {
      return undefined;
    }
    return message;
  };

  const handleSendMessage = (message: Omit<MessageItem, 'uid'>) => {
    const currentMessage = generateValidMessage(message);
    submitMessage({
      system: systemMessage
        ? { role: Roles.System, content: systemMessage }
        : undefined,
      current: currentMessage,
      parameters
    });
  };

  const handleCloseViewCode = () => {
    setShow(false);
  };

  return (
    <div className="ground-left-wrapper">
      <div className="ground-left">
        <div className="message-list-wrap" ref={scroller}>
          <>
            <div
              style={{
                marginBottom: 20
              }}
            >
              <SystemMessage
                style={{
                  borderRadius: 'var(--border-radius-mini)',
                  overflow: 'hidden'
                }}
                systemMessage={systemMessage}
                setSystemMessage={setSystemMessage}
              ></SystemMessage>
            </div>

            <div className="content">
              <MessageContent
                messageList={messageList}
                setMessageList={setMessageList}
                editable={true}
                loading={loading}
                actions={actions}
              />
              {loading && (
                <Spin size="small">
                  <div style={{ height: '46px' }}></div>
                </Spin>
              )}
            </div>
          </>
        </div>
        {tokenResult && !loading && (
          <div style={{ height: 40 }}>
            <ReferenceParams usage={tokenResult}></ReferenceParams>
          </div>
        )}
        <div className="ground-left-footer">
          <MessageInput
            defaultSize={{
              minRows: 5,
              maxRows: 5
            }}
            actions={['clear', 'layout', 'role', 'upload', 'add', 'paste']}
            defaultChecked={false}
            loading={loading}
            disabled={!parameters.model}
            isEmpty={!messageList.length}
            handleSubmit={handleSendMessage}
            addMessage={handleAddNewMessage}
            handleAbortFetch={handleStopConversation}
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
            ref={formRef}
            onValuesChange={handleOnValuesChange}
            paramsConfig={paramsConfig}
            initialValues={initialValues}
            modelList={modelList}
            showModelSelector={true}
          />
        </div>
      </div>
      <ViewCommonCode
        open={show}
        viewCodeContent={viewCodeContent}
        onCancel={handleCloseViewCode}
      ></ViewCommonCode>
    </div>
  );
});

export default GroundLeft;
