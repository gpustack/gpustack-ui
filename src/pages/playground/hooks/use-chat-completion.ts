import useOverlayScroller from '@/hooks/use-overlay-scroller';
import { fetchChunkedData, readStreamData } from '@/utils/fetch-chunk-data';
import _ from 'lodash';
import React, { useEffect, useRef, useState } from 'react';
import { CHAT_API } from '../apis';
import {
  Roles,
  extractErrorMessage,
  generateMessagesByListContent
} from '../config';
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
  const reasonContentRef = useRef('');

  const setMessageId = () => {
    messageId.current = messageId.current + 1;
    return messageId.current;
  };

  const formatContent = (data: {
    content: string;
    reasoningContent: string;
  }) => {
    if (data.reasoningContent && !data.content) {
      return `<think>${data.reasoningContent}`;
    }
    if (data.reasoningContent && data.content) {
      return `<think>${data.reasoningContent}</think>${data.content}`;
    }
    return data.content;
  };

  const joinMessage = (chunk: any) => {
    console.log('chunk:', chunk);
    setTokenResult({
      ...(chunk?.usage ?? {})
    });

    if (!chunk || !_.get(chunk, 'choices', []).length) {
      return;
    }

    const deltaReasoningContent =
      _.get(chunk, 'choices.0.delta.reasoning_content', '') === null
        ? ''
        : _.get(chunk, 'choices.0.delta.reasoning_content', '');

    const deltaContent =
      _.get(chunk, 'choices.0.delta.content', '') === null
        ? ''
        : _.get(chunk, 'choices.0.delta.content', '');

    reasonContentRef.current = reasonContentRef.current + deltaReasoningContent;
    contentRef.current = contentRef.current + deltaContent;

    const content = formatContent({
      content: contentRef.current,
      reasoningContent: reasonContentRef.current
    });

    setMessageList([
      ...messageList,
      ...currentMessageRef.current,
      {
        role: Roles.Assistant,
        content: content,
        uid: messageId.current
      }
    ]);
  };

  const handleClear = () => {
    setMessageList([]);
    setTokenResult(null);
  };

  const handleAddNewMessage = (message?: { role: string; content: string }) => {
    const newMessage = message || {
      role:
        _.last(messageList)?.role === Roles.User ? Roles.Assistant : Roles.User,
      content: ''
    };
    setMessageList((preList) => [
      ...preList,
      {
        ...newMessage,
        uid: setMessageId()
      }
    ]);
  };

  const handleStopConversation = () => {
    controllerRef.current?.abort?.('stop');
    setLoading(false);
    setTokenResult(null);
  };

  const resetPerRequestCache = () => {
    contentRef.current = '';
    reasonContentRef.current = '';
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

      controllerRef.current?.abort?.('cancel');
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

      resetPerRequestCache();
      setMessageList((pre) => {
        return [...pre, ...currentMessageRef.current];
      });

      const messageParams = [
        ...(system ? [system] : []),
        ...messageList,
        ...currentMessageRef.current
      ];

      const messages = generateMessagesByListContent(messageParams);

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
          errorMessage: extractErrorMessage(result)
        });
        return;
      }
      setMessageId();
      const { reader, decoder } = result;
      await readStreamData(reader, decoder, (chunk: any) => {
        if (chunk?.error) {
          setTokenResult({
            error: true,
            errorMessage: extractErrorMessage(chunk.error)
          });
        } else {
          joinMessage(chunk);
        }
      });
    } catch (error) {
      console.log('error:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (scroller.current) {
      initialize(scroller.current);
    }
  }, [scroller.current, initialize]);

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

  useEffect(() => {
    return () => {
      handleStopConversation();
    };
  }, []);

  return {
    loading,
    tokenResult,
    messageList,
    setMessageId,
    setMessageList,
    handleClear,
    handleAddNewMessage,
    handleStopConversation,
    updateScrollerPosition,
    submitMessage
  };
}
