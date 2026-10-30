import { CloseOutlined, PlusOutlined } from '@ant-design/icons';
import { BaseSelect } from '@gpustack/core-ui';
import { useIntl } from '@umijs/max';
import { Button, Flex } from 'antd';
import styles from './index.module.less';
import type { KeyValueFilterOption, KeyValueFilterValue } from './types';

// BaseSelect restores its default icon for null; an empty fragment hides it.
const EMPTY_SUFFIX_ICON = <></>;

interface KeyValueFilterRowProps {
  value: Partial<KeyValueFilterValue>;
  options: KeyValueFilterOption[];
  disabledValues: string[];
  index: number;
  keyPlaceholder: string;
  valuePlaceholder: string;
  loading?: boolean;
  autoFocus?: boolean;
  onChange: (value: Partial<KeyValueFilterValue>) => void;
  onDelete: () => void;
  onAdd?: () => void;
}

export default function KeyValueFilterRow({
  value,
  options,
  disabledValues,
  index,
  keyPlaceholder,
  valuePlaceholder,
  loading,
  autoFocus,
  onChange,
  onDelete,
  onAdd
}: KeyValueFilterRowProps) {
  const intl = useIntl();
  const availableValues = options.find((option) => option.key === value.key);
  const keyOptions = options.map((option) => ({
    value: option.key,
    label: option.key
  }));
  // Keep active conditions readable if a refresh no longer offers them.
  if (
    value.key !== undefined &&
    !keyOptions.some((item) => item.value === value.key)
  ) {
    keyOptions.push({ value: value.key, label: value.key });
  }
  const values = [...new Set(availableValues?.values || [])];
  if (value.value !== undefined && !values.includes(value.value))
    values.push(value.value);

  return (
    <Flex align="center" className={styles.row}>
      <BaseSelect
        size="small"
        autoFocus={autoFocus}
        variant="borderless"
        showSearch
        optionFilterProp="label"
        aria-label={`${keyPlaceholder} ${index + 1}`}
        placeholder={keyPlaceholder}
        className={styles.key}
        value={value.key}
        loading={loading}
        options={keyOptions}
        suffixIcon={keyOptions.length ? undefined : EMPTY_SUFFIX_ICON}
        onChange={(key: string) => onChange({ key })}
      />
      <span className={styles.separator} aria-hidden="true">
        :
      </span>
      <BaseSelect
        size="small"
        variant="borderless"
        showSearch
        optionFilterProp="label"
        aria-label={`${valuePlaceholder} ${index + 1}`}
        placeholder={valuePlaceholder}
        className={styles.value}
        value={value.value}
        notFoundContent={
          value.key === undefined
            ? intl.formatMessage({
                id: 'common.filter.keyValue.chooseKeyFirst'
              })
            : undefined
        }
        loading={loading}
        suffixIcon={values.length ? undefined : EMPTY_SUFFIX_ICON}
        options={values.map((item) => ({
          value: item,
          label:
            item === ''
              ? intl.formatMessage({ id: 'common.filter.keyValue.empty' })
              : item,
          disabled: disabledValues.includes(item)
        }))}
        onChange={(nextValue: string) =>
          onChange({ key: value.key, value: nextValue })
        }
      />
      <Flex className={styles.actions} align="center">
        <Button
          type="text"
          size="small"
          className={styles.action}
          icon={<CloseOutlined style={{ fontSize: 12 }} />}
          aria-label={`${intl.formatMessage({ id: 'common.button.delete' })} ${index + 1}`}
          onClick={onDelete}
        />
        {onAdd ? (
          <Button
            type="text"
            size="small"
            icon={<PlusOutlined style={{ fontSize: 12 }} />}
            className={styles.action}
            aria-label={intl.formatMessage({
              id: 'common.filter.keyValue.add'
            })}
            onClick={onAdd}
          />
        ) : null}
      </Flex>
    </Flex>
  );
}
