import { Spin } from 'antd';
import React, {
  forwardRef,
  useImperativeHandle,
  useMemo,
  useRef,
  useState
} from 'react';
import { CHAT_API } from '../apis';
import MessageInput from '../components/message-input';
import MessageContent from '../components/multiple-chat/message-content';
import SystemMessage from '../components/multiple-chat/system-message';
import ReferenceParams from '../components/reference-params';
import RightContainer from '../components/right-container';
import ViewCommonCode from '../components/view-common-code';
import { Roles, generateMessagesByListContent } from '../config';
import { MessageItem } from '../config/types';
import { LLM_METAKEYS, llmInitialValues } from '../hooks/config';
import useChatCompletion from '../hooks/use-chat-completion';
import { useInitLLmMeta } from '../hooks/use-init-llm';
import '../style/ground-llm.less';
import '../style/system-message-wrap.less';
import { generateLLMCode } from '../view-code/llm';
import DataForm from './forms';
import { ChatParamsConfig } from './params-config';

interface MessageProps {
  modelList: Global.BaseOption<string>[];
  loaded?: boolean;
  ref?: any;
}

const GroundLeft: React.FC<MessageProps> = forwardRef((props, ref) => {
  const { modelList } = props;
  const [systemMessage, setSystemMessage] = useState('');
  const [show, setShow] = useState(false);
  const [collapse, setCollapse] = useState(false);
  const scroller = useRef<any>(null);

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
  const { handleOnValuesChange, formRef, setParams, paramsConfig, parameters } =
    useInitLLmMeta(
      { modelList, isChat: true },
      {
        defaultValues: llmInitialValues,
        defaultParamsConfig: ChatParamsConfig,
        metaKeys: LLM_METAKEYS
      }
    );
  console.log('parameters', parameters);
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
    console.log('viewCodeContent+++', parameters);
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

  const handleSendMessage = async (message: Omit<MessageItem, 'uid'>) => {
    const currentMessage = generateValidMessage(message);
    submitMessage({
      system: systemMessage
        ? { role: Roles.System, content: systemMessage }
        : undefined,
      current: currentMessage,
      parameters
    });
  };

  const handleOnModelChange = (model: string) => {
    setParams({
      ...formRef.current?.getFieldsValue(),
      model
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
                actions={['upload', 'delete', 'copy', 'edit']}
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
      <RightContainer collapsed={collapse}>
        <DataForm
          ref={formRef}
          onValuesChange={handleOnValuesChange}
          onModelChange={handleOnModelChange}
          paramsConfig={paramsConfig}
          initialValues={llmInitialValues}
          modelList={modelList}
        />
      </RightContainer>
      <ViewCommonCode
        open={show}
        viewCodeContent={viewCodeContent}
        onCancel={handleCloseViewCode}
      ></ViewCommonCode>
    </div>
  );
});

export default GroundLeft;
