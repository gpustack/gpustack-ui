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
  classList?: string;
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
  classList,
  onClick
}) => {
  return (
    <div
      className={classNames(
        classList,
        wrapperStyle['wrapper-box'],
        'field-wrapper',
        wrapperStyle[`validate-status-${status}`],
        addAfter ? wrapperStyle['seal-input-wrapper-addafter'] : '',
        disabled ? wrapperStyle['seal-input-wrapper-disabled'] : '',
        className ? wrapperStyle[className] : '',
        classList ? wrapperStyle[classList] : '',
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
        <div
          className={classNames(wrapperStyle['inner-wrapper'], 'wrapper-inner')}
        >
          {children}
        </div>
      </div>

      {addAfter && <div className={wrapperStyle['add-after']}>{addAfter}</div>}
    </div>
  );
};

export default Wrapper;
