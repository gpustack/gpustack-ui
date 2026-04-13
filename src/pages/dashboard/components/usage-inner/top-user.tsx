import { CardWrapper, HBarChart } from '@gpustack/core-ui';
import React from 'react';

interface TopUserProps {
  userData: { name: string; value: number }[];
  topUserList: string[];
}
const TopUser: React.FC<TopUserProps> = (props) => {
  const { userData, topUserList } = props;

  console.log('TopUser userData:', userData, topUserList);

  return (
    <CardWrapper>
      <HBarChart
        seriesData={userData}
        xAxisData={topUserList}
        height={440}
        maxItems={10}
      ></HBarChart>
    </CardWrapper>
  );
};

export default TopUser;
