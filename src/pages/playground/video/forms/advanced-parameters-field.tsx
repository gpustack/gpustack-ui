import { userSettingsHelperAtom } from '@/atoms/settings';
import { ClearOutlined, LoadingOutlined } from '@ant-design/icons';
import { IconFont } from '@gpustack/core-ui';
import { useIntl } from '@umijs/max';
import { Button, Flex, Form, Tooltip } from 'antd';
import { useAtomValue } from 'jotai';
import { lazy, Suspense, useId, type AriaAttributes } from 'react';
import { parseVideoAdvancedParameters } from '../advanced-parameters';
import styles from './advanced-parameters-field.module.less';

const JsonEditor = lazy(() =>
  import('@gpustack/core-ui/json-editor').then(({ JsonEditor }) => ({
    default: JsonEditor
  }))
);

const editorSchema = { type: ['object', 'null'] };

function Editor({
  value = '',
  onChange,
  label,
  ...fieldProps
}: AriaAttributes & {
  id?: string;
  value?: string;
  onChange?: (value: string) => void;
  label: string;
}) {
  const intl = useIntl();
  const editorId = useId();
  const { isDarkTheme } = useAtomValue(userSettingsHelperAtom);
  const clearLabel = intl.formatMessage({ id: 'common.button.clear' });

  const handleFormat = () => {
    let formatted = value;
    try {
      formatted = JSON.stringify(JSON.parse(value), null, 2);
    } catch {
      // Keep malformed input intact and let the field validator report it.
    }
    onChange?.(formatted);
  };

  return (
    <div
      className={styles.panel}
      role="group"
      aria-label={label}
      {...fieldProps}
    >
      <Flex
        className={styles.header}
        align="center"
        justify="space-between"
        wrap
      >
        <span className={styles.title}>{label}</span>
        <Flex align="center" gap="small">
          <Button
            size="small"
            icon={<IconFont type="icon-object" />}
            disabled={!value.trim()}
            onClick={handleFormat}
          >
            {intl.formatMessage({ id: 'playground.decision.questions.format' })}
          </Button>
          <Tooltip title={clearLabel}>
            <Button
              size="small"
              icon={<ClearOutlined />}
              aria-label={clearLabel}
              disabled={!value}
              onClick={() => onChange?.('')}
            />
          </Tooltip>
        </Flex>
      </Flex>
      <div className={styles.body}>
        <Suspense
          fallback={
            <Flex className={styles.loading} align="center" justify="center">
              <LoadingOutlined />
            </Flex>
          }
        >
          <JsonEditor
            path={`inmemory://model/playground-video-${editorId}.json`}
            schema={editorSchema}
            height="100%"
            value={value}
            onChange={(next) => onChange?.(next ?? '')}
            isDarkTheme={isDarkTheme}
            options={{ ariaLabel: label, lineNumbers: 'off', folding: false }}
          />
        </Suspense>
      </div>
    </div>
  );
}

export default function AdvancedParametersField({
  active
}: {
  active: boolean;
}) {
  const intl = useIntl();
  const label = intl.formatMessage({ id: 'playground.video.extraParams' });
  return (
    <Form.Item
      name="advancedParameters"
      extra={intl.formatMessage({ id: 'playground.video.extraParams.tips' })}
      rules={[
        {
          validator: async (_, value?: string) => {
            const result = parseVideoAdvancedParameters(value);
            if ('values' in result) return;
            throw new Error(
              result.issue === 'conflict'
                ? intl.formatMessage(
                    { id: 'playground.video.extraParams.conflict' },
                    { keys: result.keys.join(', ') }
                  )
                : intl.formatMessage({
                    id: 'playground.video.extraParams.invalid'
                  })
            );
          }
        }
      ]}
    >
      {active ? <Editor label={label} /> : <input type="hidden" />}
    </Form.Item>
  );
}
