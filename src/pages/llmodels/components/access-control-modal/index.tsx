import AlertBlockInfo from '@/components/alert-info/block';
import ModalFooter from '@/components/modal-footer';
import { PageActionType } from '@/config/types';
import FormDrawer from '@/pages/_components/form-drawer';
import { RouteItem } from '@/pages/model-routes/config/types';
import { useIntl } from '@umijs/max';
import { message } from 'antd';
import _ from 'lodash';
import { useEffect, useRef, useState } from 'react';
import { updateModelAccessUser } from '../../apis';
import { AccessControlFormData } from '../../config/types';
import AccessControlForm from './form';

const AccessControlModal: React.FC<
  Global.ScrollerModalProps<RouteItem, AccessControlFormData>
> = ({ open, title, currentData, action, onCancel }) => {
  const intl = useIntl();
  const form = useRef<any>(null);
  const [isChanged, setIsChanged] = useState(false);
  const formCacheRef = useRef<AccessControlFormData | null>(null);

  const handleSumit = () => {
    form.current?.submit();
  };

  const handleOnFinish = async (values: AccessControlFormData) => {
    try {
      const data = {
        access_policy: values.access_policy,
        users:
          values.access_policy === 'allowed_users' ? values.users || [] : []
      };
      await updateModelAccessUser({
        id: currentData?.id as number,
        data: data
      });
      message.success(intl.formatMessage({ id: 'common.message.success' }));
      onCancel?.();
    } catch (error) {
      // do nothing, error message handled in request layer
    }
  };

  const customEqual = (objValue: any, othValue: any) => {
    if (_.isArray(objValue) && _.isArray(othValue)) {
      const objIds = objValue.map((item: any) => item.id).sort();
      const othIds = othValue.map((item: any) => item.id).sort();
      return _.isEqual(objIds, othIds);
    }
    return undefined;
  };

  const handleOnValuesChange = async (changedValues: any, allValues: any) => {
    const initialValues = formCacheRef.current;
    if (_.isEqualWith(initialValues, allValues, customEqual)) {
      setIsChanged(false);
    } else {
      setIsChanged(true);
    }
  };

  useEffect(() => {
    if (open) {
      setIsChanged(false);
      setTimeout(() => {
        const initialValues = form.current?.getFieldsValue();
        formCacheRef.current = {
          access_policy: initialValues.access_policy,
          users: initialValues.users || []
        };
      }, 200);
    } else {
      formCacheRef.current = null;
      setIsChanged(false);
    }
  }, [open, currentData]);

  return (
    <FormDrawer
      title={title}
      open={open}
      onCancel={onCancel}
      width={700}
      footer={
        <div style={{ paddingInline: 24, paddingBottom: 8 }}>
          {isChanged && (
            <AlertBlockInfo
              type="warning"
              style={{ marginBottom: 16 }}
              contentStyle={{ paddingInline: 0 }}
              message={intl.formatMessage({
                id: 'models.button.accessSettings.tips'
              })}
            ></AlertBlockInfo>
          )}
          <ModalFooter onOk={handleSumit} onCancel={onCancel}></ModalFooter>
        </div>
      }
    >
      <AccessControlForm
        ref={form}
        currentData={currentData}
        action={action as PageActionType}
        onFinish={handleOnFinish}
        onValuesChange={handleOnValuesChange}
      />
    </FormDrawer>
  );
};

export default AccessControlModal;
