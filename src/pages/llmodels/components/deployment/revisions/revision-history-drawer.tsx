import { HistoryOutlined, UndoOutlined } from '@ant-design/icons';
import {
  AlertBlockInfo,
  GSDrawer,
  ModalFooter,
  OverlayScroller,
  TextAttribute,
  ThemeTag
} from '@gpustack/core-ui';
import { useIntl } from '@umijs/max';
import { Alert, Button, Checkbox, Empty, Flex, Spin, Tooltip } from 'antd';
import classNames from 'classnames';
import dayjs from 'dayjs';
import isEqual from 'lodash/isEqual';
import { DO_NOT_NOTIFY_RECREATE } from '../../../config';
import diffStyles from '../../../style/import-yaml-drawer.module.less';
import type { ModelRevisionsController } from './hooks/use-model-revisions';
import RevisionComparisonView from './revision-comparison';
import styles from './revision-history-drawer.module.less';
import RollbackPreviewPanel from './rollback-preview-panel';

export default function RevisionHistoryDrawer({
  history,
  onClose
}: {
  history: ModelRevisionsController;
  onClose: () => void;
}) {
  const intl = useIntl();
  const { state, saving } = history;
  const review = state.rollback;
  const showRestartWarning =
    !!review &&
    !review.restartOnRollback &&
    !!review.preview?.changes.some(
      ({ field }) => !DO_NOT_NOTIFY_RECREATE.includes(field)
    );
  const text = (key: string, values?: Record<string, any>) =>
    intl.formatMessage({ id: `models.revisions.${key}` }, values);
  const busy = saving || state.loading;
  const browsingDisabled = busy;
  const activeRevision = state.selected;
  const selected = state.items.find((item) => item.revision === state.selected);
  const comparison = state.comparison;
  const changedFields = comparison?.previous
    ? [
        ...new Set([
          ...Object.keys(comparison.previous.spec),
          ...Object.keys(comparison.target.spec)
        ])
      ].filter(
        (field) =>
          !isEqual(
            comparison.previous!.spec[field],
            comparison.target.spec[field]
          )
      ).length
    : null;

  const submitRollback = async () => {
    try {
      await history.confirmRollback();
    } catch {
      // The drawer keeps validation errors with the reviewed configuration.
    }
  };

  const footer = (
    <ModalFooter
      description={
        review && (
          <Checkbox
            checked={review.restartOnRollback}
            disabled={
              busy ||
              review.loading ||
              !review.preview?.changed ||
              !!review.error
            }
            onChange={(event) =>
              history.setRestartOnRollback(event.target.checked)
            }
          >
            {text('restartOnRollback')}
          </Checkbox>
        )
      }
      styles={{
        wrapper: {
          padding: 0,
          flexWrap: 'wrap',
          flexShrink: 0
        }
      }}
      style={{
        flexShrink: 0,
        marginInlineStart: 'auto',
        flexWrap: 'wrap',
        justifyContent: 'flex-end',
        maxWidth: '100%'
      }}
      onCancel={review ? history.cancelRollback : onClose}
      cancelText={
        review
          ? text('backToHistory')
          : intl.formatMessage({ id: 'common.button.close' })
      }
      cancelBtnProps={{
        disabled: saving,
        style: { width: 'auto', minWidth: 88 }
      }}
      showOkBtn={!!review}
      onOk={submitRollback}
      okText={text('rollBackAction')}
      loading={saving}
      okBtnProps={{
        style: { width: 'auto', minWidth: 88 },
        disabled:
          busy ||
          review?.loading ||
          !review?.preview?.changed ||
          !!review?.error
      }}
    />
  );

  return (
    <GSDrawer
      open={!!state.model}
      title={
        <Flex
          component="span"
          align="center"
          gap="small"
          className={styles.title}
        >
          <span className={styles.titleText}>
            {review
              ? text('rollbackToVersion', { revision: review.revision })
              : text('title')}
          </span>
          {state.model?.name && (
            <TextAttribute variant="outlined" className={styles.titleSubtitle}>
              <Tooltip title={state.model?.name}>
                <span className={styles.titleName}>{state.model?.name}</span>
              </Tooltip>
            </TextAttribute>
          )}
        </Flex>
      }
      onClose={onClose}
      destroyOnHidden
      mask={{ closable: !saving }}
      keyboard={!saving}
      styles={{
        wrapper: { width: 'min(1440px, 96vw)' },
        body: { paddingBlock: 0, overflow: 'hidden' }
      }}
      footer={false}
    >
      <Flex vertical gap="small" className={styles.body}>
        {state.restartError && (
          <Alert
            type="warning"
            showIcon
            title={text('restartFailed')}
            description={state.restartError}
            action={
              <Button
                size="small"
                disabled={busy}
                loading={saving}
                onClick={history.retryRestart}
              >
                {text('retryRestart')}
              </Button>
            }
          />
        )}
        {state.error && <Alert type="error" showIcon title={state.error} />}
        {!review && (
          <Flex
            align="center"
            justify="space-between"
            gap="small"
            wrap
            className={styles.toolbar}
          >
            <Flex align="center" gap="small" wrap className={styles.selection}>
              <HistoryOutlined className={styles.secondary} />
              <span className={styles.selectionName}>
                {comparison?.previous
                  ? text('comparisonRange', {
                      previous: comparison.previous.revision,
                      revision: comparison.target.revision
                    })
                  : selected
                    ? text('target', { revision: selected.revision })
                    : text('title')}
              </span>
              {comparison && (
                <>
                  <span className={styles.secondary} aria-hidden="true">
                    ·
                  </span>
                  <span className={styles.secondary}>
                    {changedFields === null
                      ? text('snapshot')
                      : text('changes', { count: changedFields })}
                  </span>
                </>
              )}
            </Flex>
            {selected && selected.revision !== state.latest && (
              <Button
                size="small"
                icon={<UndoOutlined />}
                disabled={
                  browsingDisabled || state.comparisonLoading || !comparison
                }
                onClick={() => history.reviewRollback(selected.revision)}
              >
                {text('rollbackToVersion', { revision: selected.revision })}
              </Button>
            )}
          </Flex>
        )}
        <Flex className={classNames(diffStyles.diff, styles.workspace)}>
          {!review && (
            <Flex vertical className={styles.nav}>
              <Flex align="center" className={styles.navHeader}>
                <span>{text('list', { count: state.items.length })}</span>
              </Flex>
              <div className={styles.navScroller}>
                <OverlayScroller
                  maxHeight="100%"
                  styles={{ wrapper: { height: '100%', padding: 0 } }}
                >
                  <Flex
                    vertical
                    gap="small"
                    className={styles.navItems}
                    aria-label={text('title')}
                  >
                    {state.items.map((item) => (
                      <Flex
                        key={item.revision}
                        align="flex-start"
                        gap={4}
                        className={classNames(styles.navOption, {
                          [styles.selected]: activeRevision === item.revision
                        })}
                      >
                        <button
                          type="button"
                          className={styles.selectRevision}
                          aria-pressed={activeRevision === item.revision}
                          disabled={browsingDisabled}
                          onClick={() => history.select(item.revision)}
                        >
                          <Flex vertical gap={4}>
                            <Flex
                              align="center"
                              justify="space-between"
                              gap="small"
                              className={styles.revisionHeader}
                            >
                              <span className={styles.revisionName}>
                                {text('target', { revision: item.revision })}
                              </span>
                              {item.revision === state.latest && (
                                <ThemeTag className={styles.latestTag}>
                                  {text('latest')}
                                </ThemeTag>
                              )}
                            </Flex>
                            <time
                              className={styles.timestamp}
                              dateTime={item.created_at}
                              title={dayjs(item.created_at).format(
                                'YYYY-MM-DD HH:mm:ss'
                              )}
                            >
                              {dayjs(item.created_at).format(
                                'YYYY-MM-DD HH:mm'
                              )}
                            </time>
                          </Flex>
                        </button>
                        {item.revision !== state.latest && (
                          <Tooltip
                            title={text('rollbackToVersion', {
                              revision: item.revision
                            })}
                          >
                            <Button
                              type="text"
                              size="small"
                              className={styles.rollbackAction}
                              icon={<UndoOutlined />}
                              aria-label={text('rollbackToVersion', {
                                revision: item.revision
                              })}
                              disabled={
                                browsingDisabled ||
                                state.comparisonLoading ||
                                !comparison
                              }
                              onClick={() =>
                                history.reviewRollback(item.revision)
                              }
                            />
                          </Tooltip>
                        )}
                      </Flex>
                    ))}
                    {state.loading && (
                      <Spin className={styles.loading} size="middle" />
                    )}
                    {!state.loading && !state.items.length && (
                      <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} />
                    )}
                  </Flex>
                </OverlayScroller>
              </div>
            </Flex>
          )}
          <Flex vertical className={diffStyles.diffMain}>
            {review ? (
              <RollbackPreviewPanel review={review} />
            ) : comparison && !state.loading && !state.comparisonLoading ? (
              <RevisionComparisonView
                key={comparison.target.revision}
                comparison={comparison}
              />
            ) : (
              <Flex
                align="center"
                justify="center"
                className={styles.placeholder}
              >
                {state.loading || state.comparisonLoading ? (
                  <Spin size="middle" />
                ) : (
                  <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} />
                )}
              </Flex>
            )}
          </Flex>
        </Flex>
        {showRestartWarning && (
          <div
            style={{
              flexShrink: 0
            }}
          >
            <AlertBlockInfo
              type="warning"
              ellipsis={false}
              message={text('restartWarning')}
            />
          </div>
        )}
        {review && footer}
      </Flex>
    </GSDrawer>
  );
}
