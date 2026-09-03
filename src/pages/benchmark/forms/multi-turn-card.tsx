import { PageAction } from '@/config';
import { MinusOutlined, PlusOutlined } from '@ant-design/icons';
import { useIntl } from '@umijs/max';
import { Button, Flex, Form, InputNumber, Switch } from 'antd';
import React from 'react';
import SectionCard from '../components/section-card';
import { useFormContext } from '../config/form-context';
import { FormData } from '../config/types';

// Multi-turn (synthetic-only `turns`): shapes what each request IS (a running
// conversation), so it's an opt-in card in Workload alongside the other
// data-shape cards, not a generic "advanced" bucket. On => turns >= 2; off =>
// cleared (backend treats absent as single-turn). turns == 1 (legacy) reads as
// off. One-row card — the stepper + enable switch both sit in the header.
const MultiTurnCard: React.FC = () => {
  const intl = useIntl();
  const form = Form.useFormInstance();
  const { action } = useFormContext();
  const disabled = action === PageAction.EDIT;

  const turns = Form.useWatch('turns', form);
  const multiTurnOn = !!turns && turns > 1;
  const handleMultiTurnToggle = (checked: boolean) => {
    form.setFieldValue('turns', checked ? 2 : null);
  };
  // The −/+ stepper only runs while multi-turn is on; the switch owns on/off
  // (clamping the floor to 2, since 1 turn == single-turn == off).
  const handleTurnUp = () =>
    form.setFieldValue('turns', Math.min(64, (Number(turns) || 1) + 1));
  const handleTurnDown = () =>
    form.setFieldValue('turns', Math.max(2, (Number(turns) || 2) - 1));

  return (
    <SectionCard
      title={intl.formatMessage({ id: 'benchmark.form.multiTurn' })}
      tip={intl.formatMessage({ id: 'benchmark.form.multiTurn.tips' })}
      extra={
        <Flex align="center" gap={8}>
          {/* "turns" label + −/+ stepper in one bordered pill (dimmed when off),
              then the enable switch — mirrors the design. The stepper is small so
              the row stays as short as a plain switch card rather than towering
              over it. */}
          <Flex
            align="center"
            gap={2}
            style={{
              border: '1px solid var(--ant-color-border)',
              borderRadius: 8,
              background: 'var(--ant-color-fill-quaternary)',
              padding: '0 2px 0 8px',
              opacity: multiTurnOn ? 1 : 0.5
            }}
          >
            <span
              style={{ fontSize: 12, color: 'var(--ant-color-text-tertiary)' }}
            >
              {intl.formatMessage({ id: 'benchmark.form.turns.unit' })}
            </span>
            <Button
              type="text"
              size="small"
              icon={<MinusOutlined />}
              disabled={disabled || !multiTurnOn}
              onClick={handleTurnDown}
            />
            <Form.Item<FormData>
              name="turns"
              getValueProps={(value) => ({ value: value ?? 1 })}
              noStyle
            >
              <InputNumber
                // When off the field shows a disabled "1"; keep min at 1 then so
                // antd doesn't flag it out-of-range (red). On => floor is 2
                // (1 turn == single-turn == off).
                min={multiTurnOn ? 2 : 1}
                size="small"
                controls={false}
                variant="borderless"
                disabled={disabled || !multiTurnOn}
                style={{ width: 36, textAlign: 'center' }}
              />
            </Form.Item>
            <Button
              type="text"
              size="small"
              icon={<PlusOutlined />}
              disabled={disabled || !multiTurnOn}
              onClick={handleTurnUp}
            />
          </Flex>
          <Switch
            size="small"
            checked={multiTurnOn}
            disabled={disabled}
            onChange={handleMultiTurnToggle}
          />
        </Flex>
      }
    />
  );
};

export default MultiTurnCard;
