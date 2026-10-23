import {
  ExclamationCircleOutlined,
  MoreOutlined,
  PlusOutlined
} from '@ant-design/icons';
import { IconFont, ThemeTag } from '@gpustack/core-ui';
import { useIntl } from '@umijs/max';
import { Button, Dropdown, Flex, Tooltip } from 'antd';
import { createStyles } from 'antd-style';
import classNames from 'classnames';
import { useState } from 'react';
import { DraftLayer } from './draft';
import InsertLayerInput from './insert-layer-input';
import { CUSTOM_FIELD, KeyVocabulary } from './key-editor';
import KeyList from './key-list';

const useStyles = createStyles(({ css }) => ({
  row: css`
    position: relative;
    isolation: isolate;
    &::before {
      content: '';
      position: absolute;
      inset: 0 0 0 32px;
      z-index: -1;
      border: 1px solid var(--ant-color-border);
      border-radius: var(--ant-border-radius-lg);
      background: var(--ant-color-bg-container);
      pointer-events: none;
    }
    .head {
      min-height: 48px;
      padding: var(--ant-padding-xs) var(--ant-padding-sm);
      padding-inline-start: 0;
      border-radius: var(--ant-border-radius-lg);
      cursor: pointer;
      position: relative;
      isolation: isolate;
      &::before {
        content: '';
        position: absolute;
        inset: 1px 1px 1px 33px;
        z-index: -1;
        border-radius: inherit;
        pointer-events: none;
      }
      &:hover::before,
      &[aria-expanded='true']::before {
        background: var(--ant-color-fill-tertiary);
      }
      &[aria-expanded='true']::before {
        border-end-start-radius: 0;
        border-end-end-radius: 0;
      }
      &:focus-visible {
        outline: 2px solid var(--ant-color-primary);
        outline-offset: 2px;
      }
      &.static {
        cursor: default;
      }
    }
    .identity {
      flex-shrink: 0;
      min-width: 0;
    }
    .sequence {
      position: relative;
      z-index: 1;
      width: 20px;
      height: 20px;
      flex-shrink: 0;
      border-radius: 50%;
      background: var(--ant-color-fill-content);
      color: var(--ant-color-text-secondary);
      font-size: var(--ant-font-size-sm);
      font-variant-numeric: tabular-nums;
    }
    .sequence-icon {
      position: absolute;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      font-size: inherit;
      opacity: 0;
      pointer-events: none;
    }
    &:hover {
      .sequence-number {
        visibility: hidden;
      }
      .sequence-icon {
        opacity: 1;
      }
    }
    .name {
      width: 220px;
      flex-shrink: 0;
      min-width: 0;
      overflow-wrap: anywhere;
      font-weight: 400;
    }
    .row-note {
      margin-inline-start: 6px;
      font-size: var(--ant-font-size-sm);
      font-weight: 400;
      color: var(--ant-color-text-tertiary);
      white-space: nowrap;
    }
    .summary {
      flex: 1;
      min-width: 0;
    }
    .key {
      min-width: 0;
      max-width: 100%;
    }
    .key-text {
      min-width: 0;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }
    .no-keys {
      font-size: var(--ant-font-size-sm);
      color: var(--ant-color-warning-text);
    }
    .note {
      color: var(--ant-color-text-tertiary);
      font-size: var(--ant-font-size-sm);
    }
    .metrics {
      flex-shrink: 0;
      margin-inline-start: auto;
    }
    .count {
      font-size: var(--ant-font-size-sm);
      color: var(--ant-color-text-tertiary);
      font-variant-numeric: tabular-nums;
      white-space: nowrap;
      .classified {
        color: var(--ant-color-text);
        font-weight: 500;
      }
      &.flash {
        animation: topology-count-flash 1s ease-out;
      }
    }
    .row-actions {
      width: 24px;
      flex-shrink: 0;
    }
    .body {
      margin: 0 1px 1px 33px;
      padding: var(--ant-padding-sm);
      border-top: 1px solid var(--ant-color-border);
    }
    .keys-title {
      font-size: var(--ant-font-size-sm);
      color: var(--ant-color-text-tertiary);
    }
    @keyframes topology-count-flash {
      0% {
        color: var(--ant-color-success);
      }
      100% {
        color: inherit;
      }
    }
    @media (max-width: 600px) {
      .head {
        flex-wrap: wrap;
      }
      .identity {
        flex: 1;
        width: auto;
      }
      .name {
        width: auto;
        flex: 1;
      }
      .summary {
        order: 1;
        flex-basis: 100%;
        margin-inline-start: 44px;
      }
    }
  `,
  chain: css`
    position: relative;
    .rung {
      position: relative;
      &::before {
        content: '';
        position: absolute;
        left: 9.5px;
        top: 34px;
        bottom: -14px;
        border-left: 1px dashed var(--ant-color-border);
      }
    }
    .insert-slot {
      position: relative;
      height: 20px;
      z-index: 2;
      &::before {
        content: '';
        position: absolute;
        inset-inline: 32px 12px;
        top: 50%;
        border-top: 1px dashed var(--ant-color-border);
        opacity: 0;
      }
      .insert-button {
        opacity: 0;
        pointer-events: none;
        height: 24px;
        padding-inline: var(--ant-padding-xs);
        border: 1px solid var(--ant-color-border);
        border-radius: 12px;
        background: var(--ant-color-bg-container);
        color: var(--ant-color-text-secondary);
        font-size: var(--ant-font-size-sm);
        &:not(:disabled):hover,
        &:not(:disabled):active {
          border-color: var(--ant-color-border);
          background: var(--ant-color-fill-quaternary);
          color: var(--ant-color-text);
        }
      }
    }
    .rung:hover > .insert-slot,
    .insert-slot:hover,
    .insert-slot:has(.insert-button:focus-visible) {
      &::before {
        opacity: 1;
      }
      .insert-button {
        opacity: 1;
        pointer-events: auto;
      }
    }
    .insert-slot.editing {
      height: auto;
      padding: var(--ant-padding-xs) 0 var(--ant-padding-xs) 32px;
      &::before {
        content: none;
      }
    }
    @media (hover: none) {
      .insert-slot::before,
      .insert-slot .insert-button {
        opacity: 1;
        pointer-events: auto;
      }
    }
    @media (max-width: 600px) {
      .rung::before {
        top: 29px;
        bottom: -9px;
      }
    }
  `
}));

