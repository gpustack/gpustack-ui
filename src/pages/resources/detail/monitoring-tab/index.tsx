import { ChartInteractionHelp } from '@/pages/_components/monitoring';
import MonitoringSectionCard from '@/pages/llmodels/detail/monitoring-tab/components/monitoring-section-card';
import SectionNavigation from '@/pages/llmodels/detail/monitoring-tab/components/section-navigation';
import navStyles from '@/pages/llmodels/detail/monitoring-tab/components/section-navigation.module.less';
import { scrollWhenSectionSettles } from '@/pages/llmodels/detail/utils/section-navigation';
import { scopeTimeLabel } from '@/pages/llmodels/detail/utils/time-range';
import { Flex, Typography } from 'antd';
import { useEffect, useRef, useState } from 'react';
import CollectionNotice from '../components/collection-notice';
import styles from '../components/detail.module.less';
import MetricGrid, { useHardwareCharts } from '../components/metric-grid';
import ScopeToolbar from '../components/scope-toolbar';
import { useResource } from '../config/context';
import { useResourceIntl } from '../hooks/use-resource-intl';

export default function MonitoringTab() {
  const { detail, target, scope } = useResource();
  const t = useResourceIntl(),
    charts = useHardwareCharts();
  const [expanded, setExpanded] = useState(['host', 'gpu', 'storage']);
  const cancelNavigation = useRef<(() => void) | null>(null);
  useEffect(() => () => cancelNavigation.current?.(), []);
  const groups =
    target.kind === 'gpu'
      ? [
          {
            key: 'gpu',
            label: t('gpuMonitoring'),
            charts: charts.gpu,
            help: t('physicalHelp')
          }
        ]
      : [
          {
            key: 'host',
            label: t('hostMonitoring'),
            charts: charts.host,
            help: t('hostHelp')
          },
          ...(detail.data?.devices.length
            ? [
                {
                  key: 'gpu',
                  label: t('gpuMonitoring'),
                  charts: charts.gpu,
                  help: t('physicalHelp')
                }
              ]
            : []),
          {
            key: 'storage',
            label: t('storageMonitoring'),
            charts: charts.storage,
            help: t('filesystemHelp')
          }
        ];
  const open = (key: string) => {
    setExpanded((values) => (values.includes(key) ? values : [...values, key]));
    cancelNavigation.current?.();
    cancelNavigation.current = scrollWhenSectionSettles(`model-monitor-${key}`);
  };
  const changeExpanded = (keys: string[]) => {
    cancelNavigation.current?.();
    cancelNavigation.current = null;
    setExpanded(keys);
  };
  const hasMultipleGroups = groups.length > 1;
  return (
    <Flex vertical gap={16} data-model-monitor-layout>
      <div className={navStyles.panel} data-model-monitor-panel>
        <ScopeToolbar
          embedded
          extra={
            !hasMultipleGroups ? (
              <ChartInteractionHelp contextNote={t('inventoryHelp')} />
            ) : undefined
          }
        />
        {hasMultipleGroups && (
          <SectionNavigation
            embedded
            sections={groups}
            expanded={expanded}
            onOpen={open}
            onChange={changeExpanded}
            contextNote={t('inventoryHelp')}
          />
        )}
      </div>
      <CollectionNotice />
      {groups.map((group) => (
        <MonitoringSectionCard
          key={group.key}
          sectionKey={group.key}
          id={`model-monitor-${group.key}`}
          className={styles.section}
          title={group.label}
          help={group.help}
          expanded={expanded.includes(group.key)}
          onToggle={(open) =>
            setExpanded((values) =>
              open
                ? [...new Set([...values, group.key])]
                : values.filter((key) => key !== group.key)
            )
          }
          extra={
            <Typography.Text type="secondary" style={{ fontSize: 12 }}>
              {scopeTimeLabel(scope)}
            </Typography.Text>
          }
        >
          <MetricGrid charts={group.charts} />
        </MonitoringSectionCard>
      ))}
    </Flex>
  );
}
