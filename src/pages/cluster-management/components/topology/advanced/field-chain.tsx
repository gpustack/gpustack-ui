import {
  CloseOutlined,
  DownOutlined,
  HolderOutlined,
  LockOutlined,
  MoreOutlined,
  PlusOutlined,
  RightOutlined
} from '@ant-design/icons';
import { useIntl } from '@umijs/max';
import { Button, Dropdown, Flex, Tooltip } from 'antd';
import { createStyles } from 'antd-style';
import classNames from 'classnames';
import { useState } from 'react';
import { DraftLayer } from './draft';
import { KeyEditor, KeyVocabulary } from './key-editor';

const useStyles = createStyles(({ css }) => ({
  key: css`
    display: inline-flex;
    align-items: center;
    gap: 4px;
    padding: 0 6px;
    border-radius: 4px;
    background: var(--ant-color-fill-quaternary);
    font-family: var(--ant-font-family-code);
    font-size: 12px;
    line-height: 22px;
    .grip {
      color: var(--ant-color-text-quaternary);
      cursor: grab;
    }
    .lock {
      color: var(--ant-color-text-tertiary);
    }
    &.dragging {
      opacity: 0.4;
    }
  `,
  row: css`
    .head {
      min-height: 32px;
      padding-inline: 4px;
      border-radius: 4px;
      cursor: pointer;
      &:hover {
        background: var(--ant-color-fill-quaternary);
      }
    }
    .head.static {
      cursor: default;
      &:hover {
        background: transparent;
      }
    }
    .chevron {
      width: 12px;
      color: var(--ant-color-text-tertiary);
      font-size: 10px;
    }
    .name {
      flex-shrink: 0;
      min-width: 88px;
      font-weight: 500;
    }
    .name.dim {
      color: var(--ant-color-text-tertiary);
      font-weight: 400;
    }
    /* The key gives way first: the count on the right must stay in one place. */
    .key,
    .note {
      min-width: 0;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }
    .key {
      font-size: 12px;
    }
    .more,
    .note {
      color: var(--ant-color-text-tertiary);
      font-size: 12px;
    }
    .more {
      flex-shrink: 0;
      white-space: nowrap;
    }
    .row-note {
      margin-left: 6px;
      font-size: 12px;
      font-weight: 400;
      color: var(--ant-color-text-quaternary);
    }
    .row-actions {
      flex-shrink: 0;
      margin-left: 4px;
    }
    .count {
      margin-left: auto;
      font-variant-numeric: tabular-nums;
      white-space: nowrap;
      font-size: 12px;
      color: var(--ant-color-text-secondary);
      &.flash {
        animation: topology-count-flash 1s ease-out;
      }
    }
    .body {
      padding: 4px 4px 12px 24px;
    }
    @keyframes topology-count-flash {
      0% {
        color: var(--ant-color-success);
      }
      100% {
        color: inherit;
      }
    }
  `,
  /* One straight rail with a dot per rung. The rungs stay left-aligned so the
     key column lines up; the rail is what says "one path, root to host". */
  chain: css`
    position: relative;
    padding-left: 18px;
    &::before {
      content: '';
      position: absolute;
      left: 5px;
      top: 14px;
      bottom: 14px;
      border-left: 1px solid var(--ant-color-border);
    }
    .rung {
      position: relative;
    }
    .rung::before {
      content: '';
      position: absolute;
      left: -16px;
      top: 11px;
      width: 7px;
      height: 7px;
      border-radius: 50%;
      background: var(--ant-color-bg-container);
      border: 1px solid var(--ant-color-border);
    }
    .rung.dim::before {
      border-color: var(--ant-color-border-secondary);
    }
  `,
  /* The whole vocabulary in one line, so the order stays readable while the
     unused rungs are folded away. */
  formula: css`
    margin-top: 8px;
    padding-left: 4px;
    font-size: 12px;
    color: var(--ant-color-text-tertiary);
    .unused {
      color: var(--ant-color-text-quaternary);
    }
    .sup {
      color: var(--ant-color-text-quaternary);
      margin-inline: 6px;
    }
  `
}));

