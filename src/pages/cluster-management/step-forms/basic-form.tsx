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

  // Forward through to the live ClusterForm ref on each call instead of
  // snapshotting its methods. ClusterForm rebuilds these closures whenever its
  // internal state (e.g. clusterType) changes, but BasicForm does not re-render
  // with it — a frozen snapshot would keep calling stale closures (reading the
  // initial clusterType) and be null on the first render before the ref attaches.
  useImperativeHandle(ref, () => ({
    validateFields: (...args: any[]) =>
      formRef.current?.validateFields(...args),
    getFieldsValue: (...args: any[]) =>
      formRef.current?.getFieldsValue(...args),
    submit: (...args: any[]) => formRef.current?.submit(...args)
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
