import CardWrapper from '@/components/card-wrapper';
import HBar from '@/components/echarts/h-bar';
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
      <HBar
        seriesData={userData}
        xAxisData={topUserList}
        height={440}
        maxItems={10}
      ></HBar>
    </CardWrapper>
  );
};

export default TopUser;
