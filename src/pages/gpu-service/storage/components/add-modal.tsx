import { PageActionType } from '@/config/types';
import useSubmitLock from '@/hooks/use-submit-lock';
import { FormDrawer, ModalFooter } from '@gpustack/core-ui';
import { useEffect, useRef } from 'react';
import { FormContext } from '../config/form-context';
import { FormData, ListItem } from '../config/types';
import GPUServiceStorageForm from '../forms';
import useQueryStorageClass from '../services/use-query-storage-class';

type AddModalProps = {
  title: string;
  action: PageActionType;
  open: boolean;
  onOk: (values: FormData) => void;
  data?: ListItem | null;
  onCancel: () => void;
};

const AddModal: React.FC<AddModalProps> = ({
  title,
  action,
  open,
  onOk,
  data,
  onCancel
}) => {
  const form = useRef<any>(null);
  const { loading, guard, run, release } = useSubmitLock();
  // The dropdown gets its own storage-type list, scoped to the org the
  // create-scope picker targets — distinct from the page-level list, which
  // stays unscoped so the table can label every org's rows.
  const { storageClassList, fetchData: fetchStorageClass } =
    useQueryStorageClass();

  useEffect(() => {
    if (open) {
      fetchStorageClass({ page: -1 });
    }
  }, [open]);

  // Platform admin picked a target org in the create-scope slot: reload the
  // storage-type list pinned to that org so the dropdown only offers types
  // the org can reference (its own plus any reachable via cluster access).
  const handleScopeChange = (orgId?: number | null) => {
    fetchStorageClass(
      { page: -1 },
      orgId != null
        ? { headers: { 'X-Organization-Id': String(orgId) } }
        : undefined
    );
  };

  const handleSubmit = () => {
    guard(() => form.current?.submit());
  };

  const handleCancel = () => {
    form.current?.resetFields();
    onCancel();
  };

  const onFinish = async (values: FormData) => {
    await run(() =>
      onOk({
        ...values
      })
    );
  };

  return (
    <FormDrawer
      title={title}
      open={open}
      onCancel={handleCancel}
      onSubmit={handleSubmit}
      width={600}
      footer={
        <ModalFooter
          onOk={handleSubmit}
          onCancel={handleCancel}
          loading={loading}
          style={{
            padding: '16px 24px 8px',
            display: 'flex',
            justifyContent: 'flex-end'
          }}
        />
      }
    >
      <FormContext.Provider value={{ storageClassList }}>
        <GPUServiceStorageForm
          ref={form}
          action={action}
          currentData={data}
          onScopeChange={handleScopeChange}
          onFinish={onFinish}
          onFinishFailed={release}
          open={open}
        />
      </FormContext.Provider>
    </FormDrawer>
  );
};

export default AddModal;
