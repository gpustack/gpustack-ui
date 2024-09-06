import { fetchChunkedData, readStreamData } from '@/utils/fetch-chunk-data';
import _ from 'lodash';
import { useRef, useState } from 'react';
import { CHAT_API } from '../apis';
import { Roles } from '../config';

interface MessageItemProps {
  role: string | number;
  content: string;
  uid: number;
}

const useChatCompletion = (
  systemMessage: string,
  parameters: Record<string, any>
) => {
  const [loading, setLoading] = useState(false);
  const messageId = useRef<number>(0);
  const [messageList, setMessageList] = useState<MessageItemProps[]>([
    {
      role: 'user',
      content: '',
      uid: messageId.current
    }
  ]);
  const contentRef = useRef<any>('');
  const controllerRef = useRef<any>(null);

  const setMessageId = () => {
    messageId.current = messageId.current + 1;
  };

  const abortFetch = () => {
    controllerRef.current?.abort?.();
  };

  const joinMessage = (chunk: any) => {
    if (!chunk) {
      return;
    }
    if (_.get(chunk, 'choices.0.finish_reason')) {
      return;
    }
    contentRef.current =
      contentRef.current + _.get(chunk, 'choices.0.delta.content', '');
    setMessageList([
      ...messageList,
      {
        role: Roles.Assistant,
        content: contentRef.current,
        uid: messageId.current
      }
    ]);
  };

  const submitMessage = async () => {
    if (!parameters.model) return;
    try {
      setLoading(true);
      setMessageId();

      controllerRef.current?.abort?.();
      controllerRef.current = new AbortController();
      const signal = controllerRef.current.signal;
      const messages = _.map(messageList, (item: MessageItemProps) => {
        return {
          role: item.role,
          content: item.content
        };
      });

      contentRef.current = '';
      const chatParams = {
        messages: systemMessage
          ? [
              {
                role: Roles.System,
                content: systemMessage
              },
              ...messages
            ]
          : [...messages],
        ...parameters,
        stream: true
      };
      const result = await fetchChunkedData({
        data: chatParams,
        url: CHAT_API,
        signal
      });

      if (!result) {
        return;
      }
      const { reader, decoder } = result;
      await readStreamData(reader, decoder, (chunk: any) => {
        joinMessage(chunk);
      });
      setLoading(false);
    } catch (error) {
      console.log('error=====', error);
      setLoading(false);
    }
  };

  return {
    loading,
    messageList,
    setMessageList,
    submitMessage,
    abortFetch
  };
};

export default useChatCompletion;
