import { useMemo } from 'react';
import './index.less';

type PageToolsProps = {
  left?: React.ReactNode;
  right?: React.ReactNode;
  marginBottom?: number;
  marginTop?: number;
  style?: React.CSSProperties;
};

const PageTools: React.FC<PageToolsProps> = (props) => {
  const {
    left,
    right,
    marginBottom = 0,
    marginTop = 60,
    style: pageStyle
  } = props;

  const newStyle: React.CSSProperties = useMemo(() => {
    const style: React.CSSProperties = {};
    style.marginBottom = `${marginBottom}px`;
    style.marginTop = `${marginTop}px`;
    if (pageStyle) {
      Object.assign(style, pageStyle);
    }
    return style;
  }, [marginBottom, marginTop, pageStyle]);

  return (
    <div className="page-tools" style={newStyle}>
      <div className="left">{left}</div>
      <div className="right">{right}</div>
    </div>
  );
};

export default PageTools;
