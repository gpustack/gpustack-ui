import { CaretDownOutlined } from '@ant-design/icons';
import { SectionTitle } from '@gpustack/core-ui';
import { Alert, Button, Descriptions, Flex, Popover, Typography } from 'antd';
import { useState, type CSSProperties } from 'react';
import {
  defaultCollapsedSpanIds,
  formatTraceTokens,
  formatTraceValue,
  spanTimelineDuration,
  spanTimelineLabel,
  spanTimelineRows,
  visibleSpanTimelineRows,
  type TraceMessage
} from './presentation';
import type { TraceDetail, TraceSpan } from './requests';
import styles from './trace-details.module.less';

const timeTicks = [0, 25, 50, 75, 100];
const spanDescriptionColumns = {
  xs: 1,
  sm: 2,
  md: 2,
  lg: 2,
  xl: 2,
  xxl: 2,
  xxxl: 2
};

const SpanAttributes = ({ span, t }: { span: TraceSpan; t: TraceMessage }) => (
  <Flex vertical gap={12} className={styles.spanPopoverContent}>
    <Descriptions
      column={spanDescriptionColumns}
      size="small"
      items={[
        {
          key: 'name',
          label: 'span.name',
          children: span.name || '—'
        },
        {
          key: 'service',
          label: 'service.name',
          children: (span.reported_service ?? span.service) || '—'
        },
        { key: 'id', label: 'span.id', children: span.id },
        {
          key: 'parent',
          label: 'parent.span.id',
          children: span.parent_id ?? '—'
        },
        {
          key: 'start',
          label: t('spanStart'),
          children: formatTraceValue(span.start_offset_ms, 'ms')
        },
        {
          key: 'end',
          label: t('spanEnd'),
          children: formatTraceValue(
            span.start_offset_ms + span.duration_ms,
            'ms'
          )
        },
        {
          key: 'duration',
          label: t('duration'),
          children: formatTraceValue(span.duration_ms, 'ms')
        },
        ...(span.status === 'error'
          ? [{ key: 'status', label: 'status', children: t('spanError') }]
          : [])
      ]}
    />
    {span.engine && (
      <Descriptions
        title={t('engineMetrics')}
        column={spanDescriptionColumns}
        size="small"
        items={[
          {
            key: 'ttft',
            label: t('engineTtft'),
            children: formatTraceValue(span.engine.ttft_ms, 'ms')
          },
          {
            key: 'tokens',
            label: t('tokens'),
            children: formatTraceTokens(span.engine)
          },
          {
            key: 'queue',
            label: t('queue'),
            children: formatTraceValue(span.engine.queue_ms, 'ms')
          },
          {
            key: 'prefill',
            label: 'Prefill',
            children: formatTraceValue(span.engine.prefill_ms, 'ms')
          },
          {
            key: 'decode',
            label: 'Decode',
            children: formatTraceValue(span.engine.decode_ms, 'ms')
          },
          {
            key: 'tpot',
            label: 'TPOT',
            children: formatTraceValue(span.engine.tpot_ms, 'ms/token')
          }
        ]}
      />
    )}
  </Flex>
);

