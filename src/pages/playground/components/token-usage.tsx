import { useIntl } from '@umijs/max';
import React from 'react';
import styled from 'styled-components';

const TokenUsageWrapper = styled.div`
  font-size: var(--font-size-small);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 2px 5px;
  .text {
    color: var(--ant-orange);
  }
`;

const TokenUsage: React.FC<{
  tokenResult?: any;
  [key: string]: any;
}> = ({ tokenResult, ...rest }) => {
  const intl = useIntl();
  if (!tokenResult) {
    return null;
  }
  return (
    <TokenUsageWrapper {...rest}>
      {tokenResult?.total_tokens > 0 && (
        <span className="text">
          {intl.formatMessage({ id: 'playground.tokenusage' })}:{' '}
          {tokenResult?.total_tokens}
        </span>
      )}
    </TokenUsageWrapper>
  );
};

export default TokenUsage;
