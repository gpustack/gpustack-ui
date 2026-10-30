import { CloseCircleFilled, SearchOutlined } from '@ant-design/icons';
import { useIntl } from '@umijs/max';
import { Button, Input, Popover, type InputRef } from 'antd';
import { useId, useRef, useState } from 'react';
import KeyValueFilterEditor from './editor';
import styles from './index.module.less';
import type { KeyValueFilterProps, KeyValueFilterValue } from './types';

export type {
  KeyValueFilterOption,
  KeyValueFilterProps,
  KeyValueFilterValue
} from './types';

const EMPTY_VALUE: KeyValueFilterValue[] = [];

/** API-independent exact key/value filters with a compact search-field trigger. */
export default function KeyValueFilter({
  value = EMPTY_VALUE,
  options,
  onChange,
  placeholder,
  title,
  keyPlaceholder,
  valuePlaceholder,
  loading,
  disabled,
  width = 320,
  popoverWidth = 480,
  className,
  style
}: KeyValueFilterProps) {
  const intl = useIntl();
  const [{ open, focusOnOpen }, setPopup] = useState({
    open: false,
    focusOnOpen: false
  });
  const inputRef = useRef<InputRef>(null);
  const popupId = useId();
  const triggerLabel =
    placeholder ||
    intl.formatMessage({ id: 'common.filter.keyValue.placeholder' });
  const summary = value
    .map(
      (pair) =>
        `${pair.key}: ${pair.value === '' ? intl.formatMessage({ id: 'common.filter.keyValue.empty' }) : pair.value}`
    )
    .join('; ');

  const close = () => {
    setPopup({ open: false, focusOnOpen: false });
    inputRef.current?.focus();
  };

  return (
    <Popover
      open={open && !disabled}
      onOpenChange={(nextOpen) =>
        setPopup({ open: nextOpen, focusOnOpen: false })
      }
      trigger="click"
      placement="bottomLeft"
      align={{ overflow: { adjustX: true, adjustY: true, shiftX: 16 } }}
      arrow={false}
      styles={{
        container: {
          padding: 0,
          border: '1px solid var(--ant-color-border)',
          backgroundColor: 'var(--ant-color-bg-container)',
          boxShadow: 'var(--ant-box-shadow-secondary)',
          borderRadius: 6,
          overflow: 'hidden'
        }
      }}
      content={
        <div
          id={popupId}
          role="dialog"
          aria-label={triggerLabel}
          className={styles.popover}
          style={{ width: popoverWidth }}
          onKeyDown={(event) => {
            if (
              event.key === 'Escape' &&
              !(event.target as HTMLElement).closest('[aria-expanded="true"]')
            ) {
              event.stopPropagation();
              close();
            }
          }}
        >
          <div className={styles.heading}>
            {title || intl.formatMessage({ id: 'common.filter.label' })}
          </div>
          {open ? (
            <KeyValueFilterEditor
              value={value}
              options={options}
              onChange={onChange}
              keyPlaceholder={
                keyPlaceholder ||
                intl.formatMessage({ id: 'common.filter.keyValue.key' })
              }
              valuePlaceholder={
                valuePlaceholder ||
                intl.formatMessage({ id: 'common.filter.keyValue.value' })
              }
              loading={loading}
              autoFocus={focusOnOpen}
            />
          ) : null}
        </div>
      }
    >
      <Input
        ref={inputRef}
        readOnly
        role="combobox"
        aria-label={triggerLabel}
        aria-expanded={open && !disabled}
        aria-haspopup="dialog"
        aria-controls={open ? popupId : undefined}
        disabled={disabled}
        value={summary}
        title={summary || undefined}
        placeholder={triggerLabel}
        prefix={
          <SearchOutlined
            style={{ color: 'var(--ant-color-text-placeholder)' }}
          />
        }
        suffix={
          value.length ? (
            <Button
              type="text"
              size="small"
              className={styles.clear}
              disabled={disabled}
              icon={<CloseCircleFilled />}
              aria-label={intl.formatMessage({
                id: 'common.filter.keyValue.clear'
              })}
              onClick={(event) => {
                event.stopPropagation();
                onChange([]);
                close();
              }}
            />
          ) : null
        }
        className={[styles.trigger, className].filter(Boolean).join(' ')}
        style={{ width, minWidth: 0, maxWidth: '100%', ...style }}
        onKeyDown={(event) => {
          if (
            event.key === 'Enter' ||
            event.key === ' ' ||
            event.key === 'ArrowDown'
          ) {
            event.preventDefault();
            setPopup({ open: true, focusOnOpen: true });
          } else if (event.key === 'Escape') close();
        }}
      />
    </Popover>
  );
}
