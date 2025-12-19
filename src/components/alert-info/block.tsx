import {
  CheckCircleFilled,
  LoadingOutlined,
  WarningFilled
} from '@ant-design/icons';
import { Typography } from 'antd';
import { createStyles } from 'antd-style';
import classNames from 'classnames';
import React from 'react';
import styled from 'styled-components';
import OverlayScroller, { OverlayScrollerOptions } from '../overlay-scroller';
interface AlertInfoProps {
  type: Global.MessageType;
  message: React.ReactNode;
  rows?: number;
  icon?: React.ReactNode;
  ellipsis?: boolean;
  style?: React.CSSProperties;
  contentStyle?: React.CSSProperties;
  title?: React.ReactNode;
  maxHeight?: number;
  overlayScrollerProps?: OverlayScrollerOptions;
}

const useStyles = createStyles(({ token, css }) => {
  return {
    alertBlockInfo: css`
      padding-block: 6px;
      padding-inline: 10px 16px;
      position: relative;
      padding-left: 32px;
      text-align: left;
      border-radius: ${token.borderRadius}px;
      margin: 0;
      border: 1px solid transparent;
      .ant-typography {
        margin-bottom: 0;
      }

      &.danger {
        border-color: ${token.colorErrorBorder};
        background-color: ${token.colorErrorBg};
      }

      &.warning {
        border-color: ${token.colorWarningBorder};
        background-color: ${token.colorWarningBg};
      }

      &.transition {
        color: ${token.geekblue7};
        background: ${token.geekblue1};
        border-color: ${token.geekblue3};
      }

      &.success {
        border: 1px solid ${token.colorSuccess};
        color: ${token.colorSuccessText};
        background: ${token.colorSuccessBg};

        .content.success {
          font-weight: var(--font-weight-normal);
        }
      }
      .title {
        position: absolute;
        left: 0;
        top: 0;
        display: flex;
        height: 32px;
        padding: 5px 10px;
        border-radius: ${token.borderRadius}px ${token.borderRadius}px 0 0;

        .info-icon {
          &.danger {
            color: ${token.colorErrorText};
          }

          &.warning {
            color: ${token.colorWarningText};
          }

          &.transition {
            color: ${token.geekblue7};
          }

          &.success {
            color: ${token.colorSuccessText};
          }
        }

        .text {
          font-weight: var(--font-weight-bold);
        }
      }
    `
  };
});

const TitleWrapper = styled.div`
  font-weight: 700;
  color: var(--ant-color-text);
`;

const ContentWrapper = styled.div<{ $hasTitle: boolean }>`
  word-break: break-word;
  color: ${(props) =>
    props.$hasTitle
      ? 'var(--ant-color-text-secondary)'
      : 'var(--ant-color-text)'};
  font-weight: var(--font-weight-500);
  white-space: pre-line;
`;

const AlertInfo: React.FC<AlertInfoProps> = (props) => {
  const {
    message,
    type,
    rows = 1,
    ellipsis,
    style,
    title,
    contentStyle,
    icon,
    maxHeight = 86,
    overlayScrollerProps = {}
  } = props;
  const { styles } = useStyles();

  const renderIcon = () => {
    if (type === 'transition') {
      return <LoadingOutlined />;
    }
    if (type === 'success') {
      return <CheckCircleFilled />;
    }
    return <WarningFilled />;
  };

  return (
    <>
      {message ? (
        <div
          className={classNames(styles.alertBlockInfo, type)}
          style={{ ...style }}
        >
          <Typography.Paragraph
            ellipsis={
              ellipsis ?? {
                rows: rows,
                tooltip: message
              }
            }
          >
            <div className={classNames('title', type)}>
              <span className={classNames('info-icon', type)}>
                {icon ?? renderIcon()}
              </span>
            </div>
            {title && (
              <TitleWrapper className="title-text">{title}</TitleWrapper>
            )}
            <OverlayScroller
              maxHeight={maxHeight}
              style={{ ...contentStyle }}
              {...overlayScrollerProps}
            >
              <ContentWrapper
                $hasTitle={!!title}
                className={classNames('content', type)}
              >
                {message}
              </ContentWrapper>
            </OverlayScroller>
          </Typography.Paragraph>
        </div>
      ) : null}
    </>
  );
};

export default AlertInfo;