export default function SpanTimeline({
  detail,
  t
}: {
  detail: TraceDetail;
  t: TraceMessage;
}) {
  const { spans, span_count: count } = detail;
  const rows = spanTimelineRows(spans);
  const [collapsed, setCollapsed] = useState(() =>
    defaultCollapsedSpanIds(rows)
  );
  const [openSpanId, setOpenSpanId] = useState<string>();
  const duration = spanTimelineDuration(spans);
  const position = (time: number) => `${(time / duration) * 100}%`;
  const toggleChildren = (id: string) => {
    setOpenSpanId(undefined);
    setCollapsed((current) => {
      const next = new Set(current);
      if (!next.delete(id)) next.add(id);
      return next;
    });
  };

  return (
    <Flex vertical gap={12}>
      <SectionTitle role="heading" aria-level={3}>
        {t('traceWaterfall')}
      </SectionTitle>
      {!detail.request.has_engine && (
        <Alert type="info" showIcon title={t('missingEngine')} />
      )}
      {spans.length < count && (
        <Typography.Text type="secondary">
          {t('spanLimit', { count: spans.length })}
        </Typography.Text>
      )}
      <div className={styles.timeline}>
        <Flex justify="end" className={styles.timeAxis}>
          <div className={styles.track}>
            {timeTicks.map((tick) => (
              <Typography.Text
                key={tick}
                type="secondary"
                className={styles.tick}
                style={{ insetInlineStart: `${tick}%` }}
              >
                {formatTraceValue((duration * tick) / 100, 'ms')}
              </Typography.Text>
            ))}
          </div>
        </Flex>
        <div className={styles.gridArea} aria-hidden="true">
          <div className={styles.guides}>
            {timeTicks.map((tick) => (
              <span key={tick} style={{ insetInlineStart: `${tick}%` }} />
            ))}
          </div>
        </div>
        <Flex vertical gap={4}>
          {visibleSpanTimelineRows(rows, collapsed).map(
            ({ span, depth, hasChildren }) => {
              const open = openSpanId === span.id;
              const expanded = !collapsed.has(span.id);
              const { title, subtitle } = spanTimelineLabel(span);
              const phase = span.role !== 'engine' ? span.phase : undefined;
              return (
                <div
                  key={span.id}
                  className={styles.spanRow}
                  style={
                    {
                      '--span-indent-width': `min(${depth * 18}px, 14vw, 108px)`
                    } as CSSProperties
                  }
                >
                  {hasChildren && (
                    <Button
                      size="small"
                      type="text"
                      className={styles.spanToggle}
                      aria-expanded={expanded}
                      aria-label={`${t(expanded ? 'collapseSpanChildren' : 'expandSpanChildren')} · ${title}${phase ? ` · ${phase}` : ''}`}
                      icon={
                        <CaretDownOutlined
                          rotate={expanded ? 0 : -90}
                          style={{
                            fontSize: 12,
                            color: 'var(--ant-color-text-tertiary)'
                          }}
                        />
                      }
                      onClick={() => toggleChildren(span.id)}
                    />
                  )}
                  <Popover
                    title={t('spanAttributes')}
                    content={<SpanAttributes span={span} t={t} />}
                    placement="bottomLeft"
                    align={{
                      overflow: {
                        adjustX: true,
                        adjustY: true,
                        shiftX: true,
                        shiftY: true
                      }
                    }}
                    trigger="click"
                    open={open}
                    onOpenChange={(nextOpen) =>
                      setOpenSpanId((current) =>
                        nextOpen
                          ? span.id
                          : current === span.id
                            ? undefined
                            : current
                      )
                    }
                    destroyOnHidden
                    classNames={{ root: styles.spanPopover }}
                  >
                    <Button
                      aria-expanded={open}
                      type={open ? 'default' : 'text'}
                      className={styles.spanButton}
                      onKeyDown={(event) => {
                        if (open && event.key === 'Escape') {
                          event.stopPropagation();
                          setOpenSpanId(undefined);
                        }
                      }}
                    >
                      <Flex
                        align="center"
                        gap={8}
                        className={styles.spanContent}
                      >
                        <Flex className={styles.spanText}>
                          {depth > 0 && (
                            <span
                              aria-hidden="true"
                              className={styles.spanIndent}
                            />
                          )}
                          <span
                            aria-hidden="true"
                            className={styles.spanToggleSpace}
                          />
                          <Flex
                            vertical
                            align="start"
                            className={styles.spanLabel}
                          >
                            <Flex align="center" gap={4}>
                              {phase && (
                                <span className={styles.spanPhase}>
                                  {phase === 'prefill' ? 'P' : 'D'}
                                </span>
                              )}
                              <Typography.Text ellipsis>
                                {title}
                              </Typography.Text>
                            </Flex>
                            <Typography.Text type="secondary" ellipsis>
                              {subtitle}
                            </Typography.Text>
                          </Flex>
                        </Flex>
                        <div className={`${styles.track} ${styles.spanTrack}`}>
                          <span
                            className={styles.bar}
                            data-role={span.role}
                            style={{
                              insetInlineStart: `min(${position(span.start_offset_ms)}, calc(100% - 2px))`,
                              width: position(span.duration_ms)
                            }}
                          />
                        </div>
                      </Flex>
                    </Button>
                  </Popover>
                </div>
              );
            }
          )}
        </Flex>
      </div>
    </Flex>
  );
}
