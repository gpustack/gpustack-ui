import { CheckOutlined, CloseOutlined } from '@ant-design/icons';
import { useIntl } from '@umijs/max';
import { Button, Flex, Input } from 'antd';
import { useId, useRef, useState } from 'react';

interface InsertLayerInputProps {
  taken: string[];
  onConfirm: (name: string) => void;
  onCancel: () => void;
}

const InsertLayerInput: React.FC<InsertLayerInputProps> = ({
  taken,
  onConfirm,
  onCancel
}) => {
  const intl = useIntl();
  const [state, setState] = useState({ name: '', attempted: false });
  const composingRef = useRef(false);
  const errorId = useId();
  const name = state.name.trim();
  const nameError = !name
    ? 'clusters.topology.custom.name.required'
    : taken.some(
          (candidate) =>
            candidate.trim().toLocaleLowerCase() === name.toLocaleLowerCase()
        )
      ? 'clusters.topology.custom.name.taken'
      : null;
  const error = state.attempted && nameError;
  const placeholder = intl.formatMessage({
    id: 'clusters.topology.custom.name.placeholder'
  });

  const confirm = () => {
    if (nameError) {
      setState((current) => ({ ...current, attempted: true }));
      return;
    }
    onConfirm(name);
  };

  return (
    <Flex orientation="vertical" gap={4} style={{ width: '100%' }}>
      <Flex align="center" gap={4}>
        <Input
          autoFocus
          placeholder={placeholder}
          aria-label={placeholder}
          aria-invalid={!!error}
          aria-describedby={error ? errorId : undefined}
          required
          style={{ flex: 1, minWidth: 0 }}
          value={state.name}
          status={error ? 'error' : undefined}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
            setState((current) => ({ ...current, name: e.target.value }))
          }
          onCompositionStart={() => {
            composingRef.current = true;
          }}
          onCompositionEnd={() => {
            composingRef.current = false;
          }}
          onKeyDown={(e: React.KeyboardEvent<HTMLInputElement>) => {
            if (
              composingRef.current ||
              e.nativeEvent.isComposing ||
              e.nativeEvent.keyCode === 229
            ) {
              return;
            }
            if (e.key === 'Enter' || e.key === 'Escape') {
              e.preventDefault();
              e.stopPropagation();
              if (e.key === 'Enter') {
                confirm();
              } else {
                onCancel();
              }
            }
          }}
        />
        <Button
          type="text"
          size="small"
          htmlType="button"
          icon={<CheckOutlined />}
          aria-label={intl.formatMessage({ id: 'common.button.confirm' })}
          onClick={confirm}
        />
        <Button
          type="text"
          size="small"
          htmlType="button"
          icon={<CloseOutlined />}
          aria-label={intl.formatMessage({ id: 'common.button.cancel' })}
          onClick={onCancel}
        />
      </Flex>
      {error && (
        <span
          id={errorId}
          role="alert"
          style={{ fontSize: 12, color: 'var(--ant-color-error)' }}
        >
          {intl.formatMessage({ id: error })}
        </span>
      )}
    </Flex>
  );
};

export default InsertLayerInput;
