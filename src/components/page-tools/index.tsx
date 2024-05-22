import { useMemo } from 'react';
import './index.less';

type PageToolsProps = {
  left?: React.ReactNode;
  right?: React.ReactNode;
  marginBottom?: number;
  marginTop?: number;
};

const PageTools: React.FC<PageToolsProps> = (props) => {
  const { left, right, marginBottom = 0, marginTop = 70 } = props;

  const newStyle: Record<string, string> = useMemo(() => {
    const style: Record<string, string> = {};
    style.marginBottom = `${marginBottom}px`;
    style.marginTop = `${marginTop}px`;
    return style;
  }, [marginBottom, marginTop]);

  return (
    <div className="page-tools" style={newStyle}>
      <div className="left">{left}</div>
      <div className="right">{right}</div>
    </div>
  );
};

export default PageTools;
