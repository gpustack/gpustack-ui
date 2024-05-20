import { useMemo } from 'react';
import styles from './index.less';

type PageToolsProps = {
  left?: React.ReactNode;
  right?: React.ReactNode;
  marginBottom?: number;
  marginTop?: number;
};

const PageTools: React.FC<PageToolsProps> = (props) => {
  const { left, right, marginBottom, marginTop } = props;

  const newStyle: Record<string, string> = useMemo(() => {
    const style: Record<string, string> = {};
    if (marginBottom) {
      style.marginBottom = `${marginBottom}px`;
    }
    if (marginTop) {
      style.marginTop = `${marginTop}px`;
    }
    return style;
  }, [marginBottom, marginTop]);

  return (
    <div className={styles['page-tools']} style={newStyle}>
      <div className="left">{left}</div>
      <div className="right">{right}</div>
    </div>
  );
};

export default PageTools;
