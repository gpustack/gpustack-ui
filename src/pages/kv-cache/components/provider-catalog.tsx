import { getGpuColor } from '@/pages/backends/config';
import { AutoTooltip, IconFont, ThemeTag } from '@gpustack/core-ui';
import { useIntl } from '@umijs/max';
import { Typography } from 'antd';
import classNames from 'classnames';
import React, { useMemo } from 'react';
import {
  ProviderSourceColorMap,
  ProviderSourceLabelMap,
  ServiceModeColorMap,
  ServiceModeMap
} from '../config';
import { CacheProviderItem } from '../config/types';
import '../style/provider-catalog.less';

// four-pointed sparkle: the certification cue; a five-pointed star reads
// as favorite/rating
const SparkleIcon: React.FC<{ style?: React.CSSProperties }> = ({ style }) => (
  <svg
    viewBox="0 0 24 24"
    width="1em"
    height="1em"
    fill="currentColor"
    aria-hidden="true"
    style={{ verticalAlign: '-0.125em', ...style }}
  >
    {/* straight-edged twinkle (tips + inner vertices): slim enough to
        read as a star at tag size */}
    <path d="M12 0L15 9L24 12L15 15L12 24L9 15L0 12L9 9Z" />
  </svg>
);

interface ProviderCatalogProps {
  providers: CacheProviderItem[];
  // name of the provider the flow already holds, highlighted like the
  // cluster catalog's current selection
  current?: string;
  onSelect: (provider: CacheProviderItem) => void;
}

const ProviderCard: React.FC<{
  data: CacheProviderItem;
  active: boolean;
  onClick: (data: CacheProviderItem) => void;
}> = ({ data, active, onClick }) => {
  const intl = useIntl();

  // accelerator families the provider declares dedicated builds for
  // (runtime_images doubles as the support matrix). A provider that
  // publishes no image declares no matrix, so the claim falls back to
  // the accelerators its engine integrations are scoped to — the gate
  // that decides whether an engine can attach at all. Managed only: an
  // external provider runs no platform container, so the claim would be
  // meaningless; a provider declaring neither shows nothing.
  const frameworks = useMemo(() => {
    if (!data.supported_modes?.includes('managed')) {
      return [];
    }
    const names = new Set<string>();
    Object.values(data.versions || {}).forEach((versionConfig) => {
      Object.keys(versionConfig.runtime_images || {}).forEach((name) =>
        names.add(name)
      );
    });
    if (!names.size) {
      (data.inference_backend_integrations || []).forEach((integration) =>
        (integration.frameworks || []).forEach((name) => names.add(name))
      );
    }
    return Array.from(names);
  }, [data]);

  return (
    <div
      className={classNames('provider-card', { active })}
      onClick={() => onClick(data)}
    >
      <div className="title">
        <span className="img">
          {data.icon ? (
            <img src={data.icon} alt="" />
          ) : (
            <IconFont type="icon-storage-outlined" className="fallback-icon" />
          )}
        </span>
        <AutoTooltip ghost>{data.display_name || data.name}</AutoTooltip>
        {ProviderSourceLabelMap[data.source] && (
          <ThemeTag
            className="tag-item"
            color={ProviderSourceColorMap[data.source] || 'blue'}
            opacity={0.7}
          >
            {data.source === 'partner' && (
              <SparkleIcon style={{ marginRight: 4, fontSize: 12 }} />
            )}
            {intl.formatMessage({ id: ProviderSourceLabelMap[data.source] })}
          </ThemeTag>
        )}
      </div>
      <Typography.Paragraph
        className="desc"
        ellipsis={{
          rows: 2,
          tooltip: (
            <div
              className="custome-scrollbar"
              style={{
                display: 'flex',
                justifyContent: 'flex-start',
                maxHeight: 300,
                maxWidth: 300,
                overflow: 'auto'
              }}
            >
              {data.description}
            </div>
          )
        }}
      >
        {data.description}
      </Typography.Paragraph>
      {frameworks.length > 0 && (
        <div className="frameworks">
          <span className="label">
            {intl.formatMessage({ id: 'backend.availableFrameworks' })}:
          </span>
          {frameworks.map((framework) => (
            <ThemeTag
              key={framework}
              className="tag-item"
              color={getGpuColor(framework)}
              opacity={0.7}
            >
              {framework}
            </ThemeTag>
          ))}
        </div>
      )}
      <div className="item-footer">
        <span className="tags">
          {/* registration takes the first declared mode, so the card
              shows only that one — display and behavior must agree
              until the card offers a mode choice */}
          {data.supported_modes?.slice(0, 1).map((mode) => (
            <ThemeTag
              key={mode}
              className="tag-item"
              color={ServiceModeColorMap[mode] || 'blue'}
              opacity={0.7}
            >
              {intl.formatMessage({ id: ServiceModeMap[mode] })}
            </ThemeTag>
          ))}
        </span>
        <span className="links">
          {data.links?.map((link) => (
            <a
              key={link.url}
              href={link.url}
              target="_blank"
              rel="noopener noreferrer"
              onClick={(e) => e.stopPropagation()}
            >
              {link.label}
              <IconFont type="icon-external-link"></IconFont>
            </a>
          ))}
        </span>
      </div>
    </div>
  );
};

const ProviderCatalog: React.FC<ProviderCatalogProps> = ({
  providers,
  current,
  onSelect
}) => {
  return (
    <div className="provider-catalog">
      {providers.map((item) => (
        <ProviderCard
          key={item.name}
          data={item}
          active={item.name === current}
          onClick={onSelect}
        ></ProviderCard>
      ))}
    </div>
  );
};

export default ProviderCatalog;
