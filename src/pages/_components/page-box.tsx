import {
  PageContainer,
  type PageContainerProps
} from '@ant-design/pro-components';
import styled from 'styled-components';

const paddingInlinePageContainerContent = 32;

const StyledPageContainer = styled(PageContainer)`
  .ant-affix {
    top: 0 !important;
    height: auto;
  }
  .ant-page-header {
    padding-block-end: 8px;
    .ant-page-header-heading {
      padding-block-start: 0;
    }
  }
  .ant-pro-page-container-warp-page-header {
    padding-inline: ${paddingInlinePageContainerContent}px;
  }
  .ant-page-header-heading-title {
    font-size: 16px;
  }
`;

export const PageContainerInner: React.FC<PageContainerProps> = ({
  children,
  ...rest
}) => {
  return (
    <StyledPageContainer
      {...rest}
      fixedHeader
      token={{
        paddingInlinePageContainerContent: paddingInlinePageContainerContent
      }}
    >
      {children}
    </StyledPageContainer>
  );
};

const PageBox: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return <div>{children}</div>;
};

export default PageBox;
