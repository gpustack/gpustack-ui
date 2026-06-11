import { PageAction } from '@/config';
import { PageActionType } from '@/config/types';
import { Form } from 'antd';
import { forwardRef, useEffect, useImperativeHandle } from 'react';
import {
  DefaultNFSMountOptions,
  DefaultS3MountOptions,
  StorageTypeKindValueMap
} from '../config';
import { FormData, ListItem, StorageTypeKind } from '../config/types';
import Basic from './basic';
import NFSForm from './nfs';
import S3Form from './s3';

interface StorageTypeFormProps {
  ref?: any;
  open: boolean;
  action: PageActionType;
  currentData?: ListItem | null;
  onFinish: (values: FormData) => Promise<void>;
  onFinishFailed?: (errorInfo: any) => void;
}

const detectKind = (item?: ListItem | null): StorageTypeKind => {
  if (item?.spec?.s3) return StorageTypeKindValueMap.S3;
  return StorageTypeKindValueMap.NFS;
};

const GPUServiceStorageTypeForm: React.FC<StorageTypeFormProps> = forwardRef(
  (props, ref) => {
    const { action, currentData, open, onFinish, onFinishFailed } = props;
    const [form] = Form.useForm<FormData>();
    const kind = Form.useWatch('type', form);

    useEffect(() => {
      if (!open) {
        form.resetFields();
        return;
      }

      if (action === PageAction.EDIT && currentData) {
        const detected = detectKind(currentData);
        form.setFieldsValue({
          name: currentData.name,
          displayName: currentData.displayName,
          description: currentData.description,
          type: detected,
          spec: {
            nfs: currentData.spec?.nfs ?? null,
            s3: (currentData.spec?.s3 ?? null) as any
          }
        });
        return;
      }

      form.setFieldsValue({
        type: StorageTypeKindValueMap.NFS,
        spec: {
          nfs: {
            server: '',
            share: '',
            mountOptions: DefaultNFSMountOptions
          },
          s3: null
        }
      });
    }, [action, currentData, form, open]);

    useEffect(() => {
      if (!open || action === PageAction.EDIT) return;
      if (kind === StorageTypeKindValueMap.S3) {
        const existing = form.getFieldValue(['spec', 's3']);
        if (!existing) {
          form.setFieldValue(['spec', 's3'], {
            endpoint: '',
            insecure: false,
            mountOptions: DefaultS3MountOptions
          });
        }
        form.setFieldValue(['spec', 'nfs'], null);
      } else if (kind === StorageTypeKindValueMap.NFS) {
        const existing = form.getFieldValue(['spec', 'nfs']);
        if (!existing) {
          form.setFieldValue(['spec', 'nfs'], {
            server: '',
            share: '',
            mountOptions: DefaultNFSMountOptions
          });
        }
        form.setFieldValue(['spec', 's3'], null);
      }
    }, [kind, open, action, form]);

    useImperativeHandle(ref, () => ({
      submit: () => {
        form.submit();
      },
      resetFields: () => {
        form.resetFields();
      }
    }));

    const handleFinish = async (values: FormData) => {
      const isNFS = values.type === StorageTypeKindValueMap.NFS;
      await onFinish({
        ...values,
        spec: {
          nfs: isNFS ? (values.spec?.nfs ?? null) : null,
          s3: !isNFS ? (values.spec?.s3 ?? null) : null
        }
      });
    };

    return (
      <Form
        name="gpuServiceStorageTypeForm"
        form={form}
        onFinish={handleFinish}
        onFinishFailed={onFinishFailed}
        preserve={false}
        initialValues={{}}
      >
        <Basic action={action} />
        {kind === StorageTypeKindValueMap.NFS && <NFSForm action={action} />}
        {kind === StorageTypeKindValueMap.S3 && <S3Form action={action} />}
      </Form>
    );
  }
);

export default GPUServiceStorageTypeForm;
