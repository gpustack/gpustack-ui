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
  return msg.includes('Loading chunk') && msg.includes('failed');
}

const ErrorResult: React.FC<ErrorResultProps> = ({ extra }) => {
  const intl = useIntl();
  return (
    <Result
      status="error"
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
