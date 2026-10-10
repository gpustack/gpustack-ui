import { IconFont } from '@gpustack/core-ui';
import { useIntl } from '@umijs/max';
import { Button, Divider, Flex, Form } from 'antd';
import { createStyles } from 'antd-style';
import { useState } from 'react';
import { LB_POLICY_PLUGINS, POLICY_WEIGHT_CONFIG } from '../../config';
import type { FormData } from '../../config/types';
import {
  toDecisionServiceWeight,
  toPolicyInfluence
} from '../../utils/lb-policy-weight';
import WeightSlider from './weight-slider';

const useStyles = createStyles(({ css }) => ({
  advancedToggle: css`
    height: var(--ant-control-height-sm);
    margin-inline-start: calc(0px - var(--ant-padding-xs));
    padding-inline: var(--ant-padding-xs);
    font-size: var(--ant-font-size-sm);
    color: var(--ant-color-text-secondary);

    &&:focus-visible {
      outline: 2px solid var(--ant-color-primary);
      outline-offset: 2px;
    }
  `
}));

const PolicyWeightField = ({
  plugin
}: {
  plugin: keyof typeof LB_POLICY_PLUGINS;
}) => {
  const intl = useIntl();
  const { styles } = useStyles();
  const form = Form.useFormInstance<FormData>();
  const name: ['plugins', typeof plugin, 'weight'] = [
    'plugins',
    plugin,
    'weight'
  ];
  const isDecisionService = plugin === 'decision-service';
  const { min, max, step, defaultValue } = isDecisionService
    ? POLICY_WEIGHT_CONFIG.decision
    : POLICY_WEIGHT_CONFIG.influence;
  const transform = isDecisionService
    ? toDecisionServiceWeight
    : toPolicyInfluence;
  // Only persisted weights auto-reveal the field. An untouched plugin keeps
  // weight unset so the server can apply its built-in default.
  const [open, setOpen] = useState(() => form.getFieldValue(name) != null);

  return (
    <div style={{ marginTop: open ? 'var(--ant-margin)' : 0 }}>
      {!open && (
        <Divider style={{ marginBottom: 0 }}>
          <Button
            type="text"
            size="small"
            aria-expanded={false}
            className={styles.advancedToggle}
            onClick={() => {
              setOpen(true);
              if (form.getFieldValue(name) == null) {
                form.setFieldValue(name, defaultValue);
              }
            }}
          >
            <Flex component="span" align="center" gap="var(--ant-padding-xxs)">
              {intl.formatMessage({ id: 'routes.form.target.advanced' })}
              <IconFont type="icon-down" style={{ fontSize: 12 }} />
            </Flex>
          </Button>
        </Divider>
      )}
      {open && (
        <Form.Item name={name} noStyle getValueFromEvent={transform}>
          <WeightSlider
            label={intl.formatMessage({ id: 'routes.lb.influence' })}
            min={min}
            max={max}
            step={step}
          />
        </Form.Item>
      )}
    </div>
  );
};

export default PolicyWeightField;
