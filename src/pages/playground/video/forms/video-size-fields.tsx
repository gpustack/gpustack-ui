import OptionRadioGroup, {
  type OptionRadioGroupOption
} from '@/pages/_components/option-radio-group';
import { LabelInfo } from '@gpustack/core-ui';
import { useIntl } from '@umijs/max';
import { Flex, Form } from 'antd';
import ParamsFields from '../../components/params-fields';
import type { ParamsSchema } from '../../config/types';
import { parseVideoSize } from '../resolutions';
import styles from './video-size-fields.module.less';

type Choice = { value: string; label: string; locale?: boolean };
function getChoices(
  options: Choice[],
  ratios: boolean,
  formatMessage: ReturnType<typeof useIntl>['formatMessage']
): OptionRadioGroupOption[] {
  const ordered = ratios
    ? [
        ...options.filter(
          (option) => !['default', 'reference'].includes(option.value)
        ),
        ...options.filter((option) =>
          ['default', 'reference'].includes(option.value)
        )
      ]
    : options;
  const shortLabels = options.map((option) => {
    const size = parseVideoSize(option.value);
    const edge = size && Math.min(size.width, size.height);
    return edge === 2160 ? '4k' : edge ? `${edge}p` : '';
  });
  return ordered.map((option) => {
    const dimensions = parseVideoSize(option.value);
    const rawLabel = option.locale
      ? formatMessage({ id: option.label })
      : option.label;
    const edge = dimensions && Math.min(dimensions.width, dimensions.height);
    const short = edge === 2160 ? '4k' : edge ? `${edge}p` : rawLabel;
    const duplicate =
      dimensions && shortLabels.filter((label) => label === short).length > 1;
    const ratio =
      ratios && /^\d+:\d+$/.test(option.value)
        ? option.value.split(':').map(Number)
        : undefined;
    return {
      value: option.value,
      label: ratios || duplicate ? rawLabel : short,
      tooltip: rawLabel,
      fullWidth: ['default', 'reference'].includes(option.value),
      icon: ratio ? (
        <span
          className={styles.ratioIcon}
          style={{
            width: 18 * Math.min(1, ratio[0] / ratio[1]),
            height: 18 * Math.min(1, ratio[1] / ratio[0])
          }}
        />
      ) : undefined
    };
  });
}

export default function VideoSizeFields({
  paramsConfig = []
}: {
  paramsConfig?: ParamsSchema[];
}) {
  const intl = useIntl();
  if (
    !paramsConfig.some(({ name }) =>
      ['aspectRatio', 'size', 'width', 'height'].includes(name)
    )
  ) {
    return null;
  }
  return (
    <Flex vertical gap="middle" className={styles.section}>
      {['aspectRatio', 'size'].map((name) => {
        const config = paramsConfig.find((item) => item.name === name);
        if (!config) return null;
        const options = getChoices(
          (config.options || []) as Choice[],
          name === 'aspectRatio',
          intl.formatMessage
        );
        const label = intl.formatMessage({ id: config.label.text });
        const columns =
          options.length === 1
            ? 1
            : options.length === 2
              ? 2
              : options.length === 4
                ? 4
                : 3;
        return (
          <Form.Item
            key={name}
            name={name}
            rules={config.rules}
            label={<LabelInfo label={label} />}
            layout="vertical"
            required={false}
            colon={false}
            className={styles.field}
          >
            <OptionRadioGroup
              aria-required={config.rules.some((rule) => rule.required)}
              options={options}
              columns={columns}
              aria-label={label}
              disabled={config.disabled}
            />
          </Form.Item>
        );
      })}
      <ParamsFields
        paramsConfig={paramsConfig.filter(({ name }) =>
          ['width', 'height'].includes(name)
        )}
      />
    </Flex>
  );
}
