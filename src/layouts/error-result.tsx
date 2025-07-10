import { useIntl } from '@umijs/max';
import { Result } from 'antd';
import styled from 'styled-components';

const Inner = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 16px;
`;

interface ErrorResultProps {
  extra?: string;
}

function isChunkLoadError(msg?: string): boolean {
  if (typeof msg !== 'string') return false;
  const jsChunkFailed = msg.includes('Loading chunk');
  const cssChunkFailed = msg.includes('Loading CSS chunk');

  return (jsChunkFailed || cssChunkFailed) && msg.includes('failed');
}

const ErrorResult: React.FC<ErrorResultProps> = ({ extra }) => {
  const intl = useIntl();
  return (
    <Result
      status="warning"
      title={
        isChunkLoadError(extra)
          ? intl.formatMessage({ id: 'common.page.refresh.tips' })
          : intl.formatMessage({ id: 'common.page.wentwrong' })
      }
      extra={extra}
    />
  );
};

export default ErrorResult;
