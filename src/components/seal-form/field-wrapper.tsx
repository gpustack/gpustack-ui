import classNames from 'classnames';
import React from 'react';
import LabelInfo from './components/label-info';
import wrapperStyle from './components/wrapper.less';
interface WrapperProps {
  children: React.ReactNode;
  label: React.ReactNode;
  status?: string;
  className?: string;
  disabled?: boolean;
  required?: boolean;
  description?: React.ReactNode;
  variant?: string;
  style?: React.CSSProperties;
  onClick?: () => void;
}

const Wrapper: React.FC<WrapperProps> = ({
  children,
  label,
  status,
  className,
  disabled,
  required,
  variant,
  style,
  description
}) => {
  return (
    <div
      style={{
        padding: '0 calc(var(--ant-padding-sm) - 5px)',
        width: '100%',
        ...style
      }}
      className={classNames(
        wrapperStyle.wrapper,
        wrapperStyle[`validate-status-${status}`],
        disabled ? wrapperStyle['seal-input-wrapper-disabled'] : '',
        variant === 'filled' ? wrapperStyle['filled'] : '',
        variant === 'borderless' ? wrapperStyle['borderless'] : '',
        className ? wrapperStyle[className] : ''
      )}
    >
      <label
        className={classNames(
          wrapperStyle['label'],
          wrapperStyle['isfoucs-has-value']
        )}
      >
        <LabelInfo
          label={label}
          required={required}
          description={description}
        ></LabelInfo>
      </label>
      <div
        className="child-inner"
        style={{
          width: '100%'
        }}
      >
        {children}
      </div>
    </div>
  );
};

export default Wrapper;
