import { CollapseContainer } from '@gpustack/core-ui';
import { Flex } from 'antd';
import { createStyles } from 'antd-style';
import { useId, useState, type ComponentProps } from 'react';
import HelpTooltip from '../../components/help-tooltip';
import type MonitoringSection from '../../components/monitoring-section';

const useStyles = createStyles(({ css }) => ({
  toggle: css`
    padding: 0;
    border: 0;
    background: none;
    color: var(--ant-color-text);
    font: inherit;
    font-weight: var(--font-weight-medium);
    text-align: start;
    white-space: normal;
    overflow-wrap: anywhere;
    cursor: pointer;
  `,
  extra: css`
    display: block;
    white-space: normal;
    overflow-wrap: anywhere;
    text-align: end;
  `
}));

export default function MonitoringSectionCard({
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
}: ComponentProps<typeof MonitoringSection>) {
  const { styles } = useStyles();
  const contentId = useId();
  const [hasOpened, setHasOpened] = useState(expanded);
  if (expanded && !hasOpened) setHasOpened(true);

  return (
    <div
      className={className}
      id={id}
      data-monitoring-section={sectionKey}
      data-monitoring-level={level}
    >
      <CollapseContainer
        collapsible
        open={expanded}
        onToggle={onToggle}
        styles={{
          root: { border: 0 },
          header: { borderBottom: 0 },
          content: { padding: 'var(--ant-padding) 0 var(--ant-padding-lg)' }
        }}
        title={
          <Flex align="center" gap={4} wrap>
            <button
              type="button"
              className={styles.toggle}
              aria-expanded={expanded}
              aria-controls={contentId}
              data-monitoring-section-toggle
              onClick={(event) => {
                event.stopPropagation();
                onToggle(!expanded);
              }}
            >
              {title}
            </button>
            {help && (
              <span onClick={(event) => event.stopPropagation()}>
                <HelpTooltip label={title} content={help} />
              </span>
            )}
            {annotation}
          </Flex>
        }
        right={
          extra && (
            <span
              className={styles.extra}
              onClick={(event) => event.stopPropagation()}
            >
              {extra}
            </span>
          )
        }
      >
        <Flex
          vertical
          gap={16}
          id={contentId}
          aria-hidden={!expanded}
          {...(!expanded && { inert: '' })}
        >
          {hasOpened && children}
        </Flex>
      </CollapseContainer>
    </div>
  );
}
