import classNames from 'classnames';
import wrapperStyle from './wrapper.less';
interface WrapperProps {
  children: React.ReactNode;
  label: string;
  isFocus: boolean;
  onClick?: () => void;
}

const Wrapper: React.FC<WrapperProps> = ({
  children,
  label,
  isFocus,
  onClick
}) => {
  return (
    <div className={wrapperStyle.wrapper} onClick={onClick}>
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