interface KeyListProps {
  keys: string[];
  /** Rendered first with a lock; not removable, not draggable. */
  lockedKey?: string | null;
  /** The field the keys feed; decides which known keys are offered. */
  fieldId: string;
  vocabulary: KeyVocabulary;
  /** Start with the editor open, for a list that begins empty. */
  defaultEditing?: boolean;
  onChange: (keys: string[]) => void;
}

/**
 * The any-of list of one field. Order matters only for a worker carrying two
 * of these keys at once, so the reorder is a plain drag between chips rather
 * than a full-blown sortable. Adding is inline, where the button was.
 */
export const KeyList: React.FC<KeyListProps> = ({
  keys,
  lockedKey,
  fieldId,
  vocabulary,
  defaultEditing,
  onChange
}) => {
  const intl = useIntl();
  const { styles } = useStyles();
  const [dragging, setDragging] = useState<string | null>(null);
  const [editing, setEditing] = useState(!!defaultEditing);

  const movable = keys.filter((key) => key !== lockedKey);

  const drop = (target: string) => {
    if (!dragging || dragging === target) {
      return;
    }
    const next = movable.filter((key) => key !== dragging);
    next.splice(next.indexOf(target), 0, dragging);
    onChange(lockedKey ? [lockedKey, ...next] : next);
    setDragging(null);
  };

  return (
    <Flex wrap gap={6} align="center">
      {lockedKey && (
        <Tooltip
          title={intl.formatMessage({
            id: 'clusters.topology.advanced.locked'
          })}
        >
          <span className={styles.key}>
            <LockOutlined className="lock" />
            {lockedKey}
          </span>
        </Tooltip>
      )}
      {movable.map((key) => (
        <span
          key={key}
          className={classNames(styles.key, { dragging: dragging === key })}
          draggable
          onDragStart={() => setDragging(key)}
          onDragEnd={() => setDragging(null)}
          onDragOver={(e) => e.preventDefault()}
          onDrop={() => drop(key)}
        >
          <HolderOutlined className="grip" />
          {key}
          <Button
            type="text"
            size="small"
            icon={<CloseOutlined />}
            style={{ width: 18, height: 18, minWidth: 18 }}
            onClick={() => onChange(keys.filter((k) => k !== key))}
          />
        </span>
      ))}
      {editing ? (
        <KeyEditor
          fieldId={fieldId}
          vocabulary={vocabulary}
          existing={keys}
          onAdd={(key) => {
            onChange([...keys, key]);
            setEditing(false);
          }}
          onCancel={() => setEditing(false)}
        />
      ) : (
        <Button
          type="link"
          size="small"
          style={{ padding: 0 }}
          onClick={() => setEditing(true)}
        >
          <PlusOutlined />
          {intl.formatMessage({ id: 'clusters.topology.layer.addKey' })}
        </Button>
      )}
    </Flex>
  );
};

interface FieldRowProps {
  fieldId: string;
  name: React.ReactNode;
  /** The row's own actions, rendered at the right of the header. */
  actions?: React.ReactNode;
  keys: string[];
  lockedKey?: string | null;
  vocabulary: KeyVocabulary;
  classified: number;
  total: number;
  /** The count just left zero: it blinks green once. */
  flashing?: boolean;
  /** No worker resolves it under the saved mapping. */
  dim?: boolean;
  expanded: boolean;
  onToggle: () => void;
  onChange: (keys: string[]) => void;
}

/**
 * One line while collapsed — name, the key that decides, how many more are
 * tried, how many workers resolve — so a six-rung chain reads at a glance.
 * Open, it is the full any-of list.
 */
