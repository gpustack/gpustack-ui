import { useSourceConfigVisible } from '@/pages/_components/source-config';
import { DownOutlined } from '@ant-design/icons';
import { DropdownActions } from '@gpustack/core-ui';
import { useIntl } from '@umijs/max';
import { Button, Space } from 'antd';
import React from 'react';
import BackendSourceEntry from './backend-source-entry';

export interface RightActionsProps {
  actionItems: any[];
  handleClickPrimary: (item: any) => void;
  onSourceSaved: () => void;
}

/**
 * Replaces FilterBar's default right side so the source drawer can sit beside
 * the add button. Mirrors what FilterBar renders for `actionType="dropdown"`.
 */
const RightActions: React.FC<RightActionsProps> = ({
  actionItems,
  handleClickPrimary,
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
      <DropdownActions
        styles={{ root: { minWidth: '140px' } }}
        menu={{ items: actionItems, onClick: handleClickPrimary }}
      >
        <Button icon={<DownOutlined />} type="primary" iconPlacement="end">
          {intl.formatMessage({ id: 'backend.button.add' })}
        </Button>
      </DropdownActions>
    </Space>
  );
};

export default RightActions;
