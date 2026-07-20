import { convertFileSize } from '@/utils';
import { useIntl } from '@umijs/max';
import { Flex, Popover, theme } from 'antd';
import { createStyles } from 'antd-style';
import type { GlobalToken } from 'antd/es/theme';
import React from 'react';

export interface DualArcGaugeItem {
  index: number;
  label?: string;
  memory: {
    total: number; // bytes
    used: number; // bytes — outer arc (semantic color)
    allocated: number; // bytes — inner arc (blue)
  };
}

interface DualArcGaugeProps {
  data: DualArcGaugeItem[];
}

// guage external radius: 20, internal radius: 16, stroke width: 2
const CX = 25;
const CY = 24;
const R_OUT = 20;
const R_IN = 16;
const SW = 2.5;
const L_OUT = Math.PI * R_OUT;
const L_IN = Math.PI * R_IN;
const arcPath = (r: number) =>
  `M ${CX - r} ${CY} A ${r} ${r} 0 0 1 ${CX + r} ${CY}`;
const P_OUT = arcPath(R_OUT);
const P_IN = arcPath(R_IN);

const clamp01 = (n: number) => Math.min(Math.max(n, 0), 1);

// Used color: green < 75%, yellow < 90%, red >= 90%
const usedColor = (ratio: number, token: GlobalToken) => {
  if (ratio >= 0.9) return token.colorError;
  if (ratio >= 0.75) return token.colorWarning;
  return token.colorSuccess;
};

const useStyles = createStyles(({ css, token }) => ({
  row: css`
    width: fit-content;
    padding: 3px 6px;
    border-radius: ${token.borderRadius}px;
    cursor: pointer;
    transition: background-color 0.15s;
    &:hover {
      background-color: ${token.colorFillTertiary};
    }
  `,
  index: css`
    font-size: 12px;
    font-weight: 500;
    color: ${token.colorTextSecondary};
    border-bottom: 1px dashed var(--ant-blue-6);
    padding-bottom: 3px;
    line-height: 1.2;
  `,
  popTitle: css`
    font-size: 12px;
    font-weight: 500;
    color: ${token.colorText};
    margin-bottom: 6px;
  `,
  popList: css`
    font-size: 12px;
    font-variant-numeric: tabular-nums;
  `,
  metric: css`
    white-space: nowrap;
  `,
  dot: css`
    width: 6px;
    height: 6px;
    border-radius: 50%;
    flex-shrink: 0;
  `,
  value: css`
    min-width: 64px;
    text-align: right;
    font-weight: 500;
    color: ${token.colorText};
  `,
  label: css`
    color: ${token.colorTextTertiary};
  `
}));

const DualArcGauge: React.FC<DualArcGaugeProps> = ({ data }) => {
  const intl = useIntl();
  const { styles } = useStyles();
  const { token } = theme.useToken();

  const trackColor = token.colorFillSecondary;
  const allocColor = 'var(--ant-blue-6)';

  return (
    <Flex vertical gap={2} style={{ width: 'fit-content' }}>
      {data.map((item) => {
        const { total = 0, used = 0, allocated = 0 } = item.memory || {};
        const usedR = total > 0 ? clamp01(used / total) : 0;
        const allocR = total > 0 ? clamp01(allocated / total) : 0;
        const pct = Math.round(usedR * 100);
        const uc = usedColor(usedR, token);
        // set dim color for allocated if used is 0, otherwise use the same color as used
        const allocDotColor =
          allocated > 0 ? allocColor : token.colorTextQuaternary;

        const content = (
          <div>
            <div className={styles.popTitle}>
              [{item.index}]{item.label ? ` ${item.label}` : ''} ·{' '}
              {convertFileSize(total)}
            </div>
            <Flex vertical gap={4} className={styles.popList}>
              <Flex align="center" gap={6} className={styles.metric}>
                <span className={styles.dot} style={{ background: uc }} />
                <span className={styles.value}>{convertFileSize(used)}</span>
                <span className={styles.label}>
                  {intl.formatMessage({ id: 'resources.table.used' })}
                </span>
              </Flex>
              <Flex align="center" gap={6} className={styles.metric}>
                <span
                  className={styles.dot}
                  style={{ background: allocDotColor }}
                />
                <span className={styles.value}>
                  {convertFileSize(allocated)}
                </span>
                <span className={styles.label}>
                  {intl.formatMessage({ id: 'resources.table.allocated' })}
                </span>
              </Flex>
            </Flex>
          </div>
        );

        return (
          <Popover
            key={item.index}
            content={content}
            placement="right"
            trigger={['hover', 'click']}
          >
            <Flex align="center" gap={6} className={styles.row}>
              <svg
                viewBox="0 0 50 28"
                width={54}
                height={30}
                style={{ overflow: 'visible', flexShrink: 0 }}
              >
                <path
                  d={P_OUT}
                  fill="none"
                  strokeWidth={SW}
                  stroke={trackColor}
                />
                <path
                  d={P_IN}
                  fill="none"
                  strokeWidth={SW}
                  stroke={trackColor}
                />
                {usedR > 0 && (
                  <path
                    d={P_OUT}
                    fill="none"
                    strokeWidth={SW}
                    stroke={uc}
                    strokeDasharray={`${(usedR * L_OUT).toFixed(1)} ${L_OUT.toFixed(1)}`}
                  />
                )}
                {allocR > 0 && (
                  <path
                    d={P_IN}
                    fill="none"
                    strokeWidth={SW}
                    style={{ stroke: allocColor }}
                    strokeDasharray={`${(allocR * L_IN).toFixed(1)} ${L_IN.toFixed(1)}`}
                  />
                )}
                <text
                  x={CX}
                  y={CY - 0.5}
                  textAnchor="middle"
                  fontSize={9.5}
                  fontWeight={500}
                  fill={uc}
                  style={{ fontVariantNumeric: 'tabular-nums' }}
                >
                  {pct}%
                </text>
              </svg>
              {<span className={styles.index}>[{item.index}]</span>}
            </Flex>
          </Popover>
        );
      })}
    </Flex>
  );
};

export default DualArcGauge;
