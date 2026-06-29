import { useIntl } from '@umijs/max';
import { Button } from 'antd';
import React, { useState } from 'react';
import ModifyPasswordForm from './modify-password-form';
import { SettingRow, SettingsGroup } from './settings-group';

const Security: React.FC = () => {
  const intl = useIntl();
  const [open, setOpen] = useState(false);

  return (
    <SettingsGroup>
      <SettingRow
        title={intl.formatMessage({ id: 'users.form.updatepassword' })}
        description={intl.formatMessage({
          id: 'users.password.modify.tips'
        })}
        extra={
          !open && (
            <Button onClick={() => setOpen(true)}>
              {intl.formatMessage({ id: 'users.form.updatepassword' })}
            </Button>
          )
        }
      >
        {open && (
          <ModifyPasswordForm
            onCancel={() => setOpen(false)}
            onSuccess={() => setOpen(false)}
          />
        )}
      </SettingRow>
    </SettingsGroup>
  );
};

Security.displayName = 'Security';

export default Security;
