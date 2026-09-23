import {
  DownOutlined,
  InfoCircleOutlined,
  WarningOutlined
} from '@ant-design/icons';
import { GSDrawer, useWindowResize } from '@gpustack/core-ui';
import { useIntl } from '@umijs/max';
import { useSize } from 'ahooks';
import {
  Alert,
  Button,
  Flex,
  Input,
  Modal,
  Segmented,
  Spin,
  Tooltip,
  message
} from 'antd';
import { createStyles } from 'antd-style';
import { useEffect, useRef, useState } from 'react';
import { topologyFieldLabel } from '../../config';
import {
  NODE_LAYER_NAME,
  RACK_LAYER,
  TopologyView,
  TopologyWorker
} from '../../config/types';
import AdvancedDrawer from './advanced';
import CustomLayer, { CustomLayerValue } from './advanced/custom-layer';
import {
  draftFromView,
  insertLayer,
  newCustomLayer,
  removeLayer,
  toWire
} from './advanced/draft';
import ColumnSettings from './column-settings';
import useColumnPrefs from './hooks/use-column-prefs';
import usePreview from './hooks/use-preview';
import useTopology from './hooks/use-topology';
import { LocationField, allFields } from './location';
import LocationTable from './location-table';
import Onboarding from './onboarding';
import { SetLocationPopover } from './set-location';
import {
  SpecContext,
  loadSpecContext,
  modelsGatheringOn,
  saveTopologySpec
} from './spec';
import TreeView, { TREE_GROUPING } from './tree-view';

const ONBOARDING_KEY = 'gpustack.topology.onboarding.dismissed';
/** Below this viewport width the drawer takes the whole screen. */
const FULL_WIDTH_BELOW = 1280;
const DRAWER_WIDTH = 1080;
/** How long a row pointed at from elsewhere stays tinted. */
const HIGHLIGHT_MS = 3000;
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
  /* The numbers sit on the title line so the chrome is two rows: this one and
     the toolbar. Normal weight and a size down, so the name stays the title. */
  title: css`
    .info {
      color: var(--ant-color-text-tertiary);
      font-size: 14px;
    }
    .overview {
      font-weight: 400;
      font-size: 13px;
    }
    .sep {
      color: var(--ant-color-text-quaternary);
    }
    .warn {
      color: var(--ant-color-warning);
    }
    .previewing {
      color: var(--ant-color-primary);
      font-weight: 400;
      font-size: 12px;
    }
  `,
  selection: css`
    border-top: 1px solid var(--ant-color-border-secondary);
    padding-block: 10px;
    background: var(--ant-color-bg-container);
  `
}));

interface TopologyDrawerProps {
  open: boolean;
  clusterId?: number | null;
  clusterName?: string | null;
  /** Point at this worker's row when opening from elsewhere. */
  highlightWorkerId?: number | null;
  onClose: () => void;
}

interface BatchState {
  open: boolean;
  field?: string;
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
  highlightWorkerId,
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
  const [search, setSearch] = useState('');
  const [selectedIds, setSelectedIds] = useState<number[]>([]);
  const [grouping, setGrouping] = useState<string>(TREE_GROUPING);
  const [lastField, setLastField] = useState<string>(RACK_LAYER);
  const [batch, setBatch] = useState<BatchState>({ open: false });
  const [mappingOpen, setMappingOpen] = useState(false);
  const [customLayer, setCustomLayer] = useState<SpecContext | null>(null);
  const [highlightId, setHighlightId] = useState<number | null>(null);
  const [onboardingDismissed, setOnboardingDismissed] = useState(
    () => localStorage.getItem(ONBOARDING_KEY) === '1'
  );

  const searchRef = useRef<any>(null);
  const bodyRef = useRef<HTMLDivElement>(null);
  const bodySize = useSize(bodyRef);
  const highlightTimer = useRef<any>(null);
  /** The first write of a session says once that nothing running moves. */
  const wroteOnceRef = useRef(false);

