import classNames from 'classnames';
import React from 'react';
import LabelInfo from './label-info';
import wrapperStyle from './wrapper.less';
interface WrapperProps {
  children: React.ReactNode;
  label: string;
  isFocus: boolean;
  status?: string;
  required?: boolean;
  description?: React.ReactNode;
  className?: string;
  disabled?: boolean;
  extra?: React.ReactNode;
  onClick?: () => void;
}

const Wrapper: React.FC<WrapperProps> = ({
  children,
  label,
  isFocus,
  status,
  className,
  disabled,
  description,
  required,
  extra,
  onClick
}) => {
  return (
    <div
      className={classNames(
        wrapperStyle.wrapper,
        wrapperStyle[`validate-status-${status}`],
        disabled ? wrapperStyle['seal-input-wrapper-disabled'] : '',
        className ? wrapperStyle[className] : ''
      )}
      onClick={onClick}
    >
      <label
        onClick={onClick}
        className={classNames(
          wrapperStyle['label'],
          isFocus
            ? wrapperStyle['isfoucs-has-value']
            : wrapperStyle['blur-no-value']
        )}
      >
        <LabelInfo
          label={label}
          required={required}
          description={description}
        ></LabelInfo>
      </label>
      {extra && <div className={wrapperStyle.extra}>{extra}</div>}
      {children}
    </div>
  );
};

export default Wrapper;
