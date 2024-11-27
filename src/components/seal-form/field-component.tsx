import { ParamsSchema } from '@/pages/playground/config/types';
import { useIntl } from '@umijs/max';
import React from 'react';
import componentsMap from './config/components';

const FieldComponent: React.FC<ParamsSchema> = (props) => {
  const intl = useIntl();
  const { type, label, attrs, style, ...rest } = props;
  return React.createElement(componentsMap[type], {
    ...rest,
    ...attrs,
    style: { ...style, width: '100%' },
    label: label.isLocalized
      ? intl.formatMessage({ id: label.text })
      : label.text
  });
};

export default React.memo(FieldComponent);
