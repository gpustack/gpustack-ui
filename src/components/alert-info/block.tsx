import { WarningFilled } from '@ant-design/icons';
import { Typography } from 'antd';
import classNames from 'classnames';
import React from 'react';
import styled from 'styled-components';
import OverlayScroller, { OverlayScrollerOptions } from '../overlay-scroller';
import './block.less';
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

  return (
    <>
      {message ? (
        <div
          className={classNames('alert-info-block', type)}
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
                {icon ?? <WarningFilled />}
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

export default React.memo(AlertInfo);
