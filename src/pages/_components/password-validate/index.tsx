import {
  digitReg,
  lowercaseReg,
  specialCharacterReg,
  uppercaseReg
} from '@/config';
import { CheckCircleFilled, CloseCircleFilled } from '@ant-design/icons';
import { useIntl } from '@umijs/max';
import { Space } from 'antd';

const PasswordValidate: React.FC<{ value: string }> = ({ value = '' }) => {
  const intl = useIntl();

  const renderIcon = ({ valid, text }: { valid: boolean; text: string }) => {
    return (
      <>
        {valid ? (
          <CheckCircleFilled style={{ color: 'green' }} />
        ) : (
          <CloseCircleFilled style={{ color: 'red' }} />
        )}
        <span
          className="m-l-5"
          style={{ color: 'var(--ant-color-text-description)' }}
        >
          {text}
        </span>
      </>
    );
  };
  return (
    <Space direction="vertical" style={{ paddingTop: '10px' }}>
      <span>
        {renderIcon({
          valid: uppercaseReg.test(value),
          text: intl.formatMessage({ id: 'users.password.uppcase' })
        })}
      </span>
      <span>
        {renderIcon({
          valid: lowercaseReg.test(value),
          text: intl.formatMessage({ id: 'users.password.lowercase' })
        })}
      </span>

      <span>
        {renderIcon({
          valid: digitReg.test(value),
          text: intl.formatMessage({ id: 'users.password.number' })
        })}
      </span>
      <span>
        {renderIcon({
          valid: value.length >= 6 && value.length <= 12,
          text: intl.formatMessage({ id: 'users.password.length' })
        })}
      </span>
      <span>
        {renderIcon({
          valid: specialCharacterReg.test(value),
          text: intl.formatMessage({ id: 'users.password.special' })
        })}
      </span>
    </Space>
  );
};

export default PasswordValidate;
