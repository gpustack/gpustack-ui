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
  icon?: React.ReactNode;
  active?: boolean;
  hoverable?: boolean;
  disabled?: boolean;
  onClick?: () => void;
}

const CardWrapper = styled.div.attrs({
  className: 'template-card-wrapper'
})`
  overflow: hidden;
  display: flex;
  padding: 16px 20px;
  justify-content: flex-start;
  align-items: center;
  border: 1px solid var(--ant-color-border);
  border-radius: var(--border-radius-base);
  cursor: default;
  width: 100%;
  &.clickable:hover:not(.disabled) {
    background-color: var(--ant-color-fill-tertiary);
    transition: background-color 0.2s ease;
  }

  &.hoverable:hover:not(.disabled) {
    background-color: var(--ant-color-fill-tertiary);
    transition: background-color 0.2s ease;
  }

  &.ghost {
    background-color: transparent;
  }

  &.active {
    background-color: var(--ant-color-fill-tertiary);
  }

  &.clickable:not(.disabled) {
    cursor: pointer;
  }
  &.disabled {
    cursor: default;
    opacity: 0.6;
    pointer-events: none;
    border-style: dashed;
  }
`;

const CardContent = styled.div.attrs({
  className: 'template-card-content'
})`
  width: 100%;
  flex: 1;
  color: var(--ant-color-text-tertiary);
`;

const Inner = styled.div.attrs({
  className: 'template-card-inner'
})`
  display: flex;
  width: 100%;
  flex-direction: column;
  justify-content: flex-start;
  gap: 8px;
  height: 100%;
`;

const Icon = styled.div.attrs({
  className: 'template-card-icon'
})`
  display: flex;
  align-items: center;
  margin-right: 16px;
  font-size: 32px;
`;

const Header = styled.div.attrs({
  className: 'template-card-header'
})`
  font-weight: bold;
  font-size: var(--font-size-base);
  display: flex;
  align-items: center;
  justify-content: space-between;
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
    icon,
    active,
    disabled,
    hoverable,
    onClick
  } = props;

  const handleClick = () => {
    if (disabled || !clickable) return;
    onClick?.();
  };

  return (
    <CardWrapper
      className={classNames(className, {
        clickable: clickable,
        hoverable: hoverable,
        active: active,
        disabled: disabled,
        ghost: ghost
      })}
      style={{ height: height || '180px' }}
      onClick={handleClick}
    >
      {icon && <Icon>{icon}</Icon>}
      <Inner>
        {header && <Header>{header}</Header>}
        {children && <CardContent>{children}</CardContent>}
        {footer}
      </Inner>
    </CardWrapper>
  );
};

export default Card;
