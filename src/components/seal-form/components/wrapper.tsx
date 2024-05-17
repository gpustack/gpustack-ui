import classNames from 'classnames';
import wrapperStyle from './wrapper.less';
interface WrapperProps {
  children: React.ReactNode;
  label: string;
  isFocus: boolean;
  status?: string;
  className?: string;
  disabled?: boolean;
  onClick?: () => void;
}

const Wrapper: React.FC<WrapperProps> = ({
  children,
  label,
  isFocus,
  status,
  className,
  disabled,
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
        {label}
      </label>
      {children}
    </div>
  );
};

export default Wrapper;
