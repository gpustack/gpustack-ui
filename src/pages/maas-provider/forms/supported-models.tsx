import ListInput from '@/components/list-input';
import SealSelect from '@/components/seal-form/seal-select';
import { CheckCircleFilled } from '@ant-design/icons';
import { useIntl } from '@umijs/max';
import { Button, Form } from 'antd';
import styled from 'styled-components';
import { FormData } from '../config/types';

const SelectWrapper = styled.div`
  flex: 1;
  display: flex;
  align-items: center;
  gap: 8px;
  .icon-wrapper {
    display: flex;
    align-items: center;
    height: 100%;
  }
`;

const SupportedModels = () => {
  const intl = useIntl();
  const form = Form.useFormInstance<FormData>();

  const handleTestModel = (data: any) => {
    data.loading = true;
    setTimeout(() => {
      data.loading = false;
    }, 1000);
  };

  const renderModelItem = (
    data: any,
    {
      onChange,
      onBlur
    }: { onChange: (value: string) => void; onBlur?: (e: any) => void }
  ) => {
    return (
      <SelectWrapper>
        <SealSelect
          suffixIcon={
            <CheckCircleFilled
              style={{ color: 'var(--ant-color-success)', fontSize: 16 }}
            />
          }
          alwaysFocus={true}
          value={data.value}
          onChange={onChange}
          onBlur={onBlur}
          options={[
            { label: 'Model A', value: 'model_a' },
            { label: 'Model B', value: 'model_b' },
            { label: 'Model C', value: 'model_c' }
          ]}
        />
        <Button
          type="link"
          size="small"
          loading={data.loading}
          onClick={() => handleTestModel(data)}
        >
          {intl.formatMessage({ id: 'providers.form.model.test' })}
        </Button>
      </SelectWrapper>
    );
  };

  const handleOnChange = (values: string[]) => {};

  return (
    <>
      <Form.Item name="models">
        <div data-field="supportedModels"></div>
        <ListInput
          styles={{
            wrapper: {
              paddingTop: 14
            }
          }}
          btnText={intl.formatMessage({ id: 'providers.form.models.add' })}
          dataList={[]}
          renderItem={renderModelItem}
          onChange={handleOnChange}
        ></ListInput>
      </Form.Item>
    </>
  );
};

export default SupportedModels;
