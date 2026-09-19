import { useIntl } from '@umijs/max';
import { Button } from 'antd';
import React, { useState } from 'react';
import ModifyPasswordModal from './modify-password-modal';
import { SettingRow } from './setting-row';

const Security: React.FC = () => {
  const intl = useIntl();
  const [open, setOpen] = useState(false);

  return (
    <>
      <SettingRow
        title={intl.formatMessage({ id: 'users.form.updatepassword' })}
        description={intl.formatMessage({
          id: 'users.password.modify.tips'
        })}
        extra={
          <Button onClick={() => setOpen(true)}>
            {intl.formatMessage({ id: 'users.form.updatepassword' })}
          </Button>
        }
      />
      <ModifyPasswordModal
        open={open}
        onCancel={() => setOpen(false)}
        onSuccess={() => setOpen(false)}
      />
    </>
  );
};

Security.displayName = 'Security';

export default Security;