interface FieldRowProps {
  sequence: number;
  row: DraftLayer;
  actions: React.ReactNode;
  vocabulary: KeyVocabulary;
  classified: number;
  total: number;
  flashing: boolean;
  expanded: boolean;
  editing: boolean;
  onToggle: () => void;
  onEditingChange: (editing: boolean) => void;
  onChange: (keys: string[]) => void;
}

const FieldRow: React.FC<FieldRowProps> = ({
  sequence,
  row,
  actions,
  vocabulary,
  classified,
  total,
  flashing,
  expanded,
  editing,
  onToggle,
  onEditingChange,
  onChange
}) => {
  const intl = useIntl();
  const { styles } = useStyles();
  const primary =
    (row.builtin ? row.primaryKey : null) || row.labelKeys[0] || null;
  return (
    <div className={styles.row}>
      <Flex
        align="center"
        gap={12}
        className="head"
        role="button"
        tabIndex={0}
        aria-expanded={expanded}
        onClick={onToggle}
        onKeyDown={(e) => {
          if (
            e.target === e.currentTarget &&
            (e.key === 'Enter' || e.key === ' ')
          ) {
            e.preventDefault();
            onToggle();
          }
        }}
      >
        <Flex align="center" gap={24} className="identity">
          <Flex align="center" justify="center" className="sequence">
            <span className="sequence-number">{sequence}</span>
            <IconFont type="icon-down" className="sequence-icon" aria-hidden />
          </Flex>
          <span className="name">
            {row.label}
            {row.builtin && (
              <span className="row-note">
                {intl.formatMessage({ id: 'clusters.topology.layer.builtin' })}
              </span>
            )}
            {row.disabled && (
              <span className="row-note">
                {intl.formatMessage({ id: 'clusters.topology.layer.disabled' })}
              </span>
            )}
          </span>
        </Flex>
        <Flex align="center" gap={8} wrap className="summary">
          {primary ? (
            <Tooltip title={primary}>
              <ThemeTag className="key" opacity={1}>
                <span className="key-text">{primary}</span>
              </ThemeTag>
            </Tooltip>
          ) : (
            <Flex align="center" gap={4} className="no-keys">
              <ExclamationCircleOutlined />
              <span>
                {intl.formatMessage({
                  id: 'clusters.topology.mapping.noKeys.add'
                })}
              </span>
            </Flex>
          )}
        </Flex>
        <Flex align="center" gap={16} className="metrics">
          <span className={classNames('count', { flash: flashing })}>
            {intl.formatMessage(
              { id: 'clusters.topology.mapping.classified' },
              {
                classified: <span className="classified">{classified}</span>,
                total
              }
            )}
          </span>
          <span
            className="row-actions"
            onClick={(e) => e.stopPropagation()}
            role="presentation"
          >
            {actions}
          </span>
        </Flex>
      </Flex>
      {expanded && (
        <Flex orientation="vertical" gap={8} className="body">
          <span className="keys-title">
            {intl.formatMessage({
              id: 'clusters.topology.mapping.keysPriority'
            })}
          </span>
          <KeyList
            keys={row.labelKeys}
            lockedKey={row.builtin ? row.primaryKey : null}
            fieldId={row.builtin ? row.name : CUSTOM_FIELD}
            vocabulary={vocabulary}
            editing={editing}
            onEditingChange={onEditingChange}
            onChange={onChange}
          />
        </Flex>
      )}
    </div>
  );
};

