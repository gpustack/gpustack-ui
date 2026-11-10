import { promptList } from '@/pages/playground/config';
import { ClearOutlined, SendOutlined } from '@ant-design/icons';
import { IconFont } from '@gpustack/core-ui';
import { useIntl } from '@umijs/max';
import { Button, Divider, Flex, Input, Tooltip } from 'antd';
import { imageComparisonLayouts } from '../config';
import { ImageComparisonLayout } from '../config/types';
import styles from './image-compare-input.module.less';

interface ImageCompareInputProps {
  prompt: string;
  running: boolean;
  disabled: boolean;
  layout: ImageComparisonLayout;
  onChange: (prompt: string) => void;
  onSubmit: (prompt: string) => void;
  onStop: () => void;
  onClear: () => void;
  onLayoutChange: (layout: ImageComparisonLayout) => void;
}

export default function ImageCompareInput(props: ImageCompareInputProps) {
  const intl = useIntl();
  const canSubmit = !props.running && !props.disabled && !!props.prompt.trim();
  return (
    <Flex vertical className={styles.input}>
      <Flex
        align="center"
        justify="space-between"
        gap="small"
        className={styles.toolbar}
      >
        <Flex align="center" gap="small" wrap>
          <span className="font-500">
            {intl.formatMessage({ id: 'playground.image.prompt' })}
          </span>
          <Tooltip title={intl.formatMessage({ id: 'common.button.clear' })}>
            <Button
              size="middle"
              type="text"
              icon={<ClearOutlined />}
              onClick={props.onClear}
              aria-label={intl.formatMessage({ id: 'common.button.clear' })}
            />
          </Tooltip>
          <Tooltip
            title={intl.formatMessage({ id: 'playground.image.prompt.random' })}
          >
            <Button
              size="middle"
              type="text"
              icon={<IconFont type="icon-random" />}
              onClick={() =>
                props.onChange(
                  promptList[Math.floor(Math.random() * promptList.length)]
                )
              }
              aria-label={intl.formatMessage({
                id: 'playground.image.prompt.random'
              })}
            />
          </Tooltip>
          <Divider orientation="vertical" style={{ margin: 0 }} />
          <Flex gap="small">
            {imageComparisonLayouts.map(({ count, span, icon, messageId }) => (
              <Tooltip
                key={count}
                title={intl.formatMessage({ id: messageId })}
              >
                <Button
                  size="middle"
                  type="text"
                  icon={<IconFont type={icon} />}
                  aria-label={intl.formatMessage({ id: messageId })}
                  aria-pressed={props.layout.count === count}
                  onClick={() => props.onLayoutChange({ count, span })}
                />
              </Tooltip>
            ))}
          </Flex>
        </Flex>
        {props.running ? (
          <Button
            size="middle"
            style={{ width: 46, flexShrink: 0 }}
            type="primary"
            icon={<IconFont type="icon-stop1" className="font-size-14" />}
            onClick={props.onStop}
            aria-label={intl.formatMessage({ id: 'common.button.stop' })}
          />
        ) : (
          <Button
            size="middle"
            style={{ width: 46, flexShrink: 0 }}
            type="primary"
            icon={<SendOutlined className="font-size-14" />}
            disabled={!canSubmit}
            onClick={() => props.onSubmit(props.prompt)}
            aria-label={intl.formatMessage({ id: 'common.button.submit' })}
          />
        )}
      </Flex>
      <Input.TextArea
        value={props.prompt}
        onChange={(event) => props.onChange(event.target.value)}
        aria-label={intl.formatMessage({ id: 'playground.image.prompt' })}
        placeholder={intl
          .formatMessage({ id: 'playground.input.prompt.holder' })
          .replaceAll('<kbd>', '')
          .replaceAll('</kbd>', '')}
        variant="borderless"
        autoSize={{ minRows: 5, maxRows: 5 }}
        onKeyDown={(event) => {
          if (
            event.key === 'Enter' &&
            !event.shiftKey &&
            !event.nativeEvent.isComposing
          ) {
            event.preventDefault();
            if (canSubmit) props.onSubmit(props.prompt);
          }
        }}
      />
    </Flex>
  );
}
