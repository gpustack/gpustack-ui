import { DoubleRightOutlined } from '@ant-design/icons';
import { useIntl } from '@umijs/max';
import { Button } from 'antd';
import React from 'react';
import styled from 'styled-components';

interface MoreButtonProps {
  show: boolean;
  loadMore: () => void;
  loading?: boolean;
}

const MoreWrapper = styled.div`
  display: flex;
  justify-content: center;
  margin-block: 16px;
  opacity: 1;
  transition: opacity 0.3s;
  &.loading {
    opacity: 0;
    transition: opacity 0.3s ease-in-out;
  }
`;

const MoreButton: React.FC<MoreButtonProps> = (props) => {
  const { show, loading, loadMore } = props;
  const intl = useIntl();
  return (
    <>
      {show ? (
        <MoreWrapper className={loading ? 'loading' : ''}>
          <Button
            onClick={loadMore}
            size="middle"
            type="text"
            icon={<DoubleRightOutlined rotate={90} />}
          >
            {intl.formatMessage({ id: 'common.button.more' })}
          </Button>
        </MoreWrapper>
      ) : null}
    </>
  );
};

export default MoreButton;
