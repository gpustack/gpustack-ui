import { WarningOutlined } from '@ant-design/icons';
import { ModalFooter, Select, useSubmitLock } from '@gpustack/core-ui';
import { useIntl } from '@umijs/max';
import { Button, Flex, Modal, SelectProps, Tooltip } from 'antd';
import { createStyles } from 'antd-style';
import { useRef, useState } from 'react';
import { TopologyWorker } from '../../config/types';
import {
  LocationField,
  isDiscovered,
  valueOptions,
  writableLabelKey
} from './location';
import { LocationValueSelect } from './location-cell';

/** How many conflicting hosts to name before "and N more". */
const NAMED_CONFLICTS = 3;

const useStyles = createStyles(({ css }) => ({
  selected: css`
    color: var(--ant-color-text-tertiary);
    font-weight: 400;
  `,
  form: css`
    min-width: 0;
  `,
  information: css`
    padding: var(--ant-padding-sm);
    border-radius: var(--ant-border-radius-sm);
    background: var(--ant-color-fill-quaternary);
    font-size: var(--ant-font-size-sm);
    line-height: var(--ant-line-height-sm);
    overflow-wrap: anywhere;
  `,
  note: css`
    color: var(--ant-color-text-tertiary);
    font-size: var(--ant-font-size-sm);
    overflow-wrap: anywhere;
  `,
  summary: css`
    color: var(--ant-color-text-secondary);
    overflow-wrap: anywhere;
  `,
  warning: css`
    color: var(--ant-color-warning-text);
  `
}));

const FieldOptionLabel: React.FC<{
  label: React.ReactNode;
  disabled?: boolean;
}> = ({ label, disabled }) => {
  const intl = useIntl();
  return disabled ? (
    <Tooltip
      title={intl.formatMessage({ id: 'clusters.topology.cell.noKeys.tips' })}
    >
      <span>{label}</span>
    </Tooltip>
  ) : (
    label
  );
};

const renderFieldOption: NonNullable<SelectProps['optionRender']> = ({
  data
}) => <FieldOptionLabel label={data.label} disabled={data.disabled} />;

interface SetLocationModalProps {
  open: boolean;
  /** The selection: what the write lands on. */
  targets: TopologyWorker[];
  /** Every worker of the cluster, for the value dropdown's ranking. */
  allWorkers: TopologyWorker[];
  fields: LocationField[];
  defaultField?: string;
  onApply: (field: string, value: string | null) => Promise<void>;
  onCancel: () => void;
  onManageLayers?: () => void;
}

/**
 * [S3] One field, one value, N workers.
 *
 * The conflicts are spelled out above the button instead of behind a
 * confirmation: "this will overwrite node-5 (R2)" read before clicking is a
 * decision; the same sentence in a Popconfirm after clicking is a speed bump,
 * and a batch already went through one click to get here.
 */
