import { ParamsSchema } from '@/pages/playground/config/types';
import { useIntl } from '@umijs/max';
import React, { useCallback, useMemo } from 'react';
import componentsMap from './config/components';

const FieldComponent: React.FC<ParamsSchema> = (props) => {
  const intl = useIntl();
  const { type, label, attrs, style, value, ...rest } = props;
  const renderChild = useCallback(
    (type: string) => {
      switch (type) {
        case 'Checkbox':
          return <span>{intl.formatMessage({ id: label.text })}</span>;
        default:
          return null;
      }
    },
    [intl, type]
  );
  const checkboxAttrs = useMemo(() => {
    return type === 'Checkbox' ? { checked: value } : { value: value };
  }, [type, value]);
  return React.createElement(
    componentsMap[type],
    {
      ...rest,
      ...attrs,
      ...checkboxAttrs,
      style: { ...style, width: '100%' },
      label: label.isLocalized
        ? intl.formatMessage({ id: label.text })
        : label.text
    },
    renderChild(type)
  );
};

export default React.memo(FieldComponent);
