import CopyButton from '@/components/copy-button';
import { EditOutlined, MinusCircleOutlined } from '@ant-design/icons';
import { useIntl } from '@umijs/max';
import { Button, Tooltip } from 'antd';
import React, { useCallback } from 'react';
import { Roles } from '../../config';
import { MessageItem, MessageItemAction } from '../../config/types';
import UploadImg from '../upload-img';

interface MessageActionsProps {
  data: MessageItem;
  actions: MessageItemAction[];
  loading?: boolean;
  updateMessage?: (message: MessageItem) => void;
  onDelete?: () => void;
  onEdit?: () => void;
}

const MessageActions: React.FC<MessageActionsProps> = ({
  actions,
  data,
  loading,
  updateMessage,
  onDelete,
  onEdit
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
      {actions.length > 1 && !loading ? (
        <div className="actions">
          <div className="actions-wrap gap-5">
            {actions.includes('upload') && data.role === Roles.User && (
              <UploadImg handleUpdateImgList={handleUpdateImgList} />
            )}
            {actions.includes('edit') && data.role === Roles.Assistant && (
              <Tooltip title={intl.formatMessage({ id: 'common.button.edit' })}>
                <Button
                  size="small"
                  type="text"
                  icon={<EditOutlined />}
                  onClick={onEdit}
                />
              </Tooltip>
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
              <Tooltip
                title={intl.formatMessage({ id: 'common.button.delete' })}
              >
                <Button
                  size="small"
                  type="text"
                  onClick={onDelete}
                  icon={<MinusCircleOutlined />}
                />
              </Tooltip>
            )}
          </div>
        </div>
      ) : null}
    </>
  );
};

export default MessageActions;
