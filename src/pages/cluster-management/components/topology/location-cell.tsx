import {
  CloseOutlined,
  EditOutlined,
  LockOutlined,
  PlusOutlined,
  RiseOutlined
} from '@ant-design/icons';
import { useIntl } from '@umijs/max';
import { Flex, Popconfirm, Select, Spin, Tooltip } from 'antd';
import { createStyles } from 'antd-style';
import classNames from 'classnames';
import { useEffect, useRef, useState } from 'react';
import { TopologyWorker } from '../../config/types';
import {
  LocationField,
  isDiscovered,
  isOverride,
  shownValue
} from './location';

/** The red line under a failed save clears itself after this long. */
const FAILED_VISIBLE_MS = 10_000;

const CLEAR_OPTION = '__clear__';
const CREATE_PREFIX = '__create__:';

export interface ValueOption {
  value: string;
  count: number;
}

const useStyles = createStyles(({ css }) => ({
  cell: css`
    all: unset;
    box-sizing: border-box;
    display: inline-flex;
    align-items: center;
    gap: 6px;
    width: 100%;
    min-height: 28px;
    padding: 2px 8px;
    border-radius: 4px;
    border: 1px solid transparent;
    cursor: pointer;
    color: var(--ant-color-text);
    &:hover,
    &:focus-visible {
      background: var(--ant-color-fill-tertiary);
    }
    &:focus-visible {
      outline: 2px solid var(--ant-color-primary-border);
    }
    &[aria-disabled='true'] {
      cursor: default;
      background: transparent;
    }
    .edit {
      margin-left: auto;
      opacity: 0;
      color: var(--ant-color-text-tertiary);
    }
    &:hover .edit,
    &:focus-visible .edit {
      opacity: 1;
    }
    .value {
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }
    .mark {
      flex-shrink: 0;
      color: var(--ant-color-text-tertiary);
    }
  `,
  /* A dashed frame in the quietest text colour. Not a warning: an unfilled
     rack is a fact about the fleet, and a red cell per new machine would train
     people to stop looking at red. */
  unfilled: css`
    border-style: dashed;
    border-color: var(--ant-color-border);
    color: var(--ant-color-text-quaternary);
  `,
  failed: css`
    font-size: 12px;
    line-height: 16px;
    color: var(--ant-color-error);
  `,
  option: css`
    display: flex;
    justify-content: space-between;
    gap: 12px;
    .count {
      color: var(--ant-color-text-tertiary);
      font-size: 12px;
    }
  `
}));

interface LocationValueSelectProps {
  options: ValueOption[];
  fieldLabel: string;
  /** The value the cell currently holds; offers "clear" when set. */
  current?: string | null;
  /** In-cell: open at once, focused, one pick saves. In a form: a plain Select. */
  inline?: boolean;
  value?: string | null;
  onPick: (value: string | null) => void;
  onCancel?: () => void;
  /** Tab / Shift+Tab with whatever has been typed so far (null = nothing). */
  onTab?: (shift: boolean, typed: string | null) => void;
  onBlur?: (typed: string) => void;
  style?: React.CSSProperties;
  size?: 'small' | 'middle';
}

/**
 * [C2] The values dropdown: existing values ranked by how many workers hold
 * them, "create" for a name never used before, "clear" when there is
 * something to clear. Shared by the in-cell editor and the batch panel so the
 * two never offer different lists.
 */
