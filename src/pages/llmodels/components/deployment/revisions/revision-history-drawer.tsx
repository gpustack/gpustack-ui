import { HistoryOutlined, UndoOutlined } from '@ant-design/icons';
import {
  AlertBlockInfo,
  ColumnWrapper,
  GSDrawer,
  ModalFooter,
  TextAttribute
} from '@gpustack/core-ui';
import { useIntl } from '@umijs/max';
import {
  Alert,
  Button,
  Checkbox,
  Empty,
  Flex,
  Pagination,
  Spin,
  Tooltip
} from 'antd';
import classNames from 'classnames';
import dayjs from 'dayjs';
import isEqual from 'lodash/isEqual';
import { DO_NOT_NOTIFY_RECREATE } from '../../../config';
import diffStyles from '../../../style/import-yaml-drawer.module.less';
import type { ModelRevisionsController } from './hooks/use-model-revisions';
import RevisionComparisonView from './revision-comparison';
import styles from './revision-history-drawer.module.less';
import RollbackPreviewPanel from './rollback-preview-panel';

const DIFF_HEIGHT = 'calc(100vh - 240px)';

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
          padding: review ? 0 : '16px 24px 8px',
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
        <Flex component="span" align="center" className={styles.title}>
          {text(review ? 'reviewRollback' : 'titleWithName', {
            name: (
              <Tooltip title={state.model?.name}>
                <span className={styles.titleName}>{state.model?.name}</span>
              </Tooltip>
            ),
            revision: (
              <span className={styles.titleVersion}>v{review?.revision}</span>
            )
          })}
        </Flex>
      }
      onClose={onClose}
      destroyOnHidden
      mask={{ closable: !saving }}
      keyboard={!saving}
      styles={{
        wrapper: { width: 'min(max(62vw, 1120px), 96vw)' },
        body: { paddingBlock: review ? 0 : 16 }
      }}
      footer={false}
    >
      <ColumnWrapper footer={review ? undefined : footer}>
        <Flex vertical gap="small">
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
            <Flex align="center" gap="small" className={styles.toolbar}>
              <Flex align="center" gap="small" className={styles.selection}>
                <HistoryOutlined className={styles.secondary} />
                <span className={styles.selectionName}>
                  {selected
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
            </Flex>
          )}
          <Flex
            className={diffStyles.diff}
            style={{
              height: review ? 'calc(100vh - 200px)' : DIFF_HEIGHT,
              flexShrink: 0
            }}
          >
            {!review && (
              <Flex vertical className={styles.nav}>
                <Flex
                  align="center"
                  justify="space-between"
                  className={styles.navHeader}
                >
                  <span>{text('list')}</span>
                  <span className={styles.secondary}>{state.total}</span>
                </Flex>
                <Flex
                  vertical
                  gap="small"
                  className={styles.navItems}
                  aria-label={text('title')}
                >
                  {state.items.map((item) => (
                    <Flex
                      key={item.revision}
                      align="center"
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
                        <Flex align="center" gap="small">
                          <span className={styles.revisionName}>
                            {text('target', { revision: item.revision })}
                          </span>
                          <time
                            className={styles.timestamp}
                            dateTime={item.created_at}
                            title={dayjs(item.created_at).format(
                              'YYYY-MM-DD HH:mm:ss'
                            )}
                          >
                            ({dayjs(item.created_at).format('YYYY-MM-DD HH:mm')}
                            )
                          </time>
                        </Flex>
                      </button>
                      {item.revision === state.latest ? (
                        <TextAttribute>{text('latest')}</TextAttribute>
                      ) : (
                        <Tooltip title={text('rollback')}>
                          <Button
                            type="text"
                            size="small"
                            icon={<UndoOutlined />}
                            aria-label={`${text('rollback')} ${text('target', { revision: item.revision })}`}
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
                  {state.loading && <Spin className={styles.loading} />}
                  {!state.loading && !state.items.length && (
                    <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} />
                  )}
                </Flex>
                {state.total > 10 && (
                  <Flex justify="center" className={styles.pagination}>
                    <Pagination
                      simple={{ readOnly: true }}
                      size="small"
                      current={state.page}
                      pageSize={10}
                      total={state.total}
                      showSizeChanger={false}
                      disabled={browsingDisabled}
                      onChange={history.changePage}
                    />
                  </Flex>
                )}
              </Flex>
            )}
            <Flex vertical className={diffStyles.diffMain}>
              {review ? (
                <RollbackPreviewPanel review={review} />
              ) : comparison && !state.loading && !state.comparisonLoading ? (
                <RevisionComparisonView comparison={comparison} />
              ) : (
                <Flex
                  align="center"
                  justify="center"
                  className={styles.placeholder}
                >
                  {state.loading || state.comparisonLoading ? (
                    <Spin />
                  ) : (
                    <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} />
                  )}
                </Flex>
              )}
            </Flex>
          </Flex>
          {review && (
            <div
              aria-hidden={!showRestartWarning}
              style={{
                visibility: showRestartWarning ? 'visible' : 'hidden',
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
      </ColumnWrapper>
    </GSDrawer>
  );
}
