import { useIntl } from '@umijs/max';
import { Alert, Flex } from 'antd';
import { createStyles } from 'antd-style';

const useStyles = createStyles(({ css }) => ({
  steps: css`
    margin: 0;
    padding: 0;
    list-style-position: inside;
  `
}));

/** Location setup guidance shared by the table and tree views. */
const Onboarding: React.FC = () => {
  const intl = useIntl();
  const { styles } = useStyles();

  return (
    <Alert
      type="info"
      showIcon
      styles={{ title: { fontSize: 'var(--ant-font-size)' } }}
      title={intl.formatMessage({ id: 'clusters.topology.onboarding.goal' })}
      description={
        <Flex orientation="vertical" gap={4}>
          <Flex
            component="ol"
            wrap
            gap="var(--ant-padding-xxs) var(--ant-padding)"
            className={styles.steps}
          >
            <li>
              {intl.formatMessage({
                id: 'clusters.topology.onboarding.step.select'
              })}
            </li>
            <li>
              {intl.formatMessage({
                id: 'clusters.topology.onboarding.step.setLocation'
              })}
            </li>
            <li>
              {intl.formatMessage({
                id: 'clusters.topology.onboarding.step.deploy'
              })}
            </li>
          </Flex>
          <span>
            {intl.formatMessage({ id: 'clusters.topology.onboarding.domains' })}
          </span>
          <span>
            {intl.formatMessage({ id: 'clusters.topology.noRebalance' })}
          </span>
        </Flex>
      }
    />
  );
};

export default Onboarding;
