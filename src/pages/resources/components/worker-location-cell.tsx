import GroupedInfoTooltipContent from '@/pages/_components/grouped-info-tooltip-content';
import {
  resolveLocation,
  shownValue
} from '@/pages/cluster-management/components/topology/location';
import { topologyLayerLabel } from '@/pages/cluster-management/config';
import {
  NODE_LAYER,
  TopologyView
} from '@/pages/cluster-management/config/types';
import { OverlayScroller } from '@gpustack/core-ui';
import { useIntl } from '@umijs/max';
import { Flex, Tooltip } from 'antd';
import { createStyles } from 'antd-style';
import { ListItem } from '../config/types';

const useStyles = createStyles(({ css }) => ({
  trigger: css`
    width: 100%;
    min-width: 0;
    min-height: var(--ant-control-height-sm);
    padding: var(--ant-padding-xxs) 0;
    color: var(--ant-color-text);
    text-align: start;
    white-space: nowrap;
    cursor: pointer;

    &[aria-disabled='true'] {
      cursor: default;
    }

    &:focus-visible {
      outline: 2px solid var(--ant-color-primary);
      outline-offset: 2px;
      border-radius: var(--ant-border-radius-sm);
    }
  `,
  content: css`
    width: 100%;
    min-width: 0;

    .more {
      flex-shrink: 0;
      color: var(--ant-color-text);
    }
  `,
  summary: css`
    flex: 0 1 auto;
    min-width: 0;

    .summary-label,
    .summary-value {
      min-width: 0;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }

    .summary-label {
      max-width: 8em;
      flex-shrink: 1;
      color: var(--ant-color-text-tertiary);
    }

    .summary-separator {
      flex-shrink: 0;
      color: var(--ant-color-text-tertiary);
    }

    .summary-value {
      flex: 1 1 auto;
      color: var(--ant-color-text);
    }
  `,
  heading: css`
    padding-bottom: var(--ant-padding-xs);
    padding-inline: var(--ant-padding-xxs);
    border-bottom: 1px solid var(--color-white-light-1);
    color: var(--color-white-secondary);
    font-weight: 500;

    .layer-count {
      flex-shrink: 0;
      color: var(--color-white-tertiary);
      font-size: var(--ant-font-size-sm);
      font-weight: 400;
      white-space: nowrap;
    }
  `,
  details: css`
    width: min(360px, calc(100vw - 2 * var(--ant-margin-lg)));

    > div > .ant-flex {
      padding: var(--ant-padding-xxs);
      border-radius: var(--ant-border-radius-sm);

      &:hover {
        background: var(--color-white-light-1);
      }
    }
    .divider {
      margin-block: 6px !important;
    }

    .label {
      font-weight: 400;
    }

    .location-unfilled {
      color: var(--color-white-tertiary);
    }
  `
}));

interface WorkerLocationCellProps {
  worker: Pick<ListItem, 'name' | 'labels' | 'status'>;
  view?: TopologyView;
}

/** A compact summary of the worker's own cluster hierarchy, with full details. */
const WorkerLocationCell: React.FC<WorkerLocationCellProps> = ({
  worker,
  view
}) => {
  const intl = useIntl();
  const { styles } = useStyles();
  const layers = (view?.layers || [])
    .filter((layer) => layer.id !== NODE_LAYER && !layer.disabled)
    .map((layer) => ({
      label: topologyLayerLabel(intl, layer),
      value: shownValue(resolveLocation(worker, layer.label_keys || []))
    }));
  const summary = layers.find((layer) => layer.value);
  // Include missing layers in the omitted count; they remain visible in details.
  const hiddenCount = layers.length - (summary ? 1 : 0);
  const unfilled = intl.formatMessage({
    id: 'resources.worker.location.unfilled'
  });
  const unavailable = intl.formatMessage({
    id: 'resources.worker.location.unavailable'
  });
  const trigger = (
    <Flex
      component="span"
      className={styles.trigger}
      role={view ? 'button' : undefined}
      tabIndex={0}
      aria-disabled={!view}
      aria-label={
        view
          ? intl.formatMessage(
              { id: 'resources.worker.location.open' },
              { worker: worker.name }
            )
          : unavailable
      }
      onKeyDown={(event) => {
        if (view && (event.key === 'Enter' || event.key === ' ')) {
          event.preventDefault();
          event.currentTarget.click();
        }
      }}
    >
      <Flex
        component="span"
        align="baseline"
        gap={8}
        className={styles.content}
      >
        {summary ? (
          <>
            <Flex component="span" align="baseline" className={styles.summary}>
              <span className="summary-label">{summary.label}</span>
              <span className="summary-separator">:</span>
              <span className="summary-value">{summary.value}</span>
            </Flex>
            {hiddenCount > 0 && (
              <span
                className="more dashed-underline"
                aria-label={intl.formatMessage(
                  { id: 'resources.worker.location.moreLayers' },
                  { count: hiddenCount }
                )}
              >
                +{hiddenCount}
              </span>
            )}
          </>
        ) : (
          <span className="text-tertiary">{view ? unfilled : '—'}</span>
        )}
      </Flex>
    </Flex>
  );

  return (
    <Tooltip
      title={
        <Flex orientation="vertical" gap={8}>
          <Flex
            align="center"
            justify="space-between"
            gap={16}
            className={styles.heading}
          >
            <span>
              {intl.formatMessage({ id: 'resources.table.location' })}
            </span>
            {view && (
              <span className="layer-count">
                {intl.formatMessage(
                  { id: 'resources.worker.location.totalLayers' },
                  { count: layers.length }
                )}
              </span>
            )}
          </Flex>
          <OverlayScroller
            maxHeight="min(360px, calc(50vh - var(--ant-control-height-lg) - 2 * var(--ant-margin-lg)))"
            scrollbars={{ theme: 'os-theme-light' }}
            styles={{ wrapper: { paddingInlineStart: 0 } }}
          >
            <div className={styles.details}>
              {view ? (
                layers.length ? (
                  <GroupedInfoTooltipContent
                    locale={false}
                    groups={layers.map((layer) => [
                      {
                        label: layer.label,
                        icon: null,
                        value: layer.value || (
                          <span className="location-unfilled">{unfilled}</span>
                        )
                      }
                    ])}
                  />
                ) : (
                  <span className="location-unfilled">{unfilled}</span>
                )
              ) : (
                unavailable
              )}
            </div>
          </OverlayScroller>
        </Flex>
      }
      placement="bottomLeft"
      trigger={view ? ['hover', 'click'] : ['hover']}
      styles={{ container: { width: 'max-content', paddingInlineEnd: 0 } }}
    >
      {trigger}
    </Tooltip>
  );
};

export default WorkerLocationCell;
