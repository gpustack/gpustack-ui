import { useIntl } from '@umijs/max';
import { Descriptions } from 'antd';
import { DescriptionsItemType } from 'antd/es/descriptions';
import { round } from 'lodash';
import React from 'react';
import styled from 'styled-components';
import {
  DatasetValueMap,
  loadAxisLabelId,
  loadTypeOptions,
  loadValueDecimals
} from '../../config';
import { useDetailContext } from '../../config/detail-context';

const Wrapper = styled.div`
  display: flex;
  flex-direction: column;
  gap: 20px;
  .group + .group {
    border-top: 1px solid var(--ant-color-border-secondary);
    padding-top: 18px;
  }
  .group-label {
    font-size: 12px;
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.03em;
    color: var(--ant-color-text-tertiary);
    margin-bottom: 14px;
  }
`;

const Benchmark: React.FC = () => {
  const intl = useIntl();
  const { detailData, profilesOptions } = useDetailContext();
  const t = (id?: string) => (id ? intl.formatMessage({ id }) : '');

  const d = detailData as any;
  const isShareGPT = d?.dataset_name === DatasetValueMap.ShareGPT;
  const resolvedDatasetLabel = d?.dataset_name || '-';
  const dec = loadValueDecimals(d);
  const has = (v: any) =>
    v !== undefined &&
    v !== null &&
    v !== '' &&
    !(Array.isArray(v) && v.length === 0);

  const mk = () => {
    const arr: DescriptionsItemType[] = [];
    const add = (key: string, labelId: string, value: React.ReactNode) =>
      arr.push({ key, label: t(labelId), children: value });
    const addIf = (
      key: string,
      labelId: string,
      raw: any,
      value?: React.ReactNode
    ) => {
      if (has(raw)) add(key, labelId, value ?? raw);
    };
    return { arr, add, addIf };
  };

  // ── Dataset ──────────────────────────────────────────────────────────────
  const data = mk();
  data.add('dataset', 'benchmark.table.dataset', resolvedDatasetLabel);
  if (!isShareGPT) {
    data.add(
      'tokenLen',
      'benchmark.detail.inputOutputTokenLength',
      <span>
        {d?.dataset_input_tokens || '-'} / {d?.dataset_output_tokens || '-'}
      </span>
    );
  }
  data.addIf('inStdev', 'benchmark.form.inputStdev', d?.dataset_input_stdev);
  data.addIf('inMin', 'benchmark.form.inputMin', d?.dataset_input_min);
  data.addIf('inMax', 'benchmark.form.inputMax', d?.dataset_input_max);
  data.addIf('outStdev', 'benchmark.form.outputStdev', d?.dataset_output_stdev);
  data.addIf('outMin', 'benchmark.form.outputMin', d?.dataset_output_min);
  data.addIf('outMax', 'benchmark.form.outputMax', d?.dataset_output_max);
  data.addIf(
    'prefix',
    'benchmark.form.sharedPrefix',
    d?.prefix_buckets?.length ? d.prefix_buckets : null,
    (d?.prefix_buckets || [])
      .map(
        (b: any) =>
          `${b.prefix_tokens} tok${b.prefix_count ? ` ×${b.prefix_count}` : ''}`
      )
      .join(', ')
  );
  if (!isShareGPT) {
    data.addIf('seed', 'playground.image.params.seed', d?.dataset_seed);
  }

  // ── Latency SLA ──────────────────────────────────────────────────────────
  const sla = mk();
  sla.addIf('slaTtft', 'benchmark.form.sla.ttft', d?.sla_avg_ttft_ms);
  sla.addIf('slaP95Ttft', 'benchmark.form.sla.p95Ttft', d?.sla_p95_ttft_ms);
  sla.addIf('slaP99Ttft', 'benchmark.form.sla.p99Ttft', d?.sla_p99_ttft_ms);
  sla.addIf('slaTpot', 'benchmark.form.sla.tpot', d?.sla_avg_tpot_ms);
  sla.addIf('slaP95Tpot', 'benchmark.form.sla.p95Tpot', d?.sla_p95_tpot_ms);
  sla.addIf('slaP99Tpot', 'benchmark.form.sla.p99Tpot', d?.sla_p99_tpot_ms);
  sla.addIf(
    'slaAvgLat',
    'benchmark.form.sla.avgLatency',
    d?.sla_avg_latency_ms
  );
  sla.addIf(
    'slaP95Lat',
    'benchmark.form.sla.p95Latency',
    d?.sla_p95_latency_ms
  );
  sla.addIf(
    'slaP99Lat',
    'benchmark.form.sla.p99Latency',
    d?.sla_p99_latency_ms
  );

  // ── Load ───────────────────────────────────────────────────────────────
  const load = mk();
  load.add(
    'profile',
    'benchmark.form.profile',
    profilesOptions.find((o) => o.value === d?.profile)?.label ||
      d?.profile ||
      '-'
  );
  const ltLabel = loadTypeOptions.find((o) => o.value === d?.load_type)?.label;
  load.addIf(
    'load_type',
    'benchmark.form.loadType',
    d?.load_type,
    ltLabel ? t(ltLabel) : d?.load_type
  );
  // Stages = the measured load points, mirroring the config form's "Stages" card:
  // the mode first, then either the auto-tune search range + budget or the manual
  // list. Legacy rows (no auto_tune, no stages — a single fixed rate) predate the
  // stage model, so they skip the mode row and keep the plain Request Rate below.
  const isAutoTune = !!d?.auto_tune;
  const hasStages = (d?.stages?.length ?? 0) > 0;
  if (isAutoTune || hasStages) {
    load.add(
      'stages',
      'benchmark.form.stages',
      t(
        isAutoTune
          ? 'benchmark.form.autoTune'
          : 'benchmark.form.stages.mode.manual'
      )
    );
  }
  if (isAutoTune) {
    load.addIf(
      'range',
      d?.load_type === 'concurrency'
        ? 'benchmark.form.autoTune.rangeConcurrency'
        : 'benchmark.form.autoTune.rangeRate',
      d?.upper_bound,
      `${d?.lower_bound ?? 1} ~ ${d?.upper_bound}`
    );
    load.addIf('maxPoints', 'benchmark.form.autoTune.maxPoints', d?.max_points);
    load.addIf(
      'maxTotal',
      'benchmark.form.autoTune.maxTotalSeconds',
      d?.max_total_seconds
    );
  } else {
    load.addIf(
      'stageList',
      loadAxisLabelId(d),
      hasStages ? d?.stages : null,
      (d?.stages || []).map((s: any) => round(s.rate ?? 0, dec)).join(', ')
    );
    load.addIf(
      'rate',
      'benchmark.table.requestRate',
      hasStages ? null : d?.request_rate,
      d?.request_rate
    );
  }

  // ── Execution Limits (when the run stops) ────────────────────────────────
  // The auto-tune budget (max points / max total duration) sits with Stages above,
  // the same place the config form puts it; this group keeps the caps that apply in
  // any mode.
  const exec = mk();
  exec.addIf('total', 'benchmark.form.totalRequests', d?.total_requests);
  exec.addIf(
    'maxSeconds',
    'benchmark.form.maxSeconds',
    d?.max_seconds,
    `${d?.max_seconds} s`
  );
  exec.addIf('maxErrors', 'benchmark.form.maxErrors', d?.max_errors);
  exec.addIf('maxErrorRate', 'benchmark.form.maxErrorRate', d?.max_error_rate);
  if (d?.stop_on_saturation) {
    exec.add('stopSat', 'benchmark.form.stopOnSaturation', '✓');
  }

  // ── Advanced ─────────────────────────────────────────────────────────────
  const adv = mk();
  adv.addIf('turns', 'benchmark.form.turns', d?.turns);
  adv.addIf('warmup', 'benchmark.form.warmup', d?.warmup);
  adv.addIf('cooldown', 'benchmark.form.cooldown', d?.cooldown);

  const groups = [
    { labelId: 'benchmark.form.group.dataset', items: data.arr },
    { labelId: 'benchmark.form.group.sla', items: sla.arr },
    { labelId: 'benchmark.form.group.load', items: load.arr },
    { labelId: 'benchmark.form.group.execution', items: exec.arr },
    { labelId: 'benchmark.form.group.advanced', items: adv.arr }
  ].filter((g) => g.items.length > 0);

  return (
    <Wrapper>
      {groups.map((g) => (
        <div className="group" key={g.labelId}>
          <div className="group-label">{t(g.labelId)}</div>
          <Descriptions
            items={g.items}
            colon={false}
            column={3}
            styles={{ content: { justifyContent: 'flex-start' } }}
          />
        </div>
      ))}
    </Wrapper>
  );
};

export default Benchmark;
