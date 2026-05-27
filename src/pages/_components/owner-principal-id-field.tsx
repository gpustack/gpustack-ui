import { currentOrganizationIdAtom } from '@/atoms/user';
import { Input as CInput } from '@gpustack/core-ui';
import { Form } from 'antd';
import type { NamePath } from 'antd/es/form/interface';
import { useAtomValue } from 'jotai';
import { useEffect } from 'react';

interface OwnerPrincipalIdFieldProps {
  name?: NamePath;
}

// Pins `owner_principal_id` to the Org the caller is currently acting
// under. Cluster ownership is irrelevant here: cluster_access grants
// let one Org schedule on another Org's cluster, but the resource the
// caller creates still belongs to *their* Org, and the backend enforces
// `owner_principal_id == ctx.current_principal_id`.
const OwnerPrincipalIdField: React.FC<OwnerPrincipalIdFieldProps> = ({
  name = 'owner_principal_id'
}) => {
  const currentOrgId = useAtomValue(currentOrganizationIdAtom);
  const form = Form.useFormInstance();

  useEffect(() => {
    if (currentOrgId != null) {
      form.setFieldValue(name, currentOrgId);
    }
  }, [currentOrgId, name, form]);

  return (
    <Form.Item name={name} hidden>
      <CInput.Input />
    </Form.Item>
  );
};

export default OwnerPrincipalIdField;
