import LabelInfo from '@/components/seal-form/components/label-info';
import React from 'react';
import styles from './styles/wrapper.less';

const Wrapper: React.FC<{
  label?: string;
  description?: React.ReactNode;
  children: React.ReactNode;
}> = ({ children, label, description }) => {
  return (
    <div className={styles['wrapper']}>
      {label && (
        <span className="label">
          <LabelInfo label={label} description={description}></LabelInfo>
        </span>
      )}
      {children}
    </div>
  );
};

export default Wrapper;
