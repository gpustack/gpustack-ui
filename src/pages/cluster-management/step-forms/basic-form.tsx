import { PageActionType } from '@/config/types';
import { useIntl } from '@umijs/max';
import { forwardRef, useImperativeHandle, useRef } from 'react';
import styled from 'styled-components';
import ClusterForm from '../components/cluster-form';
import { ProviderType } from '../config';

const Title = styled.span`
  display: flex;
  align-items: center;
  justify-content: space-between;
  font-weight: 600;
  font-size: 14px;
  .text {
    font-size: 20px;
  }
`;
interface BasicFormProps {
  provider: ProviderType;
  action: PageActionType;
  credentialList: Global.BaseOption<number>[];
  currentData?: any;
}

const BasicForm = forwardRef((props: BasicFormProps, ref) => {
  const intl = useIntl();
  const { provider, credentialList, action, currentData } = props;
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
      {/* <PageTools
        marginBottom={16}
        left={
          <Title>
            {intl.formatMessage({ id: 'clusters.create.configBasic' })}
          </Title>
        }
        marginTop={0}
      ></PageTools> */}
      <ClusterForm
        provider={provider}
        action={action}
        ref={formRef}
        credentialList={credentialList}
        onFinish={handleOnFinish}
        currentData={currentData}
      ></ClusterForm>
    </div>
  );
});

export default BasicForm;
