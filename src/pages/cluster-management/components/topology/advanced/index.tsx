import { DeleteModal, ModalFooter, SubDrawer } from '@gpustack/core-ui';
import { useIntl } from '@umijs/max';
import { Alert, Flex, Modal, Spin, message } from 'antd';
import { createStyles } from 'antd-style';
import { useEffect, useRef, useState } from 'react';
import { topologyFieldLabel } from '../../../config';
import {
  ClusterListItem,
  NODE_LAYER_NAME,
  TopologyView
} from '../../../config/types';
import { UsePreview } from '../hooks/use-preview';
import { fieldLayers } from '../location';
import { loadSpecContext, saveTopologySpec } from '../spec';
import {
  Draft,
  DraftLayer,
  draftFromView,
  insertLayer,
  newCustomLayer,
  removeLayer,
  renameLayer,
  setLayerDisabled,
  toWire
} from './draft';
import FieldChain from './field-chain';
import RenameLayer from './rename-layer';

/** How long the "count left zero" blink lasts. */
const FLASH_MS = 1000;

const useStyles = createStyles(({ css }) => ({
  /* `.stats` and `.heading` lived here, for the domain pane's «共 N 个域» line
     and the «层级» heading above the chain. All three are gone; the classes
     stay removed rather than kept "in case", since a rule with no element is
     invisible breakage waiting for the next reader. */
  pane: css`
    min-width: 0;
  `,
  content: css`
    padding: var(--ant-padding) var(--ant-padding-lg);
  `,
  guidance: css`
    position: sticky;
    top: 0;
    z-index: 3;
    margin-block: calc(0px - var(--ant-padding));
    margin-inline: calc(0px - var(--ant-padding-lg));
    padding: var(--ant-padding) var(--ant-padding-lg);
    background: var(--ant-color-bg-elevated);
  `,
  drawer: css`
    > :last-child {
      min-height: 0;
    }
  `
}));

interface AdvancedDrawerProps {
  open: boolean;
  width: number | string;
  getContainer: () => HTMLElement | null | undefined;
  clusterId: number;
  /** The saved mapping's view: what the draft starts from. */
  view: TopologyView;
  /** What the main drawer is showing right now (the preview once one runs). */
  displayed: TopologyView;
  preview: UsePreview;
  /** Closed without saving; the caller drops the preview. */
  onClose: () => void;
  /** Saved; the caller shows new columns, drops the preview and refetches. */
  onSaved: (addedLayerIds: string[]) => void;
}

/**
 * [S2] The rule layer under the table: which label each field reads. Every
 * change here is previewed — the main drawer redraws under the unsaved mapping
 * — and nothing reaches the cluster until Save (P7). That staged state is also
 * why closing asks for confirmation while the main drawer never does.
 */
