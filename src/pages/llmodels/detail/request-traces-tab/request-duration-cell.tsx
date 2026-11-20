import { Flex, Typography } from 'antd';
import { formatTraceValue, type TraceMessage } from './presentation';

export default function RequestDurationCell({
  label,
  durationMs,
  firstResponseMs,
  t
}: {
  label: string;
  durationMs: number;
  firstResponseMs?: number | null;
  t: TraceMessage;
}) {
  const useSeconds = durationMs >= 1000;
  const formatTiming = (ms: number) =>
    useSeconds
      ? formatTraceValue(ms / 1000, 's', 3)
      : formatTraceValue(ms, 'ms');

  return (
    <Flex vertical gap={2}>
      <Typography.Text>
        {label} {formatTiming(durationMs)}
      </Typography.Text>
      {firstResponseMs != null && (
        <Typography.Text type="secondary">
          {t('ttft')} {formatTiming(firstResponseMs)}
        </Typography.Text>
      )}
    </Flex>
  );
}
