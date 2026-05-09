import {
  InputNumber as CInputNumber,
  MetadataList,
  Select as SealSelect
} from '@gpustack/core-ui';
import { useIntl } from '@umijs/max';
import { Form } from 'antd';
import { FormData, PortItem as PortItemType } from '../config/types';

type PortProtocol = PortItemType['protocol'];

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

interface PortItemProps {
  item: PortItemType;
  index: number;
  onChange: (item: PortItemType) => void;
}

const PortItem: React.FC<PortItemProps> = ({ item, index, onChange }) => {
  return (
    <div style={{ display: 'flex', gap: 12, width: '100%' }}>
      <div style={{ flex: 1 }}>
        <SealSelect
          value={item.protocol}
          options={protocolOptions}
          onChange={(value) => {
            onChange({
              ...item,
              protocol: value as PortProtocol
            });
          }}
          style={{ width: '100%' }}
        ></SealSelect>
      </div>
      <div style={{ flex: 1 }}>
        <CInputNumber
          min={1}
          max={65535}
          precision={0}
          value={item.port}
          onChange={(value) => {
            onChange({
              ...item,
              port: typeof value === 'number' ? value : (undefined as any)
            });
          }}
          style={{ width: '100%' }}
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
        port: undefined as any
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
