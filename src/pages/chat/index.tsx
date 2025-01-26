import IconFont from '@/components/icon-font';
import MessageInput from '@/pages/playground/components/message-input';
import MessageContent from '@/pages/playground/components/multiple-chat/message-content';
import ThumbImg from '@/pages/playground/components/thumb-img';
import { MessageItem } from '@/pages/playground/config/types';
import { FileImageOutlined } from '@ant-design/icons';
import { useIntl } from '@umijs/max';
import { Button, Spin, Tooltip } from 'antd';
import { useCallback, useMemo, useRef, useState } from 'react';
import { modelCategoriesMap } from '../llmodels/config';
import useChatCompletion from '../playground/hooks/use-chat-completion';
import useTextImage from '../playground/hooks/use-text-image';
import Content from './components/content';
import Header from './components/header';
import './styles/index.less';

const ChatPanel = () => {
  const intl = useIntl();
  const scroller = useRef<any>(null);
  const [current, setCurrent] = useState<any>({});
  const [parameters, setParameters] = useState<any>({});
  const {
    submitMessage,
    handleStopConversation,
    handleClear,
    setMessageList,
    messageList,
    loading
  } = useChatCompletion(scroller);
  const {
    submitMessage: submitImageMessage,
    handleStopConversation: handleStopImageConversation,
    handleClear: handleClearImage,
    loading: imageLoading,
    generateNumber,
    imageList,
    promptList
  } = useTextImage();
  const headerRef = useRef<any>(null);
  const inputRef = useRef<any>(null);

  const handleModelChange = useCallback((value: string | number, item: any) => {
    console.log('model:', value, item);
    setCurrent(item);
  }, []);

  const handleOnValuesChange = useCallback((values: any) => {
    console.log('values:', values);
    setParameters(values);
  }, []);

  const handleRandomPrompt = useCallback(() => {
    const randomIndex = generateNumber(0, promptList.length - 1);
    const randomPrompt = promptList[randomIndex];
    inputRef.current?.handleInputChange({
      target: {
        value: randomPrompt
      }
    });
  }, []);
  const renderTools = useMemo(() => {
    return (
      <Tooltip
        title={intl.formatMessage({
          id: 'playground.image.prompt.random'
        })}
      >
        <Button
          onClick={handleRandomPrompt}
          size="middle"
          type="text"
          icon={<IconFont type="icon-random"></IconFont>}
        ></Button>
      </Tooltip>
    );
  }, [handleRandomPrompt]);

  const handleSendMessage = (message: Omit<MessageItem, 'uid'>) => {
    console.log('message:', message);
    const currentMessage =
      message.content || message.imgs?.length ? message : undefined;
    submitMessage({
      current: currentMessage,
      parameters
    });
  };

  const handleCreateImageMessage = (message: Omit<MessageItem, 'uid'>) => {
    console.log('message:', message);
    const currentMessage =
      message.content || message.imgs?.length ? message : undefined;
    submitImageMessage({
      current: currentMessage,
      parameters
    });
  };

  return (
    <div className="chat-panel flex-column flex-between h-100">
      <div className="chat-main" ref={scroller}>
        <Header
          ref={headerRef}
          onModelChange={handleModelChange}
          onValuesChange={handleOnValuesChange}
        ></Header>
        <Content>
          {current.categoris?.[0] === modelCategoriesMap.llm ? (
            <>
              <MessageContent
                showTitle={false}
                actions={['copy']}
                messageStyle="roler"
                messageList={messageList}
                setMessageList={setMessageList}
                editable={true}
                loading={loading}
              />
              {loading && (
                <Spin size="small">
                  <div style={{ height: '46px' }}></div>
                </Spin>
              )}
            </>
          ) : (
            <>
              <ThumbImg
                style={{
                  padding: 0,
                  height: '100%',
                  justifyContent: 'center',
                  flexDirection: 'column',
                  flexWrap: 'unset',
                  alignItems: 'center'
                }}
                autoBgColor={false}
                editable={false}
                dataList={imageList}
                responseable={true}
                gutter={[8, 16]}
                autoSize={true}
              ></ThumbImg>
              {!imageList.length && (
                <div
                  className="flex-column font-size-14 flex-center gap-20 justify-center hold-wrapper"
                  style={{ height: '100%' }}
                >
                  <span>
                    <FileImageOutlined className="font-size-32 text-secondary" />
                  </span>
                  <span>
                    {intl.formatMessage({ id: 'playground.params.empty.tips' })}
                  </span>
                </div>
              )}
            </>
          )}
        </Content>
      </div>
      <div className="input-wrapper">
        <div className="input-textarea">
          {current.categories?.[0] === modelCategoriesMap.llm ? (
            <MessageInput
              actions={['clear']}
              defaultSize={{
                minRows: 3,
                maxRows: 5
              }}
              loading={loading}
              disabled={!parameters.model}
              isEmpty={!messageList.length}
              handleSubmit={handleSendMessage}
              handleAbortFetch={handleStopConversation}
              clearAll={handleClear}
            />
          ) : (
            <MessageInput
              ref={inputRef}
              actions={['clear']}
              defaultSize={{
                minRows: 3,
                maxRows: 5
              }}
              loading={imageLoading}
              disabled={!parameters.model}
              isEmpty={!imageList.length}
              shouldResetMessage={false}
              handleSubmit={handleCreateImageMessage}
              handleAbortFetch={handleStopImageConversation}
              clearAll={handleClearImage}
              tools={renderTools}
            />
          )}
        </div>
      </div>
    </div>
  );
};

export default ChatPanel;
