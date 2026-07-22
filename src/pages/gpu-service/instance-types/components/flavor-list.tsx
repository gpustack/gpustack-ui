import { FileSkeletonRows } from '@/pages/llmodels/components/model-source/file-skeleton';
import {
  AutoTooltip,
  IconFont,
  TemplateCard,
  ThemeTag
} from '@gpustack/core-ui';
import { useIntl } from '@umijs/max';
import { Empty, Flex, Spin, Typography } from 'antd';
import _ from 'lodash';
import { formatMemoryDisplay } from '../../instances/config';
import { manufactureColorMap } from '../../templates/config';
import { FlavorItem } from '../config/types';
import styles from '../styles/instance-types.module.less';

const { Text } = Typography;

interface FlavorListProps {
  value?: string;
  dataList: FlavorItem[];
  loading?: boolean;
  onChange?: (item: FlavorItem) => void;
}

const MetaItem: React.FC<{
  icon: string;
  label: string;
  value?: React.ReactNode;
}> = ({ icon, label, value }) => {
  return (
    <span className={styles.metaLabel}>
      <IconFont className="icon" type={icon} />
      {label}: <span className={styles.metaValue}>{value ?? '-'}</span>
    </span>
  );
};

const FlavorList: React.FC<FlavorListProps> = ({
  value,
  dataList,
  loading,
  onChange
}) => {
  const intl = useIntl();

  if (!dataList.length) {
    if (loading) {
      return (
        <Spin spinning size="middle">
          <Flex vertical gap={16} style={{ minHeight: 200 }}>
            {_.times(6, (index: number) => (
              <FileSkeletonRows key={index} counts={2} itemHeight={96} />
            ))}
          </Flex>
        </Spin>
      );
    }
    return <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} />;
  }

  return (
    <Flex vertical gap={16}>
      {dataList.map((item) => {
        const spec = item.spec || {};
        const manufacturer = spec.manufacturer || '';
        const color = manufactureColorMap[manufacturer] ?? 'purple';
        // A generic (no product, no/`generic` manufacturer) flavor is shown as
        // "CPU-only" instead of falling back to the raw flavor name.
        const isCpuOnly =
          !spec.acceleratable &&
          !spec.product &&
          (!manufacturer || manufacturer.toLowerCase() === 'generic');
        const title = isCpuOnly ? 'CPU-only' : spec.product || item.name || '-';
        return (
          <TemplateCard
            key={item.name}
            className={styles.flavorCard}
            clickable
            ghost
            hoverable
            active={value === item.name}
            onClick={() => onChange?.(item)}
          >
            <Flex vertical gap={12} style={{ width: '100%' }}>
              <Flex align="center" justify="space-between" gap={8}>
                <div style={{ minWidth: 0, fontWeight: 500 }}>
                  <AutoTooltip ghost minWidth={20}>
                    <Text>{title}</Text>
                  </AutoTooltip>
                </div>
                {manufacturer && (
                  <ThemeTag color={color} style={{ fontWeight: 400 }}>
                    {manufacturer.toUpperCase()}
                  </ThemeTag>
                )}
              </Flex>
              {/* Memory only applies to accelerator (GPU) flavors; a
                  non-acceleratable (generic) flavor has none. (Sliceable is no
                  longer a flavor field — it is observed per instance type on
                  status.detail.slicedDetail.) */}
              {spec.acceleratable && (
                <Flex wrap gap={16}>
                  <MetaItem
                    icon="icon-ram-02"
                    label={intl.formatMessage({
                      id: 'gpuservice.instance.memory'
                    })}
                    value={formatMemoryDisplay(spec.memory ?? undefined) ?? '-'}
                  />
                </Flex>
              )}
            </Flex>
          </TemplateCard>
        );
      })}
    </Flex>
  );
};

export default FlavorList;
