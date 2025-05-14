import AlertBlockInfo from '@/components/alert-info/block';
import IconFont from '@/components/icon-font';
import { useIntl } from '@umijs/max';
import { Button } from 'antd';
import { useState } from 'react';
import styled from 'styled-components';

const Wrapper = styled.div`
  padding-inline: 24px;
`;

const Tips = styled.div`
  margin-top: 8px !important;
  ul {
    margin: 0 !important;
    padding: 0 !important;
    margin-top: 8px !important;
    li {
      position: relative;
      list-style: none;
      line-height: 24px;
      margin: 0 !important;
      padding-inline: 16px 0 !important;
      &::before {
        content: '';
        position: absolute;
        left: 0px;
        top: 0;
        width: 6px;
        height: 6px;
        border-radius: 50%;
        background-color: var(--ant-color-text-secondary);
        margin-top: 8px;
      }
    }
  }
  .bold {
    font-weight: 700;
    color: var(--ant-color-text);
  }
  .notice {
    margin-top: 8px !important;
  }
`;

const TitleWrapper = styled.div`
  display: flex;
  align-items: center;
  font-weight: 700;
  color: var(--ant-color-text);
  justify-content: space-between;
`;

const RenderMessage = () => {
  const intl = useIntl();
  return (
    <Tips>
      <div className="notice">
        <div
          dangerouslySetInnerHTML={{
            __html: intl.formatMessage({
              id: 'models.ollama.deprecated.notice'
            })
          }}
        ></div>
      </div>
    </Tips>
  );
};

const OllamaTips = () => {
  const intl = useIntl();
  const [maxHeight, setMaxHeight] = useState(1);
  const handleShowMore = () => {
    setMaxHeight(maxHeight === 1 ? 600 : 1);
  };
  return (
    <Wrapper>
      <AlertBlockInfo
        contentStyle={{ paddingInline: 0 }}
        maxHeight={maxHeight}
        ellipsis={false}
        message={<RenderMessage></RenderMessage>}
        title={
          <TitleWrapper>
            <div>
              {intl.formatMessage({ id: 'models.ollama.deprecated.title' })}
            </div>
            <Button
              onClick={handleShowMore}
              size="small"
              type="text"
              icon={<IconFont type="icon-down"></IconFont>}
            ></Button>
          </TitleWrapper>
        }
        type={'warning'}
      ></AlertBlockInfo>
    </Wrapper>
  );
};

export default OllamaTips;
