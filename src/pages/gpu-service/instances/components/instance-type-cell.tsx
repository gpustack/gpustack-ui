import { InfoCircleOutlined } from '@ant-design/icons';
import { AutoTooltip, IconFont } from '@gpustack/core-ui';
import { Flex, Tooltip } from 'antd';
import React from 'react';

export type InstanceTypeSection = {
  icon: string;
  name: string;
  // [label, value] — a null label renders a single value with no sub-label;
  // rows whose value is falsy or "-" are dropped.
  rows: [string | null, string | undefined][];
};

/**
 * "Instance Type" cell shared by the GPU Instances list and the Usage GPU
 * Instances table: a primary product label (e.g. "NVIDIA-GeForce-RTX-5090-D x
 * 1") plus a question/info icon whose dark popover breaks the spec down by
 * category (GPU / CPU / Memory / Disk), titled with the instance name.
 */
const InstanceTypeCell: React.FC<{
  title: string;
  name?: string;
  sections: InstanceTypeSection[];
}> = ({ title, name, sections }) => {
  const specInfo = (
    <div style={{ minWidth: 200 }}>
      {name && <div style={{ fontWeight: 600, marginBottom: 8 }}>{name}</div>}
      {sections.map((sec) => {
        const rows = sec.rows.filter(([, v]) => v && v !== '-');
        if (!rows.length) return null;
        return (
          <div
            key={sec.name}
            style={{
              display: 'flex',
              alignItems: 'flex-start',
              gap: 16,
              paddingBlock: 4,
              borderBottom: '1px solid rgba(255, 255, 255, 0.2)'
            }}
          >
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 6,
                minWidth: 88,
                lineHeight: '22px'
              }}
            >
              <IconFont type={sec.icon} />
              <span>{sec.name}</span>
            </div>
            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                gap: 2,
                width: '100%'
              }}
            >
              {rows.map(([label, value], i) => (
                <div
                  key={i}
                  style={{ display: 'flex', gap: 16, lineHeight: '22px' }}
                >
                  <span style={{ opacity: 0.65, minWidth: 96 }}>
                    {label || ''}
                  </span>
                  <span
                    style={{
                      display: 'flex',
                      flex: 1,
                      justifyContent: 'flex-end'
                    }}
                  >
                    {value}
                  </span>
                </div>
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );

  return (
    <Flex align="center" style={{ gap: 6 }}>
      <AutoTooltip ghost title={<span>{title}</span>}>
        <span className="text-primary">{title}</span>
      </AutoTooltip>
      <Tooltip
        title={specInfo}
        styles={{ container: { width: 'max-content', maxWidth: 480 } }}
      >
        <InfoCircleOutlined
          style={{ color: 'var(--ant-color-primary)', cursor: 'pointer' }}
        />
      </Tooltip>
    </Flex>
  );
};

export default InstanceTypeCell;
