import useUserSettings from '@/hooks/use-user-settings';
import { HighlightCode } from '@gpustack/core-ui';
import { YamlDiffEditor } from '@gpustack/core-ui/yaml-editor';
import { useIntl } from '@umijs/max';
import { Flex } from 'antd';
import classNames from 'classnames';
import diffStyles from '../../../style/import-yaml-drawer.module.less';
import { dumpDeploymentConfig as dump } from '../../../utils/deployment-yaml';
import type { RevisionComparison } from './config/types';
import styles from './revision-history-drawer.module.less';

export default function RevisionComparisonView({
  comparison
}: {
  comparison: RevisionComparison;
}) {
  const intl = useIntl();
  const { isDarkTheme } = useUserSettings();
  const { target, previous } = comparison;
  const text = (key: string, values?: Record<string, any>) =>
    intl.formatMessage({ id: `models.revisions.${key}` }, values);

  if (!previous) {
    return (
      <Flex vertical className={styles.snapshot}>
        <div className={styles.snapshotNote}>
          {text(target.revision === 1 ? 'initialSnapshot' : 'missingPrevious', {
            revision: target.revision - 1
          })}
        </div>
        <Flex vertical className={styles.snapshotContent}>
          <HighlightCode
            code={dump(target.spec)}
            lang="yaml"
            theme={isDarkTheme ? 'dark' : 'light'}
            showHeader={false}
            height="100%"
            xScrollable
          />
        </Flex>
      </Flex>
    );
  }

  return (
    <YamlDiffEditor
      readOnly
      isDarkTheme={isDarkTheme}
      original={dump(previous.spec)}
      modified={dump(target.spec)}
      height="100%"
      header={
        <div className={classNames(diffStyles.diffPanes, styles.paneHeaders)}>
          <Flex align="center" gap={4}>
            {text('previousVersion', {
              revision: (
                <span className={styles.paneVersion}>v{previous.revision}</span>
              )
            })}
          </Flex>
          <Flex align="center" gap={4}>
            {text('selectedVersion', {
              revision: (
                <span className={styles.paneVersion}>v{target.revision}</span>
              )
            })}
          </Flex>
        </div>
      }
    />
  );
}
