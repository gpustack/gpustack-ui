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
      <HBar
        title={intl.formatMessage({ id: 'dashboard.topusers' })}
        seriesData={userData}
        xAxisData={topUserList}
        height={360}
      ></HBar>
    </CardWrapper>
  );
};

export default React.memo(TopUser);
