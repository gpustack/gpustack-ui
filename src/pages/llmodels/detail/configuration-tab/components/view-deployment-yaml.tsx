import useUserSettings from '@/hooks/use-user-settings';
import { GSDrawer, HighlightCode, icons } from '@gpustack/core-ui';
import { useIntl } from '@umijs/max';
import { Button, Flex, Spin, Typography } from 'antd';
import type { ListItem } from '../../../config/types';
import useDeploymentYaml from '../hooks/use-deployment-yaml';

export default function ViewDeploymentYaml({ model }: { model: ListItem }) {
  const intl = useIntl();
  const { isDarkTheme } = useUserSettings();
  const yaml = useDeploymentYaml(model);
  const t = (key: string) =>
    intl.formatMessage({ id: `modelMonitoring.${key}` });
  return (
    <>
      <Button icon={icons.Yaml} onClick={yaml.show}>
        {t('viewYaml')}
      </Button>
      <GSDrawer
        title={`${model.name} · YAML`}
        open={yaml.open}
        onClose={yaml.close}
        destroyOnHidden
        styles={{
          wrapper: { width: 840, maxWidth: '100vw' },
          body: { paddingInline: 'var(--ant-padding-lg)' }
        }}
      >
        <Flex vertical gap={16}>
          <Flex justify="flex-end">
            <Button onClick={yaml.refresh} loading={yaml.state?.loading}>
              {t('refresh')}
            </Button>
          </Flex>
          {!yaml.state || yaml.state.loading ? (
            <Spin />
          ) : yaml.state.error || !yaml.state.data ? (
            <Typography.Text type="secondary">
              {t('metadataUnavailable')}
            </Typography.Text>
          ) : (
            <HighlightCode
              code={yaml.state.data}
              copyValue={yaml.state.data}
              lang="yaml"
              copyable
              theme={isDarkTheme ? 'dark' : 'light'}
              height="65vh"
              xScrollable
            />
          )}
        </Flex>
      </GSDrawer>
    </>
  );
}