interface FieldChainProps {
  rows: DraftLayer[];
  total: number;
  classified: Record<string, number>;
  flashing: Set<string>;
  vocabulary: KeyVocabulary;
  reserved: string[];
  /** Stages a layer and returns its id so its candidate-key editor can open. */
  onAddLayer: (name: string, index: number) => string | undefined;
  onKeysChange: (id: string, keys: string[]) => void;
  onRename: (row: DraftLayer) => void;
  onToggleDisabled: (row: DraftLayer) => void;
  onDelete: (row: DraftLayer) => void;
}

/** The complete hierarchy, root to host. New layers are entered in the chain. */
const FieldChain: React.FC<FieldChainProps> = ({
  rows,
  total,
  classified,
  flashing,
  vocabulary,
  reserved,
  onAddLayer,
  onKeysChange,
  onRename,
  onToggleDisabled,
  onDelete
}) => {
  const intl = useIntl();
  const { styles } = useStyles();
  const [{ expanded, editing }, setPanels] = useState(() => ({
    expanded: new Set<string>(),
    editing: new Set<string>()
  }));
  // Stable neighbour identity keeps the slot correct if another row is removed.
  const [insertingAfter, setInsertingAfter] = useState<string | null>(null);
  const hostLabel = intl.formatMessage({ id: 'clusters.topology.field.host' });
  const taken = [...reserved, ...rows.flatMap((row) => [row.name, row.label])];
  const toggle = (row: DraftLayer) => {
    setPanels((current) => {
      const expanded = new Set(current.expanded);
      const editing = new Set(current.editing);
      if (expanded.has(row.id)) {
        expanded.delete(row.id);
        editing.delete(row.id);
      } else {
        expanded.add(row.id);
        if (!row.labelKeys.length) editing.add(row.id);
      }
      return { expanded, editing };
    });
  };
  const openKeyEditor = (id: string) => {
    setPanels((current) => ({
      expanded: new Set([...current.expanded, id]),
      editing: new Set([...current.editing, id])
    }));
  };
  const changeEditing = (id: string, value: boolean) => {
    setPanels((current) => {
      const editing = new Set(current.editing);
      if (value) editing.add(id);
      else editing.delete(id);
      return { ...current, editing };
    });
  };
  const rowActions = (row: DraftLayer) => [
    {
      key: 'addKey',
      label: intl.formatMessage({ id: 'clusters.topology.layer.addKey' })
    },
    {
      key: 'insert',
      label: intl.formatMessage({ id: 'clusters.topology.layer.insert' })
    },
    { type: 'divider' as const },
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
  const insertionSlot = (afterId: string) => {
    const editing = insertingAfter === afterId;
    return (
      <Flex
        align="center"
        justify="center"
        className={classNames('insert-slot', { editing })}
      >
        {editing ? (
          <InsertLayerInput
            taken={taken}
            onCancel={() => setInsertingAfter(null)}
            onConfirm={(name) => {
              const index = rows.findIndex((row) => row.id === afterId) + 1;
              const id = onAddLayer(name, index);
              if (id) {
                openKeyEditor(id);
                setInsertingAfter(null);
              }
            }}
          />
        ) : (
          <Button
            className="insert-button"
            icon={<PlusOutlined />}
            onClick={() => setInsertingAfter(afterId)}
          >
            {intl.formatMessage({ id: 'clusters.topology.custom.insertHere' })}
          </Button>
        )}
      </Flex>
    );
  };
  return (
    <Flex orientation="vertical" gap={8}>
      <div className={styles.chain}>
        {rows.map((row, index) => (
          <div key={row.id} className="rung">
            <FieldRow
              sequence={index + 1}
              row={row}
              actions={
                <Dropdown
                  trigger={['click']}
                  menu={{
                    items: rowActions(row),
                    onClick: ({ key }) => {
                      if (key === 'addKey') openKeyEditor(row.id);
                      else if (key === 'insert') setInsertingAfter(row.id);
                      else if (key === 'rename') onRename(row);
                      else if (key === 'disable') onToggleDisabled(row);
                      else if (key === 'delete') onDelete(row);
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
              vocabulary={vocabulary}
              classified={classified[row.id] ?? 0}
              total={total}
              flashing={flashing.has(row.id)}
              expanded={expanded.has(row.id)}
              editing={editing.has(row.id)}
              onToggle={() => toggle(row)}
              onEditingChange={(value) => changeEditing(row.id, value)}
              onChange={(keys) => onKeysChange(row.id, keys)}
            />
            {!expanded.has(row.id) || insertingAfter === row.id ? (
              insertionSlot(row.id)
            ) : (
              <div style={{ height: 20 }} />
            )}
          </div>
        ))}
        <div className={styles.row}>
          <Flex align="center" gap={12} className="head static">
            <Flex align="center" gap={24} className="identity">
              <Flex align="center" justify="center" className="sequence">
                {rows.length + 1}
              </Flex>
              <span className="name">
                {hostLabel}
                <span className="row-note">
                  {intl.formatMessage({
                    id: 'clusters.topology.layer.builtin'
                  })}
                </span>
              </span>
            </Flex>
            <span className="summary note">
              {intl.formatMessage({
                id: 'clusters.topology.advanced.hostKeys'
              })}
            </span>
            <Flex align="center" gap={16} className="metrics">
              <span className="count">
                {intl.formatMessage(
                  { id: 'clusters.topology.mapping.classified' },
                  {
                    classified: <span className="classified">{total}</span>,
                    total
                  }
                )}
              </span>
              <span className="row-actions" />
            </Flex>
          </Flex>
        </div>
      </div>
    </Flex>
  );
};
export default FieldChain;