export const FieldRow: React.FC<FieldRowProps> = ({
  fieldId,
  name,
  actions,
  keys,
  lockedKey,
  vocabulary,
  classified,
  total,
  flashing,
  dim,
  expanded,
  onToggle,
  onChange
}) => {
  const intl = useIntl();
  const { styles } = useStyles();
  const primary = lockedKey || keys[0] || null;
  const more = keys.length - (primary ? 1 : 0);

  return (
    <div className={styles.row}>
      <Flex
        align="center"
        gap={8}
        className="head"
        role="button"
        tabIndex={0}
        aria-expanded={expanded}
        onClick={onToggle}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            onToggle();
          }
        }}
      >
        <span className="chevron">
          {expanded ? <DownOutlined /> : <RightOutlined />}
        </span>
        <span className={classNames('name', { dim })}>{name}</span>
        {primary ? (
          <Tooltip title={primary}>
            <code className="key">{primary}</code>
          </Tooltip>
        ) : (
          <span className="note">
            {intl.formatMessage({ id: 'clusters.topology.mapping.noKeys' })}
          </span>
        )}
        {more > 0 && (
          <span className="more">
            {intl.formatMessage(
              { id: 'clusters.topology.mapping.moreKeys' },
              { count: more }
            )}
          </span>
        )}
        <span className={classNames('count', { flash: flashing })}>
          {intl.formatMessage(
            { id: 'clusters.topology.mapping.classified' },
            { classified, total }
          )}
        </span>
        {/* Stops the click from also toggling the row: the menu is about the
            layer, not about opening its key list. */}
        {actions && (
          <span
            className="row-actions"
            onClick={(e) => e.stopPropagation()}
            role="presentation"
          >
            {actions}
          </span>
        )}
      </Flex>
      {expanded && (
        <div className="body">
          <KeyList
            keys={keys}
            lockedKey={lockedKey}
            fieldId={fieldId}
            vocabulary={vocabulary}
            onChange={onChange}
          />
        </div>
      )}
    </div>
  );
};

interface StaticRowProps {
  name: React.ReactNode;
  /** Same grey as an unresolved field row. */
  dim?: boolean;
  count?: React.ReactNode;
  /** Sits under the row at the key-list indent. */
  detail?: React.ReactNode;
  children?: React.ReactNode;
}

/** A row in the FieldRow grid that has nothing to fold: the host, a select. */
export const StaticRow: React.FC<StaticRowProps> = ({
  name,
  dim,
  count,
  detail,
  children
}) => {
  const { styles } = useStyles();
  return (
    <div className={styles.row}>
      <Flex align="center" gap={8} className="head static">
        <span className="chevron" />
        <span className={classNames('name', { dim })}>{name}</span>
        {children}
        {count !== undefined && <span className="count">{count}</span>}
      </Flex>
      {detail && <div className="body">{detail}</div>}
    </div>
  );
};

interface FieldChainProps {
  rows: DraftLayer[];
  total: number;
  /** Workers resolving a value per field id, from the live preview. */
  classified: Record<string, number>;
  flashing: Set<string>;
  vocabulary: KeyVocabulary;
  // `defaultShowUnused` was removed with the second chain: only the
  // accelerator pane passed it, to keep its two still-unused rungs visible.
  // The one chain's unused rungs stay folded, as they always did.
  onAddLayer?: () => void;
  onKeysChange: (id: string, keys: string[]) => void;
  onRename: (row: DraftLayer) => void;
  onToggleDisabled: (row: DraftLayer) => void;
  onDelete: (row: DraftLayer) => void;
}

/**
 * The layer chain, root at the top and the host at the bottom; the pane around
 * it owns the title. Rows nobody uses are hidden behind "show the N unused
 * fields": a fleet with racks and nothing else should see one rung and the
 * host, not the whole vocabulary.
 */
