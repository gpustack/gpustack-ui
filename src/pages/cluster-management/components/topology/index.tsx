import {
  ApartmentOutlined,
  SearchOutlined,
  TableOutlined
} from '@ant-design/icons';
import {
  AutoTooltip,
  GSDrawer,
  IconFont,
  TextAttribute,
  useWindowResize
} from '@gpustack/core-ui';
import { useIntl } from '@umijs/max';
import { useSize } from 'ahooks';
import { Alert, Button, Flex, Input, Segmented, Spin, message } from 'antd';
import { createStyles } from 'antd-style';
import { useEffect, useRef, useState } from 'react';
import {
  NODE_LAYER_NAME,
  RACK_LAYER,
  TopologyView,
  TopologyWorker
} from '../../config/types';
import AdvancedDrawer from './advanced';
import CustomLayer, {
  CustomLayerValue,
  createCustomLayerValue
} from './advanced/custom-layer';
import {
  draftFromView,
  insertLayer,
  newCustomLayer,
  toWire
} from './advanced/draft';
import ColumnSettings from './column-settings';
import useColumnPrefs from './hooks/use-column-prefs';
import usePreview from './hooks/use-preview';
import useTopology from './hooks/use-topology';
import { LocationField, allFields, writableLabelKey } from './location';
import LocationTable from './location-table';
import { SetLocationModal } from './set-location';
import { SpecContext, loadSpecContext, saveTopologySpec } from './spec';
import TreeView, { TREE_GROUPING } from './tree-view';

/** Below this viewport width the drawer takes the whole screen. */
const FULL_WIDTH_BELOW = 1280;
const DRAWER_WIDTH = 1080;
/** The table's header row, which the virtual body's height must leave out. */
const TABLE_HEADER_HEIGHT = 40;

type ViewMode = 'table' | 'tree';

const useStyles = createStyles(({ css }) => ({
  root: css`
    display: flex;
    flex-direction: column;
    height: 100%;
    min-height: 0;
  `,
  fixed: css`
    flex-shrink: 0;
    padding-inline: 24px;
  `,
  body: css`
    flex: 1;
    min-height: 0;
    padding-inline: 24px;
    overflow: auto;
  `,
  title: css`
    min-width: 0;
    .label {
      flex-shrink: 0;
      white-space: nowrap;
    }
    .subtitle {
      min-width: 0;
      font-size: var(--ant-font-size-sm);
      font-weight: 400;
      color: var(--ant-color-text-secondary);
      border-radius: 4px;
    }
    .previewing {
      flex-shrink: 0;
      color: var(--ant-color-primary);
      font-weight: 400;
      font-size: 12px;
    }
  `
}));

interface TopologyDrawerProps {
  open: boolean;
  clusterId?: number | null;
  clusterName?: string | null;
  onClose: () => void;
}

interface CustomLayerState {
  open: boolean;
  context: SpecContext | null;
  value: CustomLayerValue;
}

/**
 * [S1] "Which rack is this machine in": a table of workers with a column per
 * location field, every cell saved the moment it is filled. No Save button
 * and no discard prompt, because nothing here is staged — the one place that
 * stages, the label-key mapping sub-drawer, has its own.
 */
