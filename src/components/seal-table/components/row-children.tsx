import '../styles/row-children.less';

const RowChildren = (props: any) => {
  const { children } = props;

  return <div className="row-children">{children}</div>;
};

export default RowChildren;
