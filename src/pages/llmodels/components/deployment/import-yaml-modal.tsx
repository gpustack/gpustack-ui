import useUserSettings from '@/hooks/use-user-settings';
import { ExclamationCircleFilled, LoadingOutlined } from '@ant-design/icons';
import {
  AlertBlockInfo,
  ColumnWrapper,
  GSDrawer,
  IconFont,
  ModalFooter,
  Select as SealSelect,
  useSubmitLock
} from '@gpustack/core-ui';
import {
  checkYamlFile,
  preloadYamlEditor,
  YamlDiffEditor
} from '@gpustack/core-ui/yaml-editor';
import { useIntl } from '@umijs/max';
import { Button, Flex, Modal, Space, Tooltip, Upload } from 'antd';
import classNames from 'classnames';
import React, { useEffect, useMemo, useRef, useState } from 'react';
import { importModels } from '../../apis';
import { useDeploymentsContext } from '../../config/deploments-context';
import { entryCaption, entryColor, entryName } from '../../config/import-plan';
import { DeploymentPlanEntry, ListItem } from '../../config/types';
import styles from '../../style/import-yaml-drawer.module.less';
import {
  currentDocumentText,
  currentText,
  documentText,
  entryText,
  replaceDocumentsAt,
  splitDocuments
} from './plan-document';
import PlanNavList, { type PlanSelection } from './plan-nav-list';

interface ImportYamlModalProps {
  open: boolean;
  onCancel: () => void;
  onOk: (items: ListItem[]) => void;
}

// Where the field names in the document are written down.
const FIELDS_DOC =
  'https://docs.gpustack.ai/latest/user-guide/model-deployment-management/#field-reference';

// Everything the drawer puts above and below the diff — its own header, the
// cluster row, the breadcrumb and the footer. What is left over is the diff's,
// which carries its own 40px header inside that height.
const DIFF_HEIGHT = 'calc(100vh - 288px)';

// Long enough that a typed-out value is one request rather than one per
// character, short enough that the plan is describing what is on screen by
// the time the user looks up from it.
const REVIEW_DEBOUNCE_MS = 800;

// The cluster select's standing option: send no cluster and let every entry
// land where its own `cluster` says. A string, so it can never be mistaken
// for a cluster id.
const FOLLOW_FILE = 'file';

// The plan for the current document and cluster. The footer only enables once
// it came back clean, so the real import can't surprise.
const EMPTY_REVIEW = {
  checking: false,
  entries: [] as DeploymentPlanEntry[],
  valid: false,
  errors: [] as string[]
};

// A structural failure (bad YAML, or a file holding no deployment at all) has
// no plan to show, and a write that lost its race comes back as one labelled
// line per problem.
const errorLines = (error: any): string[] => {
  const data = error?.response?.data;
  const detail: string =
    data?.detail ||
    data?.error?.message ||
    data?.message ||
    error?.message ||
    '';
  return detail.split('\n').filter(Boolean);
};

// Comments and separators only — a file that holds no deployment, or an
// editor the user has emptied. Either way there is nothing to plan.
const hasDocument = (text: string): boolean =>
  text.split('\n').some((line) => {
    const trimmed = line.trim();
    return !!trimmed && trimmed !== '---' && !trimmed.startsWith('#');
  });

// Which part of the document the diff opens on.
//
// A problem takes the selection only on a document that has just arrived from
// a file and that nobody has started typing into, where the first thing worth
// reading is what is wrong with it. On a re-plan of the document
// already on screen the selection stays where the user put it: they are
// typing into it, and a problem that moves the pane takes the cursor, the
// scroll position and the sense of where the edit was with it. The list marks
// the entry in red either way, which is what the list is for.
const pickSelected = (
  entries: DeploymentPlanEntry[],
  current: PlanSelection,
  fresh: boolean
): PlanSelection => {
  const selected =
    typeof current === 'number'
      ? entries.find((entry) => entry.index === current)
      : undefined;
  const stayed = typeof current === 'number' && !selected ? 'whole' : current;
  if (!fresh) {
    return stayed;
  }
  const errored = entries.find((entry) => entry.errors.length);
  if (selected?.errors.length || !errored) {
    return stayed;
  }
  return errored.index;
};

