import { RequestNotice } from '@/pages/_components/monitoring';
import { Alert } from 'antd';
import { useResource } from '../config/context';
import { useResourceIntl } from '../hooks/use-resource-intl';
import { samplingIsStale } from '../utils/metrics';

export default function CollectionNotice() {
  const { metrics } = useResource();
  const t = useResourceIntl();
  return (
    <>
      <RequestNotice state={metrics} />
      {!metrics.stale && samplingIsStale(metrics.data?.metrics) && (
        <Alert type="warning" showIcon title={t('samplingStale')} />
      )}
    </>
  );
}