  const highlight = (id: number) => {
    clearTimeout(highlightTimer.current);
    setHighlightId(id);
    highlightTimer.current = setTimeout(
      () => setHighlightId(null),
      HIGHLIGHT_MS
    );
  };

  useEffect(() => {
    if (!open) {
      preview.reset();
      setSearch('');
      setSelectedIds([]);
      setGrouping(TREE_GROUPING);
      setBatch({ open: false });
      setMappingOpen(false);
      setCustomLayer(null);
      setHighlightId(null);
      wroteOnceRef.current = false;
      return;
    }
    if (highlightWorkerId) {
      setViewMode('table');
      highlight(highlightWorkerId);
    }
  }, [open]);

  const changeViewMode = (mode: ViewMode) => {
    setViewMode(mode);
    // The selection survives a trip to the tree; only its action bar hides.
    setBatch({ open: false });
  };

  const everyField: LocationField[] = displayed
    ? allFields(intl, displayed)
    : [];
  const fields = everyField.filter(prefs.isShown);
  const allWorkers = displayed?.workers || [];
  const needle = search.trim().toLowerCase();
  const workers = allWorkers.filter(
    (worker) => !needle || worker.name.toLowerCase().includes(needle)
  );
  const selectedWorkers = allWorkers.filter((worker) =>
    selectedIds.includes(worker.id)
  );

  const rackLayer = displayed?.layers.find((layer) => layer.id === RACK_LAYER);
  const anyHandFilled = allWorkers.some((worker) =>
    Object.values(worker.location || {}).some(
      (location) => location.source === 'user'
    )
  );

  const fieldLabel = (id: string) =>
    everyField.find((field) => field.id === id)?.label ||
    topologyFieldLabel(intl, id);

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

  const openBatch = (targets: TopologyWorker[], field: string) => {
    setViewMode('table');
    setSelectedIds(targets.map((w) => w.id));
    setBatch({ open: true, field });
  };

  const handleBatchApply = async (fieldId: string, value: string | null) => {
    const field = fields.find((f) => f.id === fieldId);
    if (!field) {
      return;
    }
    try {
      await assign(field, selectedWorkers, value);
    } catch (e: any) {
      message.error(e?.message);
      return;
    }
    // The selection stays so the next field can be filled for the same hosts.
    setBatch({ open: false });
  };

  const saveFailed = (e: any) =>
    message.error(
      e?.response?.data?.message ||
        intl.formatMessage({ id: 'clusters.topology.save.failed' })
    );

  /**
   * A layer a saved model gathers on cannot go: the model would fail
   * validation on its next save for a reason it cannot see from its form.
   * The view says who; an older server does not, and then we ask.
   */
  const deleteCustomLayer = async (field: LocationField) => {
    if (!clusterId || !topo.topology) {
      return;
    }
    const layer = topo.topology.layers.find((l) => l.id === field.id);
    if (!layer?.referenced_by_models) {
      const referencing = await modelsGatheringOn(clusterId, field.id);
      if (referencing.length) {
        Modal.warning({
          title: intl.formatMessage(
            { id: 'clusters.topology.custom.referenced' },
            { name: field.label }
          ),
          content: referencing.join('、')
        });
        return;
      }
    }
    try {
      const { cluster } = await loadSpecContext(clusterId);
      const draft = removeLayer(
        draftFromView(intl, topo.topology, cluster.topology),
        field.id
      );
      await saveTopologySpec(cluster, toWire(draft, cluster.topology));
    } catch (e) {
      saveFailed(e);
      return;
    }
    prefs.forget(field.id);
    message.success(
      intl.formatMessage(
        { id: 'clusters.topology.columns.deleted' },
        { name: field.label }
      )
    );
    topo.refresh();
  };

  const openCustomLayer = async () => {
    if (!clusterId) {
      return;
    }
    try {
      setCustomLayer(await loadSpecContext(clusterId));
    } catch (e) {
      saveFailed(e);
    }
  };

