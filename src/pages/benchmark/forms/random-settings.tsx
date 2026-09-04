import { PageAction } from '@/config';
import {
  InputNumber as CInputNumber,
  CollapsePanel,
  Select as SealSelect,
  useAppUtils
} from '@gpustack/core-ui';
import { useIntl } from '@umijs/max';
import { Flex, Form, Switch } from 'antd';
import React, { useState } from 'react';
import SectionCard from '../components/section-card';
import { DatasetValueMap, profileAllowsSlo } from '../config';
import { useFormContext } from '../config/form-context';
import { FormData } from '../config/types';
import DistributionCard from './distribution-card';
import LoadSettingsForm from './load-settings';
import MultiTurnCard from './multi-turn-card';
import SeedCard from './seed-card';
import SharedPrefixCard from './shared-prefix-card';
import SloTargetsForm from './slo-targets';

const RandomSettingsForm: React.FC = () => {
  const intl = useIntl();
  const { action, datasetList, profilesOptions } = useFormContext();
  const form = Form.useFormInstance();
  const profile = Form.useWatch('profile', form);
  const datasetName = Form.useWatch('dataset_name', form);
  const { getRuleMessage } = useAppUtils();

  const disabled = action === PageAction.EDIT;

  // SLO is gated by TARGET, not by axis: setting a threshold switches the delivered
  // answer from "peak throughput" to "max load meeting the SLO", so it is available
  // on BOTH axes (asking for req/s under a TTFT budget is the more common capacity
  // question) and hidden only for a preset whose answer IS the peak. See
  // profileAllowsSlo; keep in sync with the nav's copy in forms/index.tsx.
  const showSLO = profileAllowsSlo(profile, profilesOptions as any[]);
  const isRandom = datasetName === DatasetValueMap.Random;

  // Collapsible field groups, all open by default: Workload / SLO / Load / Stop
  // Conditions. Every field now has a real home (no "Advanced" catch-all), so
  // there is nothing left to hide behind a collapsed section. Uses the app's
  // CollapsePanel for a style consistent with the model form & Configuration.
  const [groupKeys, setGroupKeys] = useState<string[]>([
    'dataset',
    'slo',
    'load',
    'execution'
  ]);
  const handleGroupChange = (keys: string | string[]) =>
    setGroupKeys(Array.isArray(keys) ? keys : [keys]);

  // ---- Group 1: Dataset (what data to send) ----
  // The dataset itself plus the two length means; everything that further shapes
  // the synthetic data is an opt-in card of its own (seed / length distribution /
  // shared prefix / multi-turn), and only applies to the Random dataset.
  const datasetContent = (
    <>
      <Form.Item<FormData>
        name="dataset_name"
        rules={[
          {
            required: true,
            message: getRuleMessage('select', 'benchmark.table.dataset')
          }
        ]}
      >
        <SealSelect
          disabled={disabled}
          options={datasetList?.map((item) => ({
            ...item,
            label: item.label,
            value: item.label
          }))}
          label={intl.formatMessage({ id: 'benchmark.table.dataset' })}
          required
        ></SealSelect>
      </Form.Item>
      {isRandom && (
        <>
          <Form.Item<FormData>
            name="dataset_input_tokens"
            rules={[
              {
                required: true,
                message: getRuleMessage(
                  'input',
                  'benchmark.table.inputTokenLength'
                )
              }
            ]}
          >
            <CInputNumber
              min={0}
              disabled={disabled}
              label={intl.formatMessage({
                id: 'benchmark.table.inputTokenLength'
              })}
              required
            ></CInputNumber>
          </Form.Item>
          <Form.Item<FormData>
            name="dataset_output_tokens"
            rules={[
              {
                required: true,
                message: getRuleMessage(
                  'input',
                  'benchmark.table.outputTokenLength'
                )
              }
            ]}
          >
            <CInputNumber
              min={0}
              disabled={disabled}
              label={intl.formatMessage({
                id: 'benchmark.table.outputTokenLength'
              })}
              required
            ></CInputNumber>
          </Form.Item>
          <SeedCard />
          <DistributionCard />
          <SharedPrefixCard />
          <MultiTurnCard />
        </>
      )}
    </>
  );

  // ---- Group: Stop Conditions (when the benchmark stops) ----
  // General runtime caps that apply to ANY mode (the auto-tune budget lives in
  // the Load / Stages card). Every field here now has a real home, so there is no
  // longer an "Advanced" catch-all: turns → Workload, warmup/cooldown → Load,
  // per-stage seed → the Seed card.
  const executionLimitsContent = (
    <>
      {/* Max Errors + Max Error Rate are a natural pair, so they share a row.
          Default bottom margin (no marginBottom:0) so the row doesn't overlap the
          Stop-on-Saturation card below it. */}
      <Flex gap={12}>
        <Form.Item<FormData> name="max_errors" style={{ flex: 1 }}>
          <CInputNumber
            min={0}
            disabled={disabled}
            label={intl.formatMessage({ id: 'benchmark.form.maxErrors' })}
            style={{ width: '100%' }}
          ></CInputNumber>
        </Form.Item>
        <Form.Item<FormData> name="max_error_rate" style={{ flex: 1 }}>
          <CInputNumber
            // A FRACTION in the open interval (0, 1): guidellm's constraint
            // rejects both endpoints, so the form must not be able to produce
            // them. "Tolerate everything" is expressed by leaving this empty,
            // not by entering 1.
            min={0.01}
            max={0.99}
            step={0.01}
            disabled={disabled}
            label={intl.formatMessage({ id: 'benchmark.form.maxErrorRate' })}
            style={{ width: '100%' }}
          ></CInputNumber>
        </Form.Item>
      </Flex>
      {/* Stop-on-saturation maps to guidellm's native OverSaturationConstraint
          (stop once throughput saturates). A general cap (not auto-tune only),
          rendered as an opt-in card to match the Workload cards' look. */}
      <SectionCard
        title={intl.formatMessage({ id: 'benchmark.form.stopOnSaturation' })}
        tip={intl.formatMessage({ id: 'benchmark.form.stopOnSaturation.tips' })}
        extra={
          <Form.Item<FormData>
            name="stop_on_saturation"
            valuePropName="checked"
            noStyle
          >
            <Switch size="small" disabled={disabled} />
          </Form.Item>
        }
      />
    </>
  );

  // Top-level collapsible groups (order = the user's flow: what data → the goal
  // → how to drive → when to stop). SLO is the goal, so it sits right after
  // Workload and before Load. The header carries a data-field anchor so the top
  // scroll-spy nav can jump to each section (see segmentOptions in ./index).
  const groupLabel = (field: string, id: string) => (
    <span data-field={field}>{intl.formatMessage({ id })}</span>
  );
  return (
    <CollapsePanel
      activeKey={groupKeys}
      accordion={false}
      onChange={handleGroupChange}
      items={[
        {
          key: 'dataset',
          label: groupLabel('dataset', 'benchmark.form.group.dataset'),
          forceRender: true,
          children: datasetContent
        },
        ...(showSLO
          ? [
              {
                key: 'slo',
                label: groupLabel('slo', 'benchmark.form.group.slo'),
                forceRender: true,
                children: <SloTargetsForm />
              }
            ]
          : []),
        {
          key: 'load',
          label: groupLabel('load', 'benchmark.form.group.load'),
          forceRender: true,
          children: <LoadSettingsForm />
        },
        {
          key: 'execution',
          label: groupLabel('execution', 'benchmark.form.group.execution'),
          forceRender: true,
          children: executionLimitsContent
        }
      ]}
    ></CollapsePanel>
  );
};

export default RandomSettingsForm;
