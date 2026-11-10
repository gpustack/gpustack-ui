import { useIntl } from '@umijs/max';
import { Form } from 'antd';
import React from 'react';
import { backendLabelMap } from '../../config';
import { useFormContext } from '../../config/form-context';
import { backendOptionsMap } from '../../constants/backend-parameters';
import BackendFields from '../backend';
import CustomBackend from '../custom-backend';

interface RoleBackendProps {
  index: number;
}

const RoleBackend: React.FC<RoleBackendProps> = ({ index }) => {
  const intl = useIntl();
  const form = Form.useFormInstance();
  const { flatBackendOptions = [] } = useFormContext();
  const backend = Form.useWatch('backend', { form, preserve: true });
  const version = Form.useWatch('backend_version', { form, preserve: true });
  const image = Form.useWatch('image_name', { form, preserve: true });
  const prefix = ['roles', index];
  const source =
    image ||
    (backend !== backendOptionsMap.custom
      ? version || intl.formatMessage({ id: 'common.options.auto' })
      : null);
  const inheritLabel = [
    intl.formatMessage({ id: 'models.form.roles.backend.inherit' }),
    flatBackendOptions.find((option) => option.value === backend)?.title ||
      backendLabelMap[backend] ||
      backend ||
      '-',
    source
  ]
    .filter(Boolean)
    .join(' · ');

  return (
    <>
      <BackendFields namePrefix={prefix} inheritLabel={inheritLabel} />
      <CustomBackend namePrefix={prefix} />
    </>
  );
};

export default RoleBackend;
