import classNames from 'classnames';
import React from 'react';
import styled from 'styled-components';

interface CardProps {
  height?: string | number;
  className?: string;
  children?: React.ReactNode;
  clickable?: boolean;
  ghost?: boolean;
  header?: React.ReactNode;
  footer?: React.ReactNode;
  onClick?: () => void;
}

const CardWrapper = styled.div`
  overflow: hidden;
  display: flex;
  flex-direction: column;
  justify-content: flex-start;
  align-items: flex-start;
  border: 1px solid var(--ant-color-border);
  border-radius: var(--border-radius-base);
  cursor: default;
  width: 100%;
  &:hover {
    background-color: var(--ant-color-fill-tertiary);
    transition: background-color 0.2s ease;
  }

  &.ghost {
    background-color: transparent;
  }

  &.active {
    background-color: var(--ant-color-fill-tertiary);
  }
  &.clickable {
    cursor: pointer;
  }
`;

const CardContent = styled.div`
  padding: 16px 20px;
  width: 100%;
  flex: 1;
`;

const Card: React.FC<CardProps> = (props) => {
  const {
    className,
    height,
    children,
    clickable = true,
    ghost = false,
    header,
    footer,
    onClick
  } = props;

  return (
    <CardWrapper
      className={classNames(className, {
        clickable: clickable,
        ghost: ghost
      })}
      style={{ height: height || '180px' }}
      onClick={onClick}
    >
      {header}
      <CardContent>{children}</CardContent>
      {footer}
    </CardWrapper>
  );
};

export default Card;
