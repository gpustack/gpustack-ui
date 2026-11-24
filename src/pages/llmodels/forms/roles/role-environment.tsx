import { LabelSelector } from '@gpustack/core-ui';
import { useIntl } from '@umijs/max';
import { Form, Input, Segmented } from 'antd';

export const RoleEnvironmentMode = ({ index }: { index: number }) => {
  const intl = useIntl();
  const form = Form.useFormInstance();
  const deploymentEnv =
    Form.useWatch('env', { form, preserve: true }) ?? form.getFieldValue('env');
  const hasDeploymentEnv = Object.keys(deploymentEnv ?? {}).length > 0;
  const modeLabel = intl.formatMessage({ id: 'models.form.roles.env.mode' });

  return (
    // Keep the mode field registered while the selector is hidden.
    <Form.Item name={['roles', index, 'env_mode']} noStyle>
      {hasDeploymentEnv ? (
        <Segmented
          aria-label={modeLabel}
          size="small"
          shape="round"
          style={{ fontSize: 12, maxWidth: '100%' }}
          styles={{
            item: { minWidth: 0, alignContent: 'center' },
            label: { whiteSpace: 'normal', overflowWrap: 'anywhere' }
          }}
          options={[
            {
              value: 'merge',
              label: intl.formatMessage({ id: 'models.form.roles.env.merge' })
            },
            {
              value: 'replace',
              label: intl.formatMessage({ id: 'models.form.roles.env.replace' })
            }
          ]}
        />
      ) : (
        <Input type="hidden" />
      )}
    </Form.Item>
  );
};

const RoleEnvironment = ({ index }: { index: number }) => {
  const intl = useIntl();

  return (
    <Form.Item name={['roles', index, 'env']}>
      <LabelSelector
        label={intl.formatMessage({ id: 'models.form.env' })}
        btnText={intl.formatMessage({ id: 'common.button.vars' })}
      />
    </Form.Item>
  );
};

export default RoleEnvironment;
