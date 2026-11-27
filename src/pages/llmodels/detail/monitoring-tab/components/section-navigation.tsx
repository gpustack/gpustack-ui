import navigationStyles from '@/pages/_components/monitoring/monitoring-navigation.module.less';
import { useIntl } from '@umijs/max';
import { Button, Flex, Space, Typography } from 'antd';
import classNames from 'classnames';
import { useEffect, useRef, useState, type ReactNode } from 'react';
import ChartInteractionHelp from '../../components/chart-interaction-help';
import MonitoringVisibilityActions from '../../components/monitoring-visibility-actions';
import styles from './section-navigation.module.less';

interface SectionNavigationProps {
  sections: { key: string; label: string }[];
  expanded: string[];
  onOpen: (section: string) => void;
  onChange: (sections: string[]) => void;
  contextNote?: string;
  embedded?: boolean;
  extra?: ReactNode;
}

const SectionNavigation = ({
  sections,
  expanded,
  onOpen,
  onChange,
  contextNote,
  embedded = false,
  extra
}: SectionNavigationProps) => {
  const intl = useIntl();
  const ref = useRef<HTMLDivElement>(null);
  const [activeKey, setActiveKey] = useState<string | null>(null);
  const hasMultipleSections = sections.length > 1;
  const resolvedActiveKey =
    activeKey && sections.some((section) => section.key === activeKey)
      ? activeKey
      : sections.find((section) => expanded.includes(section.key))?.key ||
        sections[0]?.key ||
        null;
  useEffect(() => {
    const node = ref.current;
    const layout = node?.closest<HTMLElement>('[data-model-monitor-layout]');
    const stickyTarget =
      node?.closest<HTMLElement>('[data-model-monitor-panel]') || node;
    if (!stickyTarget || !layout) return;
    const measure = () => {
      const height = stickyTarget.getBoundingClientRect().height;
      if (height > 0)
        layout.style.setProperty(
          '--model-monitor-nav-height',
          `${Math.ceil(height)}px`
        );
    };
    measure();
    const observer =
      typeof ResizeObserver === 'undefined'
        ? null
        : new ResizeObserver(measure);
    observer?.observe(stickyTarget);
    window.addEventListener('resize', measure);
    return () => {
      observer?.disconnect();
      window.removeEventListener('resize', measure);
    };
  }, []);
  return (
    <Flex
      ref={ref}
      className={embedded ? styles.embeddedBar : navigationStyles.navigation}
      align="center"
      gap={12}
      wrap
      role={hasMultipleSections ? 'navigation' : undefined}
      aria-label={
        hasMultipleSections
          ? intl.formatMessage({ id: 'modelMonitoring.sectionNavigation' })
          : undefined
      }
    >
      {hasMultipleSections && (
        <Flex className={styles.links} align="center" gap={8}>
          <Typography.Text type="secondary" className={styles.prefix}>
            {intl.formatMessage({ id: 'modelMonitoring.jumpTo' })}
          </Typography.Text>
          <Flex className={styles.sections} align="center" gap={6} wrap>
            {sections.map((section) => {
              const active = embedded && resolvedActiveKey === section.key;
              return (
                <Button
                  type="text"
                  size="small"
                  className={classNames(
                    styles.sectionLink,
                    active && styles.sectionLinkActive
                  )}
                  aria-controls={`model-monitor-${section.key}`}
                  aria-current={active ? 'location' : undefined}
                  key={section.key}
                  onClick={() => {
                    setActiveKey(section.key);
                    onOpen(section.key);
                  }}
                >
                  {section.label}
                </Button>
              );
            })}
          </Flex>
        </Flex>
      )}
      <Flex className={styles.actions} align="center" gap={12} wrap>
        {extra}
        {extra && <span className={styles.actionDivider} aria-hidden />}
        <Space
          wrap
          align="center"
          role="group"
          aria-label={intl.formatMessage({
            id: 'modelMonitoring.sectionVisibility'
          })}
        >
          <ChartInteractionHelp contextNote={contextNote} />
          <MonitoringVisibilityActions
            keys={sections.map((section) => section.key)}
            expanded={expanded}
            onChange={onChange}
            showLabel
          />
        </Space>
      </Flex>
    </Flex>
  );
};

export default SectionNavigation;
