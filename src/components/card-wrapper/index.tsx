import styles from './index.less';

const CardWrapper = (props: any) => {
  const { children, style } = props;
  return (
    <div className={styles.cardWrapper} style={{ ...style }}>
      {children}
    </div>
  );
};

export default CardWrapper;
