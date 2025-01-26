import useOverlayScroller from '@/hooks/use-overlay-scroller';
import { fetchChunkedData, readStreamData } from '@/utils/fetch-chunk-data';
import _ from 'lodash';
import { useEffect, useRef, useState } from 'react';
import { CHAT_API } from '../apis';
import { Roles, generateMessages } from '../config';
import { MessageItem } from '../config/types';

export default function useChatCompletion(
  scroller: React.RefObject<HTMLElement>
) {
  const { initialize, updateScrollerPosition } = useOverlayScroller();
  const [loading, setLoading] = useState(false);
  const [tokenResult, setTokenResult] = useState<any>(null);
  const [messageList, setMessageList] = useState<MessageItem[]>([]);
  const controllerRef = useRef<any>(null);
  const messageId = useRef<number>(0);
  const contentRef = useRef<any>('');
  const currentMessageRef = useRef<any>(null);
  const messageListLengthCache = useRef<number>(0);

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

  const handleClear = () => {
    if (!messageList.length) {
      return;
    }
    setMessageId();
    setMessageList([]);
    setTokenResult(null);
  };

  const handleStopConversation = () => {
    controllerRef.current?.abort?.();
    setLoading(false);
  };

  const submitMessage = async (params: {
    current?: { role: string; content: string };
    system?: { role: string; content: string };
    parameters: any;
  }) => {
    try {
      setLoading(true);
      setMessageId();
      setTokenResult(null);

      const { current, parameters, system } = params;

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
        ...(system ? [system] : []),
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
      console.log('error:', error);
    } finally {
      setLoading(false);
    }
  };
  const throttleUpdatePosition = _.throttle(updateScrollerPosition, 100);

  useEffect(() => {
    if (scroller.current) {
      initialize(scroller.current);
    }
  }, [scroller.current, initialize]);

  useEffect(() => {
    if (loading) {
      throttleUpdatePosition();
    }
  }, [messageList, loading]);

  useEffect(() => {
    if (messageList.length > messageListLengthCache.current) {
      throttleUpdatePosition();
    }
    messageListLengthCache.current = messageList.length;
  }, [messageList.length]);

  return {
    loading,
    tokenResult,
    messageList,
    setMessageList,
    handleClear,
    handleStopConversation,
    submitMessage
  };
}
