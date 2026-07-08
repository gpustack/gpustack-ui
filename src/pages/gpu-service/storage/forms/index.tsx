import { PageAction } from '@/config';
import { PageActionType } from '@/config/types';
import { useMemoizedFn } from 'ahooks';
import { Form } from 'antd';
import { forwardRef, useEffect, useImperativeHandle, useRef } from 'react';
import { FormData, ListItem } from '../config/types';
import Basic from './basic';

interface StorageFormProps {
  ref?: any;
  open: boolean;
  action: PageActionType;
  currentData?: ListItem | null;
  // Hide the create-scope org picker when the host already fixes the
  // tenant scope (e.g. the instance create form). Defaults to shown.
  showOrgScope?: boolean;
  // Fired when the create-scope picker (platform admin "All" view)
  // retargets the form to another org. Only emitted on genuine changes,
  // never on the initial mount, and never in builds where the picker
  // isn't mounted (the watched field stays undefined). Lets the parent
  // reload the org-scoped storage-type options.
  onScopeChange?: (orgId: number | null | undefined) => void;
  onFinish: (values: FormData) => Promise<void>;
  onFinishFailed?: (errorInfo: any) => void;
}

const GPUServiceStorageForm: React.FC<StorageFormProps> = forwardRef(
  (props, ref) => {
    const {
      action,
      currentData,
      open,
      showOrgScope = true,
      onScopeChange,
      onFinish,
      onFinishFailed
    } = props;
    const [form] = Form.useForm<FormData>();
    // `organization_id` is owned by the create-scope picker slot; it only
    // exists/changes when a platform admin retargets the form. Watch it so
    // the initial/default scope can be propagated once the picker resolves it.
    const scopeOrgId = Form.useWatch('organization_id', form);
    const scopeInitRef = useRef(true);

    // Stable wrapper so the effect / change handler always call the latest
    // callback without re-subscribing on the parent's fn identity.
    const orgScope = useMemoizedFn((orgId?: number | null) => {
      onScopeChange?.(orgId);
    });

    // Genuine retarget by the create-scope picker: drop the stale type pick
    // (it may name a type the newly chosen org can't reference) and reload the
    // org-scoped list. Wired to the picker's own onChange, so it fires only on
    // a user selection — never on the picker's programmatic default.
    const handleOrgScopeChange = useMemoizedFn((orgId?: number | null) => {
      scopeInitRef.current = false;
      form.setFieldValue(['spec', 'type'], undefined);
      orgScope(orgId ?? null);
    });

    useEffect(() => {
      if (!open) {
        // Re-arm the initial-scope propagation for the next open.
        scopeInitRef.current = true;
        return;
      }
      // Propagate the initial/default scope once the picker resolves it so the
      // parent loads the org-scoped type list, leaving any pre-filled type
      // intact. User-driven retargets go through handleOrgScopeChange instead.
      if (scopeInitRef.current && scopeOrgId != null) {
        scopeInitRef.current = false;
        orgScope(scopeOrgId);
      }
    }, [open, scopeOrgId, orgScope]);

    useEffect(() => {
      if (!open) {
        form.resetFields();
        return;
      }

      if (action === PageAction.EDIT && currentData) {
        form.setFieldsValue({
          name: currentData.name,
          displayName: currentData.displayName,
          description: currentData.description,
          spec: {
            capacity: currentData.spec?.capacity,
            type: currentData.spec?.type
          }
        });
      }
    }, [action, currentData, form, open]);

    useImperativeHandle(ref, () => ({
      submit: () => {
        form.submit();
      },
      resetFields: () => {
        form.resetFields();
      }
    }));

    return (
      <Form
        name="gpuServiceStorageForm"
        form={form}
        onFinish={onFinish}
        onFinishFailed={onFinishFailed}
        preserve={false}
        initialValues={{}}
      >
        <Basic
          action={action}
          open={open}
          showOrgScope={showOrgScope}
          onOrgScopeChange={handleOrgScopeChange}
        />
      </Form>
    );
  }
);

export default GPUServiceStorageForm;
