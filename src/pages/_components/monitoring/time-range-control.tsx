import { QUICK_TIME_RANGES } from '@/pages/llmodels/detail/config';
import type {
  MonitoringCapabilities,
  MonitoringScope
} from '@/pages/llmodels/detail/config/types';
import {
  durationLabel,
  isFixedTimeRange,
  monitoringCapabilities,
  scopeTimeLabel,
  validateTimeRange
} from '@/pages/llmodels/detail/utils/time-range';
import { CalendarOutlined } from '@ant-design/icons';
import { BaseSelect } from '@gpustack/core-ui';
import { useIntl } from '@umijs/max';
import { Button, DatePicker, Flex, Modal, Tooltip, Typography } from 'antd';
import dayjs, { type Dayjs } from 'dayjs';
import { useId, useState } from 'react';

export interface TimeRangeControlProps {
  scope: Pick<MonitoringScope, 'window' | 'start' | 'end'>;
  changeScope: (
    patch: Partial<Pick<MonitoringScope, 'window' | 'start' | 'end'>>
  ) => void;
  capabilities?: { data: MonitoringCapabilities | null; stale: boolean };
  historyNote?: string;
}
const TimeRangeControl = ({
  scope,
  changeScope,
  capabilities,
  historyNote
}: TimeRangeControlProps) => {
  const intl = useIntl();
  const fieldId = useId();
  const limits = monitoringCapabilities(capabilities?.data);
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState<[Dayjs | null, Dayjs | null] | null>(null);
  const t = (key: string, values?: Record<string, string | number>) =>
    intl.formatMessage({ id: `modelMonitoring.${key}` }, values);
  const durationValues = {
    minimum: durationLabel(limits.min_query_seconds),
    maximum: durationLabel(limits.max_query_seconds)
  };
  const error = open
    ? validateTimeRange(draft?.[0]?.unix(), draft?.[1]?.unix(), limits)
    : null;
  const fixed = isFixedTimeRange(scope);
  const retention =
    limits.retention_seconds != null
      ? t('retentionConfiguredTime', {
          duration: durationLabel(limits.retention_seconds)
        })
      : t('retentionUnknown');
  const openCustom = () => {
    if (!limits.supports_custom_range) return;
    const now = dayjs().startOf('second');
    const seconds =
      QUICK_TIME_RANGES.find(([value]) => value === scope.window)?.[1] || 3600;
    setDraft(
      fixed
        ? [dayjs(scope.start! * 1000), dayjs(scope.end! * 1000)]
        : [
            now.subtract(Math.min(limits.max_query_seconds, seconds), 'second'),
            now
          ]
    );
    setOpen(true);
  };
  const apply = () => {
    const start = draft?.[0]?.unix(),
      end = draft?.[1]?.unix();
    if (validateTimeRange(start, end, limits)) return;
    changeScope({ start: start!, end: end! });
    setOpen(false);
  };
  return (
    <Flex vertical gap={4} style={{ minWidth: 240, maxWidth: 460 }}>
      <Flex gap={8} align="center">
        <label
          htmlFor={fieldId}
          style={{
            color: 'var(--ant-color-text-secondary)',
            whiteSpace: 'nowrap'
          }}
        >
          {t('window')}
        </label>
        <BaseSelect
          id={fieldId}
          aria-label={t('window')}
          value={fixed ? 'custom' : scope.window}
          style={{ minWidth: 140 }}
          options={[
            ...QUICK_TIME_RANGES.map(([value, seconds]) => ({
              value,
              label: value,
              disabled:
                seconds < limits.min_query_seconds ||
                seconds > limits.max_query_seconds
            })),
            {
              value: 'custom',
              label: t('customTimeRange'),
              disabled: !limits.supports_custom_range
            }
          ]}
          onChange={(value: string) =>
            value === 'custom' ? openCustom() : changeScope({ window: value })
          }
        />
        <Tooltip
          title={
            !limits.supports_custom_range
              ? t('customRangeRequiresBackend')
              : t('customTimeRange')
          }
        >
          <Button
            icon={<CalendarOutlined />}
            aria-label={t('customTimeRange')}
            disabled={!limits.supports_custom_range}
            onClick={openCustom}
          />
        </Tooltip>
      </Flex>
      {fixed && (
        <Typography.Text type="secondary" style={{ fontSize: 12 }}>
          {scopeTimeLabel(scope)}
        </Typography.Text>
      )}
      <Modal
        title={t('customTimeRange')}
        open={open}
        onCancel={() => setOpen(false)}
        onOk={apply}
        okText={t('applyTimeRange')}
        okButtonProps={{ disabled: !!error || !limits.supports_custom_range }}
        destroyOnHidden
        width={600}
      >
        <Flex vertical gap={12}>
          <DatePicker.RangePicker
            aria-label={t('customTimeRange')}
            showTime={{ format: 'HH:mm:ss' }}
            needConfirm={false}
            format="YYYY-MM-DD HH:mm:ss"
            placeholder={[t('rangeStart'), t('rangeEnd')]}
            value={draft}
            allowClear={false}
            onChange={(value) => setDraft(value)}
            disabledDate={(date) => date.isAfter(dayjs().endOf('day'))}
            style={{ width: '100%' }}
          />
          {error && (
            <Typography.Text type="danger" role="alert">
              {t(`timeRangeError.${error}`, durationValues)}
            </Typography.Text>
          )}
          <Typography.Text type="secondary">
            {t('queryRangeLimit', durationValues)} · {retention}
            {limits.retention_size_based && ` · ${t('retentionSizeBased')}`}
            {capabilities?.stale && ` · ${t('rangeCapabilityStale')}`}
          </Typography.Text>
          <Typography.Text type="secondary">
            {t('retentionNotGuarantee')}
          </Typography.Text>
          <Typography.Text type="secondary">
            {t('fixedRangeRefresh')}
          </Typography.Text>
          <Typography.Text type="secondary">
            {historyNote || t('historicalScopeNote')}
          </Typography.Text>
        </Flex>
      </Modal>
    </Flex>
  );
};

export default TimeRangeControl;
