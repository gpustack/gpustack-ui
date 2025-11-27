import { Button, Empty, EmptyProps, Typography } from 'antd';
import _ from 'lodash';
import React, { useMemo } from 'react';
import styled from 'styled-components';

const StyledEmpty = styled(Empty)`
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  margin-block: 60px 32px;
  .ant-empty-image {
    margin-bottom: 0;
    height: auto;
    line-height: 1;
    font-size: 42px;
    .anticon {
      color: var(--ant-color-primary);
    }
  }
  .ant-empty-footer {
    display: flex;
  }
`;

const ImageWrapper = styled.div`
  margin-bottom: 16px;
  display: flex;
  justify-content: center;
  align-items: center;
`;

const SimpleImageWrapper = styled.div`
  margin-bottom: 8px;
  display: flex;
  justify-content: center;
  align-items: center;
`;

const Description = styled.div`
  display: flex;
  flex-direction: column;
  gap: 12px;
  justify-content: center;
  align-items: center;
`;

const NoResult: React.FC<
  EmptyProps & {
    title?: React.ReactNode;
    subTitle?: React.ReactNode;
    noFoundText?: React.ReactNode;
    filters?: Record<string, any>;
    loading?: boolean;
    loadend?: boolean;
    dataSource?: any[];
    buttonText?: React.ReactNode;
    onClick?: () => void;
  }
> = (props) => {
  const {
    filters,
    noFoundText,
    loadend,
    loading,
    dataSource,
    buttonText,
    onClick
  } = props;

  const hasFilters = useMemo(() => {
    const filterValues = _.omit(filters, ['page', 'perPage']);

    return Object.values(filterValues || {}).some((value) => {
      if (Array.isArray(value)) {
        return value.length > 0;
      }

      return !!value;
    });
  }, [filters]);

  const renderChildren = () => {
    if (!buttonText || !onClick) return null;
    return (
      <Button color="primary" variant="filled" onClick={onClick}>
        {buttonText}
      </Button>
    );
  };

  return (
    <>
      {!loading && loadend && !dataSource?.length ? (
        <StyledEmpty
          image={
            hasFilters ? (
              <SimpleImageWrapper>
                {Empty.PRESENTED_IMAGE_SIMPLE}
              </SimpleImageWrapper>
            ) : (
              <ImageWrapper>{props.image}</ImageWrapper>
            )
          }
          description={
            <Description>
              {!hasFilters && (
                <Typography.Text style={{ fontSize: '16px', fontWeight: 500 }}>
                  {props.title}
                </Typography.Text>
              )}
              <Typography.Text type="secondary">
                {hasFilters ? noFoundText : props.subTitle}
              </Typography.Text>
            </Description>
          }
        >
          {!hasFilters && renderChildren()}
        </StyledEmpty>
      ) : (
        <span></span>
      )}
    </>
  );
};

export default NoResult;
