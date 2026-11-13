import { HelpTooltip } from '@/pages/_components/monitoring';
import SectionNavigation from '@/pages/llmodels/detail/monitoring-tab/components/section-navigation';
import { scrollWhenSectionSettles } from '@/pages/llmodels/detail/utils/section-navigation';
import { Collapse, Flex } from 'antd';
import { useEffect, useRef, useState, type CSSProperties } from 'react';
import CollectionNotice from '../components/collection-notice';
import styles from '../components/detail.module.less';
import MetricGrid, { useHardwareCharts } from '../components/metric-grid';
import ScopeToolbar from '../components/scope-toolbar';
import { useResource } from '../config/context';
import { useResourceIntl } from '../hooks/use-resource-intl';

export default function MonitoringTab() {
  const { detail, target } = useResource();
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
  return (
    <Flex
      vertical
      gap={16}
      data-model-monitor-layout
      style={{ '--model-monitor-nav-height': '48px' } as CSSProperties}
    >
      <ScopeToolbar />
      <CollectionNotice />
      <SectionNavigation
        sections={groups}
        expanded={expanded}
        onOpen={open}
        onChange={changeExpanded}
        contextNote={t('inventoryHelp')}
      />
      {groups.map((group) => (
        <Collapse
          key={group.key}
          activeKey={expanded.includes(group.key) ? [group.key] : []}
          onChange={(keys) =>
            setExpanded((values) =>
              keys.length
                ? [...new Set([...values, group.key])]
                : values.filter((k) => k !== group.key)
            )
          }
          items={[
            {
              key: group.key,
              label: (
                <Flex
                  align="center"
                  gap={4}
                  id={`model-monitor-${group.key}`}
                  className={styles.section}
                >
                  <span>{group.label}</span>
                  <span
                    onClick={(e) => e.stopPropagation()}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ')
                        e.stopPropagation();
                    }}
                  >
                    <HelpTooltip label={group.label} content={group.help} />
                  </span>
                </Flex>
              ),
              children: <MetricGrid charts={group.charts} />
            }
          ]}
        />
      ))}
    </Flex>
  );
}
