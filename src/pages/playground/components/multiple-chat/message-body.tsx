import SimpleAudio from '@/components/audio-player/simple-audio';
import FullMarkdown from '@/components/markdown-viewer/full-markdown';
import { Input } from 'antd';
import classNames from 'classnames';
import _ from 'lodash';
import React, {
  forwardRef,
  useCallback,
  useImperativeHandle,
  useRef
} from 'react';
import styled from 'styled-components';
import { Roles } from '../../config';
import { MessageItem, MessageItemAction } from '../../config/types';
import ThumbImg from '../thumb-img';
import ThinkContent from './think-content';

const AudioWrapper = styled.div`
  padding-top: 10px;
  height: max-content;
  width: max-content;
  margin-inline: 10px;
`;

const ThumbImgWrapper = styled.div.attrs({
  className: 'custom-scrollbar-horizontal'
})`
  display: flex;
  justify-content: flex-start;
  overflow-x: auto;
  flex-direction: column;
`;

interface MessageBodyProps {
  ref?: any;
  data: MessageItem;
  editable?: boolean;
  loading?: boolean;
  showTitle?: boolean;
  actions?: MessageItemAction[];
  showMarkdown?: boolean;
  reasoningContent: {
    thought: string;
    isThinking: boolean;
    result: string;
  };
  collapsed?: boolean;
  updateMessage?: (message: MessageItem) => void;
  onDelete?: () => void;
}

const MessageBody: React.FC<MessageBodyProps> = forwardRef(
  (
    {
      editable,
      data,
      loading,
      reasoningContent,
      showMarkdown,
      collapsed,
      updateMessage
    },
    ref
  ) => {
    const inputRef = useRef<any>(null);
    const imgCountRef = useRef(0);
    const [editContent, setEditContent] = React.useState(data.content);

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
              audio: data.audio || [],
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
        audio: data.audio || [],
        imgs: list
      });
    };

    const handleDeleteAudio = () => {
      updateMessage?.({
        role: data.role,
        content: data.content,
        uid: data.uid,
        audio: [],
        imgs: data.imgs || []
      });
    };

    const handleMessageChange = (e: any) => {
      updateMessage?.({
        imgs: data.imgs || [],
        audio: data.audio || [],
        role: data.role,
        content: e.target.value,
        uid: data.uid
      });
    };

    const handleEdit = (e: any) => {
      setEditContent(e.target.value);
    };

    const handleCancelEdit = () => {
      setEditContent(data.content);
    };

    const handleSaveEdit = () => {
      updateMessage?.({
        role: data.role,
        content: editContent,
        uid: data.uid,
        audio: data.audio || [],
        imgs: data.imgs
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

    const renderReadOnlyMode = () => {
      return (
        <div
          className={classNames('content-item-content', {
            'has-img':
              data.imgs?.length || (data.audio && data.audio?.length > 0)
          })}
        >
          <div className="justify-start ">
            <ThumbImg
              editable={editable}
              dataList={data.imgs || []}
              onDelete={handleDeleteImg}
            />
            {data.audio && data.audio.length > 0 && (
              <AudioWrapper>
                <SimpleAudio
                  url={data.audio?.[0]?.data.url}
                  name={data.audio?.[0]?.data.name}
                  actions={[]}
                  height={50}
                ></SimpleAudio>
              </AudioWrapper>
            )}
          </div>
          {data.content && <div className="text">{data.content}</div>}
        </div>
      );
    };

    const renderEditMode = () => {
      return (
        <div
          className={classNames('message-content-input', {
            'has-img':
              data.imgs?.length || (data.audio && data.audio?.length > 0)
          })}
          onClick={handleClickWrapper}
        >
          <ThumbImgWrapper>
            <ThumbImg
              style={{ paddingBlockEnd: 0 }}
              editable={editable}
              dataList={data.imgs || []}
              onDelete={handleDeleteImg}
            />
            {data.audio && data.audio.length > 0 && (
              <AudioWrapper className={data.imgs?.length ? '' : 'm-l-10'}>
                <SimpleAudio
                  url={data.audio?.[0]?.data.url}
                  name={data.audio?.[0]?.data.name}
                  onDelete={handleDeleteAudio}
                  height={50}
                ></SimpleAudio>
              </AudioWrapper>
            )}
          </ThumbImgWrapper>
          <>
            {data.role === Roles.User ? (
              <Input.TextArea
                ref={inputRef}
                value={data.content}
                variant="filled"
                autoSize={{ minRows: 1 }}
                style={{ borderRadius: 'var(--border-radius-mini)' }}
                readOnly={loading}
                onChange={handleMessageChange}
                onPaste={handleOnPaste}
              />
            ) : (
              <>
                {showMarkdown ? (
                  <>
                    <ThinkContent
                      collapsed={collapsed}
                      content={reasoningContent.thought}
                      isThinking={loading && reasoningContent.isThinking}
                    ></ThinkContent>
                    <div style={{ paddingInline: 4 }}>
                      <FullMarkdown
                        content={`${reasoningContent.result || ''}`}
                      ></FullMarkdown>
                    </div>
                  </>
                ) : (
                  <Input.TextArea
                    ref={inputRef}
                    value={editContent}
                    defaultValue={data.content}
                    variant="filled"
                    autoSize={{ minRows: 1 }}
                    style={{ borderRadius: 'var(--border-radius-mini)' }}
                    onChange={handleEdit}
                    onPaste={handleOnPaste}
                  />
                )}
              </>
            )}
          </>
        </div>
      );
    };

    useImperativeHandle(ref, () => ({
      handleSaveEdit,
      handleCancelEdit,
      setEditContent
    }));

    return <>{editable ? renderEditMode() : renderReadOnlyMode()}</>;
  }
);

export default MessageBody;
