import styles from './index.less';

const CardWrapper = (props: any) => {
  const { children } = props;
  return <div className={styles.cardWrapper}>{children}</div>;
};

export default CardWrapper;
