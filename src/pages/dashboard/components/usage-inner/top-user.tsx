import CardWrapper from '@/components/card-wrapper';
import HBar from '@/components/echarts/h-bar';
import { useIntl } from '@umijs/max';
import React from 'react';

interface TopUserProps {
  userData: { name: string; value: number }[];
  topUserList: string[];
}
const TopUser: React.FC<TopUserProps> = (props) => {
  const { userData, topUserList } = props;
  const intl = useIntl();

  return (
    <CardWrapper>
      <HBar seriesData={userData} xAxisData={topUserList} height={440}></HBar>
    </CardWrapper>
  );
};

export default React.memo(TopUser);