const ImportYamlModal: React.FC<ImportYamlModalProps> = ({
  open,
  onCancel,
  onOk
}) => {
  const intl = useIntl();
  const { isDarkTheme } = useUserSettings();
  const { clusterList } = useDeploymentsContext();
  const { loading, guard, run } = useSubmitLock();
  // What seeds the editable pane. Deliberately not derived from the plan on
  // every render: `@monaco-editor/react` writes a changed `modified` in as a
  // full-range edit with `forceMoveMarkers`, which takes the cursor with it.
  // The buffer is therefore set at the few moments the pane is meant to start
  // over, and left alone in between.
  const [draft, setDraft] = useState('');
  const [review, setReview] = useState(EMPTY_REVIEW);
  const [pending, setPending] = useState(false);
  // Whether a file has been brought in. Until one has there is nothing to
  // diff, so the editor is not mounted and the drawer holds only what can
  // produce a document: the cluster to check against, and the file picker.
  const [started, setStarted] = useState(false);
  const [selected, setSelected] = useState<PlanSelection>('whole');
  const [navCollapsed, setNavCollapsed] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const [picked, setPicked] = useState<number | null>(null);
  // Only the newest request may write state: they are fired from three places
  // and the last one sent is not always the last one back. A stale answer
  // would leave the list and the names submitted for overwrite describing a
  // document nobody is looking at.
  const requestId = useRef(0);
  const inFlight = useRef<AbortController | null>(null);
  // Read synchronously by the debounce and by a click that has to bank an
  // edit before it moves the pane, both of which run outside the render that
  // would have the state.
  const liveRef = useRef('');
  // The pane text the document already reflects — last flushed, or last
  // written in. The guard on an edit has to compare against this rather than
  // against the seed: an ordinary re-plan does not reseed, so the seed stays
  // behind, and an undo back to it would read as no edit at all. The document
  // would keep the value that was undone and the import would write it.
  const flushedRef = useRef('');
  // Whether the pane has been typed in since it was last written to. A plan
  // answers a document the user may already have moved on from, so it must
  // not put its own rendering back on screen: the keystrokes made during the
  // round trip live only in the buffer, and overwriting it drops them along
  // with the cursor.
  const typedRef = useRef(false);
  const contentRef = useRef('');
  const dirtyRef = useRef(false);
  const selectedRef = useRef<PlanSelection>('whole');
  const reseedRef = useRef(false);
  // How many documents the pane currently holds — its index names only the
  // first of them. A pane is seeded with one, but a `---` typed into it makes
  // it two, and an edit has to replace the whole stretch it took over rather
  // than the single document it started as.
  const paneSpan = useRef(1);
  const debounce = useRef<ReturnType<typeof setTimeout>>();
  // The debounce fires long after the render that scheduled it, so what it
  // runs is looked up rather than captured.
  const flushRef = useRef<() => void>(() => {});

  // The cluster to force every entry into, or null to follow the file. Null
  // is where the drawer starts: an exported file names the cluster of each
  // deployment in it, so following it is what restores one. Picking a cluster
  // overrides all of them.
  const clusterId = picked;

  // The whole document, and whether it has been edited since the file it came
  // from. Nothing renders from either, so neither is state: making them so
  // would re-render the drawer on every debounce for no visible difference.
  const setDocument = (text: string, isDirty: boolean) => {
    contentRef.current = text;
    dirtyRef.current = isDirty;
  };

  const setBuffer = (text: string) => {
    liveRef.current = text;
    flushedRef.current = text;
    typedRef.current = false;
    paneSpan.current = splitDocuments(text).length;
    setDraft(text);
  };

  const select = (next: PlanSelection) => {
    selectedRef.current = next;
    setSelected(next);
  };

  // What the editable pane should hold for a given selection: the document,
  // or the one entry of it the pane points at. Always the document itself and
  // never the plan's rendering of it — the plan lags the last edit by a round
  // trip, so sourcing the pane from it would put a superseded version of the
  // entry back on screen.
  const seedText = (
    selection: PlanSelection,
    entries: DeploymentPlanEntry[]
  ): string => {
    if (selection === 'whole') {
      return contentRef.current;
    }
    const slice = splitDocuments(contentRef.current)[selection];
    if (slice != null) {
      return `${slice.replace(/^\n+|\n+$/g, '')}\n`;
    }
    // Past the end of the document: an edit removed the entry the pane was
    // opened on and no plan has moved the selection off it yet.
    const entry = entries.find((each) => each.index === selection);
    return entry ? entryText(entry) : '';
  };

  // `fresh` is a document that arrived from a file: the plan starts over. An
  // edit — typing or pasting into the pane — re-plans the document already on
  // screen, where throwing the plan away would take the list the user is
  // navigating by with it.
  const reviewDocument = async (
    text: string,
    cluster: number | null,
    fresh = false
  ) => {
    inFlight.current?.abort();
    if (!hasDocument(text)) {
      requestId.current += 1;
      setReview(EMPTY_REVIEW);
      return;
    }
    const id = ++requestId.current;
    const controller = new AbortController();
    inFlight.current = controller;
    setReview((current) =>
      fresh
        ? { ...EMPTY_REVIEW, checking: true }
        : { ...current, checking: true, errors: [] }
    );
    try {
      const result = await importModels(
        { content: text, cluster_id: cluster ?? undefined, dry_run: true },
        { signal: controller.signal }
      );
      if (id !== requestId.current) {
        return;
      }
      setReview({
        checking: false,
        entries: result.entries,
        valid: result.valid,
        errors: []
      });
      const before = selectedRef.current;
      // Typing outruns the plan: the document on screen is already past the
      // one this answers, so an arrival nobody is waiting on neither moves
      // the pane nor takes the selection to a problem not looked at yet.
      const next = pickSelected(
        result.entries,
        before,
        fresh && !typedRef.current
      );
      select(next);
      // Reseed when the document was just imported, or when a problem moved
      // the selection: either way what the buffer holds is not what the pane
      // is now meant to be showing. An ordinary re-plan leaves it alone, and
      // so does one that landed in a pane being typed in. The flag is cleared
      // either way, so it cannot stay armed and swap the buffer out under a
      // later edit.
      const reseed = reseedRef.current;
      reseedRef.current = false;
      if ((reseed && !typedRef.current) || next !== before) {
        // A file that has not been edited yet gives way to the plan's
        // rendering of it, document and all — an entry pane is a slice of the
        // document, and a slice of the file's own text would be diffed
        // against a read-only side this client rendered, which does not write
        // a list the same way. Every list would read as an edit nobody made.
        //
        // Only when nothing is lost by it: an item that is not even a mapping
        // renders as `{}`, and that is the text the user has to fix.
        const lossless = result.entries.every(
          (entry) =>
            Object.keys(entry.desired).length > 0 ||
            Object.keys(entry.raw).length > 0
        );
        if (!dirtyRef.current && result.entries.length && lossless) {
          setDocument(documentText(result.entries), false);
        }
        setBuffer(seedText(next, result.entries));
      }
    } catch (error) {
      if (id !== requestId.current) {
        return;
      }
      setReview((current) =>
        fresh
          ? { ...EMPTY_REVIEW, errors: errorLines(error) }
          : {
              ...current,
              checking: false,
              valid: false,
              errors: errorLines(error)
            }
      );
    }
  };

  // The edit as it stands, folded back into the whole document and sent for a
  // plan. A pane that still holds what it was seeded with was never typed in,
  // which is what a focus and a blur amount to.
  const flushEdit = () => {
    clearTimeout(debounce.current);
    setPending(false);
    const text = liveRef.current;
    if (text === flushedRef.current) {
      return;
    }
    flushedRef.current = text;
    // What the pane holds is patched into the document where it sits, leaving
    // the rest of the file untouched; the whole document simply is the
    // document. An edit can also empty the document out from under the pane,
    // leaving the selection past the end of what is left — with no entry
    // there to replace, what is in the pane is the whole of what the user has.
    const next =
      typeof selected === 'number'
        ? (replaceDocumentsAt(
            contentRef.current,
            selected,
            paneSpan.current,
            text
          ) ?? text)
        : text;
    // The document now carries whatever the pane grew into, so the next edit
    // has to replace that much of it rather than the one document the pane
    // was opened on.
    paneSpan.current = splitDocuments(text).length;
    setDocument(next, true);
    reviewDocument(next, clusterId);
  };
  flushRef.current = flushEdit;

  const handleDiffChange = (text: string) => {
    // `@monaco-editor/react` writes a changed `modified` in as an edit rather
    // than a set, so monaco reports a reseed the same way it reports typing.
    // The buffer was written a moment before and holds exactly this text,
    // which is what tells the two apart — a keystroke cannot produce the text
    // already in the buffer. Without this a reseed would arm the debounce and
    // hold the footer disabled for its full delay with no request in flight.
    if (text === liveRef.current) {
      return;
    }
    liveRef.current = text;
    typedRef.current = true;
    setPending(true);
    clearTimeout(debounce.current);
    debounce.current = setTimeout(() => flushRef.current(), REVIEW_DEBOUNCE_MS);
  };

  // Leaving the editor is a statement that the edit is finished, so it does
  // not wait out the rest of the debounce.
  const handleDiffBlur = (text: string) => {
    liveRef.current = text;
    flushEdit();
  };

  // Switching cluster re-checks the document against the one just picked
  // rather than throwing it away: reproducing a set of deployments on another
  // cluster is what a file is for. Nothing to re-check until one is in.
  //
  // Reseeded, because picking a cluster changes where every entry lands and
  // the pane is a rendering of exactly that. Leaving it alone would count the
  // new cluster among the changes while showing the old one in the document,
  // which reads as a change nobody can find.
  const handleClusterChange = (value: number | typeof FOLLOW_FILE) => {
    const next = value === FOLLOW_FILE ? null : value;
    setPicked(next);
    if (hasDocument(contentRef.current)) {
      reseedRef.current = true;
      reviewDocument(contentRef.current, next);
    }
  };

  // Opening the drawer reads nothing from the cluster — only the editor
  // bundle, so it is ready rather than still arriving by the time a file lands
  // in it. What fills the read-only side of the diff is the plan, which
  // projects the deployment behind every entry the imported file names, so the
  // deployments that get loaded are the ones the file actually names. A drawer
  // opened and closed again costs the cluster nothing.
  useEffect(() => {
    if (open) {
      preloadYamlEditor();
    }
  }, [open]);

  // Nothing is uploaded: the text travels in the import request body. This is
  // the only way a document gets in, so it is also what puts the diff on
  // screen — a second file replaces the first outright, plan and edits with
  // it.
  //
  // The file arrives clean, not dirty: nobody has edited it yet, so the pane
  // takes the plan's rendering of it once that lands. Left as the file's own
  // text it would be diffed against a read-only side the client serialized
  // itself, and the two disagree on how to write a list — every
  // `backend_parameters` would read as an edit nobody made.
  const handleFile = async (rawFile: File) => {
    // The same refusals the editor's own Import button makes, run before
    // `text()` — which is itself enough to take the tab down on a large enough
    // file (gpustack/gpustack#6234), and this screen pays for it twice over
    // since the text goes on to back both sides of a diff. Surfaced in the
    // banner rather than as a toast: it renders whether or not a file has been
    // picked yet, so the empty state can say why nothing happened.
    const rejection = checkYamlFile(rawFile);
    if (rejection) {
      // Abandon what the replaced document had in flight first, exactly as
      // `reset` does — a plan or a pending edit landing after this would put
      // the old file's review back over the refusal.
      requestId.current += 1;
      inFlight.current?.abort();
      clearTimeout(debounce.current);
      setReview({
        ...EMPTY_REVIEW,
        errors: [intl.formatMessage({ id: rejection.id }, rejection.values)]
      });
      return false;
    }
    try {
      const text = await rawFile.text();
      clearTimeout(debounce.current);
      setPending(false);
      setStarted(true);
      setDocument(text, false);
      setBuffer(text);
      select('whole');
      reseedRef.current = true;
      reviewDocument(text, clusterId, true);
    } catch (error) {
      setReview({ ...EMPTY_REVIEW, errors: errorLines(error) });
    }
    return false;
  };

  // Moving the pane banks whatever is in it first, then starts the new
  // selection over from the plan.
  const handleSelect = (next: PlanSelection) => {
    flushEdit();
    select(next);
    setBuffer(seedText(next, review.entries));
  };

  const reset = () => {
    requestId.current += 1;
    setPicked(null);
    inFlight.current?.abort();
    clearTimeout(debounce.current);
    reseedRef.current = false;
    setPending(false);
    setStarted(false);
    setDocument('', false);
    setBuffer('');
    select('whole');
    setNavCollapsed(false);
    setConfirming(false);
    setReview(EMPTY_REVIEW);
  };

  const handleCancel = () => {
    reset();
    onCancel();
  };

  const counts = useMemo(() => {
    const tally = { create: 0, update: 0, unchanged: 0, changes: 0 };
    review.entries.forEach((entry) => {
      if (entry.action) {
        tally[entry.action] += 1;
      }
      tally.changes += entry.changes.length;
    });
    return tally;
  }, [review.entries]);

  // Every entry the plan marks as an update is an overwrite, and they are
  // agreed to together in the dialog that stands between here and the write.
  const overwrites = useMemo(
    () =>
      review.entries
        .filter((entry) => entry.action === 'update' && entry.name)
        .map((entry) => entry.name!),
    [review.entries]
  );

  const invalidCount = review.entries.filter(
    (entry) => entry.errors.length
  ).length;
  // A document can parse cleanly and still write nothing — re-importing an
  // untouched export is exactly that — so the button waits for something to
  // actually do rather than for the document to merely be valid.
  const writes = counts.create + counts.update;
  const busy = pending || review.checking;

  const submit = () => {
    guard(() => {
      run(async () => {
        try {
          const result = await importModels({
            content: contentRef.current,
            cluster_id: clusterId ?? undefined,
            dry_run: false,
            overwrite: overwrites
          });
          reset();
          onOk(result.items);
        } catch (error) {
          // The dry run passed a moment ago; something changed since.
          setConfirming(false);
          setReview((current) => ({
            ...current,
            valid: false,
            errors: errorLines(error)
          }));
        }
      });
    });
  };

  const handleSubmit = () => {
    if (overwrites.length) {
      setConfirming(true);
      return;
    }
    submit();
  };

  const ready = review.valid && writes > 0 && !busy;

  const selectedEntry =
    typeof selected === 'number'
      ? review.entries.find((entry) => entry.index === selected)
      : undefined;
  const whole = selected === 'whole';
  const original = whole
    ? currentDocumentText(review.entries)
    : selectedEntry
      ? currentText(selectedEntry)
      : '';

  // Following the file leads, because an exported file already says where
  // each of its deployments belongs; the clusters below it override that.
  const clusterOptions = [
    {
      value: FOLLOW_FILE,
      label: intl.formatMessage({ id: 'models.import.cluster.follow' })
    },
    ...clusterList
  ];

  // What the status line calls the destination. Following the file there is
  // no single one, so it names the clusters the plan says the entries land
  // in — an entry that already exists reports the cluster it is in, which is
  // where it stays.
  const clusterName = clusterId
    ? clusterList.find((cluster) => cluster.value === clusterId)?.label
    : [
        ...new Set(
          review.entries
            .map(
              (entry) =>
                entry.desired.cluster_name ?? entry.current.cluster_name
            )
            .filter(Boolean)
        )
      ].join(', ');
  const allLabel = intl.formatMessage(
    { id: 'models.import.scope.all' },
    { count: review.entries.length }
  );

  const fieldsDocLink = (
    <a href={FIELDS_DOC} target="_blank" rel="noreferrer">
      {intl.formatMessage({ id: 'models.import.fieldsDoc' })}
    </a>
  );

  // How much of the document was understood, against which cluster, and
  // whether any of it is in the way.
  const renderStatus = () => {
    if (busy) {
      return (
        <Flex align="center" gap={6} className={styles.status}>
          <LoadingOutlined />
          {intl.formatMessage({ id: 'models.import.checking' })}
        </Flex>
      );
    }
    if (!review.entries.length) {
      // A check that failed says so in its own banner, and left no plan
      // behind to describe. Reporting nothing to import would be a claim
      // about a document the server may never have got to read.
      return review.errors.length ? null : (
        <span className={styles.status}>
          {intl.formatMessage({ id: 'models.import.hint.nothing' })}
          {' · '}
          {fieldsDocLink}
        </span>
      );
    }
    if (invalidCount) {
      return (
        <span className={classNames(styles.status, styles.invalid)}>
          {`${intl.formatMessage(
            { id: 'models.import.parsed' },
            { count: review.entries.length }
          )} · ${intl.formatMessage(
            { id: 'models.import.parsed.invalid' },
            { count: invalidCount }
          )}`}
        </span>
      );
    }
    if (!writes) {
      return (
        <span className={styles.status}>
          {intl.formatMessage(
            { id: 'models.import.loaded' },
            { cluster: clusterName, count: review.entries.length }
          )}
          {' · '}
          {fieldsDocLink}
        </span>
      );
    }
    return (
      <span className={styles.status}>
        {intl.formatMessage(
          { id: 'models.import.counts' },
          {
            count: review.entries.length,
            cluster: clusterName,
            changes: counts.changes
          }
        )}
      </span>
    );
  };

  // Where in the document the diff is pointing, and the way back up to the
  // whole of it.
  const renderBreadcrumb = () => (
    <Flex align="center" gap={8} className={styles.crumbs}>
      <Tooltip
        title={intl.formatMessage({
          id: navCollapsed ? 'common.button.expand' : 'common.button.collapse'
        })}
      >
        <Button
          type="text"
          size="small"
          aria-label={intl.formatMessage({
            id: navCollapsed ? 'common.button.expand' : 'common.button.collapse'
          })}
          icon={
            <IconFont
              type={
                navCollapsed ? 'icon-left_panel_open' : 'icon-left_panel_close'
              }
            />
          }
          onClick={() => setNavCollapsed((value) => !value)}
        ></Button>
      </Tooltip>
      {whole ? (
        <>
          <span className={styles.crumbCurrent}>{allLabel}</span>
          <span className={styles.crumbNote}>
            {intl.formatMessage({ id: 'models.import.scope.whole' })}
          </span>
        </>
      ) : (
        <>
          <Button
            type="link"
            size="small"
            onClick={() => handleSelect('whole')}
          >
            {allLabel}
          </Button>
          <span className={styles.crumbSep}>›</span>
          <span
            className={classNames(styles.crumbCurrent, {
              [styles.invalid]: !!selectedEntry?.errors.length
            })}
          >
            {selectedEntry ? entryName(intl, selectedEntry) : ''}
          </span>
          {selectedEntry && (
            <span style={{ color: entryColor(selectedEntry) }}>
              {entryCaption(intl, selectedEntry)}
            </span>
          )}
        </>
      )}
    </Flex>
  );

  // Which side of the diff is which. The left one says so twice when there is
  // nothing on it, because an empty pane alone does not distinguish a new
  // deployment from an editor that has not loaded.
  //
  // With no document there is also nothing the cluster has been asked about,
  // so the note says only that — claiming the cluster holds no match would be
  // a statement about deployments nobody has looked up. Once there is a plan
  // and every entry in it is a create, the empty side is not an absence to
  // explain but the point: nothing here is being replaced.
  const renderPanes = () => (
    <div className={styles.diffPanes}>
      <Flex gap={8} align="center" justify="space-between">
        <span>{intl.formatMessage({ id: 'models.import.pane.current' })}</span>
        {!original.trim() && (
          <span className={styles.paneNote}>
            {intl.formatMessage({
              id: !whole
                ? 'models.import.pane.absent'
                : !review.entries.length
                  ? 'models.import.pane.waiting'
                  : counts.create === review.entries.length
                    ? 'models.import.pane.allNew'
                    : 'models.import.pane.none'
            })}
          </span>
        )}
      </Flex>
      <Flex gap={8} align="center" justify="space-between">
        <span>{intl.formatMessage({ id: 'models.import.pane.draft' })}</span>
        {!whole && !!selectedEntry?.changes.length && (
          <span className={styles.paneChanges}>
            {intl.formatMessage(
              { id: 'models.import.changes' },
              { count: selectedEntry.changes.length }
            )}
          </span>
        )}
      </Flex>
    </div>
  );

  // Why an entry cannot be imported, directly above the diff that has to be
  // edited to fix it. On one deployment that is the one it is showing; on the
  // whole document it is every entry holding the import back, since the pane
  // no longer moves to them.
  const renderErrors = () => {
    const failed = whole
      ? review.entries.filter((entry) => entry.errors.length)
      : selectedEntry?.errors.length
        ? [selectedEntry]
        : [];
    if (!failed.length) {
      return null;
    }
    return (
      <Flex vertical gap={8} className={styles.entryError}>
        {failed.map((entry) => (
          <Flex vertical gap={4} key={entry.index}>
            <span className={styles.entryErrorTitle}>
              {intl.formatMessage(
                { id: 'models.import.entry.invalid' },
                { index: entry.index + 1 }
              )}
            </span>
            {entry.errors.map((error, index) => (
              <span key={index} className={styles.entryErrorDetail}>
                {error}
              </span>
            ))}
          </Flex>
        ))}
      </Flex>
    );
  };

  // A picker, not an upload: `beforeUpload` returning false is what keeps
  // antd from sending the file anywhere. The same control sits in the empty
  // state and, once there is a diff, in its toolbar — one way in, wherever
  // the user is looking for it.
  const renderPicker = (trigger: React.ReactNode) => (
    <Upload
      accept=".yaml,.yml"
      maxCount={1}
      showUploadList={false}
      beforeUpload={handleFile}
    >
      {trigger}
    </Upload>
  );

  // Before a file there is nothing to diff, and an editor holding a blank
  // document against a blank cluster is a worse invitation than saying so.
  // Laid out in the height the diff will take, so importing fills the space
  // rather than moving everything below it.
  const renderEmpty = () => (
    <Flex
      vertical
      align="center"
      justify="center"
      gap={10}
      className={styles.empty}
      style={{ height: DIFF_HEIGHT }}
    >
      <IconFont type="icon-files" className={styles.emptyIcon} />
      <span className={styles.emptyTitle}>
        {intl.formatMessage({ id: 'models.import.empty.title' })}
      </span>
      <span className={styles.emptyDescription}>
        {intl.formatMessage({ id: 'models.import.empty.description' })}
      </span>
      {renderPicker(
        <Button type="primary" icon={<IconFont type="icon-files" />}>
          {intl.formatMessage({ id: 'models.import.pickFile' })}
        </Button>
      )}
      <span className={styles.emptyDoc}>{fieldsDocLink}</span>
    </Flex>
  );

  const renderFooterDescription = () => {
    if (!review.entries.length) {
      return null;
    }
    if (invalidCount) {
      return (
        <span style={{ color: 'var(--ant-color-error)' }}>
          {intl.formatMessage(
            { id: 'models.import.blocked' },
            { count: invalidCount }
          )}
        </span>
      );
    }
    if (!writes) {
      return (
        <span>
          {intl.formatMessage(
            { id: 'models.import.loaded.hint' },
            { cluster: clusterName }
          )}
        </span>
      );
    }
    return (
      <span>
        {intl.formatMessage({ id: 'models.import.summary' }, counts)}
        {counts.update > 0 &&
          ` ${intl.formatMessage({ id: 'models.import.summary.replaces' })}`}
      </span>
    );
  };

  return (
    <GSDrawer
      title={intl.formatMessage({ id: 'models.button.importYaml' })}
      open={open}
      onClose={handleCancel}
      destroyOnHidden={true}
      closeIcon={true}
      mask={{
        closable: false
      }}
      keyboard={false}
      // Wide: the index of the document takes a fixed column off the left, and
      // what is left has to hold a deployment's YAML beside the deployment it
      // would replace without either side wrapping. Capped at the viewport so
      // the fixed left column stays on screen on a display narrower than the
      // preferred width -- the drawer is right-aligned and does not scroll.
      styles={{
        wrapper: { width: 'min(max(62vw, 1120px), 96vw)' }
      }}
      footer={false}
    >
      <ColumnWrapper
        footer={
          <ModalFooter
            styles={{ wrapper: { padding: '16px 24px 8px' } }}
            onOk={handleSubmit}
            onCancel={handleCancel}
            loading={loading}
            okText={intl.formatMessage({ id: 'common.button.import' })}
            okBtnProps={{ disabled: !ready }}
            // What this import would do, beside the button that would do it.
            // It does not belong above the diff, where it pushes the diff down
            // and reads as a standing caveat about the document.
            description={renderFooterDescription()}
          ></ModalFooter>
        }
      >
        <Flex vertical gap={12}>
          <Flex align="center" gap={16} wrap>
            {/* Not a form: one field, nothing submitted from it, and the
                import is gated on a plan rather than on validity. A required
                rule would have nothing to fire on — the cluster always holds
                a value, since following the file is one. */}
            <SealSelect
              style={{ width: 280 }}
              label={intl.formatMessage({ id: 'clusters.title' })}
              options={clusterOptions}
              value={clusterId ?? FOLLOW_FILE}
              onChange={handleClusterChange}
              required
            ></SealSelect>
            {started && renderStatus()}
          </Flex>
          {review.errors.length > 0 && (
            <AlertBlockInfo
              type="danger"
              title={intl.formatMessage({ id: 'models.import.invalid' })}
              maxHeight={160}
              message={
                <Flex vertical gap={4}>
                  {review.errors.map((line, index) => (
                    <span key={index}>{line}</span>
                  ))}
                </Flex>
              }
            ></AlertBlockInfo>
          )}
          {started ? (
            <Flex vertical gap={10}>
              <Flex align="center" justify="space-between">
                {renderBreadcrumb()}
                {renderPicker(
                  <Button
                    type="text"
                    size="small"
                    icon={<IconFont type="icon-files" />}
                  >
                    {intl.formatMessage({ id: 'models.import.pickFile' })}
                  </Button>
                )}
              </Flex>
              <Flex className={styles.diff} style={{ height: DIFF_HEIGHT }}>
                <PlanNavList
                  entries={review.entries}
                  selected={selected}
                  collapsed={navCollapsed}
                  onSelect={handleSelect}
                ></PlanNavList>
                <Flex vertical className={styles.diffMain}>
                  {renderErrors()}
                  {/* One editor per selection: an undo stack that reached back
                      into the deployment before it would undo edits off
                      screen. */}
                  <YamlDiffEditor
                    key={whole ? 'whole' : selected}
                    original={original}
                    modified={draft}
                    height="100%"
                    isDarkTheme={isDarkTheme}
                    header={renderPanes()}
                    onChange={handleDiffChange}
                    onBlur={handleDiffBlur}
                  ></YamlDiffEditor>
                </Flex>
              </Flex>
            </Flex>
          ) : (
            renderEmpty()
          )}
        </Flex>
      </ColumnWrapper>
      {/* The overwrite is agreed to once, here, rather than entry by entry in
          the plan: the diff has already spelled out what each replacement
          does, and a tick beside it adds nothing the diff did not say. Laid
          out like the delete confirmation, without its danger colouring —
          replacing a stopped deployment is reversible by re-importing. */}
      <Modal
        open={confirming}
        width={460}
        closeIcon={false}
        keyboard={false}
        mask={{ closable: false }}
        style={{ top: '20%' }}
        styles={{
          container: { borderRadius: 'var(--modal-border-radius)' },
          footer: { marginTop: 20 }
        }}
        onCancel={() => setConfirming(false)}
        footer={
          <Space size={20}>
            <Button onClick={() => setConfirming(false)}>
              {intl.formatMessage({ id: 'common.button.cancel' })}
            </Button>
            <Button type="primary" loading={loading} onClick={submit}>
              {intl.formatMessage({ id: 'common.button.import' })}
            </Button>
          </Space>
        }
      >
        <Flex align="center" className={styles.confirmTitle}>
          <ExclamationCircleFilled />
          <span>
            {intl.formatMessage({ id: 'models.import.overwrite.title' })}
          </span>
        </Flex>
        <div className={styles.confirmBody}>
          {intl.formatMessage(
            { id: 'models.import.overwrite.confirm' },
            { count: overwrites.length }
          )}
          {(counts.create > 0 || counts.unchanged > 0) &&
            ` ${intl.formatMessage({ id: 'models.import.overwrite.rest' }, counts)}`}
        </div>
        <Flex vertical gap={4} className={styles.confirmNames}>
          {overwrites.map((name) => (
            <span key={name}>{name}</span>
          ))}
        </Flex>
      </Modal>
    </GSDrawer>
  );
};

export default ImportYamlModal;
