import { Checkbox } from 'antd';
import React from 'react';
import styled from 'styled-components';
import '../styles/skeleton.less';

const SkeletonItem = () => {
  return (
    <div className="row-skeleton">
      <div className="holder"></div>
      <Checkbox></Checkbox>
    </div>
  );
};

const Wrapper = styled.div`
  display: flex;
  flex-direction: column;
  gap: 20px;
`;

const TableSkeleton = () => {
  const dataSource = Array.from({ length: 5 });
  return (
    <Wrapper>
      {dataSource.map((item, index) => (
        <SkeletonItem key={index} />
      ))}
    </Wrapper>
  );
};

export default React.memo(TableSkeleton);
