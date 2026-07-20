import { PageActionType } from '@/config/types';
import { RouteItem } from '@/pages/model-routes/config/types';
import { getGPUStackPlugin } from '@/plugins';
import { AlertBlockInfo, FormDrawer, ModalFooter } from '@gpustack/core-ui';
import { useIntl } from '@umijs/max';
import { message } from 'antd';
import _ from 'lodash';
import { useEffect, useRef, useState } from 'react';
import { updateModelAccessUser } from '../../apis';
import { AccessControlFormData } from '../../config/types';
import AccessControlForm, { ALLOWED_PRINCIPALS_POLICY } from './form';

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
      // Everything saves through the single `/access` POST as
      // `principals` (one request, one success toast):
      //   * principal-based override active → its staged full grant set.
      //   * user picker → selected users mapped to USER-kind grants,
      //     plus any non-user grants preserved from the GET snapshot
      //     (so a user-only UI never wipes org/group grants it can't
      //     see — though in practice the picker only runs where none
      //     exist).
      //   * otherwise (authed/public) → send neither, so the server
      //     leaves existing grants untouched.
      const override = getGPUStackPlugin()?.accessControl?.allowedUsersOverride;
      const usesPrincipals =
        !!override && values.access_policy === override.policyValue;
      const usesUserList =
        !override && values.access_policy === ALLOWED_PRINCIPALS_POLICY;

      // Guard the load race: on an existing route, `principals` is
      // undefined until the GET seeds it. Saving in that window would
      // submit an empty grant set and wipe existing grants — bail out
      // (the modal stays open; the user can retry once loaded).
      if (
        currentData?.id &&
        (usesPrincipals || usesUserList) &&
        !values.principals
      ) {
        return;
      }

      let data: AccessControlFormData;
      if (usesPrincipals) {
        data = {
          access_policy: values.access_policy,
          principals: values.principals || []
        };
      } else if (usesUserList) {
        const preserved = (values.principals || []).filter(
          (p) => p.principal_type !== 'user'
        );
        const userGrants = (values.users || []).map((u) => ({
          principal_type: 'user',
          principal_id: u.id
        }));
        data = {
          access_policy: values.access_policy,
          principals: [...preserved, ...userGrants]
        };
      } else {
        data = { access_policy: values.access_policy };
      }
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
              contentStyle={{
                paddingInline: 0
              }}
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
