import { useIntl } from '@umijs/max';
import { Flex, Form, Segmented, Tooltip } from 'antd';
import { createStyles } from 'antd-style';
import DecisionServiceFields from '../components/lb-policy/decision-service-fields';
import PolicyPluginSection from '../components/lb-policy/policy-plugin-section';
import PolicyWeightField from '../components/lb-policy/policy-weight-field';
import SessionAffinityFields from '../components/lb-policy/session-affinity-fields';
import { LB_FORM_MODE } from '../config';
import type { FormData } from '../config/types';

const useStyles = createStyles(({ css }) => ({
  sectionTitle: css`
    font-size: var(--ant-font-size);
    font-weight: 500;
  `,
  sectionCard: css`
    border: 1px solid var(--ant-color-border);
    border-radius: 6px;
    padding: 14px 10px 12px;
    margin-bottom: 12px;
  `
}));

const LbPolicySection = ({
  onModeChange,
  getTargetModelNames
}: {
  onModeChange: (mode: string) => void;
  getTargetModelNames: () => string[];
}) => {
  const intl = useIntl();
  const { styles } = useStyles();
  const form = Form.useFormInstance<FormData>();
  const mode = Form.useWatch('lb_policy_mode', form);

  return (
    <>
      <Flex
        justify="space-between"
        align="center"
        style={{ minHeight: 40, marginBottom: 8, paddingInline: 5 }}
      >
        <span className={styles.sectionTitle}>
          {intl.formatMessage({ id: 'routes.lb.routeBy' })}
        </span>
      </Flex>
      <div className={styles.sectionCard}>
        <Form.Item name="lb_policy_mode" hidden noStyle>
          <input />
        </Form.Item>
        <Segmented
          block
          size="middle"
          value={mode}
          onChange={(value) => onModeChange(value as string)}
          options={[
            {
              value: LB_FORM_MODE.weighted,
              label: (
                <Tooltip
                  title={intl.formatMessage({
                    id: 'routes.lb.form.mode.weighted.tips'
                  })}
                >
                  <span>
                    {intl.formatMessage({ id: 'routes.lb.form.mode.weighted' })}
                  </span>
                </Tooltip>
              )
            },
            {
              value: LB_FORM_MODE.policy,
              label: (
                <Tooltip
                  title={intl.formatMessage({
                    id: 'routes.lb.form.mode.policy.tips'
                  })}
                >
                  <span>
                    {intl.formatMessage({ id: 'routes.lb.form.mode.policy' })}
                  </span>
                </Tooltip>
              )
            }
          ]}
        />
      </div>
      {mode === LB_FORM_MODE.policy && (
        <>
          <SessionAffinityFields />
          <PolicyPluginSection plugin="least-load">
            <PolicyWeightField plugin="least-load" />
          </PolicyPluginSection>
          <DecisionServiceFields getTargetModelNames={getTargetModelNames} />
        </>
      )}
    </>
  );
};

export default LbPolicySection;
