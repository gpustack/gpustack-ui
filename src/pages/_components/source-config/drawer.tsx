import { CollapsePanel, FormDrawer, TextAttribute } from '@gpustack/core-ui';
import { useIntl } from '@umijs/max';
import { createStyles } from 'antd-style';
import React, { useEffect, useState } from 'react';
import SourceSlotForm from './slot-form';
import type { SourceScopeConfig, SourceSlotConfig } from './types';
import { useProbeStatus } from './use-source-config';

const useStyles = createStyles(({ css }) => ({
  // A ghost collapse draws no divider between items, so an expanded panel's
  // last row — its Save button — lands directly against the next panel's
  // title, reading as if the button belonged to that title.
  panels: css`
    .ant-collapse-item + .ant-collapse-item {
      margin-top: 24px;
    }
  `
}));

interface SourceConfigDrawerProps {
  open: boolean;
  onCancel: () => void;
  // The merged result changed, so the list behind the drawer is stale.
  onSaved?: () => void;
  config: SourceScopeConfig;
}

/**
 * Configures the source of every kind of content a scope owns.
 *
 * The catalog scope owns one kind and shows its form directly; the backend
 * scope owns two — the built-in backend versions and the community library —
 * and stacks them as panels that expand independently, because they are two
 * separate configurations rather than two settings of one.
 *
 * Each panel saves itself: a kind's whole configuration is one object on the
 * server, so one panel is one request, and the drawer's footer carries no Save
 * that would have to guess which panel it meant.
 *
 * `/source-probe` reports every kind at once — the leader-only state each panel
 * shows and the OTA server its official file link is built from — so it is
 * fetched once here and handed down.
 */
const SourceConfigDrawer: React.FC<SourceConfigDrawerProps> = ({
  open,
  onCancel,
  onSaved,
  config: scope
}) => {
  const intl = useIntl();
  const { styles } = useStyles();
  const { probeStatus, loadProbe } = useProbeStatus(scope.probe);
  const slots = scope.slots;
  const [activeKeys, setActiveKeys] = useState<string[]>([slots[0].kind]);

  useEffect(() => {
    if (!open) {
      return;
    }
    setActiveKeys([slots[0].kind]);
    loadProbe();
    // the fetch is tied to open; loadProbe is recreated every render
  }, [open]);

  // A panel saved: its merged content moved, so the probe and the list behind
  // the drawer are both stale.
  const handleSlotSaved = () => {
    loadProbe();
    onSaved?.();
  };

  const renderSlot = (slot: SourceSlotConfig) => (
    <SourceSlotForm
      slot={slot}
      status={probeStatus?.kinds?.[slot.kind]}
      otaServerUrl={probeStatus?.ota_server_url || ''}
      onSaved={handleSlotSaved}
    ></SourceSlotForm>
  );

  // Only what departs from the default is worth marking — following the official
  // source is the default, so tagging it too is noise on every collapsed panel.
  // That leaves the one state the panel cannot show on its own: the card row
  // says which kind of source is configured, but not whether the URL in it is
  // the admin's or the official file's own address.
  const renderPanelLabel = (slot: SourceSlotConfig) => (
    <span>
      {slot.titleKey && intl.formatMessage({ id: slot.titleKey })}
      {probeStatus?.kinds?.[slot.kind]?.official_masked && (
        <TextAttribute>
          {intl.formatMessage({ id: 'common.source.tag.custom' })}
        </TextAttribute>
      )}
    </span>
  );

  return (
    <FormDrawer
      title={intl.formatMessage({ id: scope.titleKey })}
      open={open}
      onCancel={onCancel}
      width={620}
      // `false`, not `null`: FormDrawer falls back to its default Cancel/Save
      // footer on nullish. Every slot form ends in its own Save row, so a
      // drawer-level footer would either duplicate it or, with two panels, have
      // to guess which panel it meant.
      footer={false}
    >
      {/* FormDrawer destroys its children on close, so every panel re-reads its
          config on open without a gate here — one would only empty the drawer
          for the duration of the closing animation. */}
      {slots.length === 1 ? (
        renderSlot(slots[0])
      ) : (
        <div className={styles.panels}>
          <CollapsePanel
            accordion={false}
            activeKey={activeKeys}
            onChange={(keys) =>
              setActiveKeys(Array.isArray(keys) ? keys : [keys])
            }
            items={slots.map((slot) => ({
              key: slot.kind,
              label: renderPanelLabel(slot),
              forceRender: true,
              children: renderSlot(slot)
            }))}
          ></CollapsePanel>
        </div>
      )}
    </FormDrawer>
  );
};

export default SourceConfigDrawer;