export const LocationValueSelect: React.FC<LocationValueSelectProps> = ({
  options,
  fieldLabel,
  current,
  inline,
  value,
  onPick,
  onCancel,
  onTab,
  onBlur,
  style,
  size
}) => {
  const intl = useIntl();
  const { styles } = useStyles();
  const [typed, setTyped] = useState('');

  const needle = typed.trim();
  const matching = options.filter(
    (option) =>
      !needle || option.value.toLowerCase().includes(needle.toLowerCase())
  );
  const exists = options.some((option) => option.value === needle);

  const items: any[] = matching.map((option) => ({
    value: option.value,
    label: (
      <span className={styles.option}>
        <span>{option.value}</span>
        <span className="count">
          {intl.formatMessage(
            { id: 'clusters.topology.value.count' },
            { count: option.count }
          )}
        </span>
      </span>
    )
  }));
  if (needle && !exists) {
    items.push({
      value: `${CREATE_PREFIX}${needle}`,
      label: (
        <span>
          <PlusOutlined style={{ marginRight: 6 }} />
          {intl.formatMessage(
            { id: 'clusters.topology.value.create' },
            { value: needle }
          )}
        </span>
      )
    });
  }
  if (current) {
    items.push({
      value: CLEAR_OPTION,
      label: (
        <span className="text-tertiary">
          <CloseOutlined style={{ marginRight: 6 }} />
          {intl.formatMessage({ id: 'clusters.topology.value.clear' })}
        </span>
      )
    });
  }

  const pick = (picked: string) => {
    if (picked === CLEAR_OPTION) {
      onPick(null);
    } else if (picked.startsWith(CREATE_PREFIX)) {
      onPick(picked.slice(CREATE_PREFIX.length));
    } else {
      onPick(picked);
    }
    setTyped('');
  };

  return (
    <Select
      showSearch
      size={size}
      style={{ width: '100%', ...style }}
      autoFocus={inline}
      defaultOpen={inline}
      value={
        inline ? undefined : value === null ? CLEAR_OPTION : value || undefined
      }
      placeholder={intl.formatMessage(
        { id: 'clusters.topology.cell.fill' },
        { field: fieldLabel }
      )}
      searchValue={typed}
      onSearch={setTyped}
      // Filtering is done above, where the "create" row is decided on the same
      // needle; letting the Select filter again would hide that row.
      filterOption={false}
      options={items}
      notFoundContent={null}
      onSelect={(picked: string) => pick(picked)}
      onBlur={() => onBlur?.(needle)}
      onInputKeyDown={(e) => {
        if (e.key === 'Escape') {
          e.stopPropagation();
          onCancel?.();
        } else if (e.key === 'Tab' && onTab) {
          e.preventDefault();
          onTab(e.shiftKey, needle || null);
        }
      }}
    />
  );
};

interface LocationCellProps {
  worker: TopologyWorker;
  field: LocationField;
  options: ValueOption[];
  editing: boolean;
  onStartEdit: () => void;
  onStopEdit: () => void;
  onSave: (value: string | null) => Promise<void>;
  onTab: (shift: boolean) => void;
  onBusy: (busy: boolean) => void;
}

/**
 * [C1] One worker's value for one field, in one of four states: unfilled,
 * hand-filled, reported by the device, or hand-filled over a reported value.
 * The states differ by icon and hover text, never by colour alone.
 *
 * Editing saves on the spot — Enter, a pick, or clicking away with a change —
 * because a value is data, not a rule (P7). A device-reported value asks
 * first: it is usually right, and a mis-click should not silently overwrite
 * what the hardware said.
 */
