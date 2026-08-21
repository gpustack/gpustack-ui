import { SettingOutlined } from '@ant-design/icons';
import { useBodyScroll } from '@gpustack/core-ui';
import { useAccess, useIntl } from '@umijs/max';
import { Button, Tooltip } from 'antd';
import React, { useState } from 'react';
import SourceConfigDrawer from './drawer';
import type { SourceScopeConfig } from './types';

interface SourceConfigEntryProps {
  config: SourceScopeConfig;
  // The merged result changed, so the list behind the drawer is stale.
  onSaved?: () => void;
}

/**
 * Whether the entry belongs in this user's toolbar at all. Both source
 * endpoints are platform-admin only on the server, so it is hidden for everyone
 * else rather than left to fail with a 403 — and the pages carrying it are
 * `canSeeOrgAdmin`, which extensions widen past platform admin.
 *
 * The caller does the hiding, which is why this is a hook rather than an
 * `Access` wrapper inside the entry: both toolbars are an antd `Space`, and a
 * `Space` reads its children as items *before* they render. An element that
 * renders nothing still occupies an item, so the gap around it survives — only
 * an absent element leaves no trace.
 */
export const useSourceConfigVisible = () => !!useAccess().canSeeAdmin;

const SourceConfigEntry: React.FC<SourceConfigEntryProps> = ({
  config,
  onSaved
}) => {
  const intl = useIntl();
  const { saveScrollHeight, restoreScrollHeight } = useBodyScroll();
  const [open, setOpen] = useState(false);

  const handleOpen = () => {
    saveScrollHeight();
    setOpen(true);
  };

  const handleCancel = () => {
    setOpen(false);
    restoreScrollHeight();
  };

  return (
    <>
      {/* Icon only, with the label as its tooltip: a secondary action sitting
          beside the toolbar's primary button. Default styling, so it keeps the
          border that tells it apart from the page behind it. */}
      <Tooltip title={intl.formatMessage({ id: 'common.source.manage' })}>
        <Button icon={<SettingOutlined />} onClick={handleOpen}></Button>
      </Tooltip>
      <SourceConfigDrawer
        open={open}
        onCancel={handleCancel}
        onSaved={onSaved}
        config={config}
      ></SourceConfigDrawer>
    </>
  );
};

export default SourceConfigEntry;
