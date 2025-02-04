import CopyButton from '@/components/copy-button';
import { MinusCircleOutlined } from '@ant-design/icons';
import { useIntl } from '@umijs/max';
import { Button, Input, Tooltip } from 'antd';
import classNames from 'classnames';
import _ from 'lodash';
import React, { useCallback, useRef } from 'react';
import { Roles } from '../../config';
import { MessageItem, MessageItemAction } from '../../config/types';
import '../../style/content-item.less';
import ThumbImg from '../thumb-img';
import UploadImg from '../upload-img';

interface MessageItemProps {
  data: MessageItem;
  editable?: boolean;
  loading?: boolean;
  showTitle?: boolean;
  actions?: MessageItemAction[];
  updateMessage?: (message: MessageItem) => void;
  onDelete?: () => void;
}

const ContentItem: React.FC<MessageItemProps> = ({
  updateMessage,
  onDelete,
  loading,
  data,
  editable,
  showTitle = true,
  actions = ['upload', 'delete', 'copy']
}) => {
  const intl = useIntl();
  const inputRef = useRef<any>(null);
  const imgCountRef = useRef(0);

  const handleMessageChange = (e: any) => {
    updateMessage?.({
      imgs: data.imgs || [],
      role: data.role,
      content: e.target.value,
      uid: data.uid
    });
  };

  const handleToggleRole = () => {
    updateMessage?.({
      imgs: data.imgs || [],
      role: data.role === Roles.User ? Roles.Assistant : Roles.User,
      content: data.content,
      uid: data.uid
    });
  };

  const getPasteContent = useCallback(
    async (event: any) => {
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

  const handleUpdateImgList = useCallback(
    (list: { uid: number | string; dataUrl: string }[]) => {
      updateMessage?.({
        role: data.role,
        content: data.content,
        uid: data.uid,
        imgs: [...(data.imgs || []), ...list]
      });
    },
    [data, updateMessage]
  );

  const handleDeleteImg = (uid: number | string) => {
    const list = _.filter(data.imgs, (item: MessageItem) => item.uid !== uid);
    updateMessage?.({
      role: data.role,
      content: data.content,
      uid: data.uid,
      imgs: list
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
    console.log('e===========', e);
    e.stopPropagation();
    e.preventDefault();
    inputRef.current.focus();
  };

  return (
    <div className="content-item">
      <div
        className="content-item-role"
        style={{ display: !showTitle && !actions.length ? 'none' : 'flex' }}
      >
        {showTitle && (
          <div className="role">
            {data.title ??
              intl.formatMessage({ id: `playground.${data.role}` })}
          </div>
        )}
        <div className="actions">
          {actions.includes('upload') && data.role === Roles.User && (
            <UploadImg handleUpdateImgList={handleUpdateImgList}></UploadImg>
          )}
          {data.content && actions.includes('copy') && (
            <CopyButton
              text={data.content}
              size="small"
              shape="default"
              type="text"
              fontSize="12px"
            ></CopyButton>
          )}
          {actions.includes('delete') && (
            <Tooltip title={intl.formatMessage({ id: 'common.button.delete' })}>
              <Button
                size="small"
                type="text"
                onClick={onDelete}
                icon={<MinusCircleOutlined />}
              ></Button>
            </Tooltip>
          )}
        </div>
      </div>
      {editable ? (
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
          ></ThumbImg>
          <Input.TextArea
            ref={inputRef}
            value={data.content}
            variant="filled"
            autoSize={{ minRows: 1 }}
            style={{
              borderRadius: 'var(--border-radius-mini)'
            }}
            readOnly={loading}
            onKeyDown={handleKeyDown}
            onChange={handleMessageChange}
            onPaste={handleOnPaste}
          ></Input.TextArea>
        </div>
      ) : (
        <div
          className={classNames('content-item-content', {
            'has-img': data.imgs?.length
          })}
        >
          <ThumbImg
            editable={editable}
            dataList={data.imgs || []}
            onDelete={handleDeleteImg}
          ></ThumbImg>
          {data.content && <div className="text">{data.content}</div>}
        </div>
      )}
    </div>
  );
};

export default React.memo(ContentItem);