  const handleCustomOk = async (value: CustomLayerValue) => {
    if (!customLayer || !topo.topology) {
      return;
    }
    const { cluster } = customLayer;
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
    setCustomLayer(null);
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
    customLayer && topo.topology
      ? draftFromView(intl, topo.topology, customLayer.cluster.topology).chain
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

  const showOnboarding =
    viewMode === 'table' &&
    !!displayed?.workers?.length &&
    !anyHandFilled &&
    !onboardingDismissed;

  const dismissOnboarding = () => {
    localStorage.setItem(ONBOARDING_KEY, '1');
    setOnboardingDismissed(true);
  };

  const overviewLink = (text: React.ReactNode, onClick: () => void) => (
    <Button type="link" size="small" style={{ padding: 0 }} onClick={onClick}>
      {text}
    </Button>
  );

  const clearFilters = () => {
    setSearch('');
  };

  const width = size.width < FULL_WIDTH_BELOW ? '100%' : DRAWER_WIDTH;

  const titleText = clusterName
    ? `${intl.formatMessage({ id: 'clusters.topology.title' })} · ${clusterName}`
    : intl.formatMessage({ id: 'clusters.topology.title' });

  const title = (
    <Flex
      component="span"
      align="center"
      gap={10}
      wrap
      className={styles.title}
    >
      <span>{titleText}</span>
      {/* Said on this screen rather than in release notes: filling a location
          relocates nothing already running. */}
      <Tooltip
        title={intl.formatMessage({ id: 'clusters.topology.noRebalance' })}
      >
        <InfoCircleOutlined className="info" />
      </Tooltip>
      {displayed && (
        <Flex component="span" align="center" gap={8} wrap className="overview">
          {overviewLink(
            intl.formatMessage(
              { id: 'clusters.topology.overview.workers' },
              { count: allWorkers.length }
            ),
            clearFilters
          )}
          {/* One counter per rung that resolved anything — an operator's own
              «加速器域» layer gets one on exactly the same terms as «机柜», which
              is the whole point of folding it into the chain. The dedicated
              «加速器域 N 个» counter it replaces was the last place the domain
              was named as a dimension of its own. */}
          {fields.map((field) => {
            const layer = displayed.layers.find((l) => l.id === field.id);
            if (!layer?.domains) {
              return null;
            }
            return (
              <Flex key={field.id} align="center" gap={8}>
                <span className="sep">·</span>
                {overviewLink(
                  intl.formatMessage(
                    { id: 'clusters.topology.overview.domains' },
                    { field: field.label, count: layer.domains }
                  ),
                  () => {
                    changeViewMode('tree');
                    setGrouping(
                      field.id === RACK_LAYER ? TREE_GROUPING : field.id
                    );
                  }
                )}
              </Flex>
            );
          })}
          {!!rackLayer?.unclassified && (
            <>
              <span className="sep">·</span>
              <WarningOutlined className="warn" />
              {overviewLink(
                <span className="warn">
                  {intl.formatMessage(
                    { id: 'clusters.topology.overview.unfilled' },
                    {
                      count: rackLayer.unclassified,
                      field: fieldLabel(RACK_LAYER)
                    }
                  )}
                </span>,
                /* Switches to the table and stops there. It used to also
                   turn on an «只看未填的» filter, which was removed in review:
                   in the table an unfilled cell is an empty input carrying a
                   «填写机柜» placeholder, so the rows this link points at are
                   already the ones that stand out. */
                () => changeViewMode('table')
              )}
            </>
          )}
        </Flex>
      )}
      {preview.active && (
        <span className="previewing">
          {intl.formatMessage({ id: 'clusters.topology.previewing' })}
        </span>
      )}
    </Flex>
  );

  return (
    <GSDrawer
      title={title}
      open={open}
      onClose={onClose}
      destroyOnHidden
      styles={{
        wrapper: { width },
        body: { paddingBlock: 0, overflow: 'hidden' }
      }}
    >
      <div
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
          align="center"
          gap={12}
          className={styles.fixed}
          style={{ paddingBlock: 12 }}
        >
          <Segmented
            value={viewMode}
            onChange={(value) => changeViewMode(value as ViewMode)}
            options={[
              {
                value: 'table',
                label: intl.formatMessage({
                  id: 'clusters.topology.view.table'
                })
              },
              {
                value: 'tree',
                label: intl.formatMessage({ id: 'clusters.topology.view.tree' })
              }
            ]}
          />
          <Input.Search
            ref={searchRef}
            allowClear
            style={{ width: 240 }}
            placeholder={intl.formatMessage({
              id: 'clusters.topology.search.placeholder'
            })}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <span style={{ marginLeft: 'auto' }}>
            <ColumnSettings
              disabled={!topo.topology}
              fields={everyField}
              isShown={prefs.isShown}
              onToggle={prefs.setShown}
              referencedBy={(id) =>
                topo.topology?.layers.find((layer) => layer.id === id)
                  ?.referenced_by_models
              }
              onDeleteCustom={deleteCustomLayer}
              onOpenMapping={() => setMappingOpen(true)}
            />
          </span>
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
              view={displayed}
              fields={fields}
              workers={workers}
              grouping={grouping}
              onGroupingChange={setGrouping}
              onHostClick={(worker) => {
                changeViewMode('table');
                highlight(worker.id);
              }}
              onSetLocation={openBatch}
            />
          ) : (
            <Flex orientation="vertical" gap={12} style={{ height: '100%' }}>
              {showOnboarding && (
                <Onboarding
                  hosts={allWorkers.length}
                  onDismiss={dismissOnboarding}
                />
              )}
              <div ref={bodyRef} style={{ flex: 1, minHeight: 0 }}>
                <LocationTable
                  workers={workers}
                  allWorkers={allWorkers}
                  fields={fields}
                  selectedIds={selectedIds}
                  onSelectionChange={setSelectedIds}
                  highlightId={highlightId}
                  height={Math.max(
                    160,
                    (bodySize?.height || 400) - TABLE_HEADER_HEIGHT
                  )}
                  onAssign={assign}
                  onBusy={(busy) => (busy ? topo.beginBusy() : topo.endBusy())}
                />
              </div>
            </Flex>
          )}
        </div>

