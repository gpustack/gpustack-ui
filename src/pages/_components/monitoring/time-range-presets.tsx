import { CalendarOutlined } from '@ant-design/icons';
import { useIntl } from '@umijs/max';
import { Button, Dropdown, Flex, Segmented } from 'antd';
import styles from './time-range-presets.module.less';

const visiblePresets = new Set(['15m', '1h', '24h', '7d']);

interface TimeRangeOption {
  value: string;
  label: string;
  disabled: boolean;
}

interface TimeRangePresetsProps {
  value: string;
  options: TimeRangeOption[];
  customRangeHint?: string;
  onChange: (value: string) => void;
}

export default function TimeRangePresets({
  value,
  options,
  customRangeHint,
  onChange
}: TimeRangePresetsProps) {
  const intl = useIntl();
  const label = intl.formatMessage({ id: 'modelMonitoring.window' });
  const more = intl.formatMessage({ id: 'common.button.more' });
  const primary = options.filter((option) => visiblePresets.has(option.value));
  const secondary = options.filter(
    (option) => !visiblePresets.has(option.value)
  );
  const selectedSecondary = secondary.find((option) => option.value === value);
  const moreLabel = `${label} · ${more}`;
  return (
    <Flex align="stretch" wrap className={styles.control}>
      <Segmented<string>
        aria-label={label}
        className={styles.segments}
        options={primary}
        value={value}
        onChange={onChange}
        block
      />
      <Dropdown
        trigger={['click']}
        menu={{
          selectable: true,
          selectedKeys: selectedSecondary ? [value] : [],
          items: secondary.map((option) => ({
            key: option.value,
            label: option.label,
            disabled: option.disabled,
            title: option.value === 'custom' ? customRangeHint : undefined
          })),
          onClick: ({ key }) => onChange(key)
        }}
      >
        <Button
          type="text"
          className={styles.calendar}
          icon={<CalendarOutlined />}
          aria-label={moreLabel}
          aria-haspopup="menu"
          title={selectedSecondary?.label || moreLabel}
          data-selected={!!selectedSecondary}
        >
          {selectedSecondary?.value !== 'custom' && selectedSecondary?.label}
        </Button>
      </Dropdown>
    </Flex>
  );
}