const LocationCell: React.FC<LocationCellProps> = ({
  worker,
  field,
  options,
  editing,
  onStartEdit,
  onStopEdit,
  onSave,
  onTab,
  onBusy
}) => {
  const intl = useIntl();
  const { styles } = useStyles();
  const location = worker.location?.[field.id];
  const current = location?.value || null;
  const discovered = isDiscovered(location);
  const override = isOverride(location);

  const [confirming, setConfirming] = useState(false);
  const [saving, setSaving] = useState(false);
  const [failed, setFailed] = useState<string | null>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const failedTimer = useRef<any>(null);

  useEffect(() => {
    if (!editing) {
      return;
    }
    onBusy(true);
    return () => onBusy(false);
  }, [editing]);

  useEffect(() => () => clearTimeout(failedTimer.current), []);

  const startEdit = () => {
    clearTimeout(failedTimer.current);
    setFailed(null);
    onStartEdit();
  };

  const commit = async (value: string | null, then?: () => void) => {
    onStopEdit();
    if (value === current) {
      then?.();
      return;
    }
    setSaving(true);
    onBusy(true);
    try {
      await onSave(value);
      then?.();
    } catch (e: any) {
      setFailed(e?.message || String(e));
      // Own the timer here rather than relying on `startEdit` having cleared
      // it: a second failure inheriting the first one's deadline would drop the
      // new message early, and the window is the only thing telling the user
      // the write did not land.
      clearTimeout(failedTimer.current);
      failedTimer.current = setTimeout(
        () => setFailed(null),
        FAILED_VISIBLE_MS
      );
    } finally {
      setSaving(false);
      onBusy(false);
      // Focus stays where the edit happened, so Enter reopens it.
      buttonRef.current?.focus();
    }
  };

  const handleClick = () => {
    if (saving) {
      return;
    }
    if (discovered) {
      setConfirming(true);
      return;
    }
    startEdit();
  };

  const stateLabel = !current
    ? intl.formatMessage({ id: 'clusters.topology.state.unfilled' })
    : discovered
      ? intl.formatMessage(
          { id: 'clusters.topology.state.discovered.aria' },
          { value: shownValue(location) }
        )
      : override
        ? intl.formatMessage(
            { id: 'clusters.topology.state.override.aria' },
            { value: current }
          )
        : current;

  const hover = discovered
    ? intl.formatMessage(
        { id: 'clusters.topology.state.discovered.tips' },
        { key: location?.key || '' }
      )
    : override
      ? intl.formatMessage(
          { id: 'clusters.topology.state.override.tips' },
          { value: location?.discovered_value || '' }
        )
      : current
        ? intl.formatMessage(
            { id: 'clusters.topology.state.user.tips' },
            { key: location?.key || '' }
          )
        : null;

  if (editing) {
    return (
      <LocationValueSelect
        inline
        size="small"
        options={options}
        fieldLabel={field.label}
        current={current}
        onPick={(value) => commit(value)}
        onCancel={onStopEdit}
        onTab={(shift, typed) => {
          // Save what was typed (or nothing) and move on; the table decides
          // which cell "next unfilled" is.
          commit(typed ?? current, () => onTab(shift));
        }}
        onBlur={(typed) => {
          // Spreadsheet rule: a change on blur saves, no change just exits.
          if (typed && typed !== current) {
            commit(typed);
          } else {
            onStopEdit();
          }
        }}
      />
    );
  }

  const button = (
    <button
      ref={buttonRef}
      type="button"
      className={classNames(styles.cell, { [styles.unfilled]: !current })}
      aria-label={intl.formatMessage(
        { id: 'clusters.topology.cell.aria' },
        { field: field.label, state: stateLabel, host: worker.name }
      )}
      aria-disabled={saving}
      onClick={handleClick}
      onKeyDown={(e) => {
        if (e.key === 'Enter') {
          e.preventDefault();
          handleClick();
        }
      }}
    >
      {discovered && <LockOutlined className="mark" />}
      <span className="value">
        {current
          ? shownValue(location)
          : intl.formatMessage(
              { id: 'clusters.topology.cell.fill' },
              { field: field.label }
            )}
      </span>
      {override && <RiseOutlined className="mark" />}
      {saving ? (
        <Spin size="small" style={{ marginLeft: 'auto' }} />
      ) : (
        current && !discovered && <EditOutlined className="edit" />
      )}
    </button>
  );

  return (
    <Flex orientation="vertical" style={{ width: '100%' }}>
      <Popconfirm
        open={confirming}
        title={intl.formatMessage({
          id: 'clusters.topology.override.confirm'
        })}
        okText={intl.formatMessage({ id: 'clusters.topology.override.ok' })}
        cancelText={intl.formatMessage({ id: 'common.button.cancel' })}
        onConfirm={() => {
          setConfirming(false);
          startEdit();
        }}
        onCancel={() => setConfirming(false)}
        onOpenChange={(next) => {
          if (!next) {
            setConfirming(false);
          }
        }}
      >
        {hover ? <Tooltip title={hover}>{button}</Tooltip> : button}
      </Popconfirm>
      {failed && <span className={styles.failed}>{failed}</span>}
    </Flex>
  );
};

export default LocationCell;