const AdvancedDrawer: React.FC<AdvancedDrawerProps> = ({
  open,
  width,
  getContainer,
  clusterId,
  view,
  displayed,
  preview,
  onClose,
  onSaved
}) => {
  const intl = useIntl();
  const { styles } = useStyles();
  const [cluster, setCluster] = useState<ClusterListItem | null>(null);
  const [workerLabels, setWorkerLabels] = useState<Record<string, string>[]>(
    []
  );
  const [draft, setDraft] = useState<Draft | null>(null);
  const [baseline, setBaseline] = useState<string>('');
  const [saving, setSaving] = useState(false);
  /** The rung being renamed, if any. */
  const [renaming, setRenaming] = useState<DraftLayer | null>(null);
  const [flashing, setFlashing] = useState<Set<string>>(new Set());
  const discardModalRef = useRef<any>(null);
  const prevCountsRef = useRef<Record<string, number>>({});
  useEffect(() => {
    if (!open) {
      setDraft(null);
      setCluster(null);
      return;
    }
    loadSpecContext(clusterId).then((ctx) => {
      setCluster(ctx.cluster);
      setWorkerLabels(ctx.workerLabels);
      const initial = draftFromView(intl, view, ctx.cluster.topology);
      setDraft(initial);
      setBaseline(JSON.stringify(toWire(initial, ctx.cluster.topology)));
      prevCountsRef.current = {};
    });
  }, [open]);

  const total = displayed.workers?.length || 0;
  const classified: Record<string, number> = {};
  (displayed.layers || []).forEach((layer) => {
    classified[layer.id] = layer.classified;
  });

  useEffect(() => {
    const left = Object.keys(classified).filter(
      (id) =>
        (prevCountsRef.current[id] ?? 0) === 0 &&
        classified[id] > 0 &&
        id in prevCountsRef.current
    );
    prevCountsRef.current = classified;
    if (left.length) {
      setFlashing(new Set(left));
      const timer = setTimeout(() => setFlashing(new Set()), FLASH_MS);
      return () => clearTimeout(timer);
    }
    return undefined;
  }, [displayed]);

  const update = (next: Draft) => {
    setDraft(next);
    preview.run(toWire(next, cluster?.topology));
  };

  const dirty =
    !!draft && JSON.stringify(toWire(draft, cluster?.topology)) !== baseline;

  const handleKeysChange = (id: string, keys: string[]) => {
    if (!draft) {
      return;
    }
    const edit = (layer: DraftLayer) =>
      layer.id === id
        ? {
            ...layer,
            labelKeys:
              layer.builtin &&
              layer.primaryKey &&
              !keys.includes(layer.primaryKey)
                ? [layer.primaryKey, ...keys]
                : keys,
            customised: true
          }
        : layer;
    update({ chain: draft.chain.map(edit) });
  };

  /**
   * Staged like every other edit in this drawer. Writing the cluster straight
   * away — the way the column picker's own "add layer" does — would be saved
   * under a draft this drawer opened before it, and the next Save would drop
   * the new layer again.
   */
  const handleAddLayer = (name: string, index: number) => {
    if (!draft) {
      return;
    }
    const layer = newCustomLayer(name, []);
    update(insertLayer(draft, layer, index));
    return layer.id;
  };

  const handleRename = (displayName: string | null) => {
    if (!draft || !renaming) {
      return;
    }
    update(
      renameLayer(
        draft,
        renaming.id,
        displayName,
        // Recomputed here rather than in the reducer: turning a name into a
        // label needs `intl`, and a pure transform over the draft should not
        // reach for the UI's locale.
        displayName || topologyFieldLabel(intl, renaming.name, renaming.name)
      )
    );
    setRenaming(null);
  };

  /**
   * Deleting a custom rung. Guarded here as well as server-side, because the
   * server's refusal arrives as a 400 on Save — long after the gesture, and
   * with the rest of the edit already staged behind it.
   */
  const handleDelete = (row: DraftLayer) => {
    if (!draft) {
      return;
    }
    const referencedBy =
      fieldLayers(displayed).find((layer) => layer.id === row.id)
        ?.referenced_by_models || [];
    if (referencedBy.length) {
      Modal.warning({
        title: intl.formatMessage({ id: 'clusters.topology.layer.inUse' }),
        content: intl.formatMessage(
          { id: 'clusters.topology.layer.inUse.tips' },
          { models: referencedBy.join(', ') }
        )
      });
      return;
    }
    update(removeLayer(draft, row.id));
  };

  const handleClose = () => {
    if (!dirty) {
      onClose();
      return;
    }
    discardModalRef.current?.show({
      title: 'clusters.topology.advanced.discard',
      content: 'clusters.topology.mapping.title',
      operation: 'clusters.topology.advanced.discard.tips',
      okText: 'clusters.topology.discard.ok',
      cancelText: 'clusters.topology.advanced.discard.cancel',
      showSuccess: false,
      onOk: onClose
    });
  };

  const handleSave = async () => {
    if (!draft || !cluster) {
      return;
    }
    setSaving(true);
    try {
      await saveTopologySpec(cluster, toWire(draft, cluster.topology));
      message.success(
        intl.formatMessage({ id: 'clusters.topology.advanced.saved' })
      );
      const savedIds = new Set(view.layers.map((layer) => layer.id));
      onSaved(
        draft.chain
          .filter((layer) => !savedIds.has(layer.id))
          .map((layer) => layer.id)
      );
    } catch (e: any) {
      message.error(
        e?.response?.data?.message ||
          intl.formatMessage({ id: 'clusters.topology.save.failed' })
      );
    } finally {
      setSaving(false);
    }
  };

  // 🔴 «共 N 个域，最大的跨 M 个机柜» is gone with the second chain. Its job was
  // to justify the second chain — to show that a domain crosses rack
  // boundaries and therefore could not be a rung of the first. Under the
  // one-chain model a domain that spans racks simply sits *above* the rack, so
  // the chain itself says it and the statistic argues for nothing.

  /**
   * Names a new custom layer may not take.
   *
   * 🔴 Names, not ids. A rung's name stopped being its id: ids are generated
   * (`custom-a7f3c1`) and cannot be typed into collision, while two rungs
   * *called* the same thing still can — and that is the collision that shows,
   * because the deployment form's "at least in the same ___" would then list
   * one word twice.
   *
   * The leaf is in here for the same reason and is not in `draft.chain`: it
   * is never a declared rung, only ever the bottom of the chain.
   */
  const reserved = [
    intl.formatMessage({ id: 'clusters.topology.field.host' }),
    NODE_LAYER_NAME
  ];

  const vocabulary = {
    known: view.vocabulary?.known_keys || [],
    workerLabels
  };

  // 🔴 One pane, and no heading over it. The «层级» heading was a leftover from
  // the `Tabs` this replaced — it carried the tab's name, active-field count
  // and tooltip. With a single pane the drawer title already says what this is,
  // and the chain below states its own shape, so the heading restated both and
  // the count answered a question nobody was asking.

  const drawer = (
    <SubDrawer
      title={intl.formatMessage({ id: 'clusters.topology.mapping.title' })}
      open={open}
      onCancel={handleClose}
      getContainer={getContainer}
      width={width}
      className={styles.drawer}
      styles={{
        container: {
          paddingBlock: 0,
          paddingInline: 0,
          minHeight: 0
        }
      }}
      footer={
        <ModalFooter
          onCancel={handleClose}
          onOk={handleSave}
          okText={intl.formatMessage({ id: 'common.button.save' })}
          loading={saving}
          okBtnProps={{ disabled: !!preview.error }}
          styles={{
            wrapper: {
              padding:
                'var(--ant-padding) var(--ant-padding-lg) var(--ant-padding-lg)',
              flexWrap: 'wrap',
              gap: 'var(--ant-padding-sm) var(--ant-padding-lg)'
            }
          }}
          style={{
            flexShrink: 0,
            marginInlineStart: 'auto',
            flexWrap: 'wrap',
            justifyContent: 'flex-end',
            maxWidth: '100%'
          }}
        />
      }
    >
      <div className={styles.content}>
        {!draft ? (
          <Flex align="center" justify="center" style={{ minHeight: 200 }}>
            <Spin size="small" />
          </Flex>
        ) : (
          <Flex orientation="vertical" gap={20}>
            <div className={styles.guidance}>
              <Alert
                type="info"
                showIcon
                title={intl.formatMessage({
                  id: 'clusters.topology.mapping.intro'
                })}
              />
            </div>
            {preview.error && (
              <Alert type="warning" showIcon message={preview.error} />
            )}

            <Flex orientation="vertical" className={styles.pane}>
              <FieldChain
                rows={draft.chain}
                total={total}
                classified={classified}
                flashing={flashing}
                vocabulary={vocabulary}
                reserved={reserved}
                onAddLayer={handleAddLayer}
                onKeysChange={handleKeysChange}
                onRename={setRenaming}
                onToggleDisabled={(row) =>
                  draft &&
                  update(setLayerDisabled(draft, row.id, !row.disabled))
                }
                onDelete={handleDelete}
              />
            </Flex>

            {displayed.suggestions?.length > 0 && (
              <Flex orientation="vertical" gap={8}>
                <span style={{ fontWeight: 500 }}>
                  {intl.formatMessage({
                    id: 'clusters.topology.advanced.suggestions'
                  })}
                </span>
                {displayed.suggestions.map((suggestion) => (
                  <span key={suggestion.key} className="text-tertiary">
                    <code>{suggestion.key}</code> ·{' '}
                    {intl.formatMessage(
                      { id: 'clusters.topology.advanced.suggestion' },
                      {
                        workers: suggestion.workers,
                        values: suggestion.distinct_values,
                        field: topologyFieldLabel(
                          intl,
                          suggestion.looks_like,
                          suggestion.looks_like
                        )
                      }
                    )}
                  </span>
                ))}
              </Flex>
            )}
          </Flex>
        )}
      </div>

      {renaming && (
        <RenameLayer
          open
          layer={renaming}
          taken={(draft?.chain || [])
            .filter((layer) => layer.id !== renaming.id)
            .map((layer) => layer.label)
            .concat(intl.formatMessage({ id: 'clusters.topology.field.host' }))}
          onOk={handleRename}
          onCancel={() => setRenaming(null)}
        />
      )}
    </SubDrawer>
  );

  return (
    <>
      {drawer}
      <DeleteModal ref={discardModalRef} />
    </>
  );
};

export default AdvancedDrawer;
