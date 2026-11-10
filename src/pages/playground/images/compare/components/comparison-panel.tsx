import { MoreOutlined, SettingOutlined } from '@ant-design/icons';
import { AutoTooltip, BaseSelect, OverlayScroller } from '@gpustack/core-ui';
import { useIntl } from '@umijs/max';
import { Button, Dropdown, Flex, MenuProps, Popover } from 'antd';
import { ReactNode } from 'react';
import styles from './comparison-panel.module.less';

interface ComparisonPanelProps {
  model: string;
  modelList: Global.BaseOption<string>[];
  onModelChange: (model: string) => void;
  actions: MenuProps['items'];
  parameters: ReactNode;
  children: ReactNode;
}

const renderModelLabel = (data: { label?: ReactNode }) => (
  <AutoTooltip
    ghost
    tooltipProps={{ placement: 'right' }}
    minWidth={60}
    maxWidth={220}
  >
    {data.label}
  </AutoTooltip>
);

const ComparisonPanel = ({
  model,
  modelList,
  onModelChange,
  actions,
  parameters,
  children
}: ComparisonPanelProps) => {
  const intl = useIntl();
  return (
    <Flex vertical className={`image-compare-panel ${styles.panel}`}>
      <Flex align="center" justify="space-between" className={styles.header}>
        <span className={styles.title}>
          <BaseSelect
            style={{ width: '100%' }}
            variant="borderless"
            options={modelList}
            onChange={onModelChange}
            value={model || undefined}
            placeholder={intl.formatMessage({ id: 'playground.model' })}
            labelRender={renderModelLabel}
            optionRender={renderModelLabel}
          />
        </span>
        <Flex align="center" gap={2}>
          <Dropdown menu={{ items: actions }} placement="bottomRight">
            <Button
              type="text"
              aria-label={intl.formatMessage({ id: 'common.button.more' })}
              icon={<MoreOutlined style={{ fontSize: '14px' }} />}
              size="small"
            />
          </Dropdown>
          <Popover
            autoAdjustOverflow={true}
            styles={{
              container: {
                width: 'min(375px, calc(100vw - 32px))',
                paddingInline: 0
              }
            }}
            content={
              <OverlayScroller
                maxHeight={500}
                style={{ paddingInline: '24px' }}
                oppositeTheme={true}
              >
                {parameters}
              </OverlayScroller>
            }
            trigger={['click']}
            arrow={false}
            fresh={true}
            title={false}
          >
            <Button
              type="text"
              icon={<SettingOutlined />}
              size="small"
              aria-label={intl.formatMessage({ id: 'playground.parameters' })}
            />
          </Popover>
        </Flex>
      </Flex>
      {children}
    </Flex>
  );
};

export default ComparisonPanel;
