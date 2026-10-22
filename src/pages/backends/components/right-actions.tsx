import { useSourceConfigVisible } from '@/pages/_components/source-config';
import { PlusOutlined } from '@ant-design/icons';
import { IconFont } from '@gpustack/core-ui';
import { useIntl } from '@umijs/max';
import { Button, Space } from 'antd';
import React from 'react';
import BackendSourceEntry from './backend-source-entry';

export interface RightActionsProps {
  onOpenCommunity: () => void;
  onAddBackend: () => void;
  onSourceSaved: () => void;
}

const RightActions: React.FC<RightActionsProps> = ({
  onOpenCommunity,
  onAddBackend,
  onSourceSaved
}) => {
  const intl = useIntl();
  // Gated here rather than inside the entry: a `Space` item that renders
  // nothing still takes its gap.
  const showSourceEntry = useSourceConfigVisible();

  return (
    <Space size={16}>
      {showSourceEntry && (
        <BackendSourceEntry onSaved={onSourceSaved}></BackendSourceEntry>
      )}
      <Button icon={<IconFont type="icon-public" />} onClick={onOpenCommunity}>
        {intl.formatMessage({ id: 'backend.button.marketplace' })}
      </Button>
      <Button icon={<PlusOutlined />} type="primary" onClick={onAddBackend}>
        {intl.formatMessage({ id: 'backend.button.add' })}
      </Button>
    </Space>
  );
};

export default RightActions;
