import {
  CloseOutlined,
  EditOutlined,
  LockOutlined,
  PlusOutlined,
  RiseOutlined
} from '@ant-design/icons';
import { BaseSelect, IconFont, Select } from '@gpustack/core-ui';
import { useIntl } from '@umijs/max';
import { Flex, Popconfirm, Spin, Tooltip } from 'antd';
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

interface SelectValueOption {
  value: string;
  label: string;
  count?: number;
  action?: 'create' | 'clear';
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
    &.static {
      cursor: default;
      color: var(--ant-color-text-tertiary);
      &:hover {
        background: transparent;
      }
    }
    .action {
      position: relative;
      margin-inline-start: auto;
      flex-shrink: 0;
      color: var(--ant-color-text-tertiary);
    }
    .edit {
      opacity: 0;
    }
    .empty-state {
      position: absolute;
      inset: 0;
    }
    &:hover .edit,
    &:focus-visible .edit {
      opacity: 1;
    }
    &:hover .empty-state,
    &:focus-visible .empty-state {
      opacity: 0;
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
  unfilled: css`
    color: var(--ant-color-text-tertiary);
    &:hover {
      border-style: dashed;
      border-color: var(--ant-color-border);
    }
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
  /** Reset a form draft without requesting removal of the worker label. */
  onClear?: () => void;
  onCancel?: () => void;
  /** Tab / Shift+Tab with whatever has been typed so far (null = nothing). */
  onTab?: (shift: boolean, typed: string | null) => void;
  onBlur?: (typed: string) => void;
  style?: React.CSSProperties;
  size?: 'small' | 'middle';
  label?: string;
  disabled?: boolean;
  placeholder?: string;
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
  onClear,
  onCancel,
  onTab,
  onBlur,
  style,
  size,
  label,
  disabled,
  placeholder
}) => {
  const intl = useIntl();
  const { styles } = useStyles();
  const [typed, setTyped] = useState('');

  const needle = typed.trim();
  const search = needle.toLowerCase();
  const matching = options.filter(
    (option) => !needle || option.value.toLowerCase().includes(search)
  );
  const exists = options.some((option) => option.value === needle);
  const clearLabel = intl.formatMessage({
    id: 'clusters.topology.value.clear'
  });

  // Core-UI clones options before translating them. Keep React elements out
  // of that data so typing never copies their owning component tree.
  const items: SelectValueOption[] = matching.map((option) => ({
    value: option.value,
    label: option.value,
    count: option.count
  }));
  if (needle && !exists) {
    items.push({
      value: `${CREATE_PREFIX}${needle}`,
      label: intl.formatMessage(
        { id: 'clusters.topology.value.create' },
        { value: needle }
      ),
      action: 'create'
    });
  }
  if (current) {
    items.push({
      value: CLEAR_OPTION,
      label: clearLabel,
      action: 'clear'
    });
  }

  const renderOption = (option: SelectValueOption) => {
    if (option.action === 'create') {
      return (
        <span>
          <PlusOutlined style={{ marginRight: 6 }} />
          {option.label}
        </span>
      );
    }
    if (option.action === 'clear') {
      return (
        <span className="text-tertiary">
          <CloseOutlined style={{ marginRight: 6 }} />
          {option.label}
        </span>
      );
    }
    return (
      <span className={styles.option}>
        <span>{option.label}</span>
        <span className="count">
          {intl.formatMessage(
            { id: 'clusters.topology.value.count' },
            { count: option.count }
          )}
        </span>
      </span>
    );
  };

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
  const SelectControl = label ? Select : BaseSelect;

  return (
    <SelectControl
      {...(label && {
        label,
        'aria-label': label,
        isInFormItems: false,
        alwaysFocus: true
      })}
      showSearch
      allowClear={Boolean(onClear)}
      size={size}
      disabled={disabled}
      style={{ width: '100%', ...style }}
      autoFocus={inline}
      defaultOpen={inline}
      value={
        inline
          ? current || undefined
          : value === null
            ? CLEAR_OPTION
            : value || undefined
      }
      optionLabelProp={inline ? 'value' : undefined}
      placeholder={
        placeholder ||
        intl.formatMessage(
          { id: 'clusters.topology.cell.fill' },
          { field: fieldLabel }
        )
      }
      searchValue={typed}
      onSearch={setTyped}
      // Filtering is done above, where the "create" row is decided on the same
      // needle; letting the Select filter again would hide that row.
      filterOption={false}
      options={items}
      optionRender={({ data }) => renderOption(data as SelectValueOption)}
      labelRender={
        inline
          ? undefined
          : (selected) => {
              if (selected.value === CLEAR_OPTION) {
                return renderOption({
                  value: CLEAR_OPTION,
                  label: clearLabel,
                  action: 'clear'
                });
              }
              const option = options.find(
                (item) => item.value === selected.value
              );
              return option
                ? renderOption({ ...option, label: option.value })
                : selected.label;
            }
      }
      notFoundContent={intl.formatMessage({
        id: 'clusters.topology.value.empty'
      })}
      onSelect={(picked: string) => pick(picked)}
      onClear={() => {
        setTyped('');
        onClear?.();
      }}
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
 * [C1] One worker's value for one field: missing label keys, missing worker
 * labels, hand-filled, reported by the device, or a hand-filled override.
 * Disabled layers and layers without candidate keys are read-only.
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
  const hasLabelKeys = field.labelKeys.length > 0;
  const editable = hasLabelKeys && !field.disabled;
  const emptyLabel = intl.formatMessage({
    id: 'clusters.topology.cell.unfilled'
  });

  const [confirming, setConfirming] = useState(false);
  const [saving, setSaving] = useState(false);
  const [failed, setFailed] = useState<string | null>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const failedTimer = useRef<any>(null);

  useEffect(() => {
    if (!editing || !editable) {
      return;
    }
    onBusy(true);
    return () => onBusy(false);
  }, [editing, editable]);

  useEffect(() => () => clearTimeout(failedTimer.current), []);

  if (!hasLabelKeys) {
    return (
      <Tooltip
        title={intl.formatMessage({ id: 'clusters.topology.cell.noKeys.tips' })}
      >
        <span className={classNames(styles.cell, 'static')}>
          <span className="value">
            {intl.formatMessage({ id: 'clusters.topology.mapping.noKeys' })}
          </span>
          <IconFont type="icon-label_thin" className="action" aria-hidden />
        </span>
      </Tooltip>
    );
  }

  const startEdit = () => {
    clearTimeout(failedTimer.current);
    setFailed(null);
    onStartEdit();
  };

  const commit = async (value: string | null, then?: () => void) => {
    if (!editable) {
      return;
    }
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
    if (!editable || saving) {
      return;
    }
    if (discovered) {
      setConfirming(true);
      return;
    }
    startEdit();
  };

  const stateLabel = !current
    ? emptyLabel
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

  const hover = !current
    ? null
    : discovered
      ? intl.formatMessage(
          { id: 'clusters.topology.state.discovered.tips' },
          { key: location?.key || '' }
        )
      : override
        ? intl.formatMessage(
            { id: 'clusters.topology.state.override.tips' },
            { value: location?.discovered_value || '' }
          )
        : intl.formatMessage(
            { id: 'clusters.topology.state.user.tips' },
            { key: location?.key || '' }
          );

  if (!editable) {
    return (
      <Tooltip title={hover}>
        <span
          className={classNames(styles.cell, { static: !current })}
          aria-disabled
        >
          {discovered && <LockOutlined className="mark" />}
          <span className="value">
            {current ? shownValue(location) : emptyLabel}
          </span>
          {override && <RiseOutlined className="mark" />}
        </span>
      </Tooltip>
    );
  }

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
        {current ? shownValue(location) : emptyLabel}
      </span>
      {override && <RiseOutlined className="mark" />}
      {saving ? (
        <Spin size="small" style={{ marginLeft: 'auto' }} />
      ) : (
        !discovered && (
          <Flex
            component="span"
            align="center"
            justify="center"
            className="action"
            aria-hidden
          >
            {!current && (
              <IconFont type="icon-tag-outlined" className="empty-state" />
            )}
            <EditOutlined className="edit" />
          </Flex>
        )
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
