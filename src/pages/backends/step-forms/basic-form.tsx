import PageTools from '@/components/page-tools';
import { PageActionType } from '@/config/types';
import { useIntl } from '@umijs/max';
import { forwardRef, useImperativeHandle, useRef } from 'react';
import styled from 'styled-components';
import Basic from '../forms/basic';

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

const BasicForm = forwardRef((props: BasicFormProps, ref) => {
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
        left={
          <Title>
            {intl.formatMessage({ id: 'clusters.create.configBasic' })}
          </Title>
        }
        marginTop={0}
      ></PageTools>
      <Basic
        action={action}
        ref={formRef}
        onFinish={handleOnFinish}
        currentData={currentData}
      ></Basic>
    </div>
  );
});

export default BasicForm;
