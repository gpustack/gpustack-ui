import LabelInfo from '@/components/seal-form/components/label-info';
import React from 'react';
import styles from './styles/wrapper.less';

const Wrapper: React.FC<{
  label?: React.ReactNode;
  description?: React.ReactNode;
  labelExtra?: React.ReactNode;
  children: React.ReactNode;
}> = ({ children, label, description, labelExtra, ...rest }) => {
  return (
    <div className={styles['wrapper']}>
      {label && (
        <span className="label">
          <LabelInfo
            label={label}
            description={description}
            labelExtra={labelExtra}
          ></LabelInfo>
        </span>
      )}
      {React.isValidElement(children)
        ? React.cloneElement(children, { ...rest })
        : children}
    </div>
  );
};

export default Wrapper;
