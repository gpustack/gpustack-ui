import PageTools from '@/components/page-tools';
import { PageActionType } from '@/config/types';
import { useIntl } from '@umijs/max';
import { forwardRef, useImperativeHandle, useRef } from 'react';
import styled from 'styled-components';
import Parameters from '../forms/parameters';

const Title = styled.span`
  display: flex;
  align-items: center;
  justify-content: space-between;
  font-weight: 700;
  font-size: 16px;
  .text {
    font-size: 20px;
  }
`;
interface BasicFormProps {
  action: PageActionType;
  currentData?: any;
}

const ParametersForm = forwardRef((props: BasicFormProps, ref) => {
  const intl = useIntl();
  const { action, currentData } = props;
  const formRef = useRef<any>(null);

  const handleOnFinish = (values: any) => {
    console.log(values);
  };

  useImperativeHandle(ref, () => ({
    validateFields: formRef.current?.validateFields,
    getFieldsValue: formRef.current?.getFieldsValue,
    submit: formRef.current?.submit
  }));

  return (
    <div>
      <PageTools
        marginBottom={16}
        left={<Title>Parameters Configuration</Title>}
        marginTop={0}
      ></PageTools>
      <Parameters
        action={action}
        ref={formRef}
        onFinish={handleOnFinish}
        currentData={currentData}
      ></Parameters>
    </div>
  );
});

export default ParametersForm;
