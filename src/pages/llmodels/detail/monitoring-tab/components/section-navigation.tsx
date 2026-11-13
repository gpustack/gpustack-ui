import { ArrowsAltOutlined, ShrinkOutlined } from '@ant-design/icons';
import { useIntl } from '@umijs/max';
import { Button, Flex, Space, Typography } from 'antd';
import { useEffect, useRef } from 'react';
import ChartInteractionHelp from '../../components/chart-interaction-help';
import styles from './section-navigation.module.less';

interface SectionNavigationProps {
  sections: { key: string; label: string }[];
  expanded: string[];
  onOpen: (section: string) => void;
  onChange: (sections: string[]) => void;
  contextNote?: string;
}

const SectionNavigation = ({
  sections,
  expanded,
  onOpen,
  onChange,
  contextNote
}: SectionNavigationProps) => {
  const intl = useIntl();
  const ref = useRef<HTMLDivElement>(null);
  const hasMultipleSections = sections.length > 1;
  const allOpen = sections.every((section) => expanded.includes(section.key));
  const allClosed = sections.every(
    (section) => !expanded.includes(section.key)
  );
  useEffect(() => {
    const node = ref.current;
    const layout = node?.closest<HTMLElement>('[data-model-monitor-layout]');
    if (!node || !layout) return;
    const measure = () => {
      const height = node.getBoundingClientRect().height;
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
    observer?.observe(node);
    window.addEventListener('resize', measure);
    return () => {
      observer?.disconnect();
      window.removeEventListener('resize', measure);
    };
  }, []);
  return (
    <Flex
      ref={ref}
      className={styles.navigation}
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
          <Typography.Text className={styles.label}>
            {intl.formatMessage({ id: 'modelMonitoring.jumpTo' })}
          </Typography.Text>
          <Flex className={styles.sections} align="center" gap={6}>
            {sections.map((section) => (
              <Button
                type="text"
                size="small"
                className={styles.sectionLink}
                aria-controls={`model-monitor-${section.key}`}
                key={section.key}
                onClick={() => onOpen(section.key)}
              >
                {section.label}
              </Button>
            ))}
          </Flex>
        </Flex>
      )}
      <Space
        wrap
        className={styles.actions}
        role="group"
        aria-label={intl.formatMessage({
          id: 'modelMonitoring.sectionVisibility'
        })}
      >
        <ChartInteractionHelp contextNote={contextNote} />
        <Button
          size="small"
          icon={<ArrowsAltOutlined />}
          disabled={allOpen}
          onClick={() => onChange(sections.map((section) => section.key))}
        >
          {intl.formatMessage({ id: 'modelMonitoring.expandAll' })}
        </Button>
        <Button
          size="small"
          icon={<ShrinkOutlined />}
          disabled={allClosed}
          onClick={() => onChange([])}
        >
          {intl.formatMessage({ id: 'modelMonitoring.collapseAll' })}
        </Button>
      </Space>
    </Flex>
  );
};

export default SectionNavigation;
