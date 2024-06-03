import classNames from 'classnames';
import { useEffect, useRef, useState } from 'react';
import './index.less';

interface TransitionWrapProps {
  minHeight?: number;
  header?: React.ReactNode;
  variant?: 'bordered' | 'filled';
  children: React.ReactNode;
}
const TransitionWrapper: React.FC<TransitionWrapProps> = (props) => {
  const { minHeight = 50, header, variant = 'bordered', children } = props;
  const [isOpen, setIsOpen] = useState(true);
  const [height, setHeight] = useState(0);
  const contentRef = useRef(null);

  useEffect(() => {
    if (isOpen) {
      setHeight(contentRef?.current?.scrollHeight);
    } else {
      setHeight(0);
    }
  }, [isOpen]);

  const toggleOpen = () => {
    setIsOpen(!isOpen);
  };

  return (
    <div
      className={classNames('transition-wrapper', {
        bordered: variant === 'bordered',
        filled: variant === 'filled'
      })}
    >
      <div
        onClick={toggleOpen}
        className="header"
        style={{
          height: minHeight
        }}
      >
        {header}
      </div>
      <div
        className="content-wrapper"
        style={{ height: height }}
        ref={contentRef}
      >
        <div className="content">{children}</div>
      </div>
    </div>
  );
};

export default TransitionWrapper;