const TopologyDrawer: React.FC<TopologyDrawerProps> = ({
  open,
  clusterId,
  clusterName,
  onClose
}) => {
  const intl = useIntl();
  const { styles } = useStyles();
  const { size } = useWindowResize();

  const preview = usePreview({ clusterId });
  const topo = useTopology({
    clusterId,
    open,
    // A location write changes the workers the preview was computed over.
    onWrite: () => preview.active && preview.rerun()
  });
  const displayed: TopologyView | null = preview.preview ?? topo.topology;
  const prefs = useColumnPrefs(clusterId);

  const [viewMode, setViewMode] = useState<ViewMode>(
    /* Always «表格» on open, deliberately NOT the last choice.
       The table is the working surface — its cells are the editable ones —
       while the tree is a read-only cross-check of what the labels produced.
       Remembering the tree meant a drawer opened for «把位置填上» landed on the
       one view where nothing can be filled in. */
    'table'
  );
  const [treeToolbarContainer, setTreeToolbarContainer] =
    useState<HTMLDivElement | null>(null);
  const [search, setSearch] = useState('');
  const [selectedIds, setSelectedIds] = useState<number[]>([]);
  const [grouping, setGrouping] = useState<string>(TREE_GROUPING);
  const [lastField, setLastField] = useState<string>(RACK_LAYER);
  const [batchOpen, setBatchOpen] = useState(false);
  const [mappingOpen, setMappingOpen] = useState(false);
  const [customLayer, setCustomLayer] = useState<CustomLayerState>(() => ({
    open: false,
    context: null,
    value: createCustomLayerValue([])
  }));
  const searchRef = useRef<any>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const bodyRef = useRef<HTMLDivElement>(null);
  const bodySize = useSize(bodyRef);
  /** The first write of a session says once that nothing running moves. */
  const wroteOnceRef = useRef(false);

  const getDrawerContainer = () =>
    contentRef.current?.closest<HTMLElement>('.ant-drawer-section');

  useEffect(() => {
    if (!open) {
      preview.reset();
      setSearch('');
      setSelectedIds([]);
      setGrouping(TREE_GROUPING);
      setBatchOpen(false);
      setMappingOpen(false);
      setCustomLayer({
        open: false,
        context: null,
        value: createCustomLayerValue([])
      });
      wroteOnceRef.current = false;
      return;
    }
  }, [open]);

  const changeViewMode = (mode: ViewMode) => {
    setViewMode(mode);
    // Keep the table selection while cross-checking it in the tree.
    setBatchOpen(false);
  };

  const everyField: LocationField[] = displayed
    ? allFields(intl, displayed)
    : [];
  const fields = everyField.filter(prefs.isShown);
  const batchFields = everyField.filter((field) => !field.disabled);
  const allWorkers = displayed?.workers || [];
  const needle = search.trim().toLowerCase();
  const workers = allWorkers.filter(
    (worker) => !needle || worker.name.toLowerCase().includes(needle)
  );
  const selectedWorkers = allWorkers.filter((worker) =>
    selectedIds.includes(worker.id)
  );

  const summarize = (
    field: LocationField,
    targets: TopologyWorker[],
    value: string | null
  ) => {
    if (targets.length === 1) {
      return value
        ? intl.formatMessage(
            { id: 'clusters.topology.toast.setOne' },
            { host: targets[0].name, field: field.label, value }
          )
        : intl.formatMessage(
            { id: 'clusters.topology.toast.clearedOne' },
            { host: targets[0].name, field: field.label }
          );
    }
    return value
      ? intl.formatMessage(
          { id: 'clusters.topology.toast.set' },
          { count: targets.length, field: field.label, value }
        )
      : intl.formatMessage(
          { id: 'clusters.topology.toast.cleared' },
          { count: targets.length, field: field.label }
        );
  };

  const assign = async (
    field: LocationField,
    targets: TopologyWorker[],
    value: string | null
  ) => {
    setLastField(field.id);
    const suffix = wroteOnceRef.current
      ? ''
      : intl.formatMessage({ id: 'clusters.topology.toast.firstWrite' });
    await topo.assign(
      [{ worker_ids: targets.map((w) => w.id), layer: field.id, value }],
      summarize(field, targets, value) + suffix
    );
    wroteOnceRef.current = true;
  };

  const handleBatchApply = async (fieldId: string, value: string | null) => {
    const field = batchFields.find((f) => f.id === fieldId);
    if (!field || !writableLabelKey(field) || !selectedWorkers.length) {
      return;
    }
    try {
      await assign(field, selectedWorkers, value);
    } catch (e: any) {
      message.error(e?.message);
      return;
    }
    // The selection stays so the next field can be filled for the same hosts.
    setBatchOpen(false);
  };

  const saveFailed = (e: any) =>
    message.error(
      e?.response?.data?.message ||
        intl.formatMessage({ id: 'clusters.topology.save.failed' })
    );

  const openCustomLayer = async () => {
    if (!clusterId || !topo.topology) {
      return;
    }
    try {
      const context = await loadSpecContext(clusterId);
      const chain = draftFromView(
        intl,
        topo.topology,
        context.cluster.topology
      ).chain;
      setCustomLayer({
        open: true,
        context,
        value: createCustomLayerValue(chain)
      });
    } catch (e) {
      saveFailed(e);
    }
  };

  const handleCustomOk = async (value: CustomLayerValue) => {
    if (!customLayer.context || !topo.topology) {
      return;
    }
    const { cluster } = customLayer.context;
    const layer = newCustomLayer(value.name, value.labelKeys);
    const draft = insertLayer(
      draftFromView(intl, topo.topology, cluster.topology),
      layer,
      value.index
    );
    try {
      await saveTopologySpec(cluster, toWire(draft, cluster.topology));
    } catch (e) {
      saveFailed(e);
      return;
    }
    setCustomLayer((current) => ({ ...current, open: false }));
    // The new column shows at once, empty: that is what it is for.
    //
    // By id, which is what `isShown` looks the preference up by. The name went
    // in for a while and the two never met: the lookup missed, the column fell
    // back to `shownByDefault` — which a brand-new custom layer satisfies
    // neither half of — and the layer the user had just created was the one
    // thing the table did not show. The stray key stayed in localStorage too.
    prefs.setShown(layer.id, true);
    topo.refresh();
  };

  const customChain =
    customLayer.context && topo.topology
      ? draftFromView(intl, topo.topology, customLayer.context.cluster.topology)
          .chain
      : [];
  // 🔴 Names, not ids. Ids are generated now and cannot be typed into
  // collision; two rungs *called* the same thing still can, and that is the
  // one that shows — the deployment form's "at least in the same ___" would
  // list one word twice. `custom-layer` checks the chain itself, so only the
  // leaf (never a declared rung) has to be named here.
  //
  // `accelerator_domain` is NOT reserved — it is a perfectly good name for a
  // layer an operator adds, and reserving it would forbid the one thing the
  // new model asks them to do.
  const reserved = [
    intl.formatMessage({ id: 'clusters.topology.field.host' }),
    NODE_LAYER_NAME
  ];

  const width = size.width < FULL_WIDTH_BELOW ? '100%' : DRAWER_WIDTH;

  const title = (
    <Flex
      component="span"
      align="center"
      gap="small"
      className={styles.title}
      style={{
        maxWidth:
          typeof width === 'number' ? width - 104 : 'calc(100vw - 104px)'
      }}
    >
      <span className="label">
        {intl.formatMessage({ id: 'clusters.topology.title' })}
      </span>
      {clusterName && (
        <TextAttribute variant="outlined" className="subtitle">
          <AutoTooltip ghost minWidth={0}>
            {clusterName}
          </AutoTooltip>
        </TextAttribute>
      )}
      {preview.active && (
        <span className="previewing">
          {intl.formatMessage({ id: 'clusters.topology.previewing' })}
        </span>
      )}
    </Flex>
  );

  return (
    <div>
      <GSDrawer
        title={title}
        open={open}
        onClose={onClose}
        keyboard={false}
        destroyOnHidden
        styles={{
          wrapper: { width },
          body: { paddingBlock: 0, overflow: 'hidden' }
        }}
      >
        <div
          ref={contentRef}
          className={styles.root}
          onKeyDown={(e) => {
            // "/" anywhere in the drawer focuses the search, unless typing.
            const tag = (e.target as HTMLElement).tagName;
            if (e.key === '/' && tag !== 'INPUT' && tag !== 'TEXTAREA') {
              e.preventDefault();
              searchRef.current?.focus?.();
            }
          }}
        >
          <Flex
            orientation="vertical"
            gap={12}
            className={styles.fixed}
            style={{ paddingBlock: 12 }}
          >
            <Flex align="center" gap={12} wrap>
              <Input
                ref={searchRef}
                prefix={
                  <SearchOutlined
                    style={{ color: 'var(--ant-color-text-placeholder)' }}
                  />
                }
                allowClear
                style={{ width: 300, maxWidth: '100%' }}
                placeholder={intl.formatMessage({
                  id: 'clusters.topology.search.placeholder'
                })}
                aria-label={intl.formatMessage({
                  id: 'clusters.topology.search.placeholder'
                })}
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
              <Flex
                align="center"
                justify="flex-end"
                gap={12}
                wrap
                style={{
                  marginInlineStart: 'auto',
                  flexShrink: 0,
                  maxWidth: '100%'
                }}
              >
                {viewMode === 'tree' && displayed && (
                  <Flex ref={setTreeToolbarContainer} align="center" />
                )}
                <Segmented
                  value={viewMode}
                  onChange={(value) => changeViewMode(value as ViewMode)}
                  options={[
                    {
                      value: 'table',
                      icon: (
                        <TableOutlined
                          aria-label={intl.formatMessage({
                            id: 'clusters.topology.view.table'
                          })}
                        />
                      ),
                      tooltip: intl.formatMessage({
                        id: 'clusters.topology.view.table'
                      })
                    },
                    {
                      value: 'tree',
                      icon: (
                        <ApartmentOutlined
                          aria-label={intl.formatMessage({
                            id: 'clusters.topology.view.tree'
                          })}
                        />
                      ),
                      tooltip: intl.formatMessage({
                        id: 'clusters.topology.view.tree'
                      })
                    }
                  ]}
                />
                <ColumnSettings
                  disabled={!topo.topology}
                  fields={everyField}
                  isShown={prefs.isShown}
                  onToggle={prefs.setShown}
                  onReset={prefs.reset}
                />
                <Button
                  icon={<IconFont type="icon-layers-outlined" />}
                  disabled={!topo.topology}
                  onClick={() => setMappingOpen(true)}
                >
                  {intl.formatMessage({
                    id: 'clusters.topology.mapping.title'
                  })}
                </Button>
                <Button
                  type="primary"
                  icon={<IconFont type="icon-tag-outlined" />}
                  disabled={
                    viewMode === 'tree' || !selectedWorkers.length || !displayed
                  }
                  onClick={() => setBatchOpen(true)}
                >
                  {intl.formatMessage({
                    id: 'clusters.topology.batch.button'
                  })}
                </Button>
              </Flex>
            </Flex>
          </Flex>

          <div className={styles.body}>
            {topo.error && (
              <Alert
                type="error"
                showIcon
                message={topo.error}
                style={{ marginBottom: 12 }}
              />
            )}
            {!displayed ? (
              <Flex align="center" justify="center" style={{ minHeight: 240 }}>
                <Spin spinning={topo.loading} />
              </Flex>
            ) : viewMode === 'tree' ? (
              <TreeView
                toolbarContainer={treeToolbarContainer}
                view={displayed}
                fields={fields}
                workers={workers}
                grouping={grouping}
                onGroupingChange={setGrouping}
                onHostClick={(worker) => {
                  setSearch(worker.name);
                  changeViewMode('table');
                }}
              />
            ) : (
              <Flex orientation="vertical" gap={12} style={{ height: '100%' }}>
                <div ref={bodyRef} style={{ flex: 1, minHeight: 0 }}>
                  <LocationTable
                    workers={workers}
                    allWorkers={allWorkers}
                    fields={fields}
                    selectedIds={selectedIds}
                    onSelectionChange={(ids) => {
                      setSelectedIds(ids);
                      setBatchOpen(false);
                    }}
                    height={Math.max(
                      160,
                      (bodySize?.height || 400) - TABLE_HEADER_HEIGHT
                    )}
                    onAssign={assign}
                    onBusy={(busy) =>
                      busy ? topo.beginBusy() : topo.endBusy()
                    }
                  />
                </div>
              </Flex>
            )}
          </div>
        </div>

        {displayed && (
          <SetLocationModal
            open={
              viewMode === 'table' && batchOpen && selectedWorkers.length > 0
            }
            onCancel={() => setBatchOpen(false)}
            targets={selectedWorkers}
            allWorkers={allWorkers}
            fields={batchFields}
            defaultField={lastField}
            onApply={handleBatchApply}
            onManageLayers={() => {
              setBatchOpen(false);
              setMappingOpen(true);
            }}
          />
        )}

        {clusterId && topo.topology && (
          <AdvancedDrawer
            open={mappingOpen}
            width={width}
            getContainer={getDrawerContainer}
            clusterId={clusterId}
            view={topo.topology}
            displayed={displayed || topo.topology}
            preview={preview}
            onClose={() => {
              preview.reset();
              setMappingOpen(false);
            }}
            onSaved={(addedLayerIds) => {
              prefs.showFields(addedLayerIds);
              preview.reset();
              setMappingOpen(false);
              topo.refresh();
            }}
          />
        )}
      </GSDrawer>
      {topo.topology && (
        <CustomLayer
          open={customLayer.open}
          value={customLayer.value}
          onChange={(value) =>
            setCustomLayer((current) => ({ ...current, value }))
          }
          getContainer={getDrawerContainer}
          chain={customChain}
          reserved={reserved}
          knownKeys={topo.topology.vocabulary?.known_keys || []}
          workerLabels={(topo.topology.workers || []).map(
            (w) => w.labels || {}
          )}
          onOk={handleCustomOk}
          onCancel={() =>
            setCustomLayer((current) => ({ ...current, open: false }))
          }
        />
      )}
    </div>
  );
};

export default TopologyDrawer;
