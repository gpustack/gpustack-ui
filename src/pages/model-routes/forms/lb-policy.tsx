import { CardWrapper } from '@gpustack/core-ui';
import { useIntl } from '@umijs/max';
import { Flex, Form, Radio, Tooltip } from 'antd';
import { createStyles } from 'antd-style';
import DecisionServiceFields from '../components/lb-policy/decision-service-fields';
import PolicyPluginSection from '../components/lb-policy/policy-plugin-section';
import PolicyWeightField from '../components/lb-policy/policy-weight-field';
import SessionAffinityFields from '../components/lb-policy/session-affinity-fields';
import { LB_FORM_MODE } from '../config';
import type { FormData } from '../config/types';

const useStyles = createStyles(({ css }, isPolicy: boolean) => ({
  sectionTitle: css`
    font-size: var(--ant-font-size);
    font-weight: 500;
  `,
  sectionHeader: css`
    padding: var(--ant-padding-sm) var(--ant-padding);
    background-color: ${isPolicy
      ? 'var(--ant-color-fill-quaternary)'
      : 'var(--ant-color-bg-container)'};
  `,
  sectionBody: css`
    border-block-start: 1px solid var(--ant-color-border-secondary);
    padding-inline: var(--ant-padding);
    background-color: var(--ant-color-bg-elevated);
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
  const form = Form.useFormInstance<FormData>();
  const mode = Form.useWatch('lb_policy_mode', form);
  const { styles } = useStyles(mode === LB_FORM_MODE.policy);

  return (
    <>
      <Flex
        data-field="lb_policy_mode"
        justify="space-between"
        align="center"
        style={{ minHeight: 40, marginBottom: 8, paddingInline: 5 }}
      >
        <span className={styles.sectionTitle}>
          {intl.formatMessage({ id: 'routes.lb.routeBy' })}
        </span>
      </Flex>
      <CardWrapper
        style={{
          padding: 0,
          marginBottom: 'var(--ant-margin-sm)',
          overflow: 'hidden'
        }}
      >
        <Form.Item name="lb_policy_mode" hidden noStyle>
          <input />
        </Form.Item>
        <div className={styles.sectionHeader}>
          <Radio.Group
            orientation="horizontal"
            aria-label={intl.formatMessage({ id: 'routes.lb.routeBy' })}
            value={mode}
            onChange={(event) => onModeChange(event.target.value)}
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
                      {intl.formatMessage({
                        id: 'routes.lb.form.mode.weighted'
                      })}
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
          <div className={styles.sectionBody}>
            <SessionAffinityFields />
            <PolicyPluginSection plugin="least-load">
              <PolicyWeightField plugin="least-load" />
            </PolicyPluginSection>
            <DecisionServiceFields getTargetModelNames={getTargetModelNames} />
          </div>
        )}
      </CardWrapper>
    </>
  );
};

export default LbPolicySection;
