import { Collapse, Flex, Typography } from 'antd';
import { createStyles } from 'antd-style';
import type { ReactNode } from 'react';
import HelpTooltip from './help-tooltip';

const useStyles = createStyles(({ css }) => ({
  section: css`
    min-width: 0;
    && {
      border: 0;
      background: transparent;
    }
    > .ant-collapse-item {
      border: 0;
      background: transparent;
    }
    .ant-collapse-header {
      align-items: center !important;
      padding: var(--ant-padding-sm) 0 !important;
      background: transparent;
    }
    .ant-collapse-content-box,
    .ant-collapse-body {
      padding: var(--ant-padding-sm) 0 0 !important;
    }
    .ant-collapse-extra {
      min-width: 0;
    }
    @media (max-width: 650px) {
      .ant-collapse-header {
        flex-wrap: wrap;
        row-gap: var(--ant-margin-xs);
      }
    }
  `
}));

export default function MonitoringSection({
  sectionKey,
  className,
  id,
  title,
  help,
  extra,
  annotation,
  level = 'primary',
  expanded,
  onToggle,
  children
}: {
  sectionKey: string;
  className?: string;
  id?: string;
  title: string;
  help?: ReactNode;
  extra?: ReactNode;
  annotation?: ReactNode;
  level?: 'primary' | 'detail';
  expanded: boolean;
  onToggle: (expanded: boolean) => void;
  children: ReactNode;
}) {
  const { styles } = useStyles();
  return (
    <Flex
      vertical
      className={className}
      id={id}
      data-monitoring-section={sectionKey}
      data-monitoring-level={level}
    >
      <Collapse
        ghost
        className={styles.section}
        activeKey={expanded ? [sectionKey] : []}
        onChange={(keys) => onToggle(keys.length > 0)}
        items={[
          {
            key: sectionKey,
            label: (
              <Flex align="center" gap={4}>
                <Typography.Text strong>{title}</Typography.Text>
                {help && (
                  <Flex
                    align="center"
                    onClick={(event) => event.stopPropagation()}
                    onKeyDown={(event) => {
                      if (event.key === 'Enter' || event.key === ' ')
                        event.stopPropagation();
                    }}
                  >
                    <HelpTooltip label={title} content={help} />
                  </Flex>
                )}
                {annotation}
              </Flex>
            ),
            extra: extra && (
              <span onClick={(event) => event.stopPropagation()}>{extra}</span>
            ),
            children: (
              <Flex vertical gap={16}>
                {children}
              </Flex>
            )
          }
        ]}
      />
    </Flex>
  );
}
