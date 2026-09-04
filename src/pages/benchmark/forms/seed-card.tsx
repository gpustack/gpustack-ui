import { PageAction } from '@/config';
import { QuestionCircleOutlined, ReloadOutlined } from '@ant-design/icons';
import { InputNumber as CInputNumber } from '@gpustack/core-ui';
import { useIntl } from '@umijs/max';
import { Button, Checkbox, Flex, Form, Switch, Tooltip } from 'antd';
import React from 'react';
import SectionCard from '../components/section-card';
import { DATASET_SEED_MAX, DATASET_SEED_MIN, genDatasetSeed } from '../config';
import { useFormContext } from '../config/form-context';
import { FormData } from '../config/types';

// Seed card. Header = the "Random Seed" toggle. On (default): the seed is
// generated per benchmark and each stage uses a different one (see the tooltip)
// — nothing to fill, so both fields are submitted hidden rather than relying on
// an unmounted field. Off: the user pins a seed and chooses whether stages
// differ.
const SeedCard: React.FC = () => {
  const intl = useIntl();
  const form = Form.useFormInstance();
  const { action } = useFormContext();
  const disabled = action === PageAction.EDIT;

  // Random seed is the default; only an explicit false means the user pinned one.
  const randomSeed = Form.useWatch('dataset_seed_random', form) !== false;

  // Re-roll when switched on so the seed the run will use is visible right away
  // (the switch value itself is already stored by the Form.Item). Switching off
  // keeps the current number as the starting point for the user to edit.
  const handleRandomSeedChange = (checked: boolean) => {
    if (checked) {
      // Random on => a fresh seed, and each stage uses a different one by default.
      form.setFieldValue('dataset_seed', genDatasetSeed());
      form.setFieldValue('dataset_seed_increment', true);
    }
  };
  // Manual re-roll button next to the seed value (mirrors the design): mint a
  // fresh seed on demand whether Random Seed is on or off.
  const handleReroll = () => {
    form.setFieldValue('dataset_seed', genDatasetSeed());
  };

  return (
    <>
      <SectionCard
        title={intl.formatMessage({ id: 'benchmark.form.randomSeed' })}
        tip={intl.formatMessage({ id: 'benchmark.form.randomSeed.tips' })}
        open={!randomSeed}
        extra={
          <Form.Item<FormData>
            name="dataset_seed_random"
            valuePropName="checked"
            noStyle
          >
            <Switch
              size="small"
              disabled={disabled}
              onChange={handleRandomSeedChange}
            />
          </Form.Item>
        }
      >
        <Flex align="center" gap={10}>
          {/* Card-style field; the reroll button mints a fresh seed. */}
          <div style={{ flex: 1, minWidth: 0 }}>
            <Form.Item<FormData>
              name="dataset_seed"
              getValueProps={(value) => ({ value: value || null })}
              noStyle
            >
              <CInputNumber
                required
                min={DATASET_SEED_MIN}
                max={DATASET_SEED_MAX}
                disabled={disabled}
                label={intl.formatMessage({
                  id: 'playground.image.params.seed'
                })}
                style={{ width: '100%' }}
              ></CInputNumber>
            </Form.Item>
          </div>
          <Button
            icon={<ReloadOutlined />}
            disabled={disabled}
            onClick={handleReroll}
            style={{ height: 48, width: 48, flex: 'none' }}
          />
        </Flex>
        {/* Per-stage seed policy, only when the seed is pinned; when Random is
            on it is implicitly on (see the tooltip). */}
        <Form.Item<FormData>
          name="dataset_seed_increment"
          valuePropName="checked"
          noStyle
        >
          <Checkbox disabled={disabled} style={{ marginTop: 12 }}>
            <span className="row-switch">
              {intl.formatMessage({ id: 'benchmark.form.seedIncrement' })}
              <Tooltip
                title={intl.formatMessage({
                  id: 'benchmark.form.seedIncrement.tips'
                })}
              >
                <QuestionCircleOutlined className="title-help" />
              </Tooltip>
            </span>
          </Checkbox>
        </Form.Item>
      </SectionCard>
      {/* Random mode has no visible body, but both fields must stay REGISTERED
          or they wouldn't be submitted — an unmounted field isn't. They sit
          outside the card because hidden field registration isn't card body,
          and `open` gates the card's children. */}
      {randomSeed && (
        <>
          <Form.Item<FormData>
            name="dataset_seed"
            getValueProps={(value) => ({ value: value || null })}
            hidden
          >
            <CInputNumber />
          </Form.Item>
          <Form.Item<FormData>
            name="dataset_seed_increment"
            valuePropName="checked"
            hidden
          >
            <Switch />
          </Form.Item>
        </>
      )}
    </>
  );
};

export default SeedCard;
