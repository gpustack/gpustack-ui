import { PageAction } from '@/config';
import { AutoTooltip, Select as SealSelect } from '@gpustack/core-ui';
import { useIntl } from '@umijs/max';
import { Form, Select, Tag } from 'antd';
import React from 'react';
import {
  AUTO_TUNE_DEFAULTS,
  genDatasetSeed,
  slaFieldsFromTargets,
  slaTargetsFromFields
} from '../config';
import { useFormContext } from '../config/form-context';
import { FormData, ProfileOption, StageRow } from '../config/types';
import RandomSettingsForm from './random-settings';

// The Preset (profile) is the single top-level selector. Picking one auto-fills
// the form from its builtin config (load_type / sla / dataset defaults); the
// "Custom" preset starts blank for fully manual config. `load_type` (not a
// "mode") is the traffic-shape axis; field visibility derives from it.
const DatasetForm: React.FC = () => {
  const intl = useIntl();
  const form = Form.useFormInstance();
  const { action, datasetList, profilesOptions, applyAutoName } =
    useFormContext();
  const disabled = action === PageAction.EDIT;

  // The blurb under the selector: a strategy tag (Auto-tune for named presets,
  // Custom for the manual one) + the profile's own description. Reuses the same
  // text the option tooltip shows (tips i18n key, else the backend description).
  const selectedProfile = Form.useWatch('profile', form);
  const selectedOption = (profilesOptions as any[])?.find(
    (o) => o.value === selectedProfile
  );
  const isCustomProfile = selectedProfile === 'Custom';
  const profileDesc = !selectedOption
    ? ''
    : isCustomProfile
      ? intl.formatMessage({ id: 'benchmark.form.profile.custom.tips' })
      : selectedOption.tips
        ? intl.formatMessage({ id: selectedOption.tips })
        : selectedOption.config?.description || '';

  const handleProfileChange = (profile: string) => {
    const config: Partial<ProfileOption> =
      (profilesOptions as any[])?.find((o) => o.value === profile)?.config ||
      {};
    // Default to auto-tune when the profile config doesn't say otherwise (named
    // presets set it explicitly; Custom omits it → default on, so it aligns with
    // the presets — same Load/Execution Limits fields — and can be toggled off
    // for manual stages).
    const autoTune = config.auto_tune ?? true;
    // Auto-tune presets have no manual stages; the ramp discovers points itself.
    const stages: StageRow[] = autoTune ? [] : (config.stages ?? []);
    // Switching preset never changes where the seed comes from: a random one is
    // re-rolled (kept visible rather than blanked), a seed the user pinned for a
    // reproducible run is kept. A preset's own dataset_seed is just a base
    // default — it must NOT flip the run out of random mode, or picking a preset
    // would silently pin every benchmark to the same seed, which is the very
    // cache-skew this feature exists to avoid. It only serves as a fallback when
    // nothing is pinned yet.
    const seedRandom = form.getFieldValue('dataset_seed_random') !== false;
    form.setFieldsValue({
      load_type: config.load_type ?? 'fixed_rate',
      auto_tune: autoTune,
      lower_bound: config.lower_bound ?? AUTO_TUNE_DEFAULTS.lower_bound,
      upper_bound: config.upper_bound ?? AUTO_TUNE_DEFAULTS.upper_bound,
      max_points: config.max_points ?? AUTO_TUNE_DEFAULTS.max_points,
      max_total_seconds:
        config.max_total_seconds ?? AUTO_TUNE_DEFAULTS.max_total_seconds,
      dataset_name: config.dataset_name,
      dataset_input_tokens: config.dataset_input_tokens ?? null,
      dataset_output_tokens: config.dataset_output_tokens ?? null,
      dataset_seed: seedRandom
        ? genDatasetSeed()
        : (form.getFieldValue('dataset_seed') ?? config.dataset_seed ?? null),
      dataset_seed_random: seedRandom,
      dataset_seed_increment: (config as any).dataset_seed_increment ?? true,
      total_requests: config.total_requests ?? null,
      max_seconds: config.max_seconds ?? null,
      request_rate: config.request_rate ?? -1,
      stages: stages,
      // The 9 flat thresholds are what the API takes; `sla_targets` is the form's
      // editable view of them and must be re-derived whenever the preset rewrites
      // them, or the list would still show the previous preset's rows.
      ...slaFieldsFromTargets(slaTargetsFromFields(config)),
      sla_targets: slaTargetsFromFields(config)
    });
    applyAutoName?.();
  };

  return (
    <>
      <Form.Item<FormData>
        data-field="profile"
        name="profile"
        rules={[{ required: true }]}
        style={{ marginBottom: 8 }}
      >
        <SealSelect
          disabled={disabled}
          onChange={handleProfileChange}
          label={intl.formatMessage({ id: 'benchmark.form.profile' })}
          required
        >
          {(profilesOptions as any[])?.map((item) => (
            <Select.Option
              key={item.value}
              value={item.value}
              label={item.label}
            >
              <AutoTooltip
                ghost
                showTitle={!!(item.tips || item.config?.description)}
                title={
                  item.tips
                    ? intl.formatMessage({ id: item.tips })
                    : item.config?.description || false
                }
              >
                {item.label}
              </AutoTooltip>
            </Select.Option>
          ))}
        </SealSelect>
      </Form.Item>

      {/* Strategy tag + description for the picked profile — mirrors the design's
          blurb under the selector so the user knows what the preset does. */}
      {selectedOption && (
        <div
          style={{
            display: 'flex',
            alignItems: 'flex-start',
            gap: 8,
            marginBottom: 20
          }}
        >
          <Tag
            color={isCustomProfile ? 'green' : 'blue'}
            bordered={false}
            style={{ marginInlineEnd: 0, fontWeight: 600, borderRadius: 6 }}
          >
            {isCustomProfile
              ? intl.formatMessage({ id: 'backend.custom' })
              : intl.formatMessage({ id: 'benchmark.form.autoTune' })}
          </Tag>
          {profileDesc && (
            <div
              style={{
                flex: 1,
                fontSize: 12,
                lineHeight: 1.6,
                color: 'var(--ant-color-text-secondary)'
              }}
            >
              {profileDesc}
            </div>
          )}
        </div>
      )}

      <RandomSettingsForm datasetList={datasetList} />
    </>
  );
};

export default DatasetForm;
