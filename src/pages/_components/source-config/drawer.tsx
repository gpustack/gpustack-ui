import {
  FormDrawer,
  IconFont,
  SegmentLine,
  TextAttribute
} from '@gpustack/core-ui';
import { useIntl } from '@umijs/max';
import { Tabs } from 'antd';
import { createStyles } from 'antd-style';
import React, { useEffect, useState } from 'react';
import SourceSlotForm from './slot-form';
import type {
  SourceProbeKind,
  SourceScopeConfig,
  SourceSlotConfig
} from './types';
import { useProbeStatus } from './use-source-config';

const useStyles = createStyles(({ css }) => ({
  // The rule under the labels is what makes them read as a tab bar rather than
  // as two links above a form — the same treatment the backend form/YAML switch
  // gets (`src/pages/backends/components/add-modal.tsx`).
  tabBar: css`
    margin-bottom: 16px;
    border-bottom: 1px solid var(--ant-color-split);
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
 * and puts them behind a tab bar, because they are two separate configurations
 * rather than two settings of one.
 *
 * Each tab saves itself: a kind's whole configuration is one object on the
 * server, so one tab is one request, and its Save sits at the end of the form it
 * belongs to rather than in a drawer footer shared with the other tab.
 *
 * `/source-probe` reports every kind at once — the leader-only state each tab
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
  const [activeKind, setActiveKind] = useState<SourceProbeKind>(slots[0].kind);
  // The fixed bottom bar, as an element rather than a ref: the form rendering
  // into it has to re-render once it exists, and a ref's `.current` does not
  // say when that is.
  const [footerEl, setFooterEl] = useState<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!open) {
      return;
    }
    setActiveKind(slots[0].kind);
    loadProbe();
    // the fetch is tied to open; loadProbe is recreated every render
  }, [open]);

  // A tab saved: its merged content moved, so the probe and the list behind
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
      onCancel={onCancel}
      // Every tab stays mounted, so the bar goes to the one on screen — the
      // others render no buttons at all.
      footerContainer={slot.kind === activeKind ? footerEl : null}
    ></SourceSlotForm>
  );

  // Only what departs from the default is worth marking — following the official
  // source is the default, so tagging it too is noise on every tab. That leaves
  // the one state a tab cannot show while the other one is open: the card row
  // says which kind of source is configured, but not whether the URL in it is
  // the admin's or the official file's own address.
  const renderTabLabel = (slot: SourceSlotConfig) => (
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
      // The bar itself, empty: what goes in it belongs to whichever tab is on
      // screen, and is rendered from there (see `footerContainer`). A
      // drawer-level ModalFooter would have to reach back for the state its
      // buttons read — whether the form is dirty, whether a write is in flight —
      // and a `false` here would leave the buttons scrolling with the content.
      footer={<div ref={setFooterEl} />}
    >
      {/* FormDrawer destroys its children on close, so every panel re-reads its
          config on open without a gate here — one would only empty the drawer
          for the duration of the closing animation. */}
      {slots.length === 1 ? (
        renderSlot(slots[0])
      ) : (
        <>
          <div className={styles.tabBar}>
            <SegmentLine
              theme="light"
              size="middle"
              style={{ width: '100%' }}
              value={activeKind}
              onChange={(value) => setActiveKind(value as SourceProbeKind)}
              options={slots.map((slot) => ({
                label: renderTabLabel(slot),
                value: slot.kind,
                icon: slot.iconType ? (
                  <IconFont type={slot.iconType}></IconFont>
                ) : undefined
              }))}
            ></SegmentLine>
          </div>
          {/* The labels live on the control above, so the stock bar is rendered
              away. Tabs is here for what it does to the panes rather than for
              its bar: an inactive tab keeps its form mounted, so an unsaved URL
              survives a look at the other kind — the same reason the collapse
              this replaced forced its panels to render. */}
          <Tabs
            renderTabBar={() => <></>}
            activeKey={activeKind}
            items={slots.map((slot) => ({
              key: slot.kind,
              // Required by the item type, and never rendered: the bar it would
              // appear in is the one replaced above.
              label: '',
              children: renderSlot(slot)
            }))}
          ></Tabs>
        </>
      )}
    </FormDrawer>
  );
};

export default SourceConfigDrawer;