const FieldChain: React.FC<FieldChainProps> = ({
  rows,
  total,
  classified,
  flashing,
  vocabulary,
  onAddLayer,
  onKeysChange,
  onRename,
  onToggleDisabled,
  onDelete
}) => {
  const intl = useIntl();
  const { styles } = useStyles();
  const [expanded, setExpanded] = useState<Set<string>>(new Set());
  const [showUnused, setShowUnused] = useState(false);

  // A disabled rung is never "in use" however its data looks — that is the
  // difference between switching it off and nobody having filled it in.
  const inUse = (row: DraftLayer) =>
    !row.disabled && (row.active || !row.builtin || row.customised);
  const unused = rows.filter((row) => !inUse(row)).length;
  const shown = showUnused ? rows : rows.filter(inUse);

  const toggle = (id: string) => {
    const next = new Set(expanded);
    if (next.has(id)) {
      next.delete(id);
    } else {
      next.add(id);
    }
    setExpanded(next);
  };

  const hostLabel = intl.formatMessage({ id: 'clusters.topology.field.host' });

  /**
   * What a rung offers. The two branches are the design's own split: a
   * built-in rung belongs to the vocabulary and can only be switched off,
   * while a custom one exists because someone added it and can be removed.
   * Offering "delete" on a built-in would promise something the server
   * refuses, and "disable" on a custom one would leave a row meaning nothing.
   */
  const rowActions = (row: DraftLayer) => [
    {
      key: 'rename',
      label: intl.formatMessage({ id: 'clusters.topology.layer.rename' })
    },
    row.builtin
      ? {
          key: 'disable',
          label: intl.formatMessage({
            id: row.disabled
              ? 'clusters.topology.layer.enable'
              : 'clusters.topology.layer.disable'
          })
        }
      : {
          key: 'delete',
          danger: true,
          label: intl.formatMessage({ id: 'common.button.delete' })
        }
  ];

  return (
    <Flex orientation="vertical" gap={8}>
      {unused > 0 && (
        <Flex justify="flex-end">
          <Button
            type="link"
            size="small"
            style={{ padding: 0 }}
            onClick={() => setShowUnused(!showUnused)}
          >
            {showUnused
              ? intl.formatMessage({
                  id: 'clusters.topology.mapping.hideUnused'
                })
              : intl.formatMessage(
                  { id: 'clusters.topology.mapping.showUnused' },
                  { count: unused }
                )}
          </Button>
        </Flex>
      )}
      <div className={styles.chain}>
        {shown.map((row) => (
          <div
            key={row.id}
            className={classNames('rung', { dim: !inUse(row) })}
          >
            <FieldRow
              fieldId={row.id}
              // Both a disabled rung and one nobody filled in are folded away
              // and drawn grey, but they are not the same state: the second
              // comes back the moment a worker grows the label, the first
              // does not. Only one of them needs saying.
              name={
                row.disabled ? (
                  <>
                    {row.label}
                    <span className="row-note">
                      {intl.formatMessage({
                        id: 'clusters.topology.layer.disabled'
                      })}
                    </span>
                  </>
                ) : (
                  row.label
                )
              }
              actions={
                <Dropdown
                  trigger={['click']}
                  menu={{
                    items: rowActions(row),
                    onClick: ({ key }) => {
                      if (key === 'rename') {
                        onRename(row);
                      } else if (key === 'disable') {
                        onToggleDisabled(row);
                      } else if (key === 'delete') {
                        onDelete(row);
                      }
                    }
                  }}
                >
                  <Button
                    type="text"
                    size="small"
                    icon={<MoreOutlined />}
                    aria-label={intl.formatMessage({
                      id: 'common.table.operation'
                    })}
                  />
                </Dropdown>
              }
              keys={row.labelKeys}
              lockedKey={row.primaryKey}
              vocabulary={vocabulary}
              classified={classified[row.id] ?? 0}
              total={total}
              flashing={flashing.has(row.id)}
              dim={!inUse(row)}
              expanded={expanded.has(row.id)}
              onToggle={() => toggle(row.id)}
              onChange={(keys) => onKeysChange(row.id, keys)}
            />
          </div>
        ))}
        <div className="rung">
          <StaticRow
            name={hostLabel}
            count={intl.formatMessage(
              { id: 'clusters.topology.mapping.classified' },
              { classified: total, total }
            )}
          >
            <span className="note">
              {intl.formatMessage({
                id: 'clusters.topology.advanced.hostKeys'
              })}
            </span>
          </StaticRow>
        </div>
      </div>
      {onAddLayer && (
        <Flex>
          <Button
            type="link"
            size="small"
            style={{ padding: 0 }}
            onClick={onAddLayer}
          >
            <PlusOutlined />
            {intl.formatMessage({ id: 'clusters.topology.custom.title' })}
          </Button>
        </Flex>
      )}
      <div className={styles.formula}>
        {rows.map((row) => (
          <span key={row.id}>
            <span className={classNames({ unused: !inUse(row) })}>
              {row.label}
            </span>
            <span className="sup">⊃</span>
          </span>
        ))}
        <span>{hostLabel}</span>
      </div>
    </Flex>
  );
};

export default FieldChain;
