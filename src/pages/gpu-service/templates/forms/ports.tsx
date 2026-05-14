import {
  Input as CInput,
  InputNumber as CInputNumber,
  MetadataList,
  Select as SealSelect
} from '@gpustack/core-ui';
import { useIntl } from '@umijs/max';
import { Form } from 'antd';
import { useEffect, useRef, useState } from 'react';
import { FormData, PortItem as PortItemType } from '../config/types';

type PortProtocol = PortItemType['protocol'];

const PORT_NAME_MAX = 16;

const protocolOptions = [
  {
    label: 'UDP',
    value: 'UDP'
  },
  {
    label: 'TCP',
    value: 'TCP'
  }
];

const wellKnownTcpPortNames: Record<number, string> = {
  22: 'SSH',
  80: 'HTTP',
  443: 'HTTPS'
};

const getAutoFilledName = (
  protocol: PortProtocol | undefined,
  port: number | undefined,
  previousProtocol: PortProtocol | undefined,
  previousPort: number | undefined,
  currentName: string | undefined
): string | undefined => {
  if (protocol !== 'TCP' || !port) {
    return currentName;
  }
  const suggested = wellKnownTcpPortNames[port];
  if (!suggested) {
    return currentName;
  }
  const previousSuggested =
    previousProtocol === 'TCP' && previousPort
      ? wellKnownTcpPortNames[previousPort]
      : undefined;
  // Only overwrite when the name is empty or matches a previously suggested
  // well-known name — never stomp on a user-entered value.
  if (!currentName || currentName === previousSuggested) {
    return suggested;
  }
  return currentName;
};

interface PortItemProps {
  item: PortItemType;
  index: number;
  onChange: (item: PortItemType) => void;
}

interface PortNameInputProps {
  value: string | undefined;
  onChange: (value: string) => void;
  placeholder: string;
}

const PortNameInput: React.FC<PortNameInputProps> = ({
  value,
  onChange,
  placeholder
}) => {
  const [localValue, setLocalValue] = useState<string>(value ?? '');
  const isComposingRef = useRef(false);

  useEffect(() => {
    if (!isComposingRef.current) {
      setLocalValue(value ?? '');
    }
  }, [value]);

  return (
    <CInput.Input
      showCount
      maxLength={PORT_NAME_MAX}
      value={localValue}
      placeholder={placeholder}
      onCompositionStart={() => {
        isComposingRef.current = true;
      }}
      onCompositionEnd={(e) => {
        isComposingRef.current = false;
        const next = (e.target as HTMLInputElement).value;
        setLocalValue(next);
        onChange(next);
      }}
      onChange={(e) => {
        const next = e.target.value;
        setLocalValue(next);
        if (!isComposingRef.current) {
          onChange(next);
        }
      }}
      style={{ width: '100%' }}
    />
  );
};

const PortItem: React.FC<PortItemProps> = ({ item, index, onChange }) => {
  const intl = useIntl();
  return (
    <div style={{ display: 'flex', gap: 12, width: '100%' }}>
      <div style={{ width: 120 }}>
        <SealSelect
          value={item.protocol}
          options={protocolOptions}
          onChange={(value) => {
            const nextProtocol = value as PortProtocol;
            onChange({
              ...item,
              protocol: nextProtocol,
              name: getAutoFilledName(
                nextProtocol,
                item.port,
                item.protocol,
                item.port,
                item.name
              )
            });
          }}
          style={{ width: '100%' }}
        ></SealSelect>
      </div>
      <div style={{ width: 120 }}>
        <CInputNumber
          min={1}
          max={65535}
          precision={0}
          value={item.port}
          onChange={(value) => {
            const nextPort =
              typeof value === 'number' ? value : (undefined as any);
            onChange({
              ...item,
              port: nextPort,
              name: getAutoFilledName(
                item.protocol,
                nextPort,
                item.protocol,
                item.port,
                item.name
              )
            });
          }}
          style={{ width: '100%' }}
        />
      </div>
      <div style={{ flex: 1 }}>
        <PortNameInput
          value={item.name}
          placeholder={intl.formatMessage({
            id: 'gpuservice.template.ports.name'
          })}
          onChange={(next) => {
            onChange({
              ...item,
              name: next
            });
          }}
        />
      </div>
    </div>
  );
};

const Ports: React.FC = () => {
  const intl = useIntl();
  const form = Form.useFormInstance<FormData>();
  const ports = Form.useWatch(['spec', 'ports'], form) || [];

  const updatePorts = (list: PortItemType[]) => {
    form.setFieldValue(['spec', 'ports'], list);
  };

  const handleAdd = () => {
    updatePorts([
      ...ports,
      {
        protocol: 'TCP',
        port: undefined as any,
        name: ''
      }
    ]);
  };

  const handleDelete = (index: number) => {
    const newList = [...ports];
    newList.splice(index, 1);
    updatePorts(newList);
  };

  const handleChange = (index: number, item: PortItemType) => {
    const newList = [...ports];
    newList[index] = item;
    updatePorts(newList);
  };

  return (
    <Form.Item<FormData>
      name={['spec', 'ports']}
      rules={[
        {
          validator: async (_, value) => {
            if (!value?.length) {
              return Promise.resolve();
            }
            const hasInvalidPort = value.some(
              (item: PortItemType) => !item.protocol || !item.port
            );
            if (hasInvalidPort) {
              return Promise.reject(
                new Error(
                  intl.formatMessage({
                    id: 'gpuservice.template.ports.invalid'
                  })
                )
              );
            }
            const hasInvalidName = value.some(
              (item: PortItemType) =>
                item.name && item.name.length > PORT_NAME_MAX
            );
            if (hasInvalidName) {
              return Promise.reject(
                new Error(
                  intl.formatMessage({
                    id: 'gpuservice.template.ports.name.max'
                  })
                )
              );
            }
            return Promise.resolve();
          }
        }
      ]}
    >
      <MetadataList
        dataList={ports}
        btnText={intl.formatMessage({ id: 'gpuservice.template.ports.add' })}
        label={intl.formatMessage({ id: 'gpuservice.template.ports' })}
        onAdd={handleAdd}
        onDelete={handleDelete}
      >
        {(item, index) => (
          <PortItem
            key={index}
            index={index}
            item={item}
            onChange={(data) => handleChange(index, data)}
          />
        )}
      </MetadataList>
    </Form.Item>
  );
};

export default Ports;