export const SetLocationModal: React.FC<SetLocationModalProps> = ({
  open,
  targets,
  allWorkers,
  fields,
  defaultField,
  onApply,
  onCancel,
  onManageLayers
}) => {
  const intl = useIntl();
  const { styles } = useStyles();
  const { loading: applying, guard, run } = useSubmitLock();
  const interactionRef = useRef(false);
  const initialSelection = () => ({
    field:
      fields.find((item) => item.id === defaultField && writableLabelKey(item))
        ?.id || fields.find((item) => writableLabelKey(item))?.id
  });
  const [{ field, value }, setSelection] = useState<{
    field?: string;
    /** undefined: nothing picked yet; null: remove the writing label. */
    value?: string | null;
  }>(initialSelection);
  const current = fields.find((f) => f.id === field);
  const writeKey = current ? writableLabelKey(current) : null;
  const hasWritableLayers = fields.some((item) => writableLabelKey(item));
  const options = field ? valueOptions(allWorkers, field) : [];
  const writing = value !== undefined && value !== null;
  const overwritten =
    field && writing
      ? targets.filter((worker) => {
          const location = worker.location?.[field];
          return (
            !!location?.value &&
            location.source === 'user' &&
            location.value !== value
          );
        })
      : [];
  const autoOverwritten =
    field && writing
      ? targets.filter((worker) => {
          const location = worker.location?.[field];
          return isDiscovered(location) && location?.value !== value;
        })
      : [];
  const clearable = writeKey
    ? targets.filter((worker) => worker.labels?.[writeKey] !== undefined)
    : [];

  const conflictNames = (list: TopologyWorker[]) => {
    const named = list
      .slice(0, NAMED_CONFLICTS)
      .map((worker) => {
        const before =
          value === null && writeKey
            ? worker.labels?.[writeKey]
            : worker.location?.[field!]?.value;
        return before ? `${worker.name}（${before}）` : worker.name;
      })
      .join('、');
    const more = list.length - NAMED_CONFLICTS;
    return more > 0
      ? intl.formatMessage(
          { id: 'clusters.topology.batch.more' },
          { names: named, count: more }
        )
      : named;
  };

  const handleApply = async () => {
    if (!current || !writeKey || value === undefined || !targets.length) {
      return;
    }
    let pending: Promise<void> | undefined;
    guard(() => {
      pending = run(() => onApply(current.id, value));
    });
    await pending;
  };
  const handleCancel = () => {
    if (!applying) onCancel();
  };
  const resetSelection = () => setSelection(initialSelection());

  // Flat, in chain order. It was briefly grouped under «层级» / «加速器域»,
  // because two chains could each carry a rung called something like «机柜» and
  // the list gave no way to tell which one a value was about. One chain, one
  // list: chain order alone says where a field sits.
  const fieldOptions = fields.map((item) => ({
    value: item.id,
    label: writableLabelKey(item)
      ? item.label
      : `${item.label}（${intl.formatMessage({ id: 'clusters.topology.mapping.noKeys' })}）`,
    disabled: !writableLabelKey(item)
  }));
  const hasImpact =
    Boolean(current && writeKey && value !== undefined && targets.length > 0) ||
    value === null ||
    overwritten.length > 0 ||
    autoOverwritten.length > 0;

  return (
    <Modal
      title={
        <Flex component="span" align="baseline" gap="small" wrap>
          <span>
            {intl.formatMessage({ id: 'clusters.topology.batch.title' })}
          </span>
          <span className={styles.selected}>
            {intl.formatMessage(
              { id: 'clusters.topology.batch.selected' },
              { count: targets.length }
            )}
          </span>
        </Flex>
      }
      open={open}
      onCancel={handleCancel}
      width={520}
      maskClosable={false}
      keyboard={false}
      destroyOnHidden
      closable={!applying}
      afterOpenChange={(nextOpen) => {
        if (nextOpen && !interactionRef.current) resetSelection();
      }}
      afterClose={() => {
        interactionRef.current = false;
        resetSelection();
      }}
      styles={{
        header: { marginBottom: 20 },
        footer: { marginTop: 'var(--ant-margin-lg)' }
      }}
      footer={
        <ModalFooter
          onOk={handleApply}
          onCancel={handleCancel}
          loading={applying}
          okText={intl.formatMessage(
            { id: 'clusters.topology.batch.apply' },
            { count: targets.length }
          )}
          okBtnProps={{
            disabled:
              applying || !writeKey || value === undefined || !targets.length,
            style: { width: 'auto', minWidth: 88 }
          }}
          cancelBtnProps={{ disabled: applying }}
          style={{ padding: '0 0 var(--ant-padding-xs)' }}
        />
      }
    >
      <Flex orientation="vertical" gap="middle">
        <Flex orientation="vertical" gap="middle" className={styles.form}>
          <Flex orientation="vertical" gap="small">
            <Select
              style={{ width: '100%' }}
              label={intl.formatMessage({
                id: 'clusters.topology.batch.field'
              })}
              isInFormItems={false}
              value={field}
              aria-label={intl.formatMessage({
                id: 'clusters.topology.batch.field'
              })}
              options={fieldOptions}
              disabled={applying || !targets.length}
              optionRender={renderFieldOption}
              onChange={(next) => {
                if (
                  !applying &&
                  fields.some(
                    (item) => item.id === next && writableLabelKey(item)
                  )
                ) {
                  interactionRef.current = true;
                  setSelection({ field: next });
                }
              }}
            />
            {writeKey && (
              <span className={styles.note}>
                {intl.formatMessage(
                  { id: 'clusters.topology.batch.labelKey' },
                  { key: writeKey }
                )}
              </span>
            )}
          </Flex>
          {writeKey && (
            <LocationValueSelect
              key={field}
              label={intl.formatMessage({
                id: 'clusters.topology.batch.value'
              })}
              options={options}
              fieldLabel={current?.label || ''}
              current={clearable.length ? '·' : null}
              value={value}
              disabled={applying || !targets.length}
              placeholder={intl.formatMessage({
                id: 'clusters.topology.batch.value.placeholder'
              })}
              onPick={(next) => {
                if (!applying) {
                  interactionRef.current = true;
                  setSelection({ field, value: next });
                }
              }}
              onClear={() => {
                if (!applying) {
                  interactionRef.current = true;
                  setSelection({ field });
                }
              }}
            />
          )}
          {!hasWritableLayers && (
            <Flex
              orientation="vertical"
              gap="var(--ant-margin-xxs)"
              align="flex-start"
            >
              <span className={styles.note}>
                {intl.formatMessage({
                  id: 'clusters.topology.batch.noWritableLayers'
                })}
              </span>
              {onManageLayers && (
                <Button
                  type="link"
                  size="small"
                  disabled={applying}
                  style={{ padding: 0 }}
                  onClick={onManageLayers}
                >
                  {intl.formatMessage({
                    id: 'clusters.topology.mapping.title'
                  })}
                </Button>
              )}
            </Flex>
          )}
        </Flex>
        {hasImpact && (
          <Flex
            orientation="vertical"
            gap="small"
            className={styles.information}
          >
            {current &&
              writeKey &&
              value !== undefined &&
              targets.length > 0 && (
                <span className={styles.summary}>
                  {intl.formatMessage(
                    {
                      id:
                        value === null
                          ? 'clusters.topology.batch.clearSummary'
                          : 'clusters.topology.batch.summary'
                    },
                    {
                      count: targets.length,
                      field: current.label,
                      value: value ?? ''
                    }
                  )}
                </span>
              )}
            {value === null && clearable.length > 0 && (
              <span className={styles.summary}>
                {intl.formatMessage(
                  { id: 'clusters.topology.batch.clearExisting' },
                  {
                    count: clearable.length,
                    names: conflictNames(clearable)
                  }
                )}
              </span>
            )}
            {value === null && (
              <span className={styles.note}>
                {intl.formatMessage({
                  id: 'clusters.topology.batch.clearHint'
                })}
              </span>
            )}
            {overwritten.length > 0 && (
              <Flex gap="small" align="baseline" className={styles.warning}>
                <WarningOutlined />
                <span>
                  {intl.formatMessage(
                    { id: 'clusters.topology.batch.overwrite' },
                    {
                      count: overwritten.length,
                      names: conflictNames(overwritten)
                    }
                  )}
                </span>
              </Flex>
            )}
            {autoOverwritten.length > 0 && (
              <Flex gap="small" align="baseline" className={styles.warning}>
                <WarningOutlined />
                <span>
                  {intl.formatMessage(
                    { id: 'clusters.topology.batch.overwriteAuto' },
                    {
                      count: autoOverwritten.length,
                      field: current?.label || ''
                    }
                  )}
                </span>
              </Flex>
            )}
          </Flex>
        )}
      </Flex>
    </Modal>
  );
};