        {viewMode === 'table' && selectedIds.length > 0 && displayed && (
          <Flex
            align="center"
            gap={16}
            className={`${styles.fixed} ${styles.selection}`}
          >
            <span>
              {intl.formatMessage(
                { id: 'clusters.topology.selected' },
                { count: selectedIds.length }
              )}
            </span>
            <SetLocationPopover
              open={batch.open}
              onOpenChange={(next) =>
                setBatch({ open: next, field: batch.field })
              }
              targets={selectedWorkers}
              allWorkers={allWorkers}
              fields={fields}
              defaultField={batch.field || lastField}
              onApply={handleBatchApply}
            >
              <Button type="primary" size="small">
                {intl.formatMessage({ id: 'clusters.topology.batch.button' })}
                <DownOutlined />
              </Button>
            </SetLocationPopover>
            <Button type="link" size="small" onClick={() => setSelectedIds([])}>
              {intl.formatMessage({ id: 'clusters.topology.clearSelection' })}
            </Button>
          </Flex>
        )}
      </div>

      {clusterId && topo.topology && (
        <AdvancedDrawer
          open={mappingOpen}
          clusterId={clusterId}
          view={topo.topology}
          displayed={displayed || topo.topology}
          preview={preview}
          onClose={() => {
            preview.reset();
            setMappingOpen(false);
          }}
          onSaved={() => {
            preview.reset();
            setMappingOpen(false);
            topo.refresh();
          }}
        />
      )}

      {customLayer && topo.topology && (
        <CustomLayer
          open
          chain={customChain}
          reserved={reserved}
          knownKeys={topo.topology.vocabulary?.known_keys || []}
          workerLabels={(topo.topology.workers || []).map(
            (w) => w.labels || {}
          )}
          onOk={handleCustomOk}
          onCancel={() => setCustomLayer(null)}
        />
      )}
    </GSDrawer>
  );
};

export default TopologyDrawer;
