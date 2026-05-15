import { Input as CInput, MetadataList } from '@gpustack/core-ui';
import { useIntl } from '@umijs/max';
import { Form } from 'antd';
import { EnvItem as EnvItemType, FormData } from '../config/types';

interface EnvItemProps {
  item: EnvItemType;
  index: number;
  onChange: (item: EnvItemType) => void;
}

const EnvItem: React.FC<EnvItemProps & { disabled?: boolean }> = ({
  item,
  onChange,
  disabled = false
}) => {
  const intl = useIntl();
  return (
    <div style={{ display: 'flex', gap: 12, width: '100%' }}>
      <div style={{ flex: 1 }}>
        <CInput.Input
          disabled={disabled}
          value={item.name}
          placeholder={intl.formatMessage({
            id: 'gpuservice.template.env.name'
          })}
          onChange={(e) => {
            onChange({
              ...item,
              name: e.target.value
            });
          }}
          style={{ width: '100%' }}
        />
      </div>
      <div style={{ flex: 1 }}>
        <CInput.Input
          disabled={disabled}
          value={item.value}
          placeholder={intl.formatMessage({
            id: 'gpuservice.template.env.value'
          })}
          onChange={(e) => {
            onChange({
              ...item,
              value: e.target.value
            });
          }}
          style={{ width: '100%' }}
        />
      </div>
    </div>
  );
};

const Env: React.FC<{ disabled?: boolean }> = ({ disabled = false }) => {
  const intl = useIntl();
  const form = Form.useFormInstance<FormData>();
  const env = Form.useWatch(['spec', 'env'], form) || [];

  const updateEnv = (list: EnvItemType[]) => {
    form.setFieldValue(['spec', 'env'], list);
  };

  const handleAdd = () => {
    updateEnv([
      ...env,
      {
        name: '',
        value: ''
      }
    ]);
  };

  const handleDelete = (index: number) => {
    const newList = [...env];
    newList.splice(index, 1);
    updateEnv(newList);
  };

  const handleChange = (index: number, item: EnvItemType) => {
    const newList = [...env];
    newList[index] = item;
    updateEnv(newList);
  };

  return (
    <Form.Item<FormData>
      name={['spec', 'env']}
      rules={[
        {
          validator: async (_, value) => {
            if (!value?.length) {
              return Promise.resolve();
            }
            const hasInvalid = value.some((item: EnvItemType) => !item.name);
            if (hasInvalid) {
              return Promise.reject(
                new Error(
                  intl.formatMessage({
                    id: 'gpuservice.template.env.invalid'
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
        disabled={disabled}
        dataList={env}
        btnText={intl.formatMessage({ id: 'gpuservice.template.env.add' })}
        label={intl.formatMessage({ id: 'gpuservice.template.env' })}
        onAdd={handleAdd}
        onDelete={handleDelete}
      >
        {(item, index) => (
          <EnvItem
            disabled={disabled}
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

export default Env;
