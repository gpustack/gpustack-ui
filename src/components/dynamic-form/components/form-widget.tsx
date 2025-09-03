import ComponentsMap from '@/components/seal-form/config/components';
import { FormWidgetProps } from '../config/types';

const FormWidget: React.FC<
  FormWidgetProps & {
    onChange?: (data: any) => void;
  }
> = ({
  widget,
  title: label,
  required,
  placeholder,
  options,
  description,
  enum: enumValues,
  style,
  value,
  min,
  max,
  checked,
  onChange
}) => {
  const Component = ComponentsMap[widget];

  const optionList = enumValues?.map((item: string | number) => ({
    label: item,
    value: item
  }));

  return Component ? (
    <Component
      {...{ label, required, placeholder, description, min, max }}
      options={options || optionList}
      value={value}
      checked={checked}
      style={{
        width: '100%',
        ...style
      }}
      onChange={onChange}
    />
  ) : null;
};

export default FormWidget;
