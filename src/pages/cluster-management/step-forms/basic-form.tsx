import { PageActionType } from '@/config/types';
import { forwardRef, useImperativeHandle, useRef } from 'react';
import ClusterForm from '../components/cluster-form';
import { ProviderType } from '../config';

interface BasicFormProps {
  provider: ProviderType;
  action: PageActionType;
  credentialList: Global.BaseOption<number>[];
  currentData?: any;
}

const BasicForm = forwardRef((props: BasicFormProps, ref) => {
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
    <ClusterForm
      provider={provider}
      action={action}
      ref={formRef}
      credentialList={credentialList}
      onFinish={handleOnFinish}
      currentData={currentData}
    ></ClusterForm>
  );
});

export default BasicForm;
