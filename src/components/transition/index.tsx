import classNames from 'classnames';
import {
  forwardRef,
  useEffect,
  useImperativeHandle,
  useRef,
  useState
} from 'react';
import './index.less';

interface TransitionWrapProps {
  minHeight?: number;
  header?: React.ReactNode;
  variant?: 'bordered' | 'filled';
  children: React.ReactNode;
  ref?: any;
}
const TransitionWrapper: React.FC<TransitionWrapProps> = forwardRef(
  (props, ref) => {
    const { minHeight = 50, header, variant = 'bordered', children } = props;
    const [isOpen, setIsOpen] = useState(true);
    const [height, setHeight] = useState(0);
    const contentRef = useRef(null);

    useEffect(() => {
      if (isOpen) {
        setHeight(contentRef?.current?.scrollHeight || 0);
      } else {
        setHeight(0);
      }
    }, [isOpen]);

    const toggleOpen = () => {
      setIsOpen(!isOpen);
    };

    const setHeightByContent = () => {
      setHeight(contentRef?.current?.scrollHeight || 0);
    };

    useImperativeHandle(ref, () => {
      return {
        setHeightByContent
      };
    });

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
            // when content is closed, header should have minHeight
            height: minHeight
          }}
        >
          {header}
        </div>
        <div
          className="transition-content-wrapper"
          style={{
            minHeight: isOpen ? height : 0,
            height: isOpen ? 'auto' : 0
          }}
          ref={contentRef}
        >
          <div className="transition-content">{children}</div>
        </div>
      </div>
    );
  }
);

export default TransitionWrapper;
