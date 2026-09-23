import { BulbOutlined } from '@ant-design/icons';
import { useIntl } from '@umijs/max';
import { Button, Flex } from 'antd';
import { createStyles } from 'antd-style';

const useStyles = createStyles(({ css }) => ({
  card: css`
    padding: 12px 16px;
    border-radius: 8px;
    background: var(--ant-color-primary-bg);
    border: 1px solid var(--ant-color-primary-border);
    .steps {
      color: var(--ant-color-text-secondary);
      font-size: 13px;
    }
    .note {
      color: var(--ant-color-text-tertiary);
      font-size: 12px;
    }
  `
}));

interface OnboardingProps {
  hosts: number;
  onDismiss: () => void;
}

/**
 * [S1c] Shown above the table while nothing has been filled in. It does not
 * block anything — "same host" works without it — and it never uses the words
 * layer, label key or declaration.
 *
 * 🔴 The «已识别 N 台主机、M 个加速器域（自动）» variant is gone. It was true only
 * while the accelerator domain was a built-in dimension the server filled in by
 * itself; a domain is now a layer someone adds, so nothing is discovered before
 * anyone has declared anything — which is exactly when this card is on screen.
 */
const Onboarding: React.FC<OnboardingProps> = ({ hosts, onDismiss }) => {
  const intl = useIntl();
  const { styles } = useStyles();

  return (
    <Flex orientation="vertical" gap={8} className={styles.card}>
      <Flex align="center" gap={8}>
        <BulbOutlined style={{ color: 'var(--ant-color-primary)' }} />
        <span>
          {intl.formatMessage(
            { id: 'clusters.topology.onboarding.hosts' },
            { hosts }
          )}{' '}
          {intl.formatMessage({ id: 'clusters.topology.onboarding.goal' })}
        </span>
      </Flex>
      <span className="steps">
        {intl.formatMessage({ id: 'clusters.topology.onboarding.steps' })}
      </span>
      <Flex align="center" justify="space-between" gap={12}>
        <span className="note">
          {intl.formatMessage({ id: 'clusters.topology.onboarding.domains' })}
        </span>
        <Button size="small" onClick={onDismiss}>
          {intl.formatMessage({ id: 'clusters.topology.onboarding.dismiss' })}
        </Button>
      </Flex>
    </Flex>
  );
};

export default Onboarding;
