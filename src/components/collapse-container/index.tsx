import IconFont from '@/components/icon-font';
import { Card } from 'antd';
import { createStyles } from 'antd-style';
import classNames from 'classnames';
import React, { useEffect, useRef, useState } from 'react';
import styled from 'styled-components';

const CardStyled = styled(Card)`
  box-shadow: none !important;
  background-color: none;
  &.isOpen {
    .ant-card-head {
      border-bottom: 1px solid var(--ant-color-border-secondary);
      border-radius: var(--ant-border-radius) var(--ant-border-radius) 0 0;
    }
  }
  .ant-card-head {
    cursor: pointer;
    background-color: var(--ant-color-fill-quaternary);
    border-bottom: none;
    border-radius: var(--ant-border-radius);
    padding: 0 16px;
    &:hover {
      background-color: var(--ant-color-fill-secondary);
      .del-btn {
        display: block;
      }
    }
  }
  &.disabled {
    .ant-card-head {
      cursor: not-allowed;
      background-color: var(--ant-color-fill-quaternary) !important;
    }
  }
`;

const useStyles = createStyles(({ css, token }) => {
  return {
    title: css`
      font-weight: 400;
      min-height: 56px;
      font-size: var(--font-size-base);
      display: flex;
      justify-content: space-between;
      align-items: center;
      cursor: pointer;
    `,
    expandIcon: css`
      display: flex;
      align-items: center;
      gap: 8px;
    `,
    subtitle: css`
      font-size: 14px;
      color: ${token.colorTextSecondary};
    `,
    content: css`
      padding-top: 8px;
    `,
    left: css`
      flex: 1;
    `,
    right: css`
      display: flex;
      align-items: center;
      gap: 8px;
      .del-btn {
        display: none;
      }
    `
  };
});

export interface CollapsibleContainerProps {
  title?: React.ReactNode;
  subtitle?: React.ReactNode;
  right?: React.ReactNode;
  deleteBtn?: React.ReactNode;
  defaultOpen?: boolean;
  open?: boolean;
  collapsible?: boolean;
  showExpandIcon?: boolean;
  onToggle?: (open: boolean) => void;
  disabled?: boolean;
  variant?: 'outlined' | 'borderless' | undefined;
  iconPlacement?: 'left' | 'right';
  className?: string;
  children?: React.ReactNode;
  styles?: {
    root?: React.CSSProperties;
    body?: React.CSSProperties;
    header?: React.CSSProperties;
    content?: React.CSSProperties;
  };
}

export default function CollapsibleContainer({
  title,
  subtitle,
  right,
  deleteBtn,
  defaultOpen = true,
  open,
  onToggle,
  disabled = false,
  showExpandIcon = true,
  variant = 'borderless',
  className = '',
  collapsible,
  iconPlacement = 'left',
  styles: cardStyles,
  children
}: CollapsibleContainerProps) {
  const { styles } = useStyles();
  const isControlled = typeof open === 'boolean';
  const [internalOpen, setInternalOpen] = useState(defaultOpen);
  const isOpen = collapsible
    ? isControlled
      ? (open as boolean)
      : internalOpen
    : true;

  const toggle = () => {
    if (disabled || !collapsible) return;
    const next = !isOpen;
    if (!isControlled) setInternalOpen(next);
    onToggle?.(next);
  };

  const contentRef = useRef<HTMLDivElement>(null);
  const [height, setHeight] = useState(isOpen ? 'auto' : '0px');

  const renderIcon = () => {
    if (showExpandIcon) {
      return (
        <IconFont
          rotate={isOpen ? 180 : 0}
          type="icon-down"
          style={{
            cursor: disabled ? 'not-allowed' : 'pointer',
            fontSize: 12
          }}
        />
      );
    }
    return null;
  };

  const renderTitle = () => {
    if (!collapsible) {
      return null;
    }
    return (
      <div className={styles.title} onClick={toggle}>
        <div className={styles.left}>
          <div className={styles.expandIcon}>
            {iconPlacement === 'left' && renderIcon()}
            {title && <div>{title}</div>}
          </div>
          {subtitle && <div className={styles.subtitle}>{subtitle}</div>}
        </div>
        <div className={styles.right}>
          {right && <span>{right}</span>}
          {deleteBtn && <span className="del-btn">{deleteBtn}</span>}
          {iconPlacement === 'right' && renderIcon()}
        </div>
      </div>
    );
  };

  useEffect(() => {
    if (!collapsible) {
      setHeight('auto');
      return;
    }
    if (isOpen) {
      const scrollHeight = contentRef.current?.scrollHeight || 0;
      setHeight(scrollHeight + 'px');
      const timer = setTimeout(() => setHeight('auto'), 200);
      return () => clearTimeout(timer);
    } else {
      const scrollHeight = contentRef.current?.scrollHeight || 0;
      setHeight(scrollHeight + 'px');
      requestAnimationFrame(() => setHeight('0px'));
      return () => {};
    }
  }, [isOpen, collapsible]);

  return (
    <CardStyled
      className={classNames(className, { collapsible, disabled, isOpen })}
      variant={variant}
      styles={{
        root: {
          ...cardStyles?.root
        },
        body: {
          padding: 0,
          ...cardStyles?.body
        },
        header: {
          ...cardStyles?.header
        }
      }}
      title={renderTitle()}
    >
      <div
        ref={contentRef}
        style={{
          height: height,
          overflow: 'hidden'
        }}
      >
        <div style={{ paddingTop: 8, ...cardStyles?.content }}>{children}</div>
      </div>
    </CardStyled>
  );
}
