import { PageActionType } from '@/config/types';
import { AlertBlockInfo, FormDrawer, ModalFooter } from '@gpustack/core-ui';
import { useIntl } from '@umijs/max';
import React, { useRef } from 'react';
import { FormData, RouteItem as ListItem } from '../config/types';
import ModelRouteForm from '../forms';

type AddModalProps = {
  title: string;
  action: PageActionType;
  realAction?: string;
  open: boolean;
  currentData?: ListItem; // Used when action is EDIT
  onOk: (values: FormData) => void;
  onCancel: () => void;
};
const AddProvider: React.FC<AddModalProps> = ({
  title,
  action,
  realAction,
  open,
  currentData,
  onOk,
  onCancel
}) => {
  const intl = useIntl();
  const [isChanged, setIsChanged] = React.useState(false);
  const form = useRef<any>(null);

  const handleSubmit = () => {
    form.current?.submit();
  };

  const onFinish = async (data: FormData) => {
    onOk({
      ...data
    });
  };

  const handleCancel = () => {
    form.current?.resetFields();
    onCancel();
  };

  return (
    <FormDrawer
      title={title}
      open={open}
      onCancel={handleCancel}
      onSubmit={handleSubmit}
      width={600}
      footer={
        <div style={{ paddingInline: 24, paddingBottom: 8 }}>
          {isChanged && (
            <AlertBlockInfo
              type="warning"
              contentStyle={{ paddingInline: 0 }}
              message={intl.formatMessage({
                id: 'routes.form.fallback.warning'
              })}
            ></AlertBlockInfo>
          )}
          <ModalFooter
            onOk={handleSubmit}
            onCancel={onCancel}
            styles={{
              wrapper: {
                paddingTop: 16
              }
            }}
          ></ModalFooter>
        </div>
      }
    >
      <ModelRouteForm
        ref={form}
        action={action}
        realAction={realAction}
        currentData={currentData}
        onFinish={onFinish}
        open={open}
        onFallbackChange={(changed: boolean) => {
          setIsChanged(changed);
        }}
      />
    </FormDrawer>
  );
};

export default AddProvider;
