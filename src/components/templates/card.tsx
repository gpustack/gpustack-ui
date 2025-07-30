import classNames from 'classnames';
import React from 'react';
import styled from 'styled-components';

interface CardProps {
  height?: string | number;
  className?: string;
  children?: React.ReactNode;
}

const CardWrapper = styled.div`
  overflow: hidden;
  display: flex;
  padding: 16px 20px;
  flex-direction: column;
  justify-content: flex-start;
  align-items: flex-start;
  border: 1px solid var(--ant-color-border);
  border-radius: var(--border-radius-base);
  cursor: pointer;
  width: 100%;
  &:hover {
    background-color: var(--ant-color-fill-tertiary);
  }

  &.active {
    background-color: var(--ant-color-fill-tertiary);
  }
`;

const Card: React.FC<CardProps> = (props) => {
  const { className, height, children } = props;

  return (
    <CardWrapper
      className={classNames('card-wrapper', className)}
      style={{ height: height || '180px' }}
    >
      {children}
    </CardWrapper>
  );
};

export default Card;
