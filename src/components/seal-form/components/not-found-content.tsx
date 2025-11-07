import { LoadingOutlined } from '@ant-design/icons';
import { useIntl } from '@umijs/max';
import { Empty, Typography } from 'antd';
import React from 'react';
import styled from 'styled-components';

const { Link } = Typography;

const NoContent = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  padding-block: 12px;
`;

export const LoadingContent: React.FC = () => {
  return (
    <NoContent>
      <Link>
        <LoadingOutlined />
      </Link>
    </NoContent>
  );
};

const NotFoundContent: React.FC<{
  loading?: boolean;
  notFoundContent: React.ReactNode;
}> = ({ loading, notFoundContent }) => {
  const intl = useIntl();
  if (loading) {
    return <LoadingContent />;
  }
  return (
    <NoContent>
      {notFoundContent || (
        <Empty
          style={{ marginBlock: 0 }}
          description={intl.formatMessage({ id: 'common.data.empty' })}
          image={Empty.PRESENTED_IMAGE_SIMPLE}
        />
      )}
    </NoContent>
  );
};

export default NotFoundContent;
