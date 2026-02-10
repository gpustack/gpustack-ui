import IconFont from '@/components/icon-font';
import { useIntl } from '@umijs/max';
import { Button } from 'antd';
import React from 'react';
import styled from 'styled-components';

const Wrapper = styled.div`
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  .title {
    margin-right: 8px;
  }
`;

const DocLink: React.FC<{
  link: string;
  title?: React.ReactNode;
}> = ({ link, title }) => {
  const intl = useIntl();
  return (
    <Wrapper>
      {title && <span className="title">{title}</span>}
      <Button
        size="small"
        type="link"
        target="_blank"
        href={link}
        style={{ padding: 0 }}
      >
        {intl.formatMessage({ id: 'playground.audio.enablemic.doc' })}
        <IconFont type="icon-external-link" className="font-size-14"></IconFont>
      </Button>
    </Wrapper>
  );
};

export default DocLink;
