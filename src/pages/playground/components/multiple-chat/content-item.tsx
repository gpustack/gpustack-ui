import { useIntl } from '@umijs/max';
import React from 'react';
import { MessageItem, MessageItemAction } from '../../config/types';
import '../../style/content-item.less';
import MessageActions from './message-actions';
import MessageBody from './message-body';

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
        <MessageActions
          data={data}
          actions={actions}
          onDelete={onDelete}
          updateMessage={updateMessage}
        ></MessageActions>
      </div>
      <MessageBody
        editable={editable}
        data={data}
        loading={loading}
        actions={actions}
        updateMessage={updateMessage}
      ></MessageBody>
    </div>
  );
};

export default React.memo(ContentItem);
