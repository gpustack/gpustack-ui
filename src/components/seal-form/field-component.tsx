import { ParamsSchema } from '@/pages/playground/config/types';
import { useIntl } from '@umijs/max';
import React, { useCallback, useMemo } from 'react';
import LabelInfo from './components/label-info';
import componentsMap from './config/components';

const FieldComponent: React.FC<ParamsSchema> = (props) => {
  const intl = useIntl();
  const { type, label, attrs, style, value, ...rest } = props;
  const renderChild = useCallback(
    (type: string) => {
      switch (type) {
        case 'Checkbox':
          return (
            <LabelInfo
              required={props.required}
              label={
                label.isLocalized
                  ? intl.formatMessage({ id: label.text })
                  : label.text
              }
            ></LabelInfo>
          );
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
