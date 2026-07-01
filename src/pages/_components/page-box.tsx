import { ExtraContent } from '@/layouts/extraRender';
import {
  PageContainer,
  RouteContext,
  type PageContainerProps
} from '@ant-design/pro-components';
import { useOverlayScroller } from '@gpustack/core-ui';
import { Divider } from 'antd';
import classNames from 'classnames';
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState
} from 'react';
import { createPortal } from 'react-dom';
import pageBoxCss from './styles/page-box.less';

const paddingInlinePageContainerContent = 24;

type HeaderSlotContextValue = {
  leftEl: HTMLElement | null;
  rightEl: HTMLElement | null;
  setContentStyle: (style: React.CSSProperties | undefined) => () => void;
};

const HeaderSlotContext = createContext<HeaderSlotContextValue | null>(null);

// Pages render <HeaderLeft> / <HeaderRight> as part of their JSX; the children
// are portaled into the layout-owned PageContainerInner header bar so the
// shell never unmounts between routes. Visibility of the default title /
// right divider is driven by CSS (`:empty` / `:not(:empty)`) on the portal
// target, so they react synchronously to DOM mutations — no React state, no
// re-renders, no inter-frame flicker.
export const HeaderLeft: React.FC<{ children: React.ReactNode }> = ({
  children
}) => {
  const ctx = useContext(HeaderSlotContext);
  return ctx?.leftEl ? createPortal(children, ctx.leftEl) : null;
};

export const HeaderRight: React.FC<{ children: React.ReactNode }> = ({
  children
}) => {
  const ctx = useContext(HeaderSlotContext);
  return ctx?.rightEl ? createPortal(children, ctx.rightEl) : null;
};

// Pages that need to override the layout-owned content wrapper style
// (e.g. playground pages that want zero padding) call this hook in render.
// Applied synchronously via useLayoutEffect to avoid first-paint flicker.
export const usePageContentStyle = (style?: React.CSSProperties): void => {
  const ctx = useContext(HeaderSlotContext);
  const stable = JSON.stringify(style ?? null);
  useLayoutEffect(() => {
    if (!ctx) return;
    return ctx.setContentStyle(style);
  }, [stable, ctx?.setContentStyle]);
};

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
  const [leftEl, setLeftEl] = useState<HTMLDivElement | null>(null);
  const [rightEl, setRightEl] = useState<HTMLDivElement | null>(null);
  const [contentStyleOverride, setContentStyleOverride] = useState<
    React.CSSProperties | undefined
  >(undefined);

  useEffect(() => {
    if (contentWrapperRef.current) {
      const ins = initialize(contentWrapperRef.current);
      window.__GPUSTACK_BODY_SCROLLER__ = ins;
    }
  }, [initialize, contentWrapperRef]);

  const setContentStyle = useCallback(
    (style: React.CSSProperties | undefined) => {
      setContentStyleOverride(style);
      return () => setContentStyleOverride(undefined);
    },
    []
  );

  const slotValue = useMemo<HeaderSlotContextValue>(
    () => ({
      leftEl,
      rightEl,
      setContentStyle
    }),
    [leftEl, rightEl, setContentStyle]
  );

  return (
    <HeaderSlotContext.Provider value={slotValue}>
      <div className={pageBoxCss.containerWrapper}>
        <PageContainer
          {...rest}
          fixedHeader={false}
          title={false}
          pageHeaderRender={false}
          style={{
            flex: 1
          }}
          token={{
            paddingInlinePageContainerContent: paddingInlinePageContainerContent
          }}
        >
          <div className={pageBoxCss.title}>
            <div className={pageBoxCss.left}>
              <div ref={setLeftEl} className={pageBoxCss.leftSlot} />
              {leftContent}
              <span className={pageBoxCss.defaultTitle}>
                {pageContext.title}
              </span>
            </div>
            <div className={pageBoxCss.right}>
              <div ref={setRightEl} className={pageBoxCss.rightSlot} />
              {rightContent}
              <Divider
                className={pageBoxCss.divider}
                orientation="vertical"
                style={{ margin: '0 16px' }}
              />
              <ExtraContent />
            </div>
          </div>
          <div
            className={classNames(pageBoxCss.contentWrapper)}
            style={{ ...styles?.containerWrapper, ...contentStyleOverride }}
            ref={contentWrapperRef}
          >
            {children}
          </div>
        </PageContainer>
      </div>
    </HeaderSlotContext.Provider>
  );
};

const PageBox: React.FC<{
  children: React.ReactNode;
  style?: React.CSSProperties;
}> = ({ children, style }) => {
  return <div style={style}>{children}</div>;
};

export default PageBox;
