import IconFont from '@/components/icon-font';
import { StopOutlined } from '@ant-design/icons';
import { useIntl } from '@umijs/max';
import { Button } from 'antd';
import React, { useMemo } from 'react';
import { Roles } from '../../config';
import { MessageItem, MessageItemAction } from '../../config/types';
import '../../style/content-item.less';
import MessageActions from './message-actions';
import MessageBody from './message-body';
import ThinkParser from './think-parser';

interface MessageItemProps {
  data: MessageItem;
  editable?: boolean;
  loading?: boolean;
  showTitle?: boolean;
  actions?: MessageItemAction[];
  updateMessage?: (message: MessageItem) => void;
  onDelete?: () => void;
}

interface SaveActionsProps {
  handleSave: () => void;
  handleCancel: () => void;
}

interface ThoughtStatusProps {
  collapsed: boolean;
  setCollapsed: (collapsed: boolean) => void;
  isThinking: boolean;
}

const SaveActions: React.FC<SaveActionsProps> = ({
  handleSave,
  handleCancel
}) => {
  const intl = useIntl();
  return (
    <div className="save-actions">
      <div className="actions-wrap gap-8">
        <Button
          size="small"
          icon={<StopOutlined />}
          onClick={handleCancel}
          style={{ borderRadius: 'var(--border-radius-base)' }}
        >
          {intl.formatMessage({ id: 'common.button.cancel' })}
        </Button>
        <Button
          size="small"
          type="primary"
          icon={<IconFont type="icon-save3" />}
          onClick={handleSave}
          style={{ borderRadius: 'var(--border-radius-base)' }}
        >
          {intl.formatMessage({ id: 'common.button.save' })}
        </Button>
      </div>
    </div>
  );
};

const ThoughtStatus: React.FC<ThoughtStatusProps> = ({
  collapsed,
  setCollapsed,
  isThinking
}) => {
  const intl = useIntl();
  return (
    <div
      className="flex-center"
      style={{
        marginLeft: 10,
        borderRadius: 'var(--border-radius-base)',
        width: 'max-content',
        overflow: 'hidden'
      }}
    >
      <Button
        size="small"
        type="text"
        className="flex-center"
        variant="filled"
        color="default"
        onClick={() => setCollapsed(!collapsed)}
      >
        <span>
          {isThinking
            ? intl.formatMessage({ id: 'playground.chat.thinking' })
            : intl.formatMessage({ id: 'playground.chat.aithought' })}
        </span>
        <IconFont type="icon-down" rotate={collapsed ? 0 : 180} />
      </Button>
    </div>
  );
};

const ContentItem: React.FC<MessageItemProps> = ({
  updateMessage,
  onDelete,
  loading,
  data,
  editable,
  showTitle = true,
  actions = ['upload', 'delete', 'copy', 'edit']
}) => {
  const intl = useIntl();
  const [showMarkdown, setShowMarkdown] = React.useState(true);
  const messageRef = React.useRef<any>(null);
  const thinkerRef = React.useRef<any>(null);
  const [collapsed, setCollapsed] = React.useState(false);

  const handleOnEdit = () => {
    setShowMarkdown(false);
    messageRef.current?.setEditContent(data.content);
  };

  const handleSave = () => {
    messageRef.current?.handleSaveEdit();
    setShowMarkdown(true);
  };

  const handleCancel = () => {
    messageRef.current?.handleCancelEdit();
    setShowMarkdown(true);
  };

  const handleUpdateMessage = (message: MessageItem) => {
    updateMessage?.(message);
    if (data.role === Roles.Assistant) {
      thinkerRef.current?.reset();
    }
  };

  const reasoningContent = useMemo(() => {
    if (data.role === Roles.User) {
      return {
        thought: '',
        isThinking: false,
        result: ''
      };
    }
    if (!thinkerRef.current && showMarkdown) {
      thinkerRef.current = new ThinkParser();
    }
    if (showMarkdown) {
      const res = thinkerRef.current.parse(data.content);
      return res;
    }
    return {
      thought: '',
      isThinking: false,
      result: data.content
    };
  }, [data.content, showMarkdown, data.role]);

  const renderTitle = useMemo(() => {
    if (!showTitle) {
      return null;
    }
    let roleTitle: React.ReactNode = intl.formatMessage({
      id: `playground.${data.role}`
    });
    let avatar = (
      <IconFont
        type="icon-user-filled"
        className="font-size-16 m-r-5 text-tertiary"
      />
    );

    if (data.role === Roles.Assistant) {
      avatar = (
        <IconFont
          type="icon-assistant-filled"
          className="font-size-16 m-r-5"
          style={{ color: 'var(--ant-blue-6)' }}
        />
      );
    }

    if (data.title) {
      roleTitle = data.title;
    }
    return (
      <div className="role flex-center">
        {avatar}
        {roleTitle}
        {data.role === Roles.Assistant && reasoningContent.thought && (
          <ThoughtStatus
            isThinking={loading && reasoningContent.isThinking}
            collapsed={collapsed}
            setCollapsed={setCollapsed}
          ></ThoughtStatus>
        )}
      </div>
    );
  }, [
    data.role,
    data.title,
    intl,
    showTitle,
    loading,
    reasoningContent.thought,
    reasoningContent.isThinking,
    collapsed
  ]);

  return (
    <div className="content-item">
      <div className="content-item-title">{showTitle && renderTitle}</div>
      <div
        className="content-item-role"
        style={{ display: !actions.length ? 'none' : 'flex' }}
      >
        {showMarkdown ? (
          <MessageActions
            data={data}
            actions={actions}
            loading={loading}
            onDelete={onDelete}
            onEdit={handleOnEdit}
            updateMessage={updateMessage}
          ></MessageActions>
        ) : (
          <SaveActions
            handleSave={handleSave}
            handleCancel={handleCancel}
          ></SaveActions>
        )}
      </div>
      <MessageBody
        ref={messageRef}
        editable={editable}
        showMarkdown={showMarkdown}
        data={data}
        loading={loading}
        actions={actions}
        collapsed={collapsed}
        reasoningContent={reasoningContent}
        updateMessage={handleUpdateMessage}
      ></MessageBody>
    </div>
  );
};

export default ContentItem;
