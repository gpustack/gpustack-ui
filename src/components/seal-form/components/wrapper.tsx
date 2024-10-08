import classNames from 'classnames';
import React from 'react';
import LabelInfo from './label-info';
import wrapperStyle from './wrapper.less';
interface WrapperProps {
  children: React.ReactNode;
  label?: React.ReactNode;
  noWrapperStyle?: boolean;
  isFocus?: boolean;
  status?: string;
  required?: boolean;
  description?: React.ReactNode;
  className?: string;
  disabled?: boolean;
  extra?: React.ReactNode;
  addAfter?: React.ReactNode;
  variant?: string;
  hasPrefix?: boolean;
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
  variant,
  addAfter,
  hasPrefix,
  noWrapperStyle,
  onClick
}) => {
  return (
    <div
      className={classNames(
        wrapperStyle['wrapper-box'],
        'field-wrapper',
        wrapperStyle[`validate-status-${status}`],
        addAfter ? wrapperStyle['seal-input-wrapper-addafter'] : '',
        disabled ? wrapperStyle['seal-input-wrapper-disabled'] : '',
        className ? wrapperStyle[className] : '',
        variant ? wrapperStyle[variant] : ''
      )}
    >
      <div
        className={classNames(wrapperStyle.wrapper, {
          [wrapperStyle['no-wrapper-style']]: noWrapperStyle,
          [wrapperStyle['no-label']]: !label
        })}
        onClick={onClick}
      >
        <label
          onClick={onClick}
          className={classNames(
            wrapperStyle['label'],
            isFocus
              ? wrapperStyle['isfoucs-has-value']
              : wrapperStyle['blur-no-value'],
            {
              [wrapperStyle['has-prefix']]: hasPrefix
            }
          )}
        >
          <LabelInfo
            label={label}
            required={required}
            description={description}
          ></LabelInfo>
        </label>
        {extra && <div className={wrapperStyle.extra}>{extra}</div>}
        <div className={wrapperStyle['inner-wrapper']}>{children}</div>
      </div>

      {addAfter && <div className={wrapperStyle['add-after']}>{addAfter}</div>}
    </div>
  );
};

export default Wrapper;
