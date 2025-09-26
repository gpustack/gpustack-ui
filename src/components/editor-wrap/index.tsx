import classNames from 'classnames';
import React from 'react';
import styled from 'styled-components';
import './index.less';

const HeaderWrapper = styled.div<{ $height?: number }>`
  height: ${(props) => (props.$height ? `${props.$height}px` : 'auto')};
  display: flex;
  padding-block: 0;
  justify-content: space-between;
  align-items: center;
`;

const Wrapper = styled.div`
  border-radius: var(--border-radius-mini);
  overflow: hidden;

  &.bordered {
    border: 1px solid var(--ant-color-border);
  }
  &.borderless {
    border: none;
  }
  .code-pre {
    margin-bottom: 0;
  }
  .scrollbar {
    .slider {
      border-radius: 6px;
    }
  }
`;

interface EditorwrapProps {
  headerHeight?: number;
  header?: React.ReactNode;
  children: React.ReactNode;
  variant?: 'bordered' | 'borderless';
  styles?: {
    wrapper?: React.CSSProperties;
    header?: React.CSSProperties;
    content?: React.CSSProperties;
  };
}
const EditorWrap: React.FC<EditorwrapProps> = ({
  headerHeight = 40,
  header,
  children,
  variant = 'borderless',
  styles = {}
}) => {
  return (
    <Wrapper
      style={{ ...styles.wrapper }}
      className={classNames({
        bordered: variant === 'bordered',
        borderless: variant === 'borderless'
      })}
    >
      {header && <HeaderWrapper $height={headerHeight}>{header}</HeaderWrapper>}
      <div>{children}</div>
    </Wrapper>
  );
};

export default EditorWrap;
