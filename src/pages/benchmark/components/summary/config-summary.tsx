import { useIntl } from '@umijs/max';
import { createStyles } from 'antd-style';
import React from 'react';
import { loadTypeOptions } from '../../config';
import { useDetailContext } from '../../config/detail-context';

const useStyles = createStyles(({ css }) => ({
  bar: css`
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 6px 16px;
    font-size: 13px;
    /* GitHub-style meta row: muted label + strong value, separated by thin rules
       instead of a cloud of grey tags. */
    .item {
      display: inline-flex;
      align-items: baseline;
      gap: 6px;
      padding-right: 16px;
      border-right: 1px solid var(--ant-color-border-secondary);
    }
    .item:last-child {
      padding-right: 0;
      border-right: none;
    }
    .label {
      color: var(--ant-color-text-tertiary);
      font-size: 12px;
    }
    .value {
      color: var(--ant-color-text);
      font-weight: 600;
    }
  `
}));

// A compact one-line config summary at the top of Summary. Full config
// lives in the Configuration tab.
const ConfigSummary: React.FC = () => {
  const { styles } = useStyles();
  const intl = useIntl();
  const { detailData, profilesOptions } = useDetailContext();
  const [, instanceData] =
    Object.entries(detailData?.snapshot?.instances || {})[0] || [];

  const backend = instanceData?.backend
    ? `${instanceData.backend}${
        instanceData.backend_version ? ` (${instanceData.backend_version})` : ''
      }`
    : '-';

  // `profile` is the preset / scenario label (e.g. "Throughput", "Max
  // Throughput"). Profile = which scenario it was set up as.
  const profileLabel =
    profilesOptions?.find((o) => o.value === detailData?.profile)?.label ||
    detailData?.profile ||
    '-';

  // Load Type = how it actually sends traffic (fixed_rate / concurrency /
  // sweep). The single traffic-shape axis (there is no Mode).
  const loadTypeValue = detailData?.load_type;
  const loadTypeLabel = loadTypeValue
    ? intl.formatMessage({
        id:
          loadTypeOptions.find((o) => o.value === loadTypeValue)?.label ||
          loadTypeValue
      })
    : '-';

  const datasetLabel: string | undefined = detailData?.dataset_name;

  const items = [
    {
      label: intl.formatMessage({ id: 'benchmark.detail.modelName' }),
      value: detailData?.model_name
    },
    {
      label: intl.formatMessage({ id: 'benchmark.detail.instanceName' }),
      value: detailData?.model_instance_name
    },
    {
      label: intl.formatMessage({ id: 'models.form.backend' }),
      value: backend
    },
    {
      label: intl.formatMessage({ id: 'benchmark.form.profile' }),
      value: profileLabel
    },
    {
      label: intl.formatMessage({ id: 'benchmark.form.loadType' }),
      value: loadTypeLabel
    },
    {
      label: intl.formatMessage({ id: 'benchmark.table.dataset' }),
      value: datasetLabel
    }
  ];

  return (
    <div className={styles.bar}>
      {items.map((it, idx) => (
        <span className="item" key={idx}>
          <span className="label">{it.label}:</span>
          <span className="value">{it.value || '-'}</span>
        </span>
      ))}
    </div>
  );
};

export default ConfigSummary;
