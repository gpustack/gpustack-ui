import { displayMetricValue } from '@/pages/llmodels/detail/utils/metrics';
import { SectionTitle, ThemeTag } from '@gpustack/core-ui';
import { useIntl } from '@umijs/max';
import { Col, Descriptions, Flex, Row } from 'antd';
import styles from '../components/detail.module.less';
import { useResource } from '../config/context';
import { useResourceIntl } from '../hooks/use-resource-intl';
import { deviceHardware } from '../utils/device-hardware';
import configurationStyles from './index.module.less';

export default function ConfigurationTab() {
  const { detail, target } = useResource();
  const intl = useIntl();
  const t = useResourceIntl(),
    data = detail.data!,
    w = data.worker;
  const device = data.devices.find((d) => d.id === data.selected_device_id);
  const raw = deviceHardware(device, w.status?.gpu_devices);
  const item = (key: string, label: string, value: unknown) => ({
    key,
    label,
    children: value == null || value === '' ? '—' : String(value)
  });
  if (target.kind === 'gpu') {
    const items = [
      item('name', t('gpuName'), device?.name),
      item('index', t('gpuIndex'), device?.index),
      item('vendor', t('vendor'), raw?.vendor),
      item('type', t('runtime'), raw?.type),
      item('uuid', t('uuid'), raw?.uuid),
      item('driver', t('driver'), raw?.driver_version),
      item('runtimeVersion', t('runtimeVersion'), raw?.runtime_version),
      item(
        'memory',
        t('physicalTotal'),
        displayMetricValue(device?.current?.gpu_memory_total, 'bytes')
      ),
      item('worker', intl.formatMessage({ id: 'resources.worker' }), w.name),
      item('cluster', t('cluster'), data.cluster_name)
    ];
    return (
      <Flex vertical gap={16} className={styles.info}>
        <SectionTitle>{t('hardware')}</SectionTitle>
        <Row gutter={[32, 8]}>
          {[items.slice(0, 5), items.slice(5)].map((group) => (
            <Col xs={24} xl={12} key={group[0].key}>
              <Descriptions
                size="small"
                column={1}
                className={configurationStyles.hardwareFields}
                items={group}
              />
            </Col>
          ))}
        </Row>
      </Flex>
    );
  }
  return (
    <Row gutter={[16, 16]}>
      <Col xs={24} lg={12} className={styles.cardCol}>
        <Flex vertical gap={16} className={styles.info}>
          <SectionTitle>{t('basic')}</SectionTitle>
          <Descriptions
            size="small"
            column={1}
            items={[
              item('name', t('name'), w.name),
              item('cluster', t('cluster'), data.cluster_name),
              item(
                'ip',
                intl.formatMessage({ id: 'resources.table.ip' }),
                w.ip
              ),
              item('version', t('workerVersion'), w.worker_version),
              item(
                'os',
                t('os'),
                [w.status?.os?.name, w.status?.os?.version]
                  .filter(Boolean)
                  .join(' ')
              ),
              item('kernel', t('kernel'), w.status?.kernel?.release),
              item('arch', t('architecture'), w.status?.kernel?.architecture),
              item(
                'uptime',
                t('uptime'),
                w.status?.uptime?.uptime == null
                  ? null
                  : t('uptimeHours', {
                      count: Math.floor(w.status.uptime.uptime / 3600)
                    })
              )
            ]}
          />
        </Flex>
      </Col>
      <Col xs={24} lg={12} className={styles.cardCol}>
        <Flex vertical gap={16} className={styles.info}>
          <SectionTitle>{t('hardware')}</SectionTitle>
          <Descriptions
            size="small"
            column={1}
            items={[
              item('cpu', t('cpuCores'), w.status?.cpu?.total),
              item(
                'memory',
                t('hostMemory'),
                displayMetricValue(w.status?.memory?.total, 'bytes')
              ),
              item(
                'gpu',
                intl.formatMessage({ id: 'resources.table.gpu' }),
                data.devices.length
              ),
              item(
                'reservedRam',
                t('reservedMemory'),
                displayMetricValue(w.system_reserved?.ram, 'bytes')
              ),
              item(
                'reservedVram',
                t('reservedGPU'),
                displayMetricValue(w.system_reserved?.vram, 'bytes')
              ),
              item(
                'maintenance',
                t('maintenance'),
                t(w.maintenance?.enabled ? 'enabled' : 'disabled')
              )
            ]}
          />
        </Flex>
      </Col>
      <Col span={24}>
        <Flex vertical gap={16} className={styles.info}>
          <SectionTitle>{t('labels')}</SectionTitle>
          <Flex gap={8} wrap>
            {Object.entries(w.labels || {}).map(([key, value]) => (
              <ThemeTag key={key}>
                {key} = {value}
              </ThemeTag>
            ))}
            {!Object.keys(w.labels || {}).length && '—'}
          </Flex>
        </Flex>
      </Col>
    </Row>
  );
}
