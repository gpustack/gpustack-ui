import useOverlayScroller from '@/hooks/use-overlay-scroller';
import {
  PageContainer,
  RouteContext,
  type PageContainerProps
} from '@ant-design/pro-components';
import classNames from 'classnames';
import { useContext, useEffect, useRef } from 'react';
import pageBoxCss from './styles/page-box.less';

const paddingInlinePageContainerContent = 24;

export const PageContainerInner: React.FC<
  PageContainerProps & {
    leftContent?: React.ReactNode;
    rightContent?: React.ReactNode;
    styles?: {
      containerWrapper?: React.CSSProperties;
    };
  }
> = ({ children, styles, title, leftContent, rightContent, ...rest }) => {
  const { initialize: initialize } = useOverlayScroller({
    defer: false
  });
  const pageContext = useContext(RouteContext);
  const contentWrapperRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (contentWrapperRef.current) {
      const ins = initialize(contentWrapperRef.current);
      window.__GPUSTACK_BODY_SCROLLER__ = ins;
    }
  }, [initialize, contentWrapperRef]);

  return (
    <div className={pageBoxCss.containerWrapper}>
      <PageContainer
        {...rest}
        fixedHeader={false}
        title={false}
        style={{
          flex: 1
        }}
        token={{
          paddingInlinePageContainerContent: paddingInlinePageContainerContent
        }}
      >
        <div className={pageBoxCss.title}>
          <div className={pageBoxCss.left}>
            {leftContent || pageContext.title}
          </div>
          {rightContent && (
            <div className={pageBoxCss.right}>{rightContent}</div>
          )}
        </div>
        <div
          className={classNames(pageBoxCss.contentWrapper)}
          style={styles?.containerWrapper}
          ref={contentWrapperRef}
        >
          {children}
        </div>
      </PageContainer>
    </div>
  );
};

const PageBox: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return <div>{children}</div>;
};

export default PageBox;
