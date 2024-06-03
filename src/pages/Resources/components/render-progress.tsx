import { Progress } from 'antd';
import _ from 'lodash';
import { memo, useMemo } from 'react';
import { NodeItem } from '../config/types';

const RenderProgress = memo(
  (props: { record: NodeItem; dataIndex: string }) => {
    const { record, dataIndex } = props;
    const value1 = useMemo(() => {
      let value = _.get(record, ['resources', 'allocable', dataIndex]);
      if (['gram', 'memory'].includes(dataIndex)) {
        value = _.toNumber(value.replace(/GiB|Gib/, ''));
      }
      return value;
    }, [record, dataIndex]);

    const value2 = useMemo(() => {
      let value = _.get(record, ['resources', 'capacity', dataIndex]);
      if (['gram', 'memory'].includes(dataIndex)) {
        value = _.toNumber(value.replace(/GiB|Gib/, ''));
      }
      return value;
    }, [record, dataIndex]);

    if (!value1 || !value2) {
      return <Progress percent={0} strokeColor="var(--ant-color-primary)" />;
    }
    const percent = _.round(value1 / value2, 2) * 100;
    const strokeColor = useMemo(() => {
      if (percent <= 50) {
        return 'var(--ant-color-primary)';
      }
      if (percent <= 80) {
        return 'var(--ant-color-warning)';
      }
      return 'var(--ant-color-error)';
    }, [percent]);
    return (
      <Progress
        steps={5}
        format={() => {
          return (
            <span style={{ color: 'var(--ant-color-text)' }}>{percent}%</span>
          );
        }}
        percent={percent}
        strokeColor={strokeColor}
      />
    );
  }
);

export default RenderProgress;
