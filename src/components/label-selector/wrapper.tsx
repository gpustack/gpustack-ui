import LabelInfo from '@/components/seal-form/components/label-info';
import React from 'react';
import styles from './styles/wrapper.less';

const Wrapper: React.FC<{
  label?: string;
  children: React.ReactNode;
}> = ({ children, label }) => {
  return (
    <div className={styles['wrapper']}>
      {label && (
        <span className="label">
          <LabelInfo label={label}></LabelInfo>
        </span>
      )}
      {children}
    </div>
  );
};

export default Wrapper;
