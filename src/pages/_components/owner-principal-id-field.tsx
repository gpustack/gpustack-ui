import { currentClusterAtom } from '@/atoms/gpuservice';
import { Input as CInput } from '@gpustack/core-ui';
import { Form } from 'antd';
import type { NamePath } from 'antd/es/form/interface';
import { useAtomValue } from 'jotai';
import { useEffect } from 'react';

interface OwnerPrincipalIdFieldProps {
  name?: NamePath;
}

const OwnerPrincipalIdField: React.FC<OwnerPrincipalIdFieldProps> = ({
  name = 'owner_principal_id'
}) => {
  const currentCluster = useAtomValue(currentClusterAtom);
  const ownerPrincipalId = currentCluster?.owner_principal_id;
  const form = Form.useFormInstance();

  useEffect(() => {
    if (ownerPrincipalId != null) {
      form.setFieldValue(name, ownerPrincipalId);
    }
  }, [ownerPrincipalId, name, form]);

  return (
    <Form.Item name={name} hidden>
      <CInput.Input />
    </Form.Item>
  );
};

export default OwnerPrincipalIdField;
