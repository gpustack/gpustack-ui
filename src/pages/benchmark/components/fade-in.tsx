import React, { PropsWithChildren } from 'react';
import './fade-in.less';

type FadeInProps = PropsWithChildren<{
  duration?: number;
  delay?: number;
  className?: string;
}>;

const FadeIn: React.FC<FadeInProps> = ({
  children,
  duration = 200,
  delay = 0,
  className
}) => {
  return (
    <div
      className={`fade-in ${className || ''}`}
      style={{
        animationDuration: `${duration}ms`,
        animationDelay: `${delay}ms`
      }}
    >
      {children}
    </div>
  );
};

export default FadeIn;
