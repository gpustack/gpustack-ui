import CopyButton from '@/components/copy-button';
import HotKeys from '@/config/hotkeys';
import { CloseOutlined } from '@ant-design/icons';
import { useIntl } from '@umijs/max';
import { Button, Input, Space, Tooltip } from 'antd';
import classNames from 'classnames';
import _ from 'lodash';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { useHotkeys } from 'react-hotkeys-hook';
import { Roles } from '../config';
import '../style/message-item.less';
import ThumbImg from './thumb-img';
import UploadImg from './upload-img';
interface MessageItemProps {
  role: string;
  content: string;
  uid: number;
}

const MessageItem: React.FC<{
  message: MessageItemProps;
  loading?: boolean;
  islast?: boolean;
  onSubmit: () => void;
  updateMessage: (message: MessageItemProps) => void;
  isFocus: boolean;
  onDelete: () => void;
}> = ({ message, isFocus, onDelete, updateMessage, onSubmit, loading }) => {
  const intl = useIntl();
  const [currentIsFocus, setCurrentIsFocus] = useState(isFocus);
  const [imgList, setImgList] = useState<
    { uid: number | string; dataUrl: string }[]
  >([]);
  const imgCountRef = useRef(0);

  const inputRef = useRef<any>(null);

  useEffect(() => {
    if (inputRef.current && isFocus) {
      inputRef.current.focus();
    }
  }, [isFocus]);

  const handleUpdateMessage = (params: { role: string; message: string }) => {
    updateMessage({
      role: params.role,
      content: params.message,
      uid: message.uid
    });
  };

  const getPasteContent = useCallback(async (event: any) => {
    const clipboardData = event.clipboardData || window.clipboardData;
    const items = clipboardData.items;
    const imgPromises: Promise<string>[] = [];

    for (let i = 0; i < items.length; i++) {
      let item = items[i];
      console.log('item===========', item);

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
        setImgList((pre) => {
          return [...pre, ...list];
        });
      }
    } catch (error) {
      console.error('Error processing images:', error);
    }
  }, []);

  const handleDeleteImg = useCallback(
    (uid: number | string) => {
      const list = imgList.filter((item) => item.uid !== uid);
      setImgList(list);
    },
    [imgList]
  );

  const handleMessageChange = (e: any) => {
    console.log('e.target.value:', e.target.value);

    handleUpdateMessage({ role: message.role, message: e.target.value });
  };

  const handleBlur = () => {
    setCurrentIsFocus(false);
  };

  const handleFocus = () => {
    setCurrentIsFocus(true);
  };

  const handleClickWrapper = (e: any) => {
    console.log('e===========', e);
    e.stopPropagation();
    e.preventDefault();
    inputRef.current.focus();
    setCurrentIsFocus(true);
  };

  const handleRoleChange = () => {
    const newRoleType =
      message.role === Roles.User ? Roles.Assistant : Roles.User;

    handleUpdateMessage({ role: newRoleType, message: message.content });
  };

  const handleDelete = () => {
    onDelete();
  };

  const handleOnPaste = useCallback(
    (e: any) => {
      const text = e.clipboardData.getData('text');
      if (text) {
        handleUpdateMessage({
          role: message.role,
          message: inputRef.current?.resizableTextArea?.textArea?.value || ''
        });
      } else {
        getPasteContent(e);
      }
    },
    [getPasteContent, message.role, message.content, handleUpdateMessage]
  );

  const handleUpdateImgList = useCallback(
    (list: { uid: number | string; dataUrl: string }[]) => {
      setImgList((preList) => {
        return [...preList, ...list];
      });
    },
    [imgList]
  );

  const handleDeleteLastImage = useCallback(() => {
    if (imgList.length > 0) {
      const newImgList = [...imgList];
      const lastImage = newImgList.pop();
      if (lastImage) {
        handleDeleteImg(lastImage.uid);
      }
    }
  }, [imgList, handleDeleteImg]);

  const handleKeyDown = useCallback(
    (event: any) => {
      if (
        event.key === 'Backspace' &&
        message.content === '' &&
        imgList.length > 0
      ) {
        // inputref blur
        event.preventDefault();
        handleDeleteLastImage();
      }
    },
    [message.content, imgList, handleDeleteLastImage]
  );

  useHotkeys(
    HotKeys.SUBMIT,
    () => {
      inputRef.current.blur();
      onSubmit();
    },
    {
      enabled: currentIsFocus,
      enableOnFormTags: currentIsFocus,
      preventDefault: true
    }
  );

  return (
    <div className="message-item">
      <div className="role-type">
        <Button onClick={handleRoleChange} type="text">
          {intl.formatMessage({ id: `playground.${message.role}` })}
        </Button>
      </div>
      <div
        className={classNames('message-content-input', {
          'has-img': imgList.length
        })}
        onClick={handleClickWrapper}
      >
        <ThumbImg dataList={imgList} onDelete={handleDeleteImg}></ThumbImg>
        <Input.TextArea
          ref={inputRef}
          style={{ paddingBlock: '12px', paddingTop: 20 }}
          value={message.content}
          autoSize={true}
          variant="filled"
          readOnly={loading}
          onKeyDown={handleKeyDown}
          onChange={handleMessageChange}
          onFocus={handleFocus}
          onBlur={handleBlur}
          onPaste={handleOnPaste}
        ></Input.TextArea>
      </div>
      <div className="delete-btn">
        <Space size={5}>
          <UploadImg handleUpdateImgList={handleUpdateImgList}></UploadImg>
          {message.content && (
            <CopyButton
              text={message.content}
              size="small"
              shape="default"
              type="text"
              fontSize="12px"
            ></CopyButton>
          )}
          <Tooltip title={intl.formatMessage({ id: 'common.button.delete' })}>
            <Button
              size="small"
              type="text"
              onClick={handleDelete}
              icon={<CloseOutlined />}
            ></Button>
          </Tooltip>
        </Space>
      </div>
    </div>
  );
};

export default MessageItem;
