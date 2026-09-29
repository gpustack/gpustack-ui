import useUserSettings from '@/hooks/use-user-settings';
import { YamlDiffEditor } from '@gpustack/core-ui/yaml-editor';
import { useIntl } from '@umijs/max';
import { Alert, Flex, Spin } from 'antd';
import diffStyles from '../../../style/import-yaml-drawer.module.less';
import { dumpDeploymentConfig as dump } from '../../../utils/deployment-yaml';
import type { RollbackReview } from './config/types';
import styles from './revision-history-drawer.module.less';

export default function RollbackPreviewPanel({
  review
}: {
  review: RollbackReview;
}) {
  const intl = useIntl();
  const { isDarkTheme } = useUserSettings();
  const { preview } = review;
  const text = (key: string, values?: Record<string, any>) =>
    intl.formatMessage({ id: `models.revisions.${key}` }, values);

  return (
    <Flex vertical className={styles.snapshot}>
      {review.error && <Alert type="error" showIcon title={review.error} />}
      {preview && !preview.changed && (
        <Alert type="info" showIcon title={text('unchanged')} />
      )}
      {preview ? (
        <YamlDiffEditor
          readOnly
          original={dump(preview.current)}
          modified={dump(preview.desired)}
          isDarkTheme={isDarkTheme}
          height="100%"
          header={
            <div className={diffStyles.diffPanes}>
              <Flex align="center">{text('current')}</Flex>
              <Flex align="center">
                {text('target', { revision: preview.target_revision })}
              </Flex>
            </div>
          }
        />
      ) : review.loading ? (
        <Flex justify="center" align="center" className={styles.placeholder}>
          <Spin />
        </Flex>
      ) : null}
    </Flex>
  );
}
