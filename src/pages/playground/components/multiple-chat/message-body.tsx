import MarkdownViewer from '@/components/markdown-viewer';
import { Input } from 'antd';
import classNames from 'classnames';
import _ from 'lodash';
import React, { useCallback, useMemo, useRef } from 'react';
import { Roles } from '../../config';
import { MessageItem, MessageItemAction } from '../../config/types';
import ThumbImg from '../thumb-img';
import ThinkContent from './think-content';
import ThinkParser from './think-parser';

interface MessageBodyProps {
  data: MessageItem;
  editable?: boolean;
  loading?: boolean;
  showTitle?: boolean;
  actions?: MessageItemAction[];
  updateMessage?: (message: MessageItem) => void;
  onDelete?: () => void;
}

const MessageBody: React.FC<MessageBodyProps> = ({
  editable,
  data,
  loading,
  actions,
  updateMessage
}) => {
  const inputRef = useRef<any>(null);
  const imgCountRef = useRef(0);
  const thinkerRef = useRef<any>(null);

  const content = useMemo(() => {
    if (!thinkerRef.current && actions?.includes('markdown')) {
      thinkerRef.current = new ThinkParser();
    }
    if (actions?.includes('markdown')) {
      return thinkerRef.current.parse(data.content);
    }
    return {
      thought: '',
      result: data.content
    };
  }, [data.content, actions]);

  const getPasteContent = useCallback(
    async (event: any) => {
      // @ts-ignore
      const clipboardData = event.clipboardData || window.clipboardData;
      const items = clipboardData.items;
      const imgPromises: Promise<string>[] = [];

      for (let i = 0; i < items.length; i++) {
        let item = items[i];

        if (item.kind === 'file' && item.type.indexOf('image') !== -1) {
          const file = item.getAsFile();
          const imgPromise = new Promise<string>((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = function (event) {
              const base64String = event.target?.result as string;
              if (base64String) {
                resolve(base64String);
              } else {
                reject('Failed to convert image to base64');
              }
            };
            reader.readAsDataURL(file);
          });
          imgPromises.push(imgPromise);
        } else if (item.kind === 'string') {
          // string
        }
      }

      try {
        const imgs = await Promise.all(imgPromises);
        if (imgs.length) {
          const list = _.map(imgs, (img: string) => {
            imgCountRef.current += 1;
            return {
              uid: imgCountRef.current,
              dataUrl: img
            };
          });

          updateMessage?.({
            role: data.role,
            content: data.content,
            uid: data.uid,
            imgs: [...(data.imgs || []), ...list]
          });
        }
      } catch (error) {
        console.error('Error processing images:', error);
      }
    },
    [data, updateMessage]
  );

  const handleOnPaste = (e: any) => {
    const text = e.clipboardData.getData('text');
    if (!text) {
      e.preventDefault();
      getPasteContent(e);
    }
  };

  const handleDeleteImg = (uid: number | string) => {
    const list = _.filter(data.imgs, (item: MessageItem) => item.uid !== uid);
    updateMessage?.({
      role: data.role,
      content: data.content,
      uid: data.uid,
      imgs: list
    });
  };

  const handleMessageChange = (e: any) => {
    updateMessage?.({
      imgs: data.imgs || [],
      role: data.role,
      content: e.target.value,
      uid: data.uid
    });
  };

  const handleDeleteLastImage = useCallback(() => {
    if (data.imgs && data.imgs?.length > 0) {
      const newImgList = [...(data.imgs || [])];
      const lastImage = newImgList.pop();
      if (lastImage) {
        handleDeleteImg(lastImage.uid);
      }
    }
  }, [data.imgs, handleDeleteImg]);

  const handleKeyDown = useCallback(
    (event: any) => {
      if (
        event.key === 'Backspace' &&
        data.content === '' &&
        data.imgs &&
        data.imgs?.length > 0
      ) {
        // inputref blur
        event.preventDefault();
        handleDeleteLastImage();
      }
    },
    [data, handleDeleteLastImage]
  );
  const handleClickWrapper = (e: any) => {
    e.stopPropagation();
    e.preventDefault();
    inputRef.current?.focus();
  };

  if (!editable) {
    return (
      <div
        className={classNames('content-item-content', {
          'has-img': data.imgs?.length
        })}
      >
        <ThumbImg
          editable={editable}
          dataList={data.imgs || []}
          onDelete={handleDeleteImg}
        />
        {data.content && <div className="text">{data.content}</div>}
      </div>
    );
  }

  return (
    <div
      className={classNames('message-content-input', {
        'has-img': data.imgs?.length
      })}
      onClick={handleClickWrapper}
    >
      <ThumbImg
        editable={editable}
        dataList={data.imgs || []}
        onDelete={handleDeleteImg}
      />
      <>
        {data.role === Roles.User ? (
          <Input.TextArea
            ref={inputRef}
            value={data.content}
            variant="filled"
            autoSize={{ minRows: 1 }}
            style={{ borderRadius: 'var(--border-radius-mini)' }}
            readOnly={loading}
            onKeyDown={handleKeyDown}
            onChange={handleMessageChange}
            onPaste={handleOnPaste}
          />
        ) : (
          <>
            {actions?.includes('markdown') ? (
              <>
                <ThinkContent content={content.thought}></ThinkContent>
                <div style={{ paddingInline: 4 }}>
                  <MarkdownViewer
                    content={content.result || ''}
                    theme="light"
                  />
                </div>
              </>
            ) : (
              <Input.TextArea
                ref={inputRef}
                value={data.content}
                variant="filled"
                autoSize={{ minRows: 1 }}
                style={{ borderRadius: 'var(--border-radius-mini)' }}
                readOnly={loading}
                onKeyDown={handleKeyDown}
                onChange={handleMessageChange}
                onPaste={handleOnPaste}
              />
            )}
          </>
        )}
      </>
    </div>
  );
};

export default MessageBody;
