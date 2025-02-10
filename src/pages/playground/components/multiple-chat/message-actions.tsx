import CopyButton from '@/components/copy-button';
import {
  FileMarkdownOutlined,
  FileTextOutlined,
  MinusCircleOutlined
} from '@ant-design/icons';
import { useIntl } from '@umijs/max';
import { Button, Tooltip } from 'antd';
import React, { useCallback } from 'react';
import { Roles } from '../../config';
import { MessageItem, MessageItemAction } from '../../config/types';
import UploadImg from '../upload-img';

interface MessageActionsProps {
  data: MessageItem;
  actions: MessageItemAction[];
  renderMode?: string;
  renderModeChange?: (value: string) => void;
  updateMessage?: (message: MessageItem) => void;
  onDelete?: () => void;
}

const renderOptions = [
  { label: 'Markdown', value: 'markdown', icon: <FileMarkdownOutlined /> },
  { label: 'Plain', value: 'plain', icon: <FileTextOutlined /> }
];

const MessageActions: React.FC<MessageActionsProps> = ({
  actions,
  data,
  renderMode,
  renderModeChange,
  updateMessage,
  onDelete
}) => {
  const intl = useIntl();

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

  return (
    <>
      {actions.length > 1 ? (
        <div className="actions">
          {actions.includes('upload') && data.role === Roles.User && (
            <UploadImg handleUpdateImgList={handleUpdateImgList} />
          )}
          {data.content && actions.includes('copy') && (
            <CopyButton
              text={data.content}
              size="small"
              shape="default"
              type="text"
              fontSize="12px"
            />
          )}
          {actions.includes('delete') && (
            <Tooltip title={intl.formatMessage({ id: 'common.button.delete' })}>
              <Button
                size="small"
                type="text"
                onClick={onDelete}
                icon={<MinusCircleOutlined />}
              />
            </Tooltip>
          )}
        </div>
      ) : null}
    </>
  );
};

export default MessageActions;
